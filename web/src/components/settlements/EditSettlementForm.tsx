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
import { formatAmountInput } from "@utils/formatUtils";
import {
  GroupSettlementUpdateSchema,
  type GroupSettlementListItem,
  type GroupSettlementUpdate,
} from "@schema/settlements";
import { settlementsApi } from "@services/settlements";

interface EditSettlementFormProps {
  groupId: number;
  settlement: GroupSettlementListItem;
  membersById: Map<number, string>;
  onSuccess?: () => void;
}

export const EditSettlementForm: React.FC<EditSettlementFormProps> = ({
  groupId,
  settlement,
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

  const memberOptions = React.useMemo(
    () =>
      Array.from(membersById.entries()).map(([userId, name]) => ({
        userId,
        name,
      })),
    [membersById],
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupSettlementUpdate>({
    resolver: zodResolver(GroupSettlementUpdateSchema),
    defaultValues: {
      amount: String(settlement.amount),
      creditor_id: settlement.creditor_id,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: GroupSettlementUpdate) =>
      settlementsApi.updateSettlement(groupId, settlement.id, data),
    onSuccess: () => {
      clearApiErrors();
      toast.success("Settlement updated!");
      queryClient.invalidateQueries({
        queryKey: ["group", groupId, "settlements"],
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: GroupSettlementUpdate) => {
    clearApiErrors();
    updateMutation.mutate(data);
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
          htmlFor="edit-settlement-payee"
          className="block text-sm font-medium text-slate-700"
        >
          Paid to
        </label>
        <select
          id="edit-settlement-payee"
          className="w-full px-4 py-3 text-slate-900 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
          {...register("creditor_id", { valueAsNumber: true })}
        >
          {memberOptions.map((option) => (
            <option key={option.userId} value={option.userId}>
              {option.name}
            </option>
          ))}
        </select>
        {(errors.creditor_id?.message || fieldErrors.creditor_id) && (
          <p className="text-sm text-red-600">
            {errors.creditor_id?.message || fieldErrors.creditor_id}
          </p>
        )}
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
        error={errors.amount?.message || fieldErrors.amount}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || updateMutation.isPending}
      >
        {updateMutation.isPending ? (
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
