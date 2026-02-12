from datetime import datetime
from collections import defaultdict
from decimal import Decimal

from sqlmodel import Session, col, func, select

from auth.models import User

from core.money import quantize_currency
from expenses.models import Expense, ExpenseSplit

from .models import (
    ExpenseGroup,
    ExpenseGroupCreate,
    ExpenseGroupDebtItem,
    ExpenseGroupDetail,
    ExpenseGroupListItem,
    ExpenseGroupMember,
    ExpenseGroupMemberPublic,
    ExpenseGroupUpdate,
)
from .utils import generate_invite_code, normalize_invite_code


def get_group_by_id(*, session: Session, group_id: int) -> ExpenseGroup | None:
    """Get an expense group by ID."""
    return session.get(ExpenseGroup, group_id)


def get_user_groups(*, session: Session, user_id: int) -> list[ExpenseGroup]:
    """Get all expense groups where user is a member."""
    statement = (
        select(ExpenseGroup)
        .join(ExpenseGroupMember, col(ExpenseGroup.id) == col(ExpenseGroupMember.group_id))
        .where(ExpenseGroupMember.user_id == user_id)
    )
    return list(session.exec(statement).all())


def create_group(*, session: Session, user: User, group_in: ExpenseGroupCreate) -> ExpenseGroup:
    """Create a new expense group and add the creator as a member."""
    invite_code = ensure_invite_code_unique(session=session)
    db_group = ExpenseGroup.model_validate(group_in, update={"created_by": user.id, "invite_code": invite_code})
    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    # Add creator as a member
    assert db_group.id is not None
    assert user.id is not None
    add_member(session=session, group=db_group, user_id=user.id)

    return db_group


def update_group(*, session: Session, group: ExpenseGroup, group_in: ExpenseGroupUpdate) -> ExpenseGroup:
    """Update an expense group."""
    group.sqlmodel_update(group_in.model_dump(exclude_unset=True))
    session.add(group)
    session.commit()
    session.refresh(group)
    return group


def delete_group(*, session: Session, group: ExpenseGroup) -> None:
    """Delete an expense group (members cascade delete)."""
    session.delete(group)
    session.commit()


def get_member(*, session: Session, group_id: int, user_id: int) -> ExpenseGroupMember | None:
    """Get a specific membership record."""
    statement = select(ExpenseGroupMember).where(
        ExpenseGroupMember.group_id == group_id, ExpenseGroupMember.user_id == user_id
    )
    return session.exec(statement).one_or_none()


def get_group_by_invite_code(*, session: Session, code: str) -> ExpenseGroup | None:
    """Get an expense group by invite code."""
    normalized = normalize_invite_code(code)
    statement = select(ExpenseGroup).where(ExpenseGroup.invite_code == normalized)
    return session.exec(statement).one_or_none()


def ensure_invite_code_unique(*, session: Session) -> str:
    """Generate a unique invite code."""
    for _ in range(10):
        code = generate_invite_code()
        if not get_group_by_invite_code(session=session, code=code):
            return code
    raise ValueError("Could not generate a unique invite code")


def is_member(*, session: Session, group_id: int, user_id: int) -> bool:
    """Check if a user is a member of a group."""
    return get_member(session=session, group_id=group_id, user_id=user_id) is not None


def add_member(*, session: Session, group: ExpenseGroup, user_id: int) -> ExpenseGroupMember:
    """Add a user to a group."""
    assert group.id is not None
    db_member = ExpenseGroupMember(group_id=group.id, user_id=user_id)
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def remove_member(*, session: Session, group: ExpenseGroup, user_id: int) -> None:
    """Remove a user from a group."""
    assert group.id is not None
    member = get_member(session=session, group_id=group.id, user_id=user_id)
    if member:
        session.delete(member)
        session.commit()


def get_group_members(*, session: Session, group_id: int) -> list[ExpenseGroupMemberPublic]:
    """Get all members of a group with user details."""
    statement = (
        select(ExpenseGroupMember.user_id, User.name, User.email)
        .join(User, col(ExpenseGroupMember.user_id) == col(User.id))
        .where(ExpenseGroupMember.group_id == group_id)
    )
    results = session.exec(statement).all()
    return [ExpenseGroupMemberPublic(user_id=user_id, name=name, email=email) for user_id, name, email in results]


def get_user_groups_count(*, session: Session, user_id: int) -> int:
    """Count total groups where user is a member."""
    statement = (
        select(func.count(col(ExpenseGroup.id)))
        .join(ExpenseGroupMember, col(ExpenseGroup.id) == col(ExpenseGroupMember.group_id))
        .where(ExpenseGroupMember.user_id == user_id)
    )
    return session.exec(statement).one()


