import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";
import { useApiFormErrors } from "@hooks/useApiFormErrors";
import type { ExpenseGroupDebtItem } from "@schema/groups";
import {
  GroupSettlementCreateInputSchema,
  type GroupSettlementCreateInput,
  type GroupSettlementCreate,
} from "@schema/settlements";
import { settlementsApi } from "@services/settlements";
import { formatCurrency } from "@utils/formatUtils";

interface SettleUpFormProps {
  groupId: number;
  owedByUser: ExpenseGroupDebtItem[];
  membersById: Map<number, string>;
  onSuccess?: () => void;
}

const formatAmountInput = (value: string) =>
  value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

export const SettleUpForm: React.FC<SettleUpFormProps> = ({
  groupId,
  owedByUser,
  membersById,
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

  const options = React.useMemo(
    () =>
      owedByUser.map((entry) => ({
        userId: entry.user_id,
        amount: entry.amount,
        label: membersById.get(entry.user_id) ?? "Unknown member",
      })),
    [owedByUser, membersById],
  );

  const defaultCreditor = options[0]?.userId ?? 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupSettlementCreateInput>({
    resolver: zodResolver(GroupSettlementCreateInputSchema),
    defaultValues: {
      creditor_id: defaultCreditor,
      amount: "",
    },
  });

  const selectedCreditorId = watch("creditor_id");
  const selectedEntry = options.find(
    (entry) => entry.userId === Number(selectedCreditorId),
  );
  const maxAmount = selectedEntry?.amount ?? 0;

  const settleUpMutation = useMutation({
    mutationFn: (data: GroupSettlementCreate) =>
      settlementsApi.createGroupSettlement(groupId, data),
    onSuccess: () => {
      clearApiErrors();
      toast.success("Settlement recorded");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({
        queryKey: ["groups", "list"],
        exact: false,
      });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: GroupSettlementCreateInput) => {
    clearApiErrors();
    const payload: GroupSettlementCreate = {
      creditor_id: data.creditor_id,
      amount: Number(data.amount),
    };
    if (payload.amount > maxAmount) {
      setApiError({
        response: { data: { detail: "Amount exceeds outstanding debt" } },
      });
      return;
    }
    settleUpMutation.mutate(payload);
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

      <div className="space-y-2">
        <label
          htmlFor="settle-creditor"
          className="block text-sm font-medium text-slate-700"
        >
          Settle with
        </label>
        <select
          id="settle-creditor"
          className="w-full px-4 py-3 text-slate-900 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
          {...register("creditor_id", { valueAsNumber: true })}
        >
          {options.map((option) => (
            <option key={option.userId} value={option.userId}>
              {option.label} · Owe {formatCurrency(option.amount)}
            </option>
          ))}
        </select>
      </div>

      <Input
        {...register("amount", {
          onChange: (event) => {
            const formatted = formatAmountInput(event.target.value);
            setValue("amount", formatted, {
              shouldValidate: true,
              shouldDirty: true,
            });
          },
        })}
        label="Amount"
        placeholder="0.00"
        inputMode="decimal"
        helperText={
          selectedEntry
            ? `Max ${formatCurrency(maxAmount)} to ${selectedEntry.label}`
            : undefined
        }
        error={errors.amount?.message || fieldErrors.amount}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || settleUpMutation.isPending}
      >
        {settleUpMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        ) : (
          "Record Payment"
        )}
      </Button>
    </form>
  );
};
