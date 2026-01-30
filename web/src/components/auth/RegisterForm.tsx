import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@components/ui/Input";
import { Button } from "@components/ui/Button";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@services/auth";
import { useAuth } from "@context/AuthContext";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      // Store token and update auth state
      login(data.access_token);

      // Let parent handle navigation via onSuccess callback
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      // Error is displayed via registerMutation.error state
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        {...register("name")}
        id="name"
        type="text"
        label="Full Name"
        placeholder="Enter your full name"
        error={errors.name?.message}
        autoComplete="name"
      />

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
        placeholder="Create a password (min 6 characters)"
        error={errors.password?.message}
        autoComplete="new-password"
      />

      <Input
        {...register("confirmPassword")}
        id="confirmPassword"
        type="password"
        label="Confirm Password"
        placeholder="Confirm your password"
        error={errors.confirmPassword?.message}
        autoComplete="new-password"
      />

      {registerMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">
            {(() => {
              const error = registerMutation.error;
              if (error instanceof Error) {
                const message = error.message.toLowerCase();
                if (
                  message.includes("409") ||
                  message.includes("already exists") ||
                  message.includes("already registered")
                ) {
                  return "An account with this email already exists. Please log in instead.";
                }
                if (message.includes("network") || message.includes("fetch")) {
                  return "Unable to connect. Please check your internet connection and try again.";
                }
                if (message.includes("500") || message.includes("server")) {
                  return "Something went wrong on our end. Please try again in a moment.";
                }
                if (
                  message.includes("validation") ||
                  message.includes("invalid")
                ) {
                  return "Please check your information and try again.";
                }
              }
              return "Registration failed. Please try again.";
            })()}
          </p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
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
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
};
