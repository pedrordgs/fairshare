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
  const [apiError, setApiError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) =>
      authApi.login(data.email, data.password),
    onSuccess: (data) => {
      // Clear any previous errors
      setApiError(null);
      // Store token and update auth state
      login(data.access_token);
      // Let parent handle navigation via onSuccess callback
      onSuccess?.();
    },
    onError: (error: { response?: { status?: number } }) => {
      console.error("Login failed:", error);
      // Handle 401 specifically for wrong credentials
      if (error.response?.status === 401) {
        setApiError("Invalid email or password. Please try again.");
      } else {
        setApiError("An error occurred. Please try again later.");
      }
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {apiError}
        </div>
      )}
      <Input
        {...register("email")}
        id="email"
        type="email"
        label="Email"
        placeholder="Enter your email"
        error={errors.email?.message}
        autoComplete="email"
      />

      <Input
        {...register("password")}
        id="password"
        type="password"
        label="Password"
        placeholder="Enter your password"
        error={errors.password?.message}
        autoComplete="current-password"
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || loginMutation.isPending}
      >
        {isSubmitting ? (
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
