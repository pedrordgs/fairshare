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
  const [apiError, setApiError] = React.useState<string | null>(null);

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
      // Clear any previous errors
      setApiError(null);
      // Store token and update auth state
      login(data.access_token);
      // Let parent handle navigation via onSuccess callback
      onSuccess?.();
    },
    onError: (error: {
      response?: { status?: number; data?: { detail?: string } };
    }) => {
      console.error("Registration failed:", error);
      // Handle specific error cases
      if (
        error.response?.status === 409 ||
        error.response?.data?.detail?.toLowerCase().includes("email")
      ) {
        setApiError("An account with this email already exists.");
      } else if (error.response?.status === 400) {
        setApiError("Please check your information and try again.");
      } else {
        setApiError("An error occurred. Please try again later.");
      }
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setApiError(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md">
          {apiError}
        </div>
      )}
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

      <Button
        type="submit"
        className="w-full"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
            Creating account...
          </span>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
};
