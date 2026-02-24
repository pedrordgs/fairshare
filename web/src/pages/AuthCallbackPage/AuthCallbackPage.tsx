import React, { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAuth } from "@context/AuthContext";
import { toast } from "sonner";

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as {
    token?: string;
    error?: string;
    redirect?: string;
  };
  const { login } = useAuth();

  useEffect(() => {
    if (search.error) {
      let errorMessage = "Google authentication failed. Please try again.";
      if (
        search.error === "state_missing" ||
        search.error === "state_invalid"
      ) {
        errorMessage = "Security validation failed. Please try again.";
      } else if (search.error === "authentication_failed") {
        errorMessage =
          "Could not complete Google authentication. Please try again.";
      }
      toast.error(errorMessage);
      navigate({ to: "/" });
      return;
    }

    if (search.token) {
      login(search.token);
      toast.success("Successfully signed in with Google!");
      const destination = search.redirect || "/dashboard";
      navigate({ to: destination });
      return;
    }

    toast.error("Invalid authentication response.");
    navigate({ to: "/" });
  }, [search.token, search.error, search.redirect, login, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600">Completing sign in...</p>
      </div>
    </div>
  );
};
