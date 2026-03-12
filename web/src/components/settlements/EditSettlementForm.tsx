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
  onSuccess?: () => void;
}

export const EditSettlementForm: React.FC<EditSettlementFormProps> = ({
  groupId,
  settlement,
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
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GroupSettlementUpdate>({
    resolver: zodResolver(GroupSettlementUpdateSchema),
    defaultValues: {
      amount: String(settlement.amount),
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
