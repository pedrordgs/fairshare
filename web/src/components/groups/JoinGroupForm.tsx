import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type JoinGroupRequest,
  type JoinGroupRequestPublic,
  JoinGroupRequestSchema,
} from "@schema/groups";
import { groupsApi } from "@services/groups";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";
import { useApiFormErrors } from "@hooks/useApiFormErrors";

interface JoinGroupFormProps {
  onSuccess?: (request: JoinGroupRequestPublic) => void;
}

const formatInviteCode = (value: string) =>
  value.toUpperCase().replace(/[^0-9A-Z]/g, "");

export const JoinGroupForm: React.FC<JoinGroupFormProps> = ({ onSuccess }) => {
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
  } = useForm<JoinGroupRequest>({
    resolver: zodResolver(JoinGroupRequestSchema),
    defaultValues: { code: "" },
  });

  const joinGroupMutation = useMutation({
    mutationFn: (code: string) => groupsApi.joinGroup(code),
    onSuccess: (request: JoinGroupRequestPublic) => {
      clearApiErrors();
      toast.success("Join request sent for approval.");
      queryClient.invalidateQueries({
        queryKey: ["groups", "list"],
        exact: false,
      });
      onSuccess?.(request);
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: JoinGroupRequest) => {
    clearApiErrors();
    joinGroupMutation.mutate(formatInviteCode(data.code));
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
        {...register("code", {
          onChange: (event) => {
            setValue("code", formatInviteCode(event.target.value), {
              shouldValidate: true,
              shouldDirty: true,
            });
          },
        })}
        label="Invite Code"
        placeholder="Enter the code"
        error={errors.code?.message || fieldErrors.code}
        autoFocus
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || joinGroupMutation.isPending}
      >
        {joinGroupMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Joining...
          </span>
        ) : (
          "Join Group"
        )}
      </Button>
    </form>
  );
};
