from typing import Annotated

from fastapi import Depends, HTTPException, Path, status

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession

from .models import ExpenseGroup
from .service import get_group_by_id, is_member


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


# Type aliases for cleaner route signatures
GroupAsMember = Annotated[ExpenseGroup, Depends(get_group_as_member)]
GroupAsOwner = Annotated[ExpenseGroup, Depends(get_group_as_owner)]
