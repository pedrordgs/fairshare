import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExpenseUpdateSchema,
  type Expense,
  type ExpenseUpdate,
} from "@schema/expenses";
import { expensesApi } from "@services/expenses";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";
import { useApiFormErrors } from "@hooks/useApiFormErrors";
import { formatAmountInput } from "@utils/formatUtils";
import type { ExpenseGroupMemberPublic } from "@schema/groups";

interface EditExpenseFormProps {
  groupId: number;
  expense: Expense;
  currentUserId?: number;
  isAdmin?: boolean;
  members?: ExpenseGroupMemberPublic[];
  onSuccess?: () => void;
}

export const EditExpenseForm: React.FC<EditExpenseFormProps> = ({
  groupId,
  expense,
  currentUserId,
  isAdmin = false,
  members = [],
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const {
    fieldErrors,
    generalError,
    isGeneralError,
    setApiError,
    clearApiErrors,
  } = useApiFormErrors();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ExpenseUpdate>({
    resolver: zodResolver(ExpenseUpdateSchema),
    defaultValues: {
      name: expense.name,
      description: expense.description ?? "",
      value: String(expense.value),
      creditor_id: expense.creditor_id,
    },
  });

  const selectedCreditorId = watch("creditor_id");

  const updateExpenseMutation = useMutation({
    mutationFn: (data: ExpenseUpdate) =>
      expensesApi.updateExpense(groupId, expense.id, data),
    onSuccess: () => {
      clearApiErrors();
      toast.success("Expense updated!");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: ExpenseUpdate) => {
    clearApiErrors();
    updateExpenseMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {isGeneralError && generalError && (
        <Alert
          variant="error"
          className="animate-in fade-in slide-in-from-top-2"
        >
          {generalError}
        </Alert>
      )}

      {isAdmin && members.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="edit-expense-creditor"
            className="block text-sm font-medium text-slate-700"
          >
            Paid by
          </label>
          <select
            id="edit-expense-creditor"
            className="w-full px-4 py-3 text-slate-900 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
            value={selectedCreditorId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setValue(
                "creditor_id",
                val === "" ? expense.creditor_id : Number(val),
                { shouldValidate: true, shouldDirty: true },
              );
            }}
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.name}
                {member.user_id === currentUserId ? " (you)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <Input
        {...register("name")}
        label="Expense Name"
        placeholder="e.g., Groceries, Dinner, Uber"
        error={errors.name?.message || fieldErrors.name}
        autoFocus
      />

      <Input
        {...register("description")}
        label="Description"
        placeholder="Optional details"
        error={errors.description?.message || fieldErrors.description}
      />

      <Input
        {...register("value", {
          onChange: (event) => {
            setValue("value", formatAmountInput(event.target.value), {
              shouldValidate: true,
              shouldDirty: true,
            });
          },
        })}
        label="Amount"
        placeholder="0.00"
        inputMode="decimal"
        error={errors.value?.message || fieldErrors.value}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || updateExpenseMutation.isPending}
      >
        {updateExpenseMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
};
