import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";
import { api } from "./api";
import * as authModule from "./auth";
import * as errorUtils from "@utils/errorUtils";

// Mock the auth module
vi.mock("./auth", () => ({
  getAuthToken: vi.fn(),
  removeAuthToken: vi.fn(),
}));

// Mock the errorUtils module
vi.mock("@utils/errorUtils", () => ({
  logError: vi.fn(),
}));

describe("API Interceptors", () => {
  const requestHandlers = api.interceptors.request
    .handlers as unknown as Array<{ fulfilled?: unknown; rejected?: unknown }>;
  const responseHandlers = api.interceptors.response
    .handlers as unknown as Array<{ fulfilled?: unknown; rejected?: unknown }>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { href: "" });
  });

  describe("Request Interceptor", () => {
    it("attaches Bearer token to requests when token exists", () => {
      vi.mocked(authModule.getAuthToken).mockReturnValue("test-token");

      // Create a mock request config
      const requestConfig = { headers: {} } as InternalAxiosRequestConfig;

      // Get the request interceptor function and call it directly
      const requestInterceptor = requestHandlers[0]?.fulfilled as unknown as (
        config: InternalAxiosRequestConfig,
      ) => InternalAxiosRequestConfig;

      const result = requestInterceptor(requestConfig);

      expect(result.headers.Authorization).toBe("Bearer test-token");
    });

    it("does not attach Authorization header when no token exists", () => {
      vi.mocked(authModule.getAuthToken).mockReturnValue(null);

      const requestConfig = { headers: {} } as InternalAxiosRequestConfig;

      const requestInterceptor = requestHandlers[0]?.fulfilled as unknown as (
        config: InternalAxiosRequestConfig,
      ) => InternalAxiosRequestConfig;

      const result = requestInterceptor(requestConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe("Response Interceptor", () => {
    it("returns successful responses unchanged", async () => {
      const mockResponse = {
        data: { message: "success" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/test", headers: {} } as InternalAxiosRequestConfig,
      };

      const result = await (
        responseHandlers[0]!.fulfilled as (v: unknown) => unknown
      )(mockResponse);
      expect(result).toEqual(mockResponse);
    });

    it("clears token and redirects on 401 error", async () => {
      const error = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
        config: { url: "/protected", method: "get" },
      };

      try {
        await (responseHandlers[0]!.rejected as (v: unknown) => unknown)(error);
      } catch {
        // Expected to throw
      }

      expect(authModule.removeAuthToken).toHaveBeenCalled();
      expect(window.location.href).toBe("/");
    });

    it("logs API errors with structured context", async () => {
      const error = {
        response: {
          status: 500,
          data: { error: "Internal Server Error" },
        },
        config: { url: "/api/data", method: "post" },
      };

      try {
        await (responseHandlers[0]!.rejected as (v: unknown) => unknown)(error);
      } catch {
        // Expected to throw
      }

      expect(errorUtils.logError).toHaveBeenCalledWith(
        "SERVER_ERROR",
        error,
        expect.objectContaining({
          url: "/api/data",
          method: "post",
          status: 500,
          data: { error: "Internal Server Error" },
        }),
      );
    });

    it("logs network errors when no response received", async () => {
      const error = {
        request: {},
        message: "Network Error",
        config: { url: "/api/data", method: "get" },
      };

      try {
        await (responseHandlers[0]!.rejected as (v: unknown) => unknown)(error);
      } catch {
        // Expected to throw
      }

      expect(errorUtils.logError).toHaveBeenCalledWith(
        "NETWORK_ERROR",
        error,
        expect.objectContaining({
          url: "/api/data",
          method: "get",
        }),
      );
    });

    it("logs request errors when request cannot be made", async () => {
      const error = {
        message: "Request failed",
        config: { url: "/api/data", method: "post" },
      };

      try {
        await (responseHandlers[0]!.rejected as (v: unknown) => unknown)(error);
      } catch {
        // Expected to throw
      }

      expect(errorUtils.logError).toHaveBeenCalledWith(
        "UNKNOWN",
        error,
        expect.objectContaining({
          url: "/api/data",
          method: "post",
        }),
      );
    });

    it("does not redirect on non-401 errors", async () => {
      const error = {
        response: {
          status: 403,
          data: { message: "Forbidden" },
        },
        config: { url: "/api/data" },
      };

      try {
        await (responseHandlers[0]!.rejected as (v: unknown) => unknown)(error);
      } catch {
        // Expected to throw
      }

      expect(authModule.removeAuthToken).not.toHaveBeenCalled();
      expect(window.location.href).not.toBe("/");
    });

    it("rejects the promise after handling errors", async () => {
      const error = {
        response: {
          status: 401,
          data: { message: "Unauthorized" },
        },
        config: { url: "/api/data" },
      };

      await expect(
        (responseHandlers[0]!.rejected as (v: unknown) => Promise<unknown>)(
          error,
        ),
      ).rejects.toEqual(error);
    });
  });
});
