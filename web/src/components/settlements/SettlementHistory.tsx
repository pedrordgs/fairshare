import React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { settlementsApi } from "@services/settlements";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { formatCurrency, formatDate } from "@utils/formatUtils";
import type { GroupSettlementListItem } from "@schema/settlements";

interface SettlementHistoryProps {
  groupId: number;
  membersById: Map<number, string>;
  currentUserId: number | null;
  embedded?: boolean;
  enabled?: boolean;
}

const PAGE_SIZE = 8;

const getDisplayName = (
  membersById: Map<number, string>,
  userId: number,
  currentUserId: number | null,
) => {
  const name = membersById.get(userId) ?? "Member";
  return {
    name,
    isCurrentUser: currentUserId !== null && currentUserId === userId,
  };
};

export const SettlementHistory: React.FC<SettlementHistoryProps> = ({
  groupId,
  membersById,
  currentUserId,
  embedded = false,
  enabled = true,
}) => {
  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["group", groupId, "settlements", { pageSize: PAGE_SIZE }],
    queryFn: ({ pageParam = 0 }) =>
      settlementsApi.listGroupSettlements(groupId, {
        offset: pageParam as number,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (acc, page) => acc + page.items.length,
        0,
      );
      return loadedCount < lastPage.total ? loadedCount : undefined;
    },
    initialPageParam: 0,
    enabled,
  });

  const loadMoreRef = useInfiniteScroll({
    onIntersect: () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  });

  const settlements = data ? data.pages.flatMap((page) => page.items) : [];
  const totalCount = data?.pages[0]?.total ?? 0;
  const isEmpty = !isLoading && settlements.length === 0;

  const content = (
    <div className="space-y-6">
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`settlement-skeleton-${index}`}
              className="h-20 animate-pulse rounded-xl border border-primary-100/80 bg-white"
            />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 px-4 py-4">
          <p className="text-sm font-semibold text-rose-700">
            Could not load settlement history.
          </p>
          <p className="text-sm text-rose-600/80">
            {error instanceof Error ? error.message : "Please try again."}
          </p>
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        </div>
      )}

      {isEmpty && (
        <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/40 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            No settlements yet
          </p>
          <p className="text-sm text-slate-500">
            Record a payment to start building your group ledger.
          </p>
        </div>
      )}

      {!isLoading && !error && settlements.length > 0 && (
        <div className="space-y-3">
          {settlements.map((settlement) => {
            const debtor = getDisplayName(
              membersById,
              settlement.debtor_id,
              currentUserId,
            );
            const creditor = getDisplayName(
              membersById,
              settlement.creditor_id,
              currentUserId,
            );
            const recordedBy = getDisplayName(
              membersById,
              settlement.created_by,
              currentUserId,
            );
            return (
              <SettlementRow
                key={settlement.id}
                settlement={settlement}
                debtor={debtor}
                creditor={creditor}
                recordedBy={recordedBy}
                currentUserId={currentUserId}
              />
            );
          })}
        </div>
      )}

      {hasNextPage && !error && (
        <div className="flex items-center justify-center" ref={loadMoreRef}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading more..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <CardTitle className="text-2xl flex items-center gap-2">
            <span className="w-2 h-2 bg-accent-500 rounded-full"></span>
            Settlement History
          </CardTitle>
          <p className="text-sm text-slate-500">
            Track payments made across the group.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-primary-200/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Total {totalCount}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{content}</CardContent>
    </Card>
  );
};

interface SettlementRowProps {
  settlement: GroupSettlementListItem;
  debtor: { name: string; isCurrentUser: boolean };
  creditor: { name: string; isCurrentUser: boolean };
  recordedBy: { name: string; isCurrentUser: boolean };
  currentUserId: number | null;
}

const SettlementRow: React.FC<SettlementRowProps> = ({
  settlement,
  debtor,
  creditor,
  recordedBy,
  currentUserId,
}) => {
  const isCurrentUserInvolved =
    currentUserId !== null &&
    (settlement.debtor_id === currentUserId ||
      settlement.creditor_id === currentUserId);
  const createdByLabel = `Created by ${recordedBy.name}`;

  const rowClasses = isCurrentUserInvolved
    ? "border-sky-200 bg-sky-50/60"
    : "border-primary-100 bg-white";

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm transition-colors ${rowClasses}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900 truncate">
              {debtor.name} paid {creditor.name}
              {isCurrentUserInvolved && (
                <Badge size="sm" variant="info" className="ml-2">
                  You
                </Badge>
              )}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {createdByLabel} · {formatDate(settlement.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">
            {formatCurrency(settlement.amount)}
          </p>
        </div>
      </div>
    </div>
  );
};
