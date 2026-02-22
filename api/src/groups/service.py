from datetime import UTC, datetime
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import case, or_
from sqlmodel import Session, col, func, select

from auth.models import User

from core.money import quantize_currency
from expenses.models import Expense, ExpenseSplit

from .models import (
    ExpenseGroup,
    ExpenseGroupCreate,
    ExpenseGroupDebtItem,
    ExpenseGroupDetail,
    ExpenseGroupJoinRequest,
    ExpenseGroupListItem,
    ExpenseGroupMember,
    ExpenseGroupMemberPublic,
    ExpenseGroupUpdate,
    ExpenseGroupSettlement,
    JoinGroupRequestPublic,
    JoinGroupRequesterPublic,
    JoinRequestStatus,
)
from .utils import generate_invite_code, normalize_invite_code


MAX_JOIN_REQUEST_ATTEMPTS = 3


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
    if user.id is None:
        raise ValueError("User not found")
    invite_code = ensure_invite_code_unique(session=session)
    db_group = ExpenseGroup.model_validate(group_in, update={"created_by": user.id, "invite_code": invite_code})
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
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


def get_join_request_by_id(*, session: Session, request_id: int) -> ExpenseGroupJoinRequest | None:
    return session.get(ExpenseGroupJoinRequest, request_id)


def get_join_request_public(*, session: Session, request_id: int) -> JoinGroupRequestPublic | None:
    statement = (
        select(ExpenseGroupJoinRequest, User.id, User.name, User.email)
        .join(User, col(ExpenseGroupJoinRequest.user_id) == col(User.id))
        .where(ExpenseGroupJoinRequest.id == request_id)
    )
    result = session.exec(statement).one_or_none()
    if not result:
        return None
    request, user_id, name, email = result
    if request.id is None or request.group_id is None:
        return None
    if user_id is None:
        return None
    if name is None or email is None:
        return None
    return JoinGroupRequestPublic(
        id=request.id,
        group_id=request.group_id,
        status=request.status,
        created_at=request.created_at,
        requester=JoinGroupRequesterPublic(user_id=user_id, name=name, email=email),
    )


def get_pending_join_request(*, session: Session, group_id: int, user_id: int) -> ExpenseGroupJoinRequest | None:
    statement = select(ExpenseGroupJoinRequest).where(
        ExpenseGroupJoinRequest.group_id == group_id,
        ExpenseGroupJoinRequest.user_id == user_id,
        ExpenseGroupJoinRequest.status == JoinRequestStatus.PENDING,
    )
    return session.exec(statement).one_or_none()


def count_declined_join_requests(*, session: Session, group_id: int, user_id: int) -> int:
    statement = (
        select(func.count())
        .select_from(ExpenseGroupJoinRequest)
        .where(
            ExpenseGroupJoinRequest.group_id == group_id,
            ExpenseGroupJoinRequest.user_id == user_id,
            ExpenseGroupJoinRequest.status == JoinRequestStatus.DECLINED,
        )
    )
    return session.exec(statement).one()


def create_join_request_by_invite_code(
    *, session: Session, user: User, code: str
) -> tuple[ExpenseGroupJoinRequest, bool]:
    group = get_group_by_invite_code(session=session, code=code)
    if not group:
        raise ValueError("Group not found")

    if group.id is None:
        raise ValueError("Group not found")

    if user.id is None:
        raise ValueError("User not found")

    if is_member(session=session, group_id=group.id, user_id=user.id):
        raise ValueError("User already a member")

    pending_request = get_pending_join_request(session=session, group_id=group.id, user_id=user.id)
    if pending_request:
        return pending_request, False

    declined_count = count_declined_join_requests(session=session, group_id=group.id, user_id=user.id)
    if declined_count >= MAX_JOIN_REQUEST_ATTEMPTS:
        raise ValueError("Join request limit reached")

    db_request = ExpenseGroupJoinRequest(group_id=group.id, user_id=user.id)
    session.add(db_request)
    session.commit()
    session.refresh(db_request)
    return db_request, True


