import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { groupsApi } from "@services/groups";
import { useAuth } from "@context/AuthContext";
import { logError } from "@utils/errorUtils";
import receiptIcon from "@assets/icons/receipt-icon.svg";

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

  // Validate and parse the groupId parameter
  const groupId = React.useMemo(
    () => parseGroupId(groupIdParam),
    [groupIdParam],
  );

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

  // Log query errors for debugging
  React.useEffect(() => {
    if (queryError) {
      logError("NOT_FOUND", queryError, {
        groupId: groupIdParam,
        userId: user?.id,
      });
    }
  }, [queryError, groupIdParam, user?.id]);

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
              <Button size="sm" className="opacity-50 cursor-not-allowed">
                + Add Expense
              </Button>
            </CardHeader>
            <CardContent>
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
                <p className="text-3xl font-bold text-slate-900">$0.00</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">
                  Your Balance
                </p>
                <div className="p-3 bg-primary-50 rounded-lg">
                  <p className="text-lg font-semibold text-slate-700">$0.00</p>
                  <p className="text-xs text-slate-500">You're all settled</p>
                </div>
              </div>

              <Button className="w-full" disabled>
                Settle Up
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
