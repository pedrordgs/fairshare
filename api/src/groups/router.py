from fastapi import APIRouter, HTTPException, Query, status

from auth.dependencies import AuthenticatedUser
from auth.service import get_user_by_id
from db.dependencies import DbSession

from .dependencies import GroupAsMember, GroupAsOwner
from .models import (
    AddMemberRequest,
    ExpenseGroupCreate,
    ExpenseGroupDetail,
    ExpenseGroupUpdate,
    PaginatedGroupsResponse,
)
from .service import (
    add_member,
    create_group,
    delete_group,
    get_group_detail,
    get_member,
    get_user_groups_count,
    get_user_groups_paginated,
    remove_member,
    update_group,
)

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("/", response_model=ExpenseGroupDetail, status_code=status.HTTP_201_CREATED)
async def create_expense_group(
    *, session: DbSession, authenticated_user: AuthenticatedUser, group_in: ExpenseGroupCreate
) -> ExpenseGroupDetail:
    """Create a new expense group. The creator is automatically added as a member."""
    group = create_group(session=session, user=authenticated_user, group_in=group_in)
    return get_group_detail(session=session, group=group)


@router.get("/", response_model=PaginatedGroupsResponse)
async def list_expense_groups(
    *,
    session: DbSession,
    authenticated_user: AuthenticatedUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=12, ge=1, le=100),
) -> PaginatedGroupsResponse:
    """List expense groups where the authenticated user is a member with pagination."""
    assert authenticated_user.id is not None
    total = get_user_groups_count(session=session, user_id=authenticated_user.id)
    groups = get_user_groups_paginated(session=session, user_id=authenticated_user.id, offset=offset, limit=limit)
    items = [get_group_detail(session=session, group=group) for group in groups]
    return PaginatedGroupsResponse(items=items, total=total, offset=offset, limit=limit)


@router.get("/{group_id}", response_model=ExpenseGroupDetail)
async def get_expense_group(*, session: DbSession, group: GroupAsMember) -> ExpenseGroupDetail:
    """Get details of an expense group including members."""
    return get_group_detail(session=session, group=group)


@router.patch("/{group_id}", response_model=ExpenseGroupDetail)
async def update_expense_group(
    *, session: DbSession, group: GroupAsOwner, group_in: ExpenseGroupUpdate
) -> ExpenseGroupDetail:
    """Update an expense group. Only the owner can update."""
    group = update_group(session=session, group=group, group_in=group_in)
    return get_group_detail(session=session, group=group)


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_group(*, session: DbSession, group: GroupAsOwner) -> None:
    """Delete an expense group. Only the owner can delete."""
    delete_group(session=session, group=group)


@router.post("/{group_id}/members", response_model=ExpenseGroupDetail, status_code=status.HTTP_201_CREATED)
async def add_group_member(
    *, session: DbSession, group: GroupAsOwner, member_in: AddMemberRequest
) -> ExpenseGroupDetail:
    """Add a user to the expense group. Only the owner can add members."""
    # Check if user exists
    user = get_user_by_id(session=session, user_id=member_in.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Check if user is already a member
    if get_member(session=session, group_id=group.id, user_id=member_in.user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already a member of this group")

    add_member(session=session, group=group, user_id=member_in.user_id)
    return get_group_detail(session=session, group=group)


@router.delete("/{group_id}/members/{user_id}", response_model=ExpenseGroupDetail)
async def remove_group_member(*, session: DbSession, group: GroupAsOwner, user_id: int) -> ExpenseGroupDetail:
    """Remove a user from the expense group. Only the owner can remove members. Owner cannot remove themselves."""
    # Owner cannot remove themselves
    if group.created_by == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Owner cannot remove themselves from the group"
        )

    # Check if user is a member
    if not get_member(session=session, group_id=group.id, user_id=user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User is not a member of this group")

    remove_member(session=session, group=group, user_id=user_id)
    return get_group_detail(session=session, group=group)
