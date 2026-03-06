import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExpenseCreateSchema, type ExpenseCreate } from "@schema/expenses";
import { expensesApi } from "@services/expenses";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";
import { useApiFormErrors } from "@hooks/useApiFormErrors";
import { formatAmountInput } from "@utils/formatUtils";
import type { ExpenseGroupMemberPublic } from "@schema/groups";

interface AddExpenseFormProps {
  groupId: number;
  isAdmin?: boolean;
  members?: ExpenseGroupMemberPublic[];
  onSuccess?: () => void;
}

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  groupId,
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
    reset,
  } = useForm<ExpenseCreate>({
    resolver: zodResolver(ExpenseCreateSchema),
    defaultValues: {
      name: "",
      description: "",
      value: "",
      created_for_user_id: undefined,
    },
  });

  const selectedOnBehalfOf = watch("created_for_user_id");

  const createExpenseMutation = useMutation({
    mutationFn: (data: ExpenseCreate) =>
      expensesApi.createGroupExpense(groupId, data),
    onSuccess: () => {
      clearApiErrors();
      toast.success("Expense added!");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      reset({
        name: "",
        description: "",
        value: "",
        created_for_user_id: undefined,
      });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: ExpenseCreate) => {
    clearApiErrors();
    createExpenseMutation.mutate(data);
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

      {isAdmin && members.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="expense-on-behalf-of"
            className="block text-sm font-medium text-slate-700"
          >
            Record on behalf of
            <span className="ml-1 text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            id="expense-on-behalf-of"
            className="w-full px-4 py-3 text-slate-900 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
            value={selectedOnBehalfOf ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setValue(
                "created_for_user_id",
                val === "" ? undefined : Number(val),
                { shouldValidate: true, shouldDirty: true },
              );
            }}
          >
            <option value="">Yourself</option>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || createExpenseMutation.isPending}
      >
        {createExpenseMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        ) : (
          "Add Expense"
        )}
      </Button>
    </form>
  );
};
