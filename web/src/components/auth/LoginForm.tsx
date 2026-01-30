import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@services/auth";
import { useAuth } from "@context/AuthContext";

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
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      // Store token and update auth state
      login(data.access_token);

      // Let parent handle navigation via onSuccess callback
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Login failed:", error);
      // Error is displayed via loginMutation.error state
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      {loginMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {(() => {
              const error = loginMutation.error;
              if (error instanceof Error) {
                const message = error.message.toLowerCase();
                if (
                  message.includes("401") ||
                  message.includes("unauthorized") ||
                  message.includes("invalid")
                ) {
                  return "Invalid email or password. Please try again.";
                }
                if (message.includes("network") || message.includes("fetch")) {
                  return "Unable to connect. Please check your internet connection and try again.";
                }
                if (message.includes("500") || message.includes("server")) {
                  return "Something went wrong on our end. Please try again in a moment.";
                }
              }
              return "Login failed. Please check your credentials and try again.";
            })()}
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || loginMutation.isPending}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );
};