def get_user_groups_paginated(
    *, session: Session, user_id: int, offset: int = 0, limit: int = 12
) -> list[ExpenseGroup]:
    """Get paginated expense groups where user is a member, sorted by creation date."""
    statement = (
        select(ExpenseGroup)
        .join(ExpenseGroupMember, col(ExpenseGroup.id) == col(ExpenseGroupMember.group_id))
        .where(ExpenseGroupMember.user_id == user_id)
        .order_by(col(ExpenseGroup.created_at).desc())
        .offset(offset)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_group_detail(*, session: Session, group: ExpenseGroup, user_id: int | None) -> ExpenseGroupDetail:
    """Get expense group with members details."""
    assert group.id is not None
    members = get_group_members(session=session, group_id=group.id)
    expense_count = get_group_expense_count(session=session, group_id=group.id)
    last_activity_at = get_group_last_activity(session=session, group_id=group.id)
    owed_by_user_total = Decimal("0.00")
    owed_to_user_total = Decimal("0.00")
    owed_by_user: list[ExpenseGroupDebtItem] = []
    owed_to_user: list[ExpenseGroupDebtItem] = []
    if user_id is not None:
        (owed_by_user_total, owed_to_user_total, owed_by_user, owed_to_user) = calculate_user_debts(
            session=session, group_id=group.id, user_id=user_id
        )
    return ExpenseGroupDetail(
        id=group.id,
        name=group.name,
        created_by=group.created_by,
        invite_code=group.invite_code,
        members=members,
        created_at=group.created_at,
        expense_count=expense_count,
        owed_by_user_total=owed_by_user_total,
        owed_to_user_total=owed_to_user_total,
        owed_by_user=owed_by_user,
        owed_to_user=owed_to_user,
        last_activity_at=last_activity_at,
    )


def get_group_expense_count(*, session: Session, group_id: int) -> int:
    """Count total expenses in a group."""
    statement = select(func.count()).select_from(Expense).where(Expense.group_id == group_id)
    return session.exec(statement).one()


def get_group_last_activity(*, session: Session, group_id: int) -> datetime | None:
    """Get last activity timestamp for a group."""
    statement = select(func.max(Expense.created_at)).where(Expense.group_id == group_id)
    return session.exec(statement).one()


def get_group_list_item(
    *, session: Session, group: ExpenseGroup, totals_by_group: dict[int, tuple[Decimal, Decimal]]
) -> ExpenseGroupListItem:
    """Get expense group list item for a user with totals."""
    assert group.id is not None
    expense_count = get_group_expense_count(session=session, group_id=group.id)
    last_activity_at = get_group_last_activity(session=session, group_id=group.id)
    owed_by_user_total, owed_to_user_total = totals_by_group.get(group.id, (Decimal("0.00"), Decimal("0.00")))
    return ExpenseGroupListItem(
        id=group.id,
        name=group.name,
        created_by=group.created_by,
        invite_code=group.invite_code,
        created_at=group.created_at,
        expense_count=expense_count,
        owed_by_user_total=owed_by_user_total,
        owed_to_user_total=owed_to_user_total,
        last_activity_at=last_activity_at,
    )


def calculate_user_debts(
    *, session: Session, group_id: int, user_id: int
) -> tuple[Decimal, Decimal, list[ExpenseGroupDebtItem], list[ExpenseGroupDebtItem]]:
    """Calculate netted debts for a user based on group settlement plan."""
    transfers = _calculate_group_settlement_plan(session=session, group_id=group_id)
    owed_by_raw: dict[int, Decimal] = defaultdict(lambda: Decimal("0.00"))
    owed_to_raw: dict[int, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for debtor_id, creditor_id, amount in transfers:
        if debtor_id == user_id:
            owed_by_raw[creditor_id] += amount
        elif creditor_id == user_id:
            owed_to_raw[debtor_id] += amount

    return _net_user_debts(owed_by_raw=owed_by_raw, owed_to_raw=owed_to_raw)


def _calculate_group_settlement_plan(*, session: Session, group_id: int) -> list[tuple[int, int, Decimal]]:
    """Calculate a minimized settlement plan for a group."""
    statement = (
        select(ExpenseSplit.user_id, Expense.created_by, func.coalesce(func.sum(ExpenseSplit.share), 0))
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .where(Expense.group_id == group_id)
        .where(ExpenseSplit.user_id != Expense.created_by)
        .group_by(ExpenseSplit.user_id, Expense.created_by)
    )

    balances: dict[int, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for debtor_id, creditor_id, amount in session.exec(statement).all():
        amount_decimal = Decimal(str(amount))
        balances[debtor_id] -= amount_decimal
        balances[creditor_id] += amount_decimal

    debtors: list[tuple[int, Decimal]] = []
    creditors: list[tuple[int, Decimal]] = []
    for user_id, balance in balances.items():
        if balance > Decimal("0.00"):
            creditors.append((user_id, balance))
        elif balance < Decimal("0.00"):
            debtors.append((user_id, -balance))

    debtors.sort(key=lambda item: (-item[1], item[0]))
    creditors.sort(key=lambda item: (-item[1], item[0]))

    transfers: list[tuple[int, int, Decimal]] = []
    debtor_index = 0
    creditor_index = 0
    while debtor_index < len(debtors) and creditor_index < len(creditors):
        debtor_id, debtor_amount = debtors[debtor_index]
        creditor_id, creditor_amount = creditors[creditor_index]
        transfer_amount = quantize_currency(min(debtor_amount, creditor_amount))
        if transfer_amount > Decimal("0.00"):
            transfers.append((debtor_id, creditor_id, transfer_amount))

        remaining_debtor = quantize_currency(debtor_amount - transfer_amount)
        remaining_creditor = quantize_currency(creditor_amount - transfer_amount)

        if remaining_debtor == Decimal("0.00"):
            debtor_index += 1
        else:
            debtors[debtor_index] = (debtor_id, remaining_debtor)

        if remaining_creditor == Decimal("0.00"):
            creditor_index += 1
        else:
            creditors[creditor_index] = (creditor_id, remaining_creditor)

    return transfers


def calculate_user_debt_totals(
    *, session: Session, group_ids: list[int], user_id: int
) -> dict[int, tuple[Decimal, Decimal]]:
    """Calculate netted debt totals for a user across multiple groups."""
    if not group_ids:
        return {}

    statement = (
        select(
            Expense.group_id, ExpenseSplit.user_id, Expense.created_by, func.coalesce(func.sum(ExpenseSplit.share), 0)
        )
        .join(Expense, ExpenseSplit.expense_id == Expense.id)
        .where(Expense.group_id.in_(group_ids))
        .where(ExpenseSplit.user_id != Expense.created_by)
        .group_by(Expense.group_id, ExpenseSplit.user_id, Expense.created_by)
    )

    balance_by_group: dict[int, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for group_id, debtor_id, creditor_id, amount in session.exec(statement).all():
        amount_decimal = Decimal(str(amount))
        if debtor_id == user_id:
            balance_by_group[group_id] -= amount_decimal
        elif creditor_id == user_id:
            balance_by_group[group_id] += amount_decimal

    totals: dict[int, tuple[Decimal, Decimal]] = {}
    for group_id in group_ids:
        balance = quantize_currency(balance_by_group.get(group_id, Decimal("0.00")))
        if balance > Decimal("0.00"):
            totals[group_id] = (Decimal("0.00"), balance)
        elif balance < Decimal("0.00"):
            totals[group_id] = (quantize_currency(-balance), Decimal("0.00"))
        else:
            totals[group_id] = (Decimal("0.00"), Decimal("0.00"))

    return totals


def _net_user_debts(
    *, owed_by_raw: dict[int, Decimal], owed_to_raw: dict[int, Decimal]
) -> tuple[Decimal, Decimal, list[ExpenseGroupDebtItem], list[ExpenseGroupDebtItem]]:
    owed_by_items: list[ExpenseGroupDebtItem] = []
    owed_to_items: list[ExpenseGroupDebtItem] = []
    owed_by_total = Decimal("0.00")
    owed_to_total = Decimal("0.00")

    for other_id in set(owed_by_raw) | set(owed_to_raw):
        owed_by_amount = owed_by_raw.get(other_id, Decimal("0.00"))
        owed_to_amount = owed_to_raw.get(other_id, Decimal("0.00"))
        if owed_by_amount == owed_to_amount:
            continue
        if owed_by_amount > owed_to_amount:
            net_amount = quantize_currency(owed_by_amount - owed_to_amount)
            owed_by_items.append(ExpenseGroupDebtItem(user_id=other_id, amount=net_amount))
            owed_by_total += net_amount
        else:
            net_amount = quantize_currency(owed_to_amount - owed_by_amount)
            owed_to_items.append(ExpenseGroupDebtItem(user_id=other_id, amount=net_amount))
            owed_to_total += net_amount

    owed_by_items.sort(key=lambda item: (-item.amount, item.user_id))
    owed_to_items.sort(key=lambda item: (-item.amount, item.user_id))

    return (quantize_currency(owed_by_total), quantize_currency(owed_to_total), owed_by_items, owed_to_items)
