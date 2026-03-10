import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Badge } from "@components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Tabs, TabItem } from "@components/ui/Tabs";
import { Button } from "@components/ui/Button";
import { ButtonWithBadge } from "@components/ui/ButtonWithBadge";
import { groupsApi } from "@services/groups";
import { expensesApi } from "@services/expenses";
import { useAuth } from "@context/AuthContext";
import { logError } from "@utils/errorUtils";
import { copyToClipboard } from "@utils/clipboard";
import { formatCurrency, formatDate } from "@utils/formatUtils";
import receiptIcon from "@assets/icons/receipt-icon.svg";
import { CopyIcon, EditIcon, TrashIcon } from "@assets/icons/form-icons";
import { AddExpenseModal } from "@components/expenses/AddExpenseModal";
import { EditExpenseModal } from "@components/expenses/EditExpenseModal";
import { ConfirmationModal } from "@components/ui/ConfirmationModal";
import { SettleUpModal } from "@components/settlements/SettleUpModal";
import { SettlementHistory } from "@components/settlements/SettlementHistory";
import { JoinRequestsModal } from "@components/groups/JoinRequestsModal";
import { EditGroupModal } from "@components/groups/EditGroupModal";
import { toast } from "sonner";
import type { Expense } from "@schema/expenses";

const routeApi = getRouteApi("/groups/$groupId");

/**
 * Validates and parses the groupId route parameter.
 * Returns null if the parameter is invalid.
 */
const parseGroupId = (groupIdParam: string): number | null => {
  const parsed = Number(groupIdParam);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    logError(
      "VALIDATION_ERROR",
      new Error(`Invalid groupId route parameter: ${groupIdParam}`),
      {
        param: groupIdParam,
        url: window.location.href,
      },
    );
    return null;
  }
  return parsed;
};

/**
 * Gets error information for display based on the error type.
 */
const getErrorInfo = (
  error: unknown,
): { title: string; message: string; isRetryable: boolean } => {
  // Check if it's a 404 error
  const axiosError = error as { response?: { status?: number } };
  const status = axiosError.response?.status;

  if (status === 404) {
    return {
      title: "Group Not Found",
      message:
        "The group you're looking for doesn't exist or you don't have access.",
      isRetryable: false,
    };
  }

  if (status === 403) {
    return {
      title: "Access Denied",
      message: "You don't have permission to view this group.",
      isRetryable: false,
    };
  }

  if (status === 500) {
    return {
      title: "Server Error",
      message:
        "We're experiencing technical difficulties. Please try again in a moment.",
      isRetryable: true,
    };
  }

  // Network or other errors
  return {
    title: "Error Loading Group",
    message:
      "We couldn't load the group. Please check your connection and try again.",
    isRetryable: true,
  };
};

