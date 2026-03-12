import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";
import { useApiFormErrors } from "@hooks/useApiFormErrors";
import type {
  ExpenseGroupMemberPublic,
  GroupTransferItem,
} from "@schema/groups";
import type { GroupSettlementCreate } from "@schema/settlements";
import { settlementsApi } from "@services/settlements";
import { formatCurrency, formatAmountInput } from "@utils/formatUtils";

const AddSettlementInputSchema = z.object({
  debtor_id: z.number().int().positive({ message: "Select a debtor" }),
  creditor_id: z.number().int().positive({ message: "Select a creditor" }),
  amount: z
    .string()
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with up to 2 decimals")
    .refine((value) => Number(value) > 0, "Amount must be greater than 0"),
});

type AddSettlementInput = z.infer<typeof AddSettlementInputSchema>;

interface AddSettlementFormProps {
  groupId: number;
  members: ExpenseGroupMemberPublic[];
  groupTransfers: GroupTransferItem[];
  membersById: Map<number, string>;
  onSuccess?: () => void;
}

export const AddSettlementForm: React.FC<AddSettlementFormProps> = ({
  groupId,
  members,
  groupTransfers,
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

  // Only members who appear as debtors in the current settlement plan
  const debtorOptions = React.useMemo(() => {
    const debtorIds = new Set(groupTransfers.map((t) => t.from_user_id));
    return members.filter((m) => debtorIds.has(m.user_id));
  }, [members, groupTransfers]);

  const defaultDebtorId = debtorOptions[0]?.user_id ?? 0;

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddSettlementInput>({
    resolver: zodResolver(AddSettlementInputSchema),
    defaultValues: {
      debtor_id: defaultDebtorId,
      creditor_id: 0,
      amount: "",
    },
  });

  const selectedDebtorId = watch("debtor_id");
  const selectedCreditorId = watch("creditor_id");

  // Transfers where the selected debtor owes money to someone
  const debtorTransfers = React.useMemo(
    () =>
      groupTransfers.filter((t) => t.from_user_id === Number(selectedDebtorId)),
    [groupTransfers, selectedDebtorId],
  );

  // Creditor options: only members the debtor owes
  const creditorOptions = React.useMemo(
    () =>
      debtorTransfers.map((t) => ({
        userId: t.to_user_id,
        amount: t.amount,
        label: membersById.get(t.to_user_id) ?? "Unknown member",
      })),
    [debtorTransfers, membersById],
  );

  // Reset creditor when debtor changes
  React.useEffect(() => {
    const firstCreditor = creditorOptions[0]?.userId ?? 0;
    setValue("creditor_id", firstCreditor, {
      shouldValidate: false,
      shouldDirty: true,
    });
    setValue("amount", "", { shouldValidate: false });
  }, [selectedDebtorId, creditorOptions, setValue]);

  const selectedTransfer = debtorTransfers.find(
    (t) => t.to_user_id === Number(selectedCreditorId),
  );
  const maxAmount = selectedTransfer?.amount ?? 0;

  const selectedCreditorLabel =
    creditorOptions.find((o) => o.userId === Number(selectedCreditorId))
      ?.label ?? "";

  const addSettlementMutation = useMutation({
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

  const onSubmit = (data: AddSettlementInput) => {
    clearApiErrors();
    clearErrors("amount");

    if (data.debtor_id === data.creditor_id) {
      setError("creditor_id", {
        type: "manual",
        message: "Debtor and creditor cannot be the same person",
      });
      return;
    }

    const amount = Number(data.amount);
    if (amount > maxAmount) {
      setError("amount", {
        type: "manual",
        message: "Amount exceeds outstanding debt",
      });
      return;
    }

    const payload: GroupSettlementCreate = {
      debtor_id: data.debtor_id,
      creditor_id: data.creditor_id,
      amount,
    };
    addSettlementMutation.mutate(payload);
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

      {/* Debtor — only members with outstanding debts */}
      <div className="space-y-2">
        <label
          htmlFor="add-settlement-debtor"
          className="block text-sm font-medium text-slate-700"
        >
          Debtor
          <span className="ml-1 text-slate-400 font-normal">
            (who is paying)
          </span>
        </label>
        <select
          id="add-settlement-debtor"
          className="w-full px-4 py-3 text-slate-900 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
          {...register("debtor_id", { valueAsNumber: true })}
        >
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

      {/* Creditor */}
      <div className="space-y-2">
        <label
          htmlFor="add-settlement-creditor"
          className="block text-sm font-medium text-slate-700"
        >
          Creditor
          <span className="ml-1 text-slate-400 font-normal">
            (who receives the payment)
          </span>
        </label>
        <select
          id="add-settlement-creditor"
          className="w-full px-4 py-3 text-slate-900 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
          {...register("creditor_id", { valueAsNumber: true })}
        >
          {creditorOptions.map((option) => (
            <option key={option.userId} value={option.userId}>
              {option.label} · Owed {formatCurrency(option.amount)}
            </option>
          ))}
        </select>
        {errors.creditor_id && (
          <p className="text-sm text-red-600">{errors.creditor_id.message}</p>
        )}
      </div>

      {/* Amount */}
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
          selectedTransfer && selectedCreditorLabel
            ? `Max ${formatCurrency(maxAmount)} to ${selectedCreditorLabel}`
            : undefined
        }
        error={errors.amount?.message || fieldErrors.amount}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || addSettlementMutation.isPending}
      >
        {addSettlementMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        ) : (
          "Record Settlement"
        )}
      </Button>
    </form>
  );
};
