from typing import Annotated

from fastapi import Depends, HTTPException, Path, status

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession

from .models import ExpenseGroup, ExpenseGroupSettlement
from .service import get_group_by_id, get_settlement_by_id, is_member


async def get_group_as_member(
    session: DbSession, authenticated_user: AuthenticatedUser, group_id: Annotated[int, Path()]
) -> ExpenseGroup:
    """
    Dependency that fetches a group and verifies the user is a member.
    Returns 404 if group doesn't exist or user is not a member.
    """
    group = get_group_by_id(session=session, group_id=group_id)
    if not group or not is_member(session=session, group_id=group_id, user_id=authenticated_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group


async def get_group_as_owner(
    session: DbSession, authenticated_user: AuthenticatedUser, group_id: Annotated[int, Path()]
) -> ExpenseGroup:
    """
    Dependency that fetches a group and verifies the user is the owner.
    Returns 404 if group doesn't exist or user is not a member.
    Returns 403 if user is a member but not the owner.
    """
    group = get_group_by_id(session=session, group_id=group_id)
    if not group or not is_member(session=session, group_id=group_id, user_id=authenticated_user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if group.created_by != authenticated_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this group")
    return group


async def get_settlement_as_creator(
    session: DbSession,
    authenticated_user: AuthenticatedUser,
    group_id: Annotated[int, Path()],
    settlement_id: Annotated[int, Path()],
) -> ExpenseGroupSettlement:
    """
    Dependency that fetches a settlement and verifies the user is a group member and the settlement creator.
    Returns 404 if settlement doesn't exist, group doesn't exist, or user is not a group member.
    Returns 403 if user is a member but not the settlement creator.
    """
    settlement = get_settlement_by_id(session=session, settlement_id=settlement_id)
    if (
        not settlement
        or settlement.group_id != group_id
        or not is_member(session=session, group_id=group_id, user_id=authenticated_user.id)
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Settlement not found")
    if settlement.created_by != authenticated_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to modify this settlement")
    return settlement


# Type aliases for cleaner route signatures
GroupAsMember = Annotated[ExpenseGroup, Depends(get_group_as_member)]
GroupAsOwner = Annotated[ExpenseGroup, Depends(get_group_as_owner)]
SettlementAsCreator = Annotated[ExpenseGroupSettlement, Depends(get_settlement_as_creator)]
