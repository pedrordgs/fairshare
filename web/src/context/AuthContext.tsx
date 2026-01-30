import React, { createContext, useContext, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
} from "@services/auth";
import { type User } from "@schema/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => {
    return getAuthToken();
  });

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: authApi.getMe,
    enabled: !!token,
    retry: false,
  });

  const isAuthenticated = !!user && !error;

  const login = useCallback(
    (newToken: string) => {
      const stored = setAuthToken(newToken);
      if (!stored) {
        console.error("Failed to persist auth token to localStorage");
      }
      setToken(newToken);
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
    [queryClient],
  );

  const logout = useCallback(() => {
    const removed = removeAuthToken();
    if (!removed) {
      console.error("Failed to remove auth token from localStorage");
    }
    setToken(null);
    queryClient.clear();
    window.location.href = "/";
  }, [queryClient]);

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    error: error instanceof Error ? error : null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
