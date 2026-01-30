import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useApiFormErrors,
  isFastAPIValidationError,
  isFastAPIHTTPException,
} from "./useApiFormErrors";

describe("useApiFormErrors", () => {
  describe("Initial State", () => {
    it("starts with empty field errors", () => {
      const { result } = renderHook(() => useApiFormErrors());
      expect(result.current.fieldErrors).toEqual({});
    });

    it("starts with isValidationError as false", () => {
      const { result } = renderHook(() => useApiFormErrors());
      expect(result.current.isValidationError).toBe(false);
    });

    it("starts with isGeneralError as false", () => {
      const { result } = renderHook(() => useApiFormErrors());
      expect(result.current.isGeneralError).toBe(false);
    });

    it("starts with generalError as null", () => {
      const { result } = renderHook(() => useApiFormErrors());
      expect(result.current.generalError).toBeNull();
    });
  });

  describe("FastAPI Validation Errors", () => {
    it("correctly identifies FastAPI validation error", () => {
      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "String should have at least 1 character",
                input: "",
              },
            ],
          },
        },
      };

      expect(isFastAPIValidationError(validationError)).toBe(true);
    });

    it("parses field errors from validation response", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "String should have at least 1 character",
                input: "",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.isValidationError).toBe(true);
      expect(result.current.fieldErrors).toEqual({
        name: "String should have at least 1 character",
      });
      expect(result.current.isGeneralError).toBe(false);
    });

    it("parses multiple field errors", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "Name is too short",
                input: "",
              },
              {
                type: "value_error",
                loc: ["body", "email"],
                msg: "Invalid email address",
                input: "not-an-email",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.fieldErrors).toEqual({
        name: "Name is too short",
        email: "Invalid email address",
      });
    });

    it("concatenates multiple errors for same field", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "email"],
                msg: "Email is too short",
                input: "a",
              },
              {
                type: "value_error",
                loc: ["body", "email"],
                msg: "Invalid email format",
                input: "a",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.fieldErrors.email).toBe(
        "Email is too short; Invalid email format",
      );
    });

    it("handles nested field paths", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "missing",
                loc: ["body", "user", "profile", "name"],
                msg: "Field required",
                input: {},
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.fieldErrors).toEqual({
        "user.profile.name": "Field required",
      });
    });

    it("ignores errors without field location", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "missing",
                loc: ["body"],
                msg: "Request body required",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.fieldErrors).toEqual({});
    });
  });

  describe("FastAPI HTTPException (General Errors)", () => {
    it("correctly identifies FastAPI HTTPException", () => {
      const httpException = {
        response: {
          data: {
            detail: "A user with this email already exists",
          },
        },
      };

      expect(isFastAPIHTTPException(httpException)).toBe(true);
    });

    it("does not identify validation error as HTTPException", () => {
      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "String should have at least 1 character",
              },
            ],
          },
        },
      };

      expect(isFastAPIHTTPException(validationError)).toBe(false);
    });

    it("parses general error message", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const httpException = {
        response: {
          data: {
            detail: "A user with this email already exists",
          },
        },
      };

      act(() => {
        result.current.setApiError(httpException);
      });

      expect(result.current.isGeneralError).toBe(true);
      expect(result.current.generalError).toBe(
        "A user with this email already exists",
      );
      expect(result.current.isValidationError).toBe(false);
      expect(result.current.fieldErrors).toEqual({});
    });
  });

  describe("clearApiErrors", () => {
    it("clears all errors when called", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "Name is too short",
                input: "",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.fieldErrors).not.toEqual({});

      act(() => {
        result.current.clearApiErrors();
      });

      expect(result.current.fieldErrors).toEqual({});
      expect(result.current.isValidationError).toBe(false);
      expect(result.current.generalError).toBeNull();
    });
  });

  describe("getFieldError", () => {
    it("returns error for existing field", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "email"],
                msg: "Invalid email",
                input: "",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.getFieldError("email")).toBe("Invalid email");
    });

    it("returns undefined for non-existing field", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "Name is too short",
                input: "",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.getFieldError("email")).toBeUndefined();
    });
  });

  describe("hasFieldError", () => {
    it("returns true for field with error", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "email"],
                msg: "Invalid email",
                input: "",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.hasFieldError("email")).toBe(true);
    });

    it("returns false for field without error", () => {
      const { result } = renderHook(() => useApiFormErrors());

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "Name is too short",
                input: "",
              },
            ],
          },
        },
      };

      act(() => {
        result.current.setApiError(validationError);
      });

      expect(result.current.hasFieldError("email")).toBe(false);
    });
  });

  describe("Type Guards", () => {
    it("isFastAPIValidationError returns false for null", () => {
      expect(isFastAPIValidationError(null)).toBe(false);
    });

    it("isFastAPIValidationError returns false for undefined", () => {
      expect(isFastAPIValidationError(undefined)).toBe(false);
    });

    it("isFastAPIValidationError returns false for plain error", () => {
      expect(isFastAPIValidationError(new Error("test"))).toBe(false);
    });

    it("isFastAPIValidationError returns false for empty response", () => {
      expect(isFastAPIValidationError({ response: {} })).toBe(false);
    });

    it("isFastAPIValidationError returns false for array with primitives", () => {
      expect(
        isFastAPIValidationError({
          response: { data: { detail: ["random string"] } },
        }),
      ).toBe(false);
    });

    it("isFastAPIValidationError returns false for array with invalid objects", () => {
      expect(
        isFastAPIValidationError({
          response: {
            data: {
              detail: [{ type: "error", msg: "Missing loc field" }],
            },
          },
        }),
      ).toBe(false);
    });

    it("isFastAPIHTTPException returns false for null", () => {
      expect(isFastAPIHTTPException(null)).toBe(false);
    });

    it("isFastAPIHTTPException returns false for undefined", () => {
      expect(isFastAPIHTTPException(undefined)).toBe(false);
    });

    it("isFastAPIValidationError validates complete error item structure", () => {
      const validError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "String should have at least 1 character",
                input: "",
              },
            ],
          },
        },
      };
      expect(isFastAPIValidationError(validError)).toBe(true);
    });
  });
});
