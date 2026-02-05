import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@services/auth";
import { useAuth } from "@context/AuthContext";
import { LoadingSpinnerIcon } from "@assets/icons/loading-icons";
import { useApiFormErrors } from "@hooks/useApiFormErrors";
import { logError } from "@utils/errorUtils";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
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
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      authApi.login(data.email, data.password),
    onSuccess: (data) => {
      clearApiErrors();
      login(data.access_token);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      logError("AUTH_INVALID_CREDENTIALS", error, { component: "LoginForm" });
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        setApiError({
          response: {
            data: {
              detail: "Invalid email or password. Please try again.",
            },
          },
        });
      } else {
        setApiError(error);
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    clearApiErrors();
    loginMutation.mutate(data);
  };

  const isLoading = loginMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {isGeneralError && generalError && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {generalError}
        </div>
      )}
      <Input
        {...register("email")}
        id="email"
        type="email"
        label="Email"
        placeholder="Enter your email"
        error={errors.email?.message || fieldErrors.email}
        autoComplete="email"
      />

      <Input
        {...register("password")}
        id="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        error={errors.password?.message || fieldErrors.password}
        autoComplete="current-password"
      />

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
};
