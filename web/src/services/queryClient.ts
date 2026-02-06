import { QueryClient } from "@tanstack/react-query";

function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;

  // axios: error.response.status
  if ("response" in error) {
    const err = error as { response?: { status?: number } };
    return err.response?.status;
  }

  // custom errors
  if ("status" in error) {
    const err = error as { status?: number };
    return err.status;
  }

  return undefined;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        const status = getErrorStatus(error);
        if (status === 401) return false;
        if (status && status >= 500) return failureCount < 3;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
