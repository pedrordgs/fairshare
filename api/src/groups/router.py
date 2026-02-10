from fastapi import APIRouter, HTTPException, Query, status

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession

from .dependencies import GroupAsMember, GroupAsOwner
from core.models import PaginatedResponse

from .models import ExpenseGroupCreate, ExpenseGroupDetail, ExpenseGroupUpdate, JoinGroupRequest
from .service import (
    add_member,
    create_group,
    delete_group,
    get_group_detail,
    get_group_by_invite_code,
    get_member,
    get_user_groups_count,
    get_user_groups_paginated,
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


@router.get("/", response_model=PaginatedResponse[ExpenseGroupDetail])
async def list_expense_groups(
    *,
    session: DbSession,
    authenticated_user: AuthenticatedUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=12, ge=1, le=100),
) -> PaginatedResponse[ExpenseGroupDetail]:
    """List expense groups where the authenticated user is a member with pagination."""
    assert authenticated_user.id is not None
    total = get_user_groups_count(session=session, user_id=authenticated_user.id)
    groups = get_user_groups_paginated(session=session, user_id=authenticated_user.id, offset=offset, limit=limit)
    items = [get_group_detail(session=session, group=group) for group in groups]
    return PaginatedResponse[ExpenseGroupDetail](items=items, total=total, offset=offset, limit=limit)


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


@router.post("/join", response_model=ExpenseGroupDetail)
async def join_group_by_code(
    *, session: DbSession, authenticated_user: AuthenticatedUser, join_in: JoinGroupRequest
) -> ExpenseGroupDetail:
    """Join an expense group using an invite code."""
    assert authenticated_user.id is not None
    group = get_group_by_invite_code(session=session, code=join_in.code)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    assert group.id is not None

    if get_member(session=session, group_id=group.id, user_id=authenticated_user.id):
        return get_group_detail(session=session, group=group)

    add_member(session=session, group=group, user_id=authenticated_user.id)
    return get_group_detail(session=session, group=group)
