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
  return (
    <div className="flex-[1] min-w-0 flex flex-col">
      <Card className="bg-white h-full">
        <CardHeader className="flex flex-row items-center justify-between min-h-9">
          <CardTitle className="text-xl flex items-center gap-2">
            <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
            Balances
          </CardTitle>
          {owedByUser.length > 0 && (
            <Button size="sm" variant="secondary" onClick={onSettleUp}>
              Settle Up
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {groupTransfers.length === 0 ? (
            <div className="h-[420px] flex flex-col items-center justify-center gap-2 text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-semibold text-slate-700 text-sm">
                All settled up!
              </p>
              <p className="text-slate-400 text-xs">
                No outstanding balances in this group.
              </p>
            </div>
          ) : (
            <div className="h-[420px] overflow-y-auto pr-1">
              <div className="space-y-2">
                {groupTransfers.map((transfer, idx) => {
                  const fromName =
                    membersById.get(transfer.from_user_id) ?? "Member";
                  const toName =
                    membersById.get(transfer.to_user_id) ?? "Member";
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
                        <p className="font-bold text-slate-900 text-sm">
                          {fromIsCurrentUser ? "You" : fromName}{" "}
                          {fromIsCurrentUser ? "owe" : "owes"}{" "}
                          {toIsCurrentUser ? "you" : toName}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 ml-4">
                        {formatCurrency(transfer.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
