import React, { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { GroupRow } from "./GroupRow";
import { GroupRowSkeleton } from "./GroupRowSkeleton";
import { DashboardWelcome } from "./DashboardWelcome";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";
import { groupsApi } from "@services/groups";
import { useAuth } from "@context/AuthContext";
import type { ExpenseGroupListItem } from "@schema/groups";
import { Button } from "@components/ui/Button";
import { GettingStartedGuide } from "./GettingStartedGuide";
import { EditGroupModal } from "./EditGroupModal";
import { ConfirmationModal } from "@components/ui/ConfirmationModal";

interface GroupsListProps {
  onCreateGroup: () => void;
  onJoinGroup: () => void;
}

const SKELETON_COUNT = 6;

export const GroupsList: React.FC<GroupsListProps> = ({
  onCreateGroup,
  onJoinGroup,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [editingGroup, setEditingGroup] =
    React.useState<ExpenseGroupListItem | null>(null);
  const [deletingGroup, setDeletingGroup] =
    React.useState<ExpenseGroupListItem | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["groups", "list", { pageSize: 12 }],
    queryFn: ({ pageParam = 0 }) =>
      groupsApi.getUserGroups({ offset: pageParam, limit: 12 }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (acc, page) => acc + page.items.length,
        0,
      );
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0,
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => groupsApi.deleteGroup(deletingGroup!.id),
    onSuccess: () => {
      toast.success("Group deleted.");
      setDeletingGroup(null);
      queryClient.invalidateQueries({
        queryKey: ["groups", "list"],
        exact: false,
      });
    },
    onError: () => {
      toast.error("Failed to delete group. Please try again.");
    },
  });

  const handleIntersect = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const loadMoreRef = useInfiniteScroll({
    onIntersect: handleIntersect,
    enabled: hasNextPage && !isFetchingNextPage,
  });

  const allGroups = data ? data.pages.flatMap((page) => page.items) : [];
  const totalCount = data?.pages[0]?.total ?? 0;
  const isEmpty = allGroups.length === 0;

  const totalOwed = allGroups.reduce((sum, g) => sum + g.owed_by_user_total, 0);
  const totalOwedToUser = allGroups.reduce(
    (sum, g) => sum + g.owed_to_user_total,
    0,
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <GroupRowSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 mb-2">Failed to load groups</p>
        <p className="text-slate-400 text-sm">
          {error instanceof Error ? error.message : "Please try again later"}
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <GettingStartedGuide
        onCreateGroup={onCreateGroup}
        onJoinGroup={onJoinGroup}
      />
    );
  }

  return (
    <>
      {/* Welcome section */}
      {user && (
        <DashboardWelcome
          name={user.name}
          totalGroups={totalCount}
          totalOwed={totalOwed}
          totalOwedToUser={totalOwedToUser}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">Your Groups</h2>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Button
              onClick={onJoinGroup}
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Join Group
            </Button>
            <Button
              onClick={onCreateGroup}
              size="sm"
              className="w-full sm:w-auto"
            >
              + New Group
            </Button>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {allGroups.map((group: ExpenseGroupListItem) => (
            <GroupRow
              key={group.id}
              group={group}
              currentUserId={user!.id}
              onEdit={setEditingGroup}
              onDelete={setDeletingGroup}
            />
          ))}
        </div>

        {/* Infinite scroll sentinel */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="py-2">
            {isFetchingNextPage && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <GroupRowSkeleton key={`loading-${index}`} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          isOpen={true}
          onClose={() => setEditingGroup(null)}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={deletingGroup !== null}
        onClose={() => setDeletingGroup(null)}
        onConfirm={() => deleteGroupMutation.mutate()}
        title="Delete Group"
        message={
          deletingGroup
            ? `Are you sure you want to delete "${deletingGroup.name}"? This will permanently remove all expenses and data associated with this group.`
            : ""
        }
        isPending={deleteGroupMutation.isPending}
        confirmLabel="Delete Group"
        pendingLabel="Deleting..."
      />
    </>
  );
};
