import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import {
  formatCurrency,
  formatRelativeTime,
  formatDate,
} from "@utils/formatUtils";
import type { ExpenseGroupListItem } from "@schema/groups";

interface GroupCardProps {
  group: ExpenseGroupListItem;
  currentUserId: number;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  currentUserId,
}) => {
  const navigate = useNavigate();
  const isAdmin = group.created_by === currentUserId;
  const owedByTotal = group.owed_by_user_total;
  const owedToTotal = group.owed_to_user_total;
  const isSettled = owedByTotal === 0 && owedToTotal === 0;

  const handleClick = () => {
    navigate({ to: "/groups/$groupId", params: { groupId: String(group.id) } });
  };

  return (
    <Card
      className="cursor-pointer group relative overflow-hidden"
      onClick={handleClick}
    >
      {/* Admin Badge */}
      {isAdmin && (
        <div className="absolute top-4 right-4">
          <Badge variant="warning" size="sm" ariaLabel="Group Administrator">
            Admin
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="pr-16">
          <CardTitle className="text-lg line-clamp-2 group-hover:text-accent-600 transition-colors">
            {group.name}
          </CardTitle>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Created {formatDate(group.created_at)}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Balance Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-sm">Status:</span>
            {isSettled ? (
              <span className="text-slate-500 font-medium">
                You're all settled
              </span>
            ) : (
              <span className="text-slate-500 font-medium">
                Here's the current split
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-rose-700">
                You owe
              </span>
              <span className="text-sm font-semibold text-rose-700">
                {formatCurrency(owedByTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-emerald-700">
                Owed to you
              </span>
              <span className="text-sm font-semibold text-emerald-700">
                {formatCurrency(owedToTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <span>
              {group.expense_count} expense
              {group.expense_count !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatRelativeTime(group.last_activity_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
