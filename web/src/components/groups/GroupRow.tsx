import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Badge } from "@components/ui/Badge";
import { EditIcon, TrashIcon } from "@assets/icons/form-icons";
import {
  formatCurrency,
  formatRelativeTime,
  formatDate,
} from "@utils/formatUtils";
import type { ExpenseGroupListItem } from "@schema/groups";

interface GroupRowProps {
  group: ExpenseGroupListItem;
  currentUserId: number;
  onEdit: (group: ExpenseGroupListItem) => void;
  onDelete: (group: ExpenseGroupListItem) => void;
}

export const GroupRow: React.FC<GroupRowProps> = ({
  group,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  const isAdmin = group.is_admin;
  const isOwner = group.created_by === currentUserId;
  const owedByTotal = group.owed_by_user_total;
  const owedToTotal = group.owed_to_user_total;
  const hasActions = isAdmin || isOwner;

  const handleRowClick = () => {
    navigate({ to: "/groups/$groupId", params: { groupId: String(group.id) } });
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(group);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(group);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open group ${group.name}`}
      onClick={handleRowClick}
      onKeyDown={(e) => e.key === "Enter" && handleRowClick()}
      className="flex items-center gap-4 p-4 rounded-xl bg-white border border-primary-100 hover:border-primary-200 hover:shadow-sm transition-all duration-200 cursor-pointer group"
    >
      {/* Left: name + admin badge + created date */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900 truncate group-hover:text-accent-600 transition-colors">
            {group.name}
          </span>
          {isAdmin && (
            <Badge variant="warning" size="sm" ariaLabel="Group Administrator">
              Admin
            </Badge>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Created {formatDate(group.created_at)}
        </p>
      </div>

      {/* Centre: balance chips — only shown when non-zero */}
      {(owedByTotal !== 0 || owedToTotal !== 0) && (
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          {owedByTotal !== 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50">
              <span className="text-xs uppercase tracking-wide text-rose-600">
                You owe
              </span>
              <span className="text-sm font-semibold text-rose-700">
                {formatCurrency(owedByTotal)}
              </span>
            </div>
          )}
          {owedToTotal !== 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50">
              <span className="text-xs uppercase tracking-wide text-emerald-600">
                Owed
              </span>
              <span className="text-sm font-semibold text-emerald-700">
                {formatCurrency(owedToTotal)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Right: stats + action buttons */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Stats */}
        <div className="hidden md:flex items-center gap-3 text-sm text-slate-400">
          <span>
            {group.expense_count} expense{group.expense_count !== 1 ? "s" : ""}
          </span>
          <span>{formatRelativeTime(group.last_activity_at)}</span>
        </div>

        {/* Actions — only render when there is at least one action */}
        {hasActions && (
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                type="button"
                aria-label={`Edit group ${group.name}`}
                onClick={handleEdit}
                className="p-1.5 rounded-lg text-slate-400 hover:text-accent-600 hover:bg-accent-50 transition-colors"
              >
                <EditIcon className="w-4 h-4" />
              </button>
            )}
            {isOwner && (
              <button
                type="button"
                aria-label={`Delete group ${group.name}`}
                onClick={handleDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
