import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { GroupCard } from "./GroupCard";
import { GroupCardSkeleton } from "./GroupCardSkeleton";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";
import { groupsApi } from "@services/groups";
import type { ExpenseGroupDetail } from "@schema/groups";
import { Button } from "@components/ui/Button";
import { GettingStartedGuide } from "./GettingStartedGuide";
import { useAuth } from "@context/AuthContext";

interface GroupsListProps {
  onCreateGroup: () => void;
}

const SKELETON_COUNT = 6;

export const GroupsList: React.FC<GroupsListProps> = ({ onCreateGroup }) => {
  const { user } = useAuth();

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

  const loadMoreRef = useInfiniteScroll({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: hasNextPage && !isFetchingNextPage,
  });

  const allGroups = data ? data.pages.flatMap((page) => page.items) : [];
  const totalCount = data?.pages[0]?.total ?? 0;
  const isEmpty = allGroups.length === 0;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
          <GroupCardSkeleton key={index} />
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-slate-900">Your Groups</h2>
          <span className="px-3 py-1 bg-accent-100 text-accent-800 rounded-full text-sm font-medium">
            {totalCount}
          </span>
        </div>
        <Button onClick={onCreateGroup} size="sm">
          + New Group
        </Button>
      </div>

      {isEmpty ? (
        <GettingStartedGuide onCreateGroup={onCreateGroup} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allGroups.map((group: ExpenseGroupDetail) => (
              <GroupCard
                key={group.id}
                group={group}
                currentUserId={user?.id ?? 0}
              />
            ))}
          </div>

          {hasNextPage && (
            <div ref={loadMoreRef} className="py-4">
              {isFetchingNextPage && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <GroupCardSkeleton key={`loading-${index}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
