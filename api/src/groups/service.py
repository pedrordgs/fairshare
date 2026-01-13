from sqlmodel import Session, select, col

from auth.models import User

from .models import (
    ExpenseGroup,
    ExpenseGroupCreate,
    ExpenseGroupDetail,
    ExpenseGroupMember,
    ExpenseGroupMemberPublic,
    ExpenseGroupUpdate,
)


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
    db_group = ExpenseGroup.model_validate(group_in, update={"created_by": user.id})
    session.add(db_group)
    session.commit()
    session.refresh(db_group)

    # Add creator as a member
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


def is_member(*, session: Session, group_id: int, user_id: int) -> bool:
    """Check if a user is a member of a group."""
    return get_member(session=session, group_id=group_id, user_id=user_id) is not None


def add_member(*, session: Session, group: ExpenseGroup, user_id: int) -> ExpenseGroupMember:
    """Add a user to a group."""
    db_member = ExpenseGroupMember(group_id=group.id, user_id=user_id)
    session.add(db_member)
    session.commit()
    session.refresh(db_member)
    return db_member


def remove_member(*, session: Session, group: ExpenseGroup, user_id: int) -> None:
    """Remove a user from a group."""
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


def get_group_detail(*, session: Session, group: ExpenseGroup) -> ExpenseGroupDetail:
    """Get expense group with members details."""
    members = get_group_members(session=session, group_id=group.id)
    return ExpenseGroupDetail(id=group.id, name=group.name, created_by=group.created_by, members=members)
