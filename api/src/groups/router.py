from fastapi import APIRouter, HTTPException, Query, Response, status

from auth.dependencies import AuthenticatedUser
from db.dependencies import DbSession

from .dependencies import GroupAsMember, GroupAsOwner, SettlementAsCreator
from .utils import validate_settlement_creditor_and_amount
from core.models import PaginatedResponse

from .models import (
    ExpenseGroupCreate,
    ExpenseGroupDetail,
    ExpenseGroupListItem,
    ExpenseGroupUpdate,
    ExpenseGroupSettlementPublic,
    GroupSettlementCreate,
    GroupSettlementUpdate,
    JoinGroupRequest,
    JoinGroupRequestPublic,
    JoinRequestStatus,
)
from .service import (
    MAX_JOIN_REQUEST_ATTEMPTS,
    add_member,
    calculate_user_debt_totals,
    count_declined_join_requests,
    create_group,
    create_group_settlement,
    create_join_request,
    delete_group,
    delete_settlement,
    get_group_by_invite_code,
    get_group_detail,
    get_group_expense_counts,
    get_group_last_activity_by_group,
    get_group_list_item,
    get_group_settlements_count,
    get_group_settlements_paginated,
    get_join_request_by_id,
    get_join_request_public,
    get_member,
    get_pending_join_request,
    get_user_groups_count,
    get_user_groups_paginated,
    is_member,
    list_join_requests,
    resolve_join_request,
    update_group,
    update_settlement,
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
    group = get_group_by_invite_code(session=session, code=join_in.code)
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    if is_member(session=session, group_id=group.id, user_id=authenticated_user.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You are already a member of this group")
    pending_request = get_pending_join_request(session=session, group_id=group.id, user_id=authenticated_user.id)
    if pending_request:
        response.status_code = status.HTTP_200_OK
        return get_join_request_public(session=session, request_id=pending_request.id)

    declined_count = count_declined_join_requests(session=session, group_id=group.id, user_id=authenticated_user.id)
    if declined_count >= MAX_JOIN_REQUEST_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Join request limit reached for this group")
    join_request = create_join_request(session=session, group_id=group.id, user_id=authenticated_user.id)
    return get_join_request_public(session=session, request_id=join_request.id)


@router.get("/{group_id}/join-requests/", response_model=list[JoinGroupRequestPublic])
async def list_group_join_requests(
    *,
    session: DbSession,
    group: GroupAsOwner,
    status_filter: JoinRequestStatus | None = Query(default=JoinRequestStatus.PENDING, alias="status"),
) -> list[JoinGroupRequestPublic]:
    """List join requests for a group (owner only)."""
    return list_join_requests(session=session, group_id=group.id, status=status_filter)


@router.post("/{group_id}/join-requests/{request_id}/accept/", response_model=JoinGroupRequestPublic)
async def accept_group_join_request(
    *, session: DbSession, group: GroupAsOwner, authenticated_user: AuthenticatedUser, request_id: int
) -> JoinGroupRequestPublic:
    """Accept a join request and add the user to the group."""
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
    validate_settlement_creditor_and_amount(
        session=session,
        group_id=group.id,
        debtor_id=authenticated_user.id,
        creditor_id=settlement_in.creditor_id,
        amount=settlement_in.amount,
    )

    create_group_settlement(
        session=session,
        group_id=group.id,
        debtor_id=authenticated_user.id,
        creditor_id=settlement_in.creditor_id,
        amount=settlement_in.amount,
        created_by=authenticated_user.id,
    )
    return get_group_detail(session=session, group=group, user_id=authenticated_user.id)


@router.patch("/{group_id}/settlements/{settlement_id}/", response_model=ExpenseGroupSettlementPublic)
async def update_group_settlement(
    *, session: DbSession, settlement: SettlementAsCreator, update_in: GroupSettlementUpdate
) -> ExpenseGroupSettlementPublic:
    """Update a settlement's amount and/or payee. Only the creator can update."""
    target_creditor_id = update_in.creditor_id if update_in.creditor_id is not None else settlement.creditor_id
    target_amount = update_in.amount if update_in.amount is not None else settlement.amount
    validate_settlement_creditor_and_amount(
        session=session,
        group_id=settlement.group_id,
        debtor_id=settlement.debtor_id,
        creditor_id=target_creditor_id,
        amount=target_amount,
        existing_amount=settlement.amount if target_creditor_id == settlement.creditor_id else None,
    )
    updated = update_settlement(session=session, settlement=settlement, update_data=update_in)
    return ExpenseGroupSettlementPublic.model_validate(updated)


@router.delete("/{group_id}/settlements/{settlement_id}/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group_settlement(*, session: DbSession, settlement: SettlementAsCreator) -> None:
    """Delete a settlement. Only the creator can delete."""
    delete_settlement(session=session, settlement=settlement)
