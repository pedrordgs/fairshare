import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@components/ui/Card";
import { Button } from "@components/ui/Button";
import { formatCurrency } from "@utils/formatUtils";
import type { GroupTransferItem, ExpenseGroupDebtItem } from "@schema/groups";

interface BalancesProps {
  groupTransfers: GroupTransferItem[];
  owedByUser: ExpenseGroupDebtItem[];
  membersById: Map<number, string>;
  currentUserId: number | null;
  onSettleUp: () => void;
}

export const Balances: React.FC<BalancesProps> = ({
  groupTransfers,
  owedByUser,
  membersById,
  currentUserId,
  onSettleUp,
}) => {
  if (groupTransfers.length === 0) {
    return null;
  }

  return (
    <div className="flex-[1] min-w-0 flex flex-col">
      <Card className="bg-white h-full">
        <CardHeader className="flex flex-row items-center justify-between min-h-9">
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Balances
          </CardTitle>
          {owedByUser.length > 0 && (
            <Button size="sm" variant="secondary" onClick={onSettleUp}>
              Settle Up
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-[420px] overflow-y-auto pr-1">
            <div className="space-y-2">
              {groupTransfers.map((transfer, idx) => {
                const fromName =
                  membersById.get(transfer.from_user_id) ?? "Member";
                const toName = membersById.get(transfer.to_user_id) ?? "Member";
                const fromIsCurrentUser =
                  transfer.from_user_id === currentUserId;
                const toIsCurrentUser = transfer.to_user_id === currentUserId;
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
                        <strong>{fromIsCurrentUser ? "You" : fromName}</strong>{" "}
                        {fromIsCurrentUser ? "owe" : "owes"}{" "}
                        <strong>{toIsCurrentUser ? "you" : toName}</strong>
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
  );
};
