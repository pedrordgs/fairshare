import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { groupsApi } from "@services/groups";
import { expensesApi } from "@services/expenses";
import { useAuth } from "@context/AuthContext";
import { logError } from "@utils/errorUtils";
import { copyToClipboard } from "@utils/clipboard";
import { formatCurrency, formatDate } from "@utils/formatUtils";
import receiptIcon from "@assets/icons/receipt-icon.svg";
import { AddExpenseModal } from "@components/expenses/AddExpenseModal";
import { SettleUpModal } from "@components/settlements/SettleUpModal";

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
  const [isAddExpenseOpen, setIsAddExpenseOpen] = React.useState(false);
  const [isSettleUpOpen, setIsSettleUpOpen] = React.useState(false);

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

  const inviteCode = group?.invite_code;

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

  const owedByUserEntries = React.useMemo(() => {
    if (!group) {
      return [] as Array<{ user_id: number; name: string; amount: number }>;
    }
    return group.owed_by_user.map((entry) => ({
      user_id: entry.user_id,
      name: membersById.get(entry.user_id) ?? "Member",
      amount: entry.amount,
    }));
  }, [group, membersById]);

  const owedToUserEntries = React.useMemo(() => {
    if (!group) {
      return [] as Array<{ user_id: number; name: string; amount: number }>;
    }
    return group.owed_to_user.map((entry) => ({
      user_id: entry.user_id,
      name: membersById.get(entry.user_id) ?? "Member",
      amount: entry.amount,
    }));
  }, [group, membersById]);

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
      <div className="mb-12 fade-in">
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
        <h1 className="text-5xl font-bold text-slate-900 mb-4">{group.name}</h1>
        <div className="flex items-center gap-4 text-slate-500">
          <span className="text-lg">{group.members.length} members</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span className="text-lg">Group #{group.id}</span>
        </div>
      </div>

      {/* Three Column Layout - Placeholder for Future Features */}
      <div className="grid lg:grid-cols-12 gap-8 slide-up stagger-1">
        {/* Left Column - Members (3 cols) */}
        <div className="lg:col-span-3">
          <Card className="h-full bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-2 h-2 bg-accent-500 rounded-full"></span>
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-500 text-sm mb-4">
                {group.members.length} people in this group
              </p>
              <div className="mb-4 rounded-lg border border-primary-100 bg-primary-50/40 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Invite Code
                </p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-slate-900">
                    {group.invite_code}
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyInviteCode}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              {group.members.length > 0 ? (
                <div className="space-y-3">
                  {group.members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-primary-50/50"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">No members yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Expenses (6 cols) */}
        <div className="lg:col-span-6">
          <Card className="h-full bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                Expenses
              </CardTitle>
              <Button size="sm" onClick={() => setIsAddExpenseOpen(true)}>
                + Add Expense
              </Button>
            </CardHeader>
            <CardContent>
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
                <div className="space-y-4">
                  {expensesData.items.map((expense) => {
                    const creatorName = membersById.get(expense.created_by);
                    const isCurrentUserExpense =
                      currentUserId !== null &&
                      expense.created_by === currentUserId;
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
                            : "border-primary-100 bg-white/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 truncate">
                                {expense.name}
                              </p>
                              {isCurrentUserExpense && (
                                <span className="inline-flex items-center rounded-full border border-sky-300/70 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                                  You
                                </span>
                              )}
                            </div>
                            {expense.description && (
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                {expense.description}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                              {expenseMeta}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">
                              {formatCurrency(expense.value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
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
                    Start tracking shared costs by adding your first expense
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary (3 cols) */}
        <div className="lg:col-span-3">
          <Card className="h-full bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-gradient-to-br from-accent-50 to-accent-100/50 rounded-xl">
                <p className="text-sm text-slate-600 mb-1">Total Expenses</p>
                <p className="text-3xl font-bold text-slate-900">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-700">
                  Your Balances
                </p>
                <div className="grid gap-3">
                  <div className="rounded-lg bg-rose-50 px-3 py-3">
                    <p className="text-xs uppercase tracking-wide text-rose-700">
                      You owe
                    </p>
                    <p className="text-lg font-semibold text-rose-700">
                      {formatCurrency(group.owed_by_user_total)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-3 py-3">
                    <p className="text-xs uppercase tracking-wide text-emerald-700">
                      Owed to you
                    </p>
                    <p className="text-lg font-semibold text-emerald-700">
                      {formatCurrency(group.owed_to_user_total)}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    You owe
                  </p>
                  {owedByUserEntries.length === 0 ? (
                    <p className="text-sm text-slate-400">No one right now.</p>
                  ) : (
                    <div className="space-y-2">
                      {owedByUserEntries.map((entry) => (
                        <div
                          key={`owed-${entry.user_id}`}
                          className="flex items-center justify-between rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2"
                        >
                          <span className="text-sm text-slate-700">
                            {entry.name}
                          </span>
                          <span className="text-sm font-semibold text-rose-700">
                            {formatCurrency(entry.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Owed to you
                  </p>
                  {owedToUserEntries.length === 0 ? (
                    <p className="text-sm text-slate-400">No one right now.</p>
                  ) : (
                    <div className="space-y-2">
                      {owedToUserEntries.map((entry) => (
                        <div
                          key={`owed-to-${entry.user_id}`}
                          className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2"
                        >
                          <span className="text-sm text-slate-700">
                            {entry.name}
                          </span>
                          <span className="text-sm font-semibold text-emerald-700">
                            {formatCurrency(entry.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button
                className="w-full"
                disabled={owedByUserEntries.length === 0}
                onClick={() => setIsSettleUpOpen(true)}
              >
                Settle Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      {groupId && (
        <AddExpenseModal
          groupId={groupId}
          isOpen={isAddExpenseOpen}
          onClose={() => setIsAddExpenseOpen(false)}
        />
      )}
      {groupId && group && (
        <SettleUpModal
          groupId={groupId}
          isOpen={isSettleUpOpen}
          onClose={() => setIsSettleUpOpen(false)}
          owedByUser={group.owed_by_user}
          membersById={membersById}
        />
      )}
    </div>
  );
};
