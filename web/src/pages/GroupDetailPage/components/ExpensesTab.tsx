import React from "react";
import { formatCurrency, formatDate } from "@utils/formatUtils";
import receiptIcon from "@assets/icons/receipt-icon.svg";
import { EditIcon, TrashIcon } from "@assets/icons/form-icons";
import type { Expense } from "@schema/expenses";

interface ExpensesTabProps {
  isLoading: boolean;
  error: unknown;
  expenses: Expense[] | undefined;
  membersById: Map<number, string>;
  currentUserId: number | null;
  isAdmin: boolean;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  isLoading,
  error,
  expenses,
  membersById,
  currentUserId,
  isAdmin,
  onEditExpense,
  onDeleteExpense,
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Loading expenses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 font-medium mb-2">
          Couldn't load expenses
        </p>
        <p className="text-slate-400 text-sm">Please try again in a moment.</p>
      </div>
    );
  }

  if (expenses && expenses.length > 0) {
    return (
      <div className="h-[420px] overflow-y-auto pr-1">
        <div className="space-y-4">
          {expenses.map((expense) => {
            const payerName = membersById.get(expense.creditor_id);
            const isCurrentUserExpense =
              currentUserId !== null && expense.created_by === currentUserId;
            const canEditOrDelete = isCurrentUserExpense || isAdmin;
            const expenseMeta = `${
              payerName ? `Paid by ${payerName}` : "Paid by member"
            } · ${formatDate(expense.created_at)}`;
            return (
              <div
                key={expense.id}
                className={`rounded-xl border px-4 py-3 shadow-sm transition-colors ${
                  isCurrentUserExpense
                    ? "border-sky-200 bg-sky-50/60"
                    : "border-primary-100 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 truncate">
                        {expense.name}
                      </p>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {expense.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">{expenseMeta}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-slate-900">
                      {formatCurrency(expense.value)}
                    </p>
                    {canEditOrDelete && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Edit expense ${expense.name}`}
                          onClick={() => onEditExpense(expense)}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete expense ${expense.name}`}
                          onClick={() => onDeleteExpense(expense)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[420px] overflow-y-auto flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <img
          src={receiptIcon}
          alt="Receipt"
          className="w-8 h-8 text-primary-600"
        />
      </div>
      <p className="text-slate-600 font-medium mb-2">No expenses yet</p>
      <p className="text-slate-400 text-sm">
        Start tracking shared costs by adding your first expense
      </p>
    </div>
  );
};
