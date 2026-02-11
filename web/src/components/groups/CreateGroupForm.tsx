import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExpenseGroupCreateSchema,
  type ExpenseGroupCreate,
  type ExpenseGroupDetail,
} from "@schema/groups";
import { groupsApi } from "@services/groups";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";
import { useApiFormErrors } from "@hooks/useApiFormErrors";

interface CreateGroupFormProps {
  onSuccess?: (group: ExpenseGroupDetail) => void;
}

export const CreateGroupForm: React.FC<CreateGroupFormProps> = ({
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
  } = useForm<ExpenseGroupCreate>({
    resolver: zodResolver(ExpenseGroupCreateSchema),
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: ExpenseGroupCreate) => groupsApi.createGroup(data),
    onSuccess: (group: ExpenseGroupDetail) => {
      clearApiErrors();
      toast.success("Group created successfully!");

      // Ensure any groups lists/preview counts update when navigating back.
      // We invalidate broadly because list queries use different params.
      queryClient.invalidateQueries({
        queryKey: ["groups", "list"],
        exact: false,
      });

      onSuccess?.(group);
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: ExpenseGroupCreate) => {
    clearApiErrors();
    createGroupMutation.mutate(data);
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
        disabled={isSubmitting || createGroupMutation.isPending}
      >
        {createGroupMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Creating...
          </span>
        ) : (
          "Create Group"
        )}
      </Button>
    </form>
  );
};
