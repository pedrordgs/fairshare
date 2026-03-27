import React from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { settlementsApi } from "@services/settlements";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { ConfirmationModal } from "@components/ui/ConfirmationModal";
import { EditSettlementModal } from "./EditSettlementModal";
import { formatCurrency, formatDate } from "@utils/formatUtils";
import { EditIcon, TrashIcon } from "@assets/icons/form-icons";
import moneyIcon from "@assets/icons/money-icon.svg";
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
  const queryClient = useQueryClient();
  const [editingSettlement, setEditingSettlement] =
    React.useState<GroupSettlementListItem | null>(null);
  const [deletingSettlement, setDeletingSettlement] =
    React.useState<GroupSettlementListItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (settlementId: number) =>
      settlementsApi.deleteSettlement(groupId, settlementId),
    onSuccess: () => {
      toast.success("Settlement deleted.");
      queryClient.invalidateQueries({
        queryKey: ["group", groupId, "settlements"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      setDeletingSettlement(null);
    },
    onError: () => {
      toast.error("Couldn't delete the settlement.");
    },
  });

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

  const handleIntersect = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const loadMoreRef = useInfiniteScroll({
    onIntersect: handleIntersect,
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
    root: scrollContainerRef,
  });

  const settlements = data ? data.pages.flatMap((page) => page.items) : [];
  const totalCount = data?.pages[0]?.total ?? 0;
  const isEmpty = !isLoading && settlements.length === 0;

  const content = (
    <div
      ref={scrollContainerRef}
      className="h-[420px] overflow-y-auto pr-1 flex flex-col"
    >
      {isEmpty && (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img
              src={moneyIcon}
              alt="Money"
              className="w-8 h-8 text-primary-600"
            />
          </div>
          <p className="text-slate-600 font-medium mb-2">No settlements yet</p>
          <p className="text-slate-400 text-sm">
            Record a payment to start building your group ledger.
          </p>
        </div>
      )}

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
                  onEdit={() => setEditingSettlement(settlement)}
                  onDelete={() => setDeletingSettlement(settlement)}
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
    </div>
  );

  const modals = (
    <>
      {editingSettlement && (
        <EditSettlementModal
          groupId={groupId}
          settlement={editingSettlement}
          isOpen={!!editingSettlement}
          onClose={() => setEditingSettlement(null)}
        />
      )}
      <ConfirmationModal
        title="Confirm Delete"
        isOpen={!!deletingSettlement}
        onClose={() => setDeletingSettlement(null)}
        onConfirm={() => {
          if (deletingSettlement) {
            deleteMutation.mutate(deletingSettlement.id);
          }
        }}
        message="Are you sure you want to delete this settlement? This action cannot be undone."
        isPending={deleteMutation.isPending}
      />
    </>
  );

  if (embedded) {
    return (
      <>
        {content}
        {modals}
      </>
    );
  }

  return (
    <>
      <Card className="bg-white">
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
      {modals}
    </>
  );
};

interface SettlementRowProps {
  settlement: GroupSettlementListItem;
  debtor: { name: string; isCurrentUser: boolean };
  creditor: { name: string; isCurrentUser: boolean };
  recordedBy: { name: string; isCurrentUser: boolean };
  currentUserId: number | null;
  onEdit: () => void;
  onDelete: () => void;
}

const SettlementRow: React.FC<SettlementRowProps> = ({
  settlement,
  debtor,
  creditor,
  recordedBy,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const isCurrentUserInvolved =
    currentUserId !== null &&
    (settlement.debtor_id === currentUserId ||
      settlement.creditor_id === currentUserId);
  const isCreator =
    currentUserId !== null && settlement.created_by === currentUserId;
  const createdByLabel = `Created by ${recordedBy.name}`;

  const rowClasses = isCurrentUserInvolved
    ? "border-sky-200 bg-sky-50/60"
    : "border-primary-100 bg-white";

  return (
    <div
      className={`rounded-xl border px-4 py-3 shadow-sm transition-colors ${rowClasses}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900 truncate">
              {debtor.name} paid {creditor.name}
            </p>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {createdByLabel} · {formatDate(settlement.created_at)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <p className="text-base sm:text-lg font-bold text-slate-900">
            {formatCurrency(settlement.amount)}
          </p>
          {isCreator && (
            <div className="flex items-center gap-1 ml-2">
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit settlement"
                className="p-1.5 rounded-lg text-slate-400 hover:text-accent-600 hover:bg-accent-50 transition-colors"
              >
                <EditIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onDelete}
                aria-label="Delete settlement"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
