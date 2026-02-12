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

interface AddExpenseFormProps {
  groupId: number;
  onSuccess?: () => void;
}

const formatAmountInput = (value: string) =>
  value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  groupId,
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
    reset,
  } = useForm<ExpenseCreate>({
    resolver: zodResolver(ExpenseCreateSchema),
    defaultValues: { name: "", description: "", value: "" },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: ExpenseCreate) =>
      expensesApi.createGroupExpense(groupId, data),
    onSuccess: () => {
      clearApiErrors();
      toast.success("Expense added!");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["expenses", groupId] });
      reset({ name: "", description: "", value: "" });
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
