import axios, { type AxiosResponse } from "axios";
import { toast } from "sonner";
import { logError } from "@utils/errorUtils";
import { getAuthToken, removeAuthToken } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Type guard to check if error is a FastAPI validation error (field-level errors)
 * Validation errors have detail as an array of error objects
 */
function isFastAPIValidationError(
  errorData: unknown,
): errorData is { detail: Array<Record<string, unknown>> } {
  if (
    !errorData ||
    typeof errorData !== "object" ||
    !("detail" in errorData) ||
    !Array.isArray((errorData as { detail: unknown }).detail)
  ) {
    return false;
  }
  return true;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    // Log all API errors for debugging
    if (error.response) {
      logError(
        error.response.status >= 500 ? "SERVER_ERROR" : "UNKNOWN",
        error,
        {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response.status,
          data: error.response.data,
        },
      );

      const status = error.response.status;

      // Show toast notifications for specific HTTP errors
      if (status === 400) {
        // Skip toast for validation errors - let forms handle field-level errors
        // Only show toast for non-validation 400 errors (business logic errors)
        if (!isFastAPIValidationError(error.response.data)) {
          toast.error("Please check your information and try again.");
        }
      } else if (status === 401) {
        // Skip 401 handling for login endpoint - let LoginForm handle wrong credentials
        if (error.config?.url === "/auth/token/") {
          return Promise.reject(error);
        }
        toast.error("Your session has expired. Please sign in again.");
        removeAuthToken();
        window.location.href = "/";
      } else if (status === 403) {
        toast.error(
          "You don't have permission to do that. Check with the group owner if you need access.",
        );
      } else if (status === 404) {
        toast.error(
          "We couldn't find what you're looking for. It may have been deleted.",
        );
      } else if (status >= 500) {
        toast.error("Oops! Something went wrong on our end. Please try again.");
      }
    } else if (error.request) {
      logError("NETWORK_ERROR", error, {
        url: error.config?.url,
        method: error.config?.method,
      });
      toast.error(
        "Connection issue - please check your internet and try again.",
      );
    } else {
      logError("UNKNOWN", error, {
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    return Promise.reject(error);
  },
);

export default api;