export const GroupDetailPage: React.FC = () => {
  const { groupId: groupIdParam } = routeApi.useParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = React.useState(false);
  const [isJoinRequestsOpen, setIsJoinRequestsOpen] = React.useState(false);
  const [isEditGroupOpen, setIsEditGroupOpen] = React.useState(false);
  const [isDeleteGroupOpen, setIsDeleteGroupOpen] = React.useState(false);
  const [activeCenterTab, setActiveCenterTab] = React.useState<
    "activity" | "settlements" | "members"
  >("activity");
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(
    null,
  );
  const [deletingExpense, setDeletingExpense] = React.useState<Expense | null>(
    null,
  );
  const [demotingUserId, setDemotingUserId] = React.useState<number | null>(
    null,
  );

  // Validate and parse the groupId parameter
  const groupId = parseGroupId(groupIdParam);

  const {
    data: group,
    isLoading: isGroupLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => {
      if (!groupId) {
        throw new Error("Invalid group ID");
      }
      return groupsApi.getGroup(groupId);
    },
    enabled: !isAuthLoading && !!user && !!groupId,
  });

  const isOwner = !!group && !!user && group.created_by === user.id;

  const isAdmin = group?.is_admin ?? false;

  const promoteMemberMutation = useMutation({
    mutationFn: (userId: number) => {
      if (!groupId) throw new Error("Invalid group ID");
      return groupsApi.promoteMember(groupId, userId);
    },
    onSuccess: () => {
      toast.success("Member promoted to admin.");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: () => {
      toast.error("Couldn't promote the member.");
    },
  });

  const demoteMemberMutation = useMutation({
    mutationFn: (userId: number) => {
      if (!groupId) throw new Error("Invalid group ID");
      return groupsApi.demoteMember(groupId, userId);
    },
    onSuccess: () => {
      toast.success("Admin demoted to member.");
      setDemotingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: () => {
      toast.error("Couldn't demote the admin.");
      setDemotingUserId(null);
    },
  });

  const {
    data: joinRequests,
    isLoading: isJoinRequestsLoading,
    error: joinRequestsError,
  } = useQuery({
    queryKey: ["group", groupId, "join-requests"],
    queryFn: () => {
      if (!groupId) {
        throw new Error("Invalid group ID");
      }
      return groupsApi.listJoinRequests(groupId);
    },
    // isAdmin check enables this for non-owner admins once the backend supports it;
    // for now isOwner === true implies isAdmin === true for the current user.
    enabled: !isAuthLoading && !!user && !!groupId && (isOwner || isAdmin),
  });

  const acceptJoinRequestMutation = useMutation({
    mutationFn: (requestId: number) => {
      if (!groupId) {
        throw new Error("Invalid group ID");
      }
      return groupsApi.acceptJoinRequest(groupId, requestId);
    },
    onSuccess: () => {
      toast.success("Join request accepted.");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({
        queryKey: ["group", groupId, "join-requests"],
      });
    },
    onError: () => {
      toast.error("Couldn't accept the join request.");
    },
  });

  const declineJoinRequestMutation = useMutation({
    mutationFn: (requestId: number) => {
      if (!groupId) {
        throw new Error("Invalid group ID");
      }
      return groupsApi.declineJoinRequest(groupId, requestId);
    },
    onSuccess: () => {
      toast.success("Join request declined.");
      queryClient.invalidateQueries({
        queryKey: ["group", groupId, "join-requests"],
      });
    },
    onError: () => {
      toast.error("Couldn't decline the join request.");
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => {
      if (!groupId) {
        throw new Error("Invalid group ID");
      }
      return groupsApi.deleteGroup(groupId);
    },
    onSuccess: () => {
      toast.success("Group deleted.");
      queryClient.invalidateQueries({
        queryKey: ["groups", "list"],
        exact: false,
      });
      navigate({ to: "/dashboard" });
    },
    onError: () => {
      toast.error("Couldn't delete the group.");
    },
  });

  const {
    data: expensesData,
    isLoading: isExpensesLoading,
    error: expensesError,
  } = useQuery({
    queryKey: ["expenses", groupId],
    queryFn: () => {
      if (!groupId) {
        throw new Error("Invalid group ID");
      }
      return expensesApi.listAllGroupExpenses(groupId);
    },
    enabled: !isAuthLoading && !!user && !!groupId,
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: number) => {
      if (!groupId) {
        throw new Error("Invalid group ID");
      }
      return expensesApi.deleteExpense(groupId, expenseId);
    },
    onSuccess: () => {
      toast.success("Expense deleted.");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      setDeletingExpense(null);
    },
    onError: () => {
      toast.error("Couldn't delete the expense.");
    },
  });

  const inviteCode = group?.invite_code;
  const joinRequestsCount = joinRequests?.length ?? 0;

  const handleCopyInviteCode = React.useCallback(() => {
    if (!inviteCode) {
      return;
    }
    copyToClipboard(inviteCode, {
      successMessage: "Invite code copied",
      errorMessage: "Couldn't copy the code. Please copy it manually.",
    });
  }, [inviteCode]);

  // Log query errors for debugging
  React.useEffect(() => {
    if (queryError) {
      logError("NOT_FOUND", queryError, {
        groupId: groupIdParam,
        userId: user?.id,
      });
    }
  }, [queryError, groupIdParam, user?.id]);

  React.useEffect(() => {
    if (expensesError) {
      logError("EXPENSES_LOAD_FAILED", expensesError, {
        groupId: groupIdParam,
        userId: user?.id,
      });
    }
  }, [expensesError, groupIdParam, user?.id]);

  const totalExpenses = React.useMemo(() => {
    if (!expensesData) {
      return 0;
    }
    return expensesData.items.reduce(
      (total, expense) => total + expense.value,
      0,
    );
  }, [expensesData]);

  const currentUserId = user?.id ?? null;

  const membersById = React.useMemo(() => {
    if (!group) {
      return new Map<number, string>();
    }
    return new Map(
      group.members.map((member) => [member.user_id, member.name]),
    );
  }, [group]);

  if (isAuthLoading || isGroupLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!groupId) {
    const errorInfo = getErrorInfo(new Error("Invalid group ID"));
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {errorInfo.title}
          </h1>
          <p className="text-slate-600 mb-6">{errorInfo.message}</p>
          <Button onClick={() => navigate({ to: "/dashboard" })}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (queryError || !group) {
    const errorInfo = queryError
      ? getErrorInfo(queryError)
      : getErrorInfo(new Error("Group not found"));
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            {errorInfo.title}
          </h1>
          <p className="text-slate-600 mb-6">{errorInfo.message}</p>
          <div className="space-x-4">
            {errorInfo.isRetryable && (
              <Button onClick={() => refetch()}>Try Again</Button>
            )}
            <Button
              variant={errorInfo.isRetryable ? "secondary" : "primary"}
              onClick={() => navigate({ to: "/dashboard" })}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-max section-padding">
      {/* Hero Header */}
      <div className="mb-8 fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/dashboard" })}
            className="text-slate-500 hover:text-slate-700"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-5xl font-bold text-slate-900 mb-4">
              {group.name}
            </h1>
            <div className="flex items-center gap-4 text-slate-500">
              <span className="text-lg">{group.members.length} members</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && joinRequestsCount > 0 && (
              <ButtonWithBadge
                variant="secondary"
                size="sm"
                badgeCount={joinRequestsCount}
                badgeVariant="warning"
                onClick={() => setIsJoinRequestsOpen(true)}
              >
                Join requests
              </ButtonWithBadge>
            )}
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditGroupOpen(true)}
              >
                Edit
              </Button>
            )}
            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => setIsDeleteGroupOpen(true)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 slide-up stagger-1">
        {/* Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Expenses — always shown */}
          <div className="rounded-xl border border-accent-100 bg-gradient-to-br from-accent-50 to-accent-100/50 px-5 py-4">
            <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalExpenses)}
            </p>
          </div>
          {/* You Owe — only if non-zero */}
          {group.owed_by_user_total > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-5 py-4">
              <p className="text-sm text-rose-700 mb-1">You Owe</p>
              <p className="text-2xl font-bold text-rose-700">
                {formatCurrency(group.owed_by_user_total)}
              </p>
            </div>
          )}
          {/* Owed to You — only if non-zero */}
          {group.owed_to_user_total > 0 && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-4">
              <p className="text-sm text-emerald-700 mb-1">Owed to You</p>
              <p className="text-2xl font-bold text-emerald-700">
                {formatCurrency(group.owed_to_user_total)}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-6 items-stretch">
          {/* Tabs Card — Expenses | Settlements | Members */}
          <div className="flex-[2] min-w-0">
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between min-h-9">
                <CardTitle className="text-xl flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                  {activeCenterTab === "activity"
                    ? "Expenses"
                    : activeCenterTab === "settlements"
                      ? "Settlements"
                      : "Members"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {activeCenterTab === "activity" && (
                    <Button size="sm" onClick={() => setIsAddExpenseOpen(true)}>
                      + Add Expense
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs
                  defaultTab="activity"
                  activeTab={activeCenterTab}
                  onTabChange={(value) => {
                    if (
                      value === "activity" ||
                      value === "settlements" ||
                      value === "members"
                    ) {
                      setActiveCenterTab(value);
                    }
                  }}
                >
                  <TabItem label="Expenses" value="activity">
                    {isExpensesLoading ? (
                      <div className="text-center py-16">
                        <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-slate-600">Loading expenses...</p>
                      </div>
                    ) : expensesError ? (
                      <div className="text-center py-12">
                        <p className="text-slate-600 font-medium mb-2">
                          Couldn't load expenses
                        </p>
                        <p className="text-slate-400 text-sm">
                          Please try again in a moment.
                        </p>
                      </div>
                    ) : expensesData && expensesData.items.length > 0 ? (
                      <div className="h-[420px] overflow-y-auto pr-1">
                        <div className="space-y-4">
                          {expensesData.items.map((expense) => {
                            const creatorName = membersById.get(
                              expense.created_by,
                            );
                            const onBehalfOfName =
                              expense.on_behalf_of_user_id !== null &&
                              expense.on_behalf_of_user_id !== undefined
                                ? membersById.get(expense.on_behalf_of_user_id)
                                : undefined;
                            const isCurrentUserExpense =
                              currentUserId !== null &&
                              expense.created_by === currentUserId;
                            const canEditOrDelete =
                              isCurrentUserExpense || isAdmin;
                            const expenseMeta = `${
                              creatorName
                                ? `Created by ${creatorName}`
                                : "Created by member"
                            } · ${formatDate(expense.created_at)}`;
                            return (
                              <div
                                key={expense.id}
                                className={`rounded-xl border px-4 py-3 shadow-sm transition-colors ${
                                  isCurrentUserExpense
                                    ? "border-sky-200 bg-sky-50/60"
                                    : "border-primary-100 bg-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-semibold text-slate-900 truncate">
                                        {expense.name}
                                      </p>
                                    </div>
                                    {expense.description && (
                                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                        {expense.description}
                                      </p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-2">
                                      {expenseMeta}
                                    </p>
                                    {onBehalfOfName && (
                                      <p className="text-xs text-slate-500 mt-1">
                                        On behalf of{" "}
                                        <span className="font-medium">
                                          {onBehalfOfName}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-lg font-bold text-slate-900">
                                      {formatCurrency(expense.value)}
                                    </p>
                                    {canEditOrDelete && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          aria-label={`Edit expense ${expense.name}`}
                                          onClick={() =>
                                            setEditingExpense(expense)
                                          }
                                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                        >
                                          <EditIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          aria-label={`Delete expense ${expense.name}`}
                                          onClick={() =>
                                            setDeletingExpense(expense)
                                          }
                                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                          <TrashIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[420px] overflow-y-auto flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <img
                            src={receiptIcon}
                            alt="Receipt"
                            className="w-8 h-8 text-primary-600"
                          />
                        </div>
                        <p className="text-slate-600 font-medium mb-2">
                          No expenses yet
                        </p>
                        <p className="text-slate-400 text-sm">
                          Start tracking shared costs by adding your first
                          expense
                        </p>
                      </div>
                    )}
                  </TabItem>
                  <TabItem label="Settlements" value="settlements">
                    <SettlementHistory
                      groupId={groupId}
                      membersById={membersById}
                      currentUserId={currentUserId}
                      embedded
                      enabled={activeCenterTab === "settlements"}
                    />
                  </TabItem>
                  <TabItem label="Members" value="members">
                    {group.members.length > 0 ? (
                      <div className="h-[420px] overflow-y-auto pr-1">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-slate-500 text-sm">
                            {group.members.length} people in this group
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 shrink-0">
                              Invite code:
                            </span>
                            <span className="font-mono text-sm text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
                              {group.invite_code}
                            </span>
                            <button
                              onClick={handleCopyInviteCode}
                              aria-label="Copy invite code"
                              className="text-slate-400 hover:text-primary-600 transition-colors"
                            >
                              <CopyIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {group.members.map((member) => {
                            const isMemberOwner =
                              member.user_id === group.created_by;
                            const isCurrentUser =
                              member.user_id === currentUserId;
                            const canToggleAdmin =
                              isOwner && !isCurrentUser && !isMemberOwner;
                            return (
                              <div
                                key={member.user_id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-primary-50/50"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-slate-900 truncate">
                                      {member.name}
                                    </p>
                                    {member.is_admin && (
                                      <Badge
                                        size="sm"
                                        variant="warning"
                                        ariaLabel="Group Administrator"
                                      >
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">
                                    {member.email}
                                  </p>
                                </div>
                                {canToggleAdmin && (
                                  <div className="flex-shrink-0">
                                    {member.is_admin ? (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() =>
                                          setDemotingUserId(member.user_id)
                                        }
                                        disabled={
                                          promoteMemberMutation.isPending ||
                                          demoteMemberMutation.isPending
                                        }
                                      >
                                        Demote
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        className="text-xs"
                                        onClick={() =>
                                          promoteMemberMutation.mutate(
                                            member.user_id,
                                          )
                                        }
                                        disabled={
                                          promoteMemberMutation.isPending ||
                                          demoteMemberMutation.isPending
                                        }
                                      >
                                        Promote
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-[420px] flex items-center justify-center">
                        <p className="text-slate-400 text-sm">No members yet</p>
                      </div>
                    )}
                  </TabItem>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Balances Card — 1/3 width, shows all group transfers */}
          {group.group_transfers.length > 0 && (
            <div className="flex-[1] min-w-0 flex flex-col">
              <Card className="bg-white h-full">
                <CardHeader className="flex flex-row items-center justify-between min-h-9">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Balances
                  </CardTitle>
                  {group.owed_by_user.length > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setIsSettleUpOpen(true)}
                    >
                      Settle Up
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="h-[420px] overflow-y-auto pr-1">
                    <div className="space-y-2">
                      {group.group_transfers.map((transfer, idx) => {
                        const fromName =
                          membersById.get(transfer.from_user_id) ?? "Member";
                        const toName =
                          membersById.get(transfer.to_user_id) ?? "Member";
                        const fromIsCurrentUser =
                          transfer.from_user_id === currentUserId;
                        const toIsCurrentUser =
                          transfer.to_user_id === currentUserId;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                              fromIsCurrentUser || toIsCurrentUser
                                ? "border-sky-200 bg-sky-50/60"
                                : "border-primary-100 bg-white"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-slate-400 text-sm">
                                <strong>
                                  {fromIsCurrentUser ? "You" : fromName}
                                </strong>{" "}
                                {fromIsCurrentUser ? "owe" : "owes"}{" "}
                                <strong>
                                  {toIsCurrentUser ? "you" : toName}
                                </strong>
                              </span>
                            </div>
                            <span className="font-bold text-slate-900 ml-4">
                              {formatCurrency(transfer.amount)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {groupId && (
        <AddExpenseModal
          groupId={groupId}
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
          isAdmin={isAdmin}
          members={group?.members ?? []}
        />
      )}
      {groupId && editingExpense && (
        <EditExpenseModal
          groupId={groupId}
          expense={editingExpense}
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
      {deletingExpense && (
        <ConfirmationModal
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          onConfirm={() => deleteExpenseMutation.mutate(deletingExpense.id)}
          title="Confirm Delete"
          message={`Are you sure you want to delete the expense "${deletingExpense.name}"? This action cannot be undone.`}
          isPending={deleteExpenseMutation.isPending}
        />
      )}
      {groupId && group && (
        <SettleUpModal
          groupId={groupId}
          isOpen={isSettleUpOpen}
          onClose={() => setIsSettleUpOpen(false)}
          owedByUser={group.owed_by_user}
          membersById={membersById}
          isAdmin={isAdmin}
          members={group.members}
          currentUserId={currentUserId}
        />
      )}
      {isAdmin && (
        <JoinRequestsModal
          isOpen={isJoinRequestsOpen}
          onClose={() => setIsJoinRequestsOpen(false)}
          requests={joinRequests ?? []}
          isLoading={isJoinRequestsLoading}
          isError={!!joinRequestsError}
          isMutating={
            acceptJoinRequestMutation.isPending ||
            declineJoinRequestMutation.isPending
          }
          onAccept={(requestId) => acceptJoinRequestMutation.mutate(requestId)}
          onDecline={(requestId) =>
            declineJoinRequestMutation.mutate(requestId)
          }
        />
      )}
      {isAdmin && group && (
        <EditGroupModal
          group={group}
          isOpen={isEditGroupOpen}
          onClose={() => setIsEditGroupOpen(false)}
        />
      )}
      {isOwner && group && (
        <ConfirmationModal
          isOpen={isDeleteGroupOpen}
          onClose={() => setIsDeleteGroupOpen(false)}
          onConfirm={() => deleteGroupMutation.mutate()}
          title="Confirm Delete"
          message={`Are you sure you want to delete "${group.name}"? This will permanently remove all expenses, settlements, and members.`}
          isPending={deleteGroupMutation.isPending}
        />
      )}
      {isOwner &&
        demotingUserId !== null &&
        group &&
        (() => {
          const demotingMember = group.members.find(
            (m) => m.user_id === demotingUserId,
          );
          return (
            <ConfirmationModal
              isOpen={demotingUserId !== null}
              onClose={() => setDemotingUserId(null)}
              onConfirm={() => demoteMemberMutation.mutate(demotingUserId)}
              title="Demote Admin"
              message={`Are you sure you want to demote ${demotingMember?.name ?? "this member"} from admin?`}
              isPending={demoteMemberMutation.isPending}
              confirmLabel="Demote"
              pendingLabel="Demoting..."
            />
          );
        })()}
    </div>
  );
};