def list_join_requests(
    *, session: Session, group_id: int, status: JoinRequestStatus | None = None
) -> list[JoinGroupRequestPublic]:
    statement = (
        select(ExpenseGroupJoinRequest, User.id, User.name, User.email)
        .join(User, col(ExpenseGroupJoinRequest.user_id) == col(User.id))
        .where(ExpenseGroupJoinRequest.group_id == group_id)
    )
    if status:
        statement = statement.where(ExpenseGroupJoinRequest.status == status)
    else:
        statement = statement.where(ExpenseGroupJoinRequest.status == JoinRequestStatus.PENDING)
    statement = statement.order_by(col(ExpenseGroupJoinRequest.created_at).desc())
    results = session.exec(statement).all()
    items: list[JoinGroupRequestPublic] = []
    for request, user_id, name, email in results:
        if request.id is None or request.group_id is None:
            continue
        if user_id is None:
            continue
        if name is None or email is None:
            continue
        items.append(
            JoinGroupRequestPublic(
                id=request.id,
                group_id=request.group_id,
                status=request.status,
                created_at=request.created_at,
                requester=JoinGroupRequesterPublic(user_id=user_id, name=name, email=email),
            )
        )
    return items


def resolve_join_request(
    *, session: Session, request: ExpenseGroupJoinRequest, status: JoinRequestStatus, resolved_by: int
) -> ExpenseGroupJoinRequest:
    request.status = status
    request.resolved_at = datetime.now(UTC)
    request.resolved_by = resolved_by
    session.add(request)
    session.commit()
    session.refresh(request)
    return request


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
    if group.id is None:
        raise ValueError("Group not found")
    db_member = ExpenseGroupMember(group_id=group.id, user_id=user_id)
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def remove_member(*, session: Session, group: ExpenseGroup, user_id: int) -> None:
    """Remove a user from a group."""
    if group.id is None:
        raise ValueError("Group not found")
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
    if group.id is None:
        raise ValueError("Group not found")
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


def get_group_settlements_count(*, session: Session, group_id: int) -> int:
    """Count total settlements in a group."""

    statement = (
        select(func.count()).select_from(ExpenseGroupSettlement).where(ExpenseGroupSettlement.group_id == group_id)
    )
    return session.exec(statement).one()


