import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  authApi,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  TOKEN_KEY,
} from "./auth";
import api from "./api";

// Mock the api module
vi.mock("./api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Auth Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe("Token Storage Utilities", () => {
    describe("getAuthToken", () => {
      it("returns null when no token exists", () => {
        expect(getAuthToken()).toBeNull();
      });

      it("returns token when it exists in localStorage", () => {
        localStorage.setItem(TOKEN_KEY, "test-token");
        expect(getAuthToken()).toBe("test-token");
      });

      it("returns null and logs error when localStorage throws", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const localStorageSpy = vi
          .spyOn(Storage.prototype, "getItem")
          .mockImplementation(() => {
            throw new Error("localStorage error");
          });

        expect(getAuthToken()).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to read auth token from localStorage:",
          expect.any(Error),
        );

        consoleSpy.mockRestore();
        localStorageSpy.mockRestore();
      });
    });

    describe("setAuthToken", () => {
      it("stores token in localStorage", () => {
        const result = setAuthToken("test-token");

        expect(result).toBe(true);
        expect(localStorage.getItem(TOKEN_KEY)).toBe("test-token");
      });

      it("returns false and logs error when localStorage throws", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const localStorageSpy = vi
          .spyOn(Storage.prototype, "setItem")
          .mockImplementation(() => {
            throw new Error("localStorage error");
          });

        const result = setAuthToken("test-token");

        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to store auth token in localStorage:",
          expect.any(Error),
        );

        consoleSpy.mockRestore();
        localStorageSpy.mockRestore();
      });
    });

    describe("removeAuthToken", () => {
      it("removes token from localStorage", () => {
        localStorage.setItem(TOKEN_KEY, "test-token");
        const result = removeAuthToken();

        expect(result).toBe(true);
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      });

      it("returns false and logs error when localStorage throws", () => {
        const consoleSpy = vi
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const localStorageSpy = vi
          .spyOn(Storage.prototype, "removeItem")
          .mockImplementation(() => {
            throw new Error("localStorage error");
          });

        const result = removeAuthToken();

        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(
          "Failed to remove auth token from localStorage:",
          expect.any(Error),
        );

        consoleSpy.mockRestore();
        localStorageSpy.mockRestore();
      });
    });

    describe("TOKEN_KEY constant", () => {
      it("has the correct value", () => {
        expect(TOKEN_KEY).toBe("auth_token");
      });

      it("is readonly (const assertion)", () => {
        // TypeScript ensures this is readonly
        expect(TOKEN_KEY).toBe("auth_token");
      });
    });
  });

  describe("authApi.login", () => {
    it("sends login request with FormData", async () => {
      const mockResponse = {
        data: { access_token: "test-token", token_type: "bearer" },
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.login("test@example.com", "password123");

      expect(api.post).toHaveBeenCalledWith(
        "/auth/token",
        expect.any(FormData),
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      // Verify FormData content
      const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
      expect(formData.get("username")).toBe("test@example.com");
      expect(formData.get("password")).toBe("password123");

      expect(result).toEqual(mockResponse.data);
    });

    it("returns token data on successful login", async () => {
      const mockToken = {
        access_token: "test-token",
        token_type: "bearer" as const,
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockToken });

      const result = await authApi.login("test@example.com", "password123");

      expect(result).toEqual(mockToken);
    });

    it("throws error on failed login", async () => {
      const error = new Error("Invalid credentials");
      vi.mocked(api.post).mockRejectedValue(error);

      await expect(
        authApi.login("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("authApi.register", () => {
    it("sends registration request with user data", async () => {
      const mockResponse = {
        data: { access_token: "test-token", token_type: "bearer" },
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const result = await authApi.register(userData);

      expect(api.post).toHaveBeenCalledWith("/auth/register", userData);
      expect(result).toEqual(mockResponse.data);
    });

    it("returns token data on successful registration", async () => {
      const mockToken = {
        access_token: "test-token",
        token_type: "bearer" as const,
      };
      vi.mocked(api.post).mockResolvedValue({ data: mockToken });

      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      const result = await authApi.register(userData);

      expect(result).toEqual(mockToken);
    });

    it("throws error when email already exists", async () => {
      const error = new Error("Email already registered");
      vi.mocked(api.post).mockRejectedValue(error);

      const userData = {
        name: "John Doe",
        email: "existing@example.com",
        password: "password123",
      };

      await expect(authApi.register(userData)).rejects.toThrow(
        "Email already registered",
      );
    });
  });

  describe("authApi.getMe", () => {
    it("fetches current user data", async () => {
      const mockUser = { id: 1, name: "Test User", email: "test@example.com" };
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      const result = await authApi.getMe();

      expect(api.get).toHaveBeenCalledWith("/auth/me");
      expect(result).toEqual(mockUser);
    });

    it("throws error when not authenticated", async () => {
      const error = new Error("Unauthorized");
      error.message = "Unauthorized";
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(authApi.getMe()).rejects.toThrow("Unauthorized");
    });

    it("throws error on server error", async () => {
      const error = new Error("Internal server error");
      vi.mocked(api.get).mockRejectedValue(error);

      await expect(authApi.getMe()).rejects.toThrow("Internal server error");
    });
  });

  describe("authApi.updateMe", () => {
    it("updates user data with patch request", async () => {
      const mockUser = {
        id: 1,
        name: "Updated Name",
        email: "test@example.com",
      };
      vi.mocked(api.patch).mockResolvedValue({ data: mockUser });

      const updateData = { name: "Updated Name" };
      const result = await authApi.updateMe(updateData);

      expect(api.patch).toHaveBeenCalledWith("/auth/me", updateData);
      expect(result).toEqual(mockUser);
    });

    it("updates multiple fields", async () => {
      const mockUser = { id: 1, name: "New Name", email: "new@example.com" };
      vi.mocked(api.patch).mockResolvedValue({ data: mockUser });

      const updateData = { name: "New Name", email: "new@example.com" };
      const result = await authApi.updateMe(updateData);

      expect(api.patch).toHaveBeenCalledWith("/auth/me", updateData);
      expect(result).toEqual(mockUser);
    });

    it("throws error on update failure", async () => {
      const error = new Error("Email already in use");
      vi.mocked(api.patch).mockRejectedValue(error);

      const updateData = { email: "existing@example.com" };
      await expect(authApi.updateMe(updateData)).rejects.toThrow(
        "Email already in use",
      );
    });
  });
});
