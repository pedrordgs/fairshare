import React from "react";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { CopyIcon } from "@assets/icons/form-icons";
import type { ExpenseGroupMemberPublic } from "@schema/groups";

interface MembersTabProps {
  members: ExpenseGroupMemberPublic[];
  groupCreatedBy: number;
  inviteCode: string;
  currentUserId: number | null;
  isOwner: boolean;
  isPromotePending: boolean;
  isDemotePending: boolean;
  onPromote: (userId: number) => void;
  onDemote: (userId: number) => void;
  onCopyInviteCode: () => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  groupCreatedBy,
  inviteCode,
  currentUserId,
  isOwner,
  isPromotePending,
  isDemotePending,
  onPromote,
  onDemote,
  onCopyInviteCode,
}) => {
  if (members.length === 0) {
    return (
      <div className="h-[420px] flex items-center justify-center">
        <p className="text-slate-400 text-sm">No members yet</p>
      </div>
    );
  }

  return (
    <div className="h-[420px] overflow-y-auto pr-1">
      <div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-500 text-sm">
          {members.length} people in this group
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400 shrink-0">Invite code:</span>
          <span className="font-mono text-sm text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
            {inviteCode}
          </span>
          <button
            onClick={onCopyInviteCode}
            aria-label="Copy invite code"
            className="text-slate-400 hover:text-primary-600 transition-colors"
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="space-y-3">
        {members.map((member) => {
          const isMemberOwner = member.user_id === groupCreatedBy;
          const isCurrentUser = member.user_id === currentUserId;
          const canToggleAdmin = isOwner && !isCurrentUser && !isMemberOwner;
          return (
            <div
              key={member.user_id}
              className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-2 rounded-lg bg-primary-50/50"
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
                <div className="w-full sm:w-auto sm:flex-shrink-0">
                  {member.is_admin ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full sm:w-auto text-xs text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onDemote(member.user_id)}
                      disabled={isPromotePending || isDemotePending}
                    >
                      Demote
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full sm:w-auto text-xs"
                      onClick={() => onPromote(member.user_id)}
                      disabled={isPromotePending || isDemotePending}
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
  );
};