def get_group_settlements_paginated(
    *, session: Session, group_id: int, offset: int = 0, limit: int = 20
) -> list[ExpenseGroupSettlement]:
    """Get paginated settlements in a group, sorted by newest first."""

    statement = select(ExpenseGroupSettlement).where(ExpenseGroupSettlement.group_id == group_id)

    statement = (
        statement.order_by(col(ExpenseGroupSettlement.created_at).desc(), col(ExpenseGroupSettlement.id).desc())
        .offset(offset)
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_group_expense_counts(*, session: Session, group_ids: list[int]) -> dict[int, int]:
    """Get total expenses per group."""
    if not group_ids:
        return {}

    statement = (
        select(col(Expense.group_id), func.count())
        .where(col(Expense.group_id).in_(group_ids))
        .group_by(col(Expense.group_id))
    )
    return {group_id: count for group_id, count in session.exec(statement).all()}


def get_group_last_activity_by_group(*, session: Session, group_ids: list[int]) -> dict[int, datetime | None]:
    """Get last activity timestamp per group."""
    if not group_ids:
        return {}

    statement = (
        select(col(Expense.group_id), func.max(Expense.created_at))
        .where(col(Expense.group_id).in_(group_ids))
        .group_by(col(Expense.group_id))
    )
    return {group_id: last_activity for group_id, last_activity in session.exec(statement).all()}


def get_group_list_item(
    *,
    group: ExpenseGroup,
    totals_by_group: dict[int, tuple[Decimal, Decimal]],
    expense_counts: dict[int, int],
    last_activity_by_group: dict[int, datetime | None],
) -> ExpenseGroupListItem:
    """Get expense group list item for a user with totals."""
    if group.id is None:
        raise ValueError("Group not found")
    expense_count = expense_counts.get(group.id, 0)
    last_activity_at = last_activity_by_group.get(group.id)
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
        select(col(ExpenseSplit.user_id), col(Expense.created_by), func.coalesce(func.sum(ExpenseSplit.share), 0))
        .join(Expense, col(ExpenseSplit.expense_id) == col(Expense.id))
        .where(col(Expense.group_id) == group_id)
        .where(col(ExpenseSplit.user_id) != col(Expense.created_by))
        .group_by(col(ExpenseSplit.user_id), col(Expense.created_by))
    )

    balances: dict[int, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for debtor_id, creditor_id, amount in session.exec(statement).all():
        amount_decimal = Decimal(str(amount))
        balances[debtor_id] -= amount_decimal
        balances[creditor_id] += amount_decimal

    settlement_statement = select(
        col(ExpenseGroupSettlement.debtor_id),
        col(ExpenseGroupSettlement.creditor_id),
        col(ExpenseGroupSettlement.amount),
    ).where(col(ExpenseGroupSettlement.group_id) == group_id)

    for debtor_id, creditor_id, amount in session.exec(settlement_statement).all():
        amount_decimal = Decimal(str(amount))
        balances[debtor_id] += amount_decimal
        balances[creditor_id] -= amount_decimal

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


def create_group_settlement(
    *, session: Session, group_id: int, debtor_id: int, creditor_id: int, amount: Decimal, created_by: int
) -> ExpenseGroupSettlement:
    """Record a settlement payment within a group."""
    settlement = ExpenseGroupSettlement(
        group_id=group_id,
        debtor_id=debtor_id,
        creditor_id=creditor_id,
        amount=quantize_currency(amount),
        created_by=created_by,
    )
    session.add(settlement)
    session.commit()
    session.refresh(settlement)
    return settlement


def calculate_user_debt_totals(
    *, session: Session, group_ids: list[int], user_id: int
) -> dict[int, tuple[Decimal, Decimal]]:
    """Calculate netted debt totals for a user across multiple groups."""
    if not group_ids:
        return {}

    expense_balances = _get_user_expense_balance_by_group(session=session, group_ids=group_ids, user_id=user_id)
    settlement_balances = _get_user_settlement_balance_by_group(session=session, group_ids=group_ids, user_id=user_id)

    balance_by_group: dict[int, Decimal] = defaultdict(lambda: Decimal("0.00"))
    for group_id, balance in expense_balances.items():
        balance_by_group[group_id] += balance
    for group_id, balance in settlement_balances.items():
        balance_by_group[group_id] += balance

    return _balances_to_debt_totals(group_ids=group_ids, balance_by_group=balance_by_group)


def _get_user_expense_balance_by_group(*, session: Session, group_ids: list[int], user_id: int) -> dict[int, Decimal]:
    expense_statement = (
        select(
            col(Expense.group_id),
            func.coalesce(func.sum(case((col(Expense.created_by) == user_id, col(ExpenseSplit.share)), else_=0)), 0),
            func.coalesce(func.sum(case((col(ExpenseSplit.user_id) == user_id, col(ExpenseSplit.share)), else_=0)), 0),
        )
        .join(Expense, col(ExpenseSplit.expense_id) == col(Expense.id))
        .where(col(Expense.group_id).in_(group_ids))
        .where(col(ExpenseSplit.user_id) != col(Expense.created_by))
        .where(or_(col(ExpenseSplit.user_id) == user_id, col(Expense.created_by) == user_id))
        .group_by(col(Expense.group_id))
    )

    balances: dict[int, Decimal] = {}
    for group_id, credited_amount, debited_amount in session.exec(expense_statement).all():
        credited_decimal = Decimal(str(credited_amount))
        debited_decimal = Decimal(str(debited_amount))
        balances[group_id] = credited_decimal - debited_decimal

    return balances


def _get_user_settlement_balance_by_group(
    *, session: Session, group_ids: list[int], user_id: int
) -> dict[int, Decimal]:
    settlement_statement = (
        select(
            col(ExpenseGroupSettlement.group_id),
            func.coalesce(
                func.sum(
                    case(
                        (col(ExpenseGroupSettlement.debtor_id) == user_id, col(ExpenseGroupSettlement.amount)), else_=0
                    )
                ),
                0,
            ),
            func.coalesce(
                func.sum(
                    case(
                        (col(ExpenseGroupSettlement.creditor_id) == user_id, col(ExpenseGroupSettlement.amount)),
                        else_=0,
                    )
                ),
                0,
            ),
        )
        .where(col(ExpenseGroupSettlement.group_id).in_(group_ids))
        .where(
            or_(col(ExpenseGroupSettlement.debtor_id) == user_id, col(ExpenseGroupSettlement.creditor_id) == user_id)
        )
        .group_by(col(ExpenseGroupSettlement.group_id))
    )

    balances: dict[int, Decimal] = {}
    for group_id, debtor_amount, creditor_amount in session.exec(settlement_statement).all():
        debtor_decimal = Decimal(str(debtor_amount))
        creditor_decimal = Decimal(str(creditor_amount))
        balances[group_id] = debtor_decimal - creditor_decimal

    return balances


def _balances_to_debt_totals(
    *, group_ids: list[int], balance_by_group: dict[int, Decimal]
) -> dict[int, tuple[Decimal, Decimal]]:
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
