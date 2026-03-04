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
import type {
  ExpenseGroupDebtItem,
  ExpenseGroupMemberPublic,
} from "@schema/groups";
import {
  GroupSettlementCreateInputSchema,
  type GroupSettlementCreateInput,
  type GroupSettlementCreate,
} from "@schema/settlements";
import { settlementsApi } from "@services/settlements";
import { formatCurrency, formatAmountInput } from "@utils/formatUtils";

interface SettleUpFormProps {
  groupId: number;
  owedByUser: ExpenseGroupDebtItem[];
  membersById: Map<number, string>;
  isAdmin?: boolean;
  members?: ExpenseGroupMemberPublic[];
  currentUserId?: number | null;
  onSuccess?: () => void;
}

export const SettleUpForm: React.FC<SettleUpFormProps> = ({
  groupId,
  owedByUser,
  membersById,
  isAdmin = false,
  members = [],
  currentUserId,
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
    setError,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupSettlementCreateInput>({
    resolver: zodResolver(GroupSettlementCreateInputSchema),
    defaultValues: {
      creditor_id: defaultCreditor,
      amount: "",
      debtor_id: undefined,
    },
  });

  const selectedCreditorId = watch("creditor_id");
  const selectedDebtorId = watch("debtor_id");
  const selectedEntry = options.find(
    (entry) => entry.userId === Number(selectedCreditorId),
  );
  const maxAmount = selectedEntry?.amount ?? 0;

  // Debtor options: all members except the currently selected creditor
  const debtorOptions = React.useMemo(() => {
    return members.filter((m) => m.user_id !== Number(selectedCreditorId));
  }, [members, selectedCreditorId]);

  const settleUpMutation = useMutation({
    mutationFn: (data: GroupSettlementCreate) =>
      settlementsApi.createGroupSettlement(groupId, data),
    onSuccess: () => {
      clearApiErrors();
      toast.success("Settlement recorded");
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({
        queryKey: ["group", groupId, "settlements"],
        exact: false,
      });
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
    clearErrors("amount");

    // Client-side check: debtor must not equal creditor
    if (data.debtor_id !== undefined && data.debtor_id === data.creditor_id) {
      setError("debtor_id", {
        type: "manual",
        message: "Debtor cannot be the same as creditor",
      });
      return;
    }

    const payload: GroupSettlementCreate = {
      creditor_id: data.creditor_id,
      amount: Number(data.amount),
      ...(data.debtor_id !== undefined && { debtor_id: data.debtor_id }),
    };
    if (payload.amount > maxAmount) {
      setError("amount", {
        type: "manual",
        message: "Amount exceeds outstanding debt",
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

      {isAdmin && members.length > 0 && (
        <div className="space-y-2">
          <label
            htmlFor="settle-debtor"
            className="block text-sm font-medium text-slate-700"
          >
            Record on behalf of
            <span className="ml-1 text-slate-400 font-normal">(optional)</span>
          </label>
          <select
            id="settle-debtor"
            className="w-full px-4 py-3 text-slate-900 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
            {...register("debtor_id", {
              setValueAs: (v) =>
                v === "" || v === undefined ? undefined : Number(v),
            })}
            value={selectedDebtorId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              setValue("debtor_id", val === "" ? undefined : Number(val), {
                shouldValidate: true,
                shouldDirty: true,
              });
            }}
          >
            <option value="">
              {currentUserId
                ? (membersById.get(currentUserId) ?? "Yourself")
                : "Yourself"}
            </option>
            {debtorOptions.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.name}
              </option>
            ))}
          </select>
          {errors.debtor_id && (
            <p className="text-sm text-red-600">{errors.debtor_id.message}</p>
          )}
        </div>
      )}

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
