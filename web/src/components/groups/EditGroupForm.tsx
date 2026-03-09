import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExpenseGroupUpdateSchema,
  type ExpenseGroupUpdate,
  type ExpenseGroupDetail,
} from "@schema/groups";
import { useApiFormErrors } from "@hooks/useApiFormErrors";
import { groupsApi } from "@services/groups";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";

interface EditGroupFormProps {
  group: { id: number; name: string };
  onSuccess?: (group: ExpenseGroupDetail) => void;
}

export const EditGroupForm: React.FC<EditGroupFormProps> = ({
  group,
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
  } = useForm<ExpenseGroupUpdate>({
    resolver: zodResolver(ExpenseGroupUpdateSchema),
    defaultValues: {
      name: group.name,
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data: ExpenseGroupUpdate) =>
      groupsApi.updateGroup(group.id, data),
    onSuccess: (updatedGroup: ExpenseGroupDetail) => {
      clearApiErrors();
      toast.success("Group updated successfully!");

      queryClient.invalidateQueries({
        queryKey: ["groups", "list"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: ["group", group.id],
      });

      onSuccess?.(updatedGroup);
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: ExpenseGroupUpdate) => {
    clearApiErrors();
    updateGroupMutation.mutate(data);
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
        label="Group Name"
        placeholder="e.g., Weekend Trip, Apartment Bills"
        error={errors.name?.message || fieldErrors.name}
        autoFocus
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || updateGroupMutation.isPending}
      >
        {updateGroupMutation.isPending ? (
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
