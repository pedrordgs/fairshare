import { useState, useCallback, useMemo } from "react";
import { logError } from "@utils/errorUtils";

/**
 * FastAPI validation error detail item structure
 */
export interface FastAPIValidationErrorItem {
  type: string;
  loc: (string | number)[];
  msg: string;
  input?: unknown;
  url?: string;
}

/**
 * Type guard to check if error appears to be a FastAPI validation error.
 * Performs structural validation - assumes API contract is respected.
 */
export function isFastAPIValidationError(
  error: unknown,
): error is { response: { data: { detail: FastAPIValidationErrorItem[] } } } {
  if (
    !error ||
    typeof error !== "object" ||
    !("response" in error) ||
    !error.response ||
    typeof error.response !== "object" ||
    !("data" in error.response) ||
    !error.response.data ||
    typeof error.response.data !== "object" ||
    !("detail" in error.response.data)
  ) {
    return false;
  }

  const detail = (error.response.data as { detail: unknown }).detail;
  if (!Array.isArray(detail) || detail.length === 0) {
    return false;
  }

  // Validate at least the first item has required structure
  const firstItem = detail[0];
  return (
    firstItem &&
    typeof firstItem === "object" &&
    "type" in firstItem &&
    typeof firstItem.type === "string" &&
    "loc" in firstItem &&
    Array.isArray(firstItem.loc) &&
    "msg" in firstItem &&
    typeof firstItem.msg === "string"
  );
}

/**
 * Type guard to check if error appears to be a FastAPI HTTPException.
 * Verifies that error.response.data.detail is a string.
 */
export function isFastAPIHTTPException(
  error: unknown,
): error is { response: { data: { detail: string } } } {
  if (
    !error ||
    typeof error !== "object" ||
    !("response" in error) ||
    !error.response ||
    typeof error.response !== "object" ||
    !("data" in error.response) ||
    !error.response.data ||
    typeof error.response.data !== "object" ||
    !("detail" in error.response.data)
  ) {
    return false;
  }

  const detail = (error.response.data as { detail: unknown }).detail;
  return typeof detail === "string";
}

function shouldLogInConsole(): boolean {
  const isVitest =
    (import.meta.env as unknown as { VITEST?: boolean }).VITEST === true;
  return import.meta.env.DEV && !isVitest && import.meta.env.MODE !== "test";
}

/**
 * Extracts field errors from FastAPI validation error response
 * Maps field paths like ["body", "name"] to field names like "name"
 */
function extractFieldErrors(
  errors: FastAPIValidationErrorItem[],
): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const error of errors) {
    // Skip the first element which is usually "body", "query", "path", etc.
    const fieldPath = error.loc.slice(1);

    if (fieldPath.length === 0) {
      if (shouldLogInConsole()) {
        logError(
          "VALIDATION_ERROR",
          new Error("Validation error missing field location"),
          {
            errorDetail: error,
          },
        );
      }
      continue;
    }

    // Convert path array to dot-notation string (e.g., ["user", "email"] -> "user.email")
    const fieldName = fieldPath.join(".");

    // If we already have an error for this field, append the new message
    if (fieldErrors[fieldName]) {
      fieldErrors[fieldName] += `; ${error.msg}`;
    } else {
      fieldErrors[fieldName] = error.msg;
    }
  }

  return fieldErrors;
}

/**
 * Return type for useApiFormErrors hook
 */
export interface UseApiFormErrorsReturn {
  /** Object mapping field names to their error messages */
  fieldErrors: Record<string, string>;
  /** Whether the current error is a validation error (field-level) */
  isValidationError: boolean;
  /** Whether the current error is a general HTTPException */
  isGeneralError: boolean;
  /** Generic error message for non-field errors */
  generalError: string | null;
  /** Set API error from mutation error */
  setApiError: (error: unknown) => void;
  /** Clear all API errors */
  clearApiErrors: () => void;
  /** Get error message for a specific field */
  getFieldError: (fieldName: string) => string | undefined;
  /** Check if a specific field has an error */
  hasFieldError: (fieldName: string) => boolean;
}

/**
 * Hook to handle FastAPI API errors and map them to form fields
 *
 * This hook parses FastAPI validation errors and extracts field-level errors
 * that can be displayed on specific form inputs. Non-validation errors are
 * kept as generic errors (to be displayed as banners/alerts).
 *
 * FastAPI validation errors have this format:
 * ```json
 * {
 *   "detail": [
 *     {
 *       "type": "string_too_short",
 *       "loc": ["body", "name"],
 *       "msg": "String should have at least 1 character",
 *       "input": ""
 *     }
 *   ]
 * }
 * ```
 *
 * FastAPI HTTPExceptions (non-field errors) have this format:
 * ```json
 * {
 *   "detail": "A user with this email already exists"
 * }
 * ```
 *
 * @example
 * ```tsx
 * const { fieldErrors, isValidationError, setApiError, clearApiErrors } = useApiFormErrors();
 *
 * const mutation = useMutation({
 *   mutationFn: apiCall,
 *   onError: (error) => {
 *     setApiError(error);
 *   },
 *   onSuccess: () => {
 *     clearApiErrors();
 *   },
 * });
 *
 * // In form:
 * <Input
 *   {...register("email")}
 *   error={errors.email?.message || fieldErrors.email}
 * />
 *
 * // For general errors (non-validation):
 * {isGeneralError && (
 *   <Alert variant="error">{generalError}</Alert>
 * )}
 * ```
 */
export function useApiFormErrors(): UseApiFormErrorsReturn {
  const [error, setError] = useState<unknown>(null);

  const setApiError = useCallback((newError: unknown) => {
    setError(newError);
  }, []);

  const clearApiErrors = useCallback(() => {
    setError(null);
  }, []);

  const fieldErrors = useMemo(() => {
    if (!isFastAPIValidationError(error)) {
      return {};
    }

    return extractFieldErrors(error.response.data.detail);
  }, [error]);

  // Simple primitive derivations - no useMemo needed per React best practices
  const isValidationError = isFastAPIValidationError(error);
  const isGeneralError = isFastAPIHTTPException(error);
  const generalError = isFastAPIHTTPException(error)
    ? error.response.data.detail
    : null;

  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return fieldErrors[fieldName];
    },
    [fieldErrors],
  );

  const hasFieldError = useCallback(
    (fieldName: string): boolean => {
      return fieldName in fieldErrors;
    },
    [fieldErrors],
  );

  return {
    fieldErrors,
    isValidationError,
    isGeneralError,
    generalError,
    setApiError,
    clearApiErrors,
    getFieldError,
    hasFieldError,
  };
}
