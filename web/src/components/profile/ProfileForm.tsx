import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { authApi } from "@services/auth";
import { useAuth } from "@context/AuthContext";
import { useApiFormErrors } from "@hooks/useApiFormErrors";
import { Button } from "@components/ui/Button";
import { Input } from "@components/ui/Input";
import { Alert } from "@components/ui/Alert";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  onSuccess?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? "",
    },
  });

  useEffect(() => {
    reset({ name: user?.name ?? "" });
  }, [reset, user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => authApi.updateMe(data),
    onSuccess: (updatedUser) => {
      clearApiErrors();
      queryClient.setQueryData(["auth", "user"], updatedUser);
      toast.success("Profile updated.");
      onSuccess?.();
    },
    onError: (error: unknown) => {
      setApiError(error);
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    clearApiErrors();
    updateProfileMutation.mutate(data);
  };

  const isPending = updateProfileMutation.isPending || isSubmitting;

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
        label="Email"
        type="email"
        value={user?.email ?? ""}
        disabled
        readOnly
        className="bg-slate-50 text-slate-500"
      />

      <Input
        {...register("name")}
        label="Full Name"
        placeholder="Enter your name"
        error={errors.name?.message || fieldErrors.name}
        autoFocus
      />

      <Button type="submit" className="w-full" disabled={isPending || !user}>
        {isPending ? (
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
