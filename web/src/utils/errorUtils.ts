/**
 * Utility functions for error handling and categorization.
 *
 * This module provides standardized error handling across the application,
 * including error categorization, user-friendly messages, and logging.
 */

/**
 * Categories of errors that can occur in the application
 */
export type ErrorCategory =
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_UNAUTHORIZED"
  | "AUTH_TOKEN_EXPIRED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "TIMEOUT_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "UNKNOWN";

/**
 * Information about an error suitable for display to users
 */
export interface ErrorInfo {
  /** Title of the error for display */
  title: string;
  /** Detailed message explaining what went wrong */
  message: string;
  /** Suggested action for the user */
  action: string;
  /** Whether the operation can be retried */
  isRetryable: boolean;
  /** Error category for analytics/logging */
  category: ErrorCategory;
}

/**
 * Categorizes an error and returns user-friendly information.
 *
 * This function analyzes different types of errors (Axios errors, standard errors,
 * etc.) and returns consistent, actionable information for users.
 *
 * @param error - The error to categorize
 * @returns ErrorInfo object with user-friendly details
 *
 * @example
 * ```tsx
 * try {
 *   await login(credentials);
 * } catch (error) {
 *   const errorInfo = getAuthErrorMessage(error);
 *   showToast(errorInfo.title, errorInfo.message);
 * }
 * ```
 */
export function getAuthErrorMessage(error: unknown): ErrorInfo {
  // Handle null/undefined
  if (!error) {
    return {
      title: "Something went wrong",
      message: "An unexpected error occurred.",
      action: "Please try again.",
      isRetryable: true,
      category: "UNKNOWN",
    };
  }

  // Handle Axios errors with response
  if (typeof error === "object" && "response" in error) {
    const axiosError = error as {
      response?: { status?: number; data?: unknown };
    };
    const status = axiosError.response?.status;

    if (status === 401) {
      return {
        title: "Invalid credentials",
        message: "The email or password you entered is incorrect.",
        action: "Please check your credentials and try again.",
        isRetryable: false,
        category: "AUTH_INVALID_CREDENTIALS",
      };
    }

    if (status === 403) {
      return {
        title: "Access denied",
        message: "You don't have permission to perform this action.",
        action: "Please contact support if you think this is a mistake.",
        isRetryable: false,
        category: "AUTH_UNAUTHORIZED",
      };
    }

    if (status === 404) {
      return {
        title: "Not found",
        message: "The requested resource could not be found.",
        action: "Please check the URL or try again later.",
        isRetryable: true,
        category: "NOT_FOUND",
      };
    }

    if (status === 429) {
      return {
        title: "Too many attempts",
        message: "You've made too many login attempts.",
        action: "Please wait a few minutes before trying again.",
        isRetryable: true,
        category: "RATE_LIMIT",
      };
    }

    if (status && status >= 500) {
      return {
        title: "Server error",
        message: "Our servers are experiencing issues.",
        action: "Please try again in a few minutes.",
        isRetryable: true,
        category: "SERVER_ERROR",
      };
    }
  }

  // Handle network/timeout errors
  if (typeof error === "object" && "code" in error) {
    const codeError = error as { code?: string };

    if (codeError.code === "ECONNABORTED") {
      return {
        title: "Connection timeout",
        message: "The request took too long to complete.",
        action: "Please check your internet connection and try again.",
        isRetryable: true,
        category: "TIMEOUT_ERROR",
      };
    }

    if (codeError.code === "ECONNREFUSED" || codeError.code === "ERR_NETWORK") {
      return {
        title: "Network error",
        message: "Unable to connect to the server.",
        action: "Please check your internet connection and try again.",
        isRetryable: true,
        category: "NETWORK_ERROR",
      };
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return {
        title: "Network error",
        message: "Unable to connect to the server.",
        action: "Please check your internet connection and try again.",
        isRetryable: true,
        category: "NETWORK_ERROR",
      };
    }

    if (message.includes("timeout") || message.includes("abort")) {
      return {
        title: "Connection timeout",
        message: "The request took too long to complete.",
        action: "Please check your internet connection and try again.",
        isRetryable: true,
        category: "TIMEOUT_ERROR",
      };
    }
  }

  // Default fallback
  return {
    title: "Something went wrong",
    message: "We couldn't complete your request.",
    action: "Please try again or contact support if the problem persists.",
    isRetryable: true,
    category: "UNKNOWN",
  };
}

/**
 * Logs an error to the console with structured information.
 *
 * In production, this should be replaced with a proper error tracking
 * service like Sentry, LogRocket, or a custom logging endpoint.
 *
 * @param category - The error category
 * @param error - The original error
 * @param context - Additional context about where/when the error occurred
 *
 * @example
 * ```tsx
 * try {
 *   await apiCall();
 * } catch (error) {
 *   logError('API_REQUEST_FAILED', error, { endpoint: '/users', userId: 123 });
 *   throw error;
 * }
 * ```
 */
export function logError(
  category: ErrorCategory,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const isVitest =
    (import.meta.env as unknown as { VITEST?: boolean }).VITEST === true;
  if (isVitest) return;

  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Structure the log entry
  const logEntry = {
    timestamp,
    category,
    message: errorMessage,
    stack: errorStack,
    context,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };

  const shouldLogInConsole =
    import.meta.env.DEV && !isVitest && import.meta.env.MODE !== "test";

  // In development, log structured errors. In production, prefer sending to a tracker.
  if (shouldLogInConsole) {
    console.error(`[ERROR] ${category}:`, logEntry);
  }
}

/**
 * Determines if an error is retryable based on its category.
 *
 * @param error - The error to check
 * @returns True if the error is retryable
 *
 * @example
 * ```tsx
 * const handleRetry = async () => {
 *   if (!isRetryableError(error)) {
 *     return; // Don't retry non-retryable errors
 *   }
 *   await retryOperation();
 * };
 * ```
 */
export function isRetryableError(error: unknown): boolean {
  const errorInfo = getAuthErrorMessage(error);
  return errorInfo.isRetryable;
}

/**
 * Gets a user-friendly error message for form displays.
 *
 * This is a simplified version that returns just the message string
 * for inline form error displays.
 *
 * @param error - The error to convert
 * @returns A user-friendly message string
 *
 * @example
 * ```tsx
 * {error && (
 *   <p className="text-red-600">{getUserFriendlyErrorMessage(error)}</p>
 * )}
 * ```
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const errorInfo = getAuthErrorMessage(error);
  return errorInfo.message;
}
