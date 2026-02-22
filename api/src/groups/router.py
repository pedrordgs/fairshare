from fastapi import APIRouter, HTTPException, Query, Response, status

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession

from .dependencies import GroupAsMember, GroupAsOwner
from core.models import PaginatedResponse

from .models import (
    ExpenseGroupCreate,
    ExpenseGroupDetail,
    ExpenseGroupListItem,
    ExpenseGroupUpdate,
    ExpenseGroupSettlementPublic,
    GroupSettlementCreate,
    JoinGroupRequest,
    JoinGroupRequestPublic,
    JoinRequestStatus,
)
from .service import (
    add_member,
    calculate_user_debts,
    calculate_user_debt_totals,
    create_group,
    create_group_settlement,
    create_join_request_by_invite_code,
    delete_group,
    get_group_detail,
    get_group_expense_counts,
    get_group_last_activity_by_group,
    get_group_list_item,
    get_group_settlements_count,
    get_group_settlements_paginated,
    get_join_request_by_id,
    get_join_request_public,
    get_member,
    get_user_groups_count,
    get_user_groups_paginated,
    list_join_requests,
    resolve_join_request,
    update_group,
)

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("/", response_model=ExpenseGroupDetail, status_code=status.HTTP_201_CREATED)
async def create_expense_group(
    *, session: DbSession, authenticated_user: AuthenticatedUser, group_in: ExpenseGroupCreate
) -> ExpenseGroupDetail:
    """Create a new expense group. The creator is automatically added as a member."""
    group = create_group(session=session, user=authenticated_user, group_in=group_in)
    return get_group_detail(session=session, group=group, user_id=authenticated_user.id)


@router.get("/", response_model=PaginatedResponse[ExpenseGroupListItem])
async def list_expense_groups(
    *,
    session: DbSession,
    authenticated_user: AuthenticatedUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=12, ge=1, le=100),
) -> PaginatedResponse[ExpenseGroupListItem]:
    """List expense groups where the authenticated user is a member with pagination."""
    if authenticated_user.id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    total = get_user_groups_count(session=session, user_id=authenticated_user.id)
    groups = get_user_groups_paginated(session=session, user_id=authenticated_user.id, offset=offset, limit=limit)
    group_ids = [group.id for group in groups if group.id is not None]
    totals_by_group = calculate_user_debt_totals(session=session, group_ids=group_ids, user_id=authenticated_user.id)
    expense_counts = get_group_expense_counts(session=session, group_ids=group_ids)
    last_activity_by_group = get_group_last_activity_by_group(session=session, group_ids=group_ids)
    items = [
        get_group_list_item(
            group=group,
            totals_by_group=totals_by_group,
            expense_counts=expense_counts,
            last_activity_by_group=last_activity_by_group,
        )
        for group in groups
    ]
    return PaginatedResponse[ExpenseGroupListItem](items=items, total=total, offset=offset, limit=limit)


@router.get("/{group_id}/", response_model=ExpenseGroupDetail)
async def get_expense_group(
    *, session: DbSession, group: GroupAsMember, authenticated_user: AuthenticatedUser
) -> ExpenseGroupDetail:
    """Get details of an expense group including members."""
    return get_group_detail(session=session, group=group, user_id=authenticated_user.id)


@router.get("/{group_id}/settlements/", response_model=PaginatedResponse[ExpenseGroupSettlementPublic])
async def list_group_settlements(
    *,
    session: DbSession,
    group: GroupAsMember,
    authenticated_user: AuthenticatedUser,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
) -> PaginatedResponse[ExpenseGroupSettlementPublic]:
    """List settlements in a group with pagination."""
    if group.id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    total = get_group_settlements_count(session=session, group_id=group.id)
    settlements = get_group_settlements_paginated(session=session, group_id=group.id, offset=offset, limit=limit)
    items = [ExpenseGroupSettlementPublic.model_validate(settlement) for settlement in settlements]
    return PaginatedResponse[ExpenseGroupSettlementPublic](items=items, total=total, offset=offset, limit=limit)


@router.patch("/{group_id}/", response_model=ExpenseGroupDetail)
async def update_expense_group(
    *, session: DbSession, group: GroupAsOwner, group_in: ExpenseGroupUpdate, authenticated_user: AuthenticatedUser
) -> ExpenseGroupDetail:
    """Update an expense group. Only the owner can update."""
    group = update_group(session=session, group=group, group_in=group_in)
    return get_group_detail(session=session, group=group, user_id=authenticated_user.id)


