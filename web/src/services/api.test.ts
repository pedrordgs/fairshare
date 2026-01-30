import { describe, it, expect, vi, beforeEach } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.location
    delete (window as Window & { location: Location }).location;
    window.location = { href: "" } as Location;
  });

  describe("Request Interceptor", () => {
    it("attaches Bearer token to requests when token exists", () => {
      vi.mocked(authModule.getAuthToken).mockReturnValue("test-token");

      // Create a mock request config
      const requestConfig = { headers: {} };

      // Get the request interceptor function and call it directly
      const requestInterceptor = api.interceptors.request.handlers.find(
        (h: { fulfilled: unknown }) => h.fulfilled,
      )?.fulfilled as (config: { headers: Record<string, string> }) => {
        headers: Record<string, string>;
      };

      const result = requestInterceptor(requestConfig);

      expect(result.headers.Authorization).toBe("Bearer test-token");
    });

    it("does not attach Authorization header when no token exists", () => {
      vi.mocked(authModule.getAuthToken).mockReturnValue(null);

      const requestConfig = { headers: {} };

      const requestInterceptor = api.interceptors.request.handlers.find(
        (h: { fulfilled: unknown }) => h.fulfilled,
      )?.fulfilled as (config: { headers: Record<string, string> }) => {
        headers: Record<string, string>;
      };

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
        config: { url: "/test" },
      };

      const result =
        await api.interceptors.response.handlers[0].fulfilled(mockResponse);
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
        await api.interceptors.response.handlers[0].rejected(error);
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
        await api.interceptors.response.handlers[0].rejected(error);
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
        await api.interceptors.response.handlers[0].rejected(error);
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
        await api.interceptors.response.handlers[0].rejected(error);
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
        await api.interceptors.response.handlers[0].rejected(error);
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
        api.interceptors.response.handlers[0].rejected(error),
      ).rejects.toEqual(error);
    });
  });
});