@router.delete("/{group_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense_group(*, session: DbSession, group: GroupAsOwner) -> None:
    """Delete an expense group. Only the owner can delete."""
    delete_group(session=session, group=group)


@router.post("/join/", response_model=JoinGroupRequestPublic, status_code=status.HTTP_201_CREATED)
async def join_group_by_code(
    *, session: DbSession, authenticated_user: AuthenticatedUser, join_in: JoinGroupRequest, response: Response
) -> JoinGroupRequestPublic:
    """Request to join an expense group using an invite code."""
    if authenticated_user.id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        join_request, created = create_join_request_by_invite_code(
            session=session, user=authenticated_user, code=join_in.code
        )
    except ValueError as exc:
        if str(exc) == "Group not found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
        if str(exc) == "User already a member":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="You are already a member of this group"
            )
        if str(exc) == "Join request limit reached":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Join request limit reached for this group"
            )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to create join request")

    if not created:
        response.status_code = status.HTTP_200_OK

    if join_request.id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    join_request_public = get_join_request_public(session=session, request_id=join_request.id)
    if not join_request_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    return join_request_public


@router.get("/{group_id}/join-requests/", response_model=list[JoinGroupRequestPublic])
async def list_group_join_requests(
    *,
    session: DbSession,
    group: GroupAsOwner,
    status_filter: JoinRequestStatus | None = Query(default=JoinRequestStatus.PENDING, alias="status"),
) -> list[JoinGroupRequestPublic]:
    """List join requests for a group (owner only)."""
    if group.id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return list_join_requests(session=session, group_id=group.id, status=status_filter)


@router.post("/{group_id}/join-requests/{request_id}/accept/", response_model=JoinGroupRequestPublic)
async def accept_group_join_request(
    *, session: DbSession, group: GroupAsOwner, authenticated_user: AuthenticatedUser, request_id: int
) -> JoinGroupRequestPublic:
    """Accept a join request and add the user to the group."""
    if authenticated_user.id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    if group.id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    join_request = get_join_request_by_id(session=session, request_id=request_id)
    if not join_request or join_request.group_id != group.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    if join_request.status != JoinRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Join request already resolved")

    resolve_join_request(
        session=session, request=join_request, status=JoinRequestStatus.ACCEPTED, resolved_by=authenticated_user.id
    )
    if join_request.user_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    if not get_member(session=session, group_id=group.id, user_id=join_request.user_id):
        add_member(session=session, group=group, user_id=join_request.user_id)
    if join_request.id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    join_request_public = get_join_request_public(session=session, request_id=join_request.id)
    if not join_request_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    return join_request_public


@router.post("/{group_id}/join-requests/{request_id}/decline/", response_model=JoinGroupRequestPublic)
async def decline_group_join_request(
    *, session: DbSession, group: GroupAsOwner, authenticated_user: AuthenticatedUser, request_id: int
) -> JoinGroupRequestPublic:
    """Decline a join request for a group."""
    if authenticated_user.id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    join_request = get_join_request_by_id(session=session, request_id=request_id)
    if not join_request or join_request.group_id != group.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    if join_request.status != JoinRequestStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Join request already resolved")

    resolve_join_request(
        session=session, request=join_request, status=JoinRequestStatus.DECLINED, resolved_by=authenticated_user.id
    )
    if join_request.id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    join_request_public = get_join_request_public(session=session, request_id=join_request.id)
    if not join_request_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join request not found")
    return join_request_public


@router.post("/{group_id}/settlements/", response_model=ExpenseGroupDetail, status_code=status.HTTP_201_CREATED)
async def create_group_settlement_payment(
    *,
    session: DbSession,
    group: GroupAsMember,
    authenticated_user: AuthenticatedUser,
    settlement_in: GroupSettlementCreate,
) -> ExpenseGroupDetail:
    """Record a settlement payment. User must be a group member."""
    if group.id is None or authenticated_user.id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if settlement_in.creditor_id == authenticated_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Creditor must be a different group member")

    if not get_member(session=session, group_id=group.id, user_id=settlement_in.creditor_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    owed_by_total, _, owed_by_user, _ = calculate_user_debts(
        session=session, group_id=group.id, user_id=authenticated_user.id
    )
    if owed_by_total <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No outstanding debt to settle")

    owed_entry = next((entry for entry in owed_by_user if entry.user_id == settlement_in.creditor_id), None)
    if not owed_entry:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No outstanding debt for selected member")
    if settlement_in.amount > owed_entry.amount:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount exceeds outstanding debt")

    create_group_settlement(
        session=session,
        group_id=group.id,
        debtor_id=authenticated_user.id,
        creditor_id=settlement_in.creditor_id,
        amount=settlement_in.amount,
        created_by=authenticated_user.id,
    )
    return get_group_detail(session=session, group=group, user_id=authenticated_user.id)
