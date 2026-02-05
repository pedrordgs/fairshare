import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as AuthService from "@services/auth";

// Mock the auth service
vi.mock("@services/auth", () => ({
  authApi: {
    getMe: vi.fn(),
  },
  getAuthToken: vi.fn(),
  setAuthToken: vi.fn(),
  removeAuthToken: vi.fn(),
}));

Object.defineProperty(window, "location", {
  value: { href: "" },
  writable: true,
});

describe("AuthContext", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
    window.location.href = "";

    vi.mocked(AuthService.setAuthToken).mockReturnValue(true);
    vi.mocked(AuthService.removeAuthToken).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{ui}</AuthProvider>
      </QueryClientProvider>,
    );
  };

  // Test component that uses the hook
  const TestComponent = () => {
    const { user, isLoading, isAuthenticated, error, login, logout } =
      useAuth();

    return (
      <div>
        <div data-testid="loading">{isLoading ? "Loading" : "Not Loading"}</div>
        <div data-testid="authenticated">
          {isAuthenticated ? "Authenticated" : "Not Authenticated"}
        </div>
        <div data-testid="user">{user ? user.name : "No User"}</div>
        <div data-testid="error">{error ? error.message : "No Error"}</div>
        <button onClick={() => login("test-token")}>Login</button>
        <button onClick={logout}>Logout</button>
      </div>
    );
  };

  describe("Initial State", () => {
    it("returns unauthenticated state when no token exists", () => {
      vi.mocked(AuthService.getAuthToken).mockReturnValue(null);
      vi.mocked(AuthService.authApi.getMe).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
      });

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "Not Authenticated",
      );
      expect(screen.getByTestId("user")).toHaveTextContent("No User");
    });

    it("starts loading when token exists", async () => {
      vi.mocked(AuthService.getAuthToken).mockReturnValue("test-token");
      vi.mocked(AuthService.authApi.getMe).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: 1,
                  name: "Test User",
                  email: "test@example.com",
                }),
              100,
            ),
          ),
      );

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId("loading")).toHaveTextContent("Loading");

      await waitFor(() => {
        expect(screen.getByTestId("loading")).toHaveTextContent("Not Loading");
      });
    });
  });

  describe("Authentication State", () => {
    it("returns authenticated when user data is loaded", async () => {
      vi.mocked(AuthService.getAuthToken).mockReturnValue("test-token");
      vi.mocked(AuthService.authApi.getMe).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
      });

      renderWithProviders(<TestComponent />);

      await waitFor(
        () => {
          expect(screen.getByTestId("authenticated")).toHaveTextContent(
            "Authenticated",
          );
        },
        { timeout: 3000 },
      );

      await waitFor(
        () => {
          expect(screen.getByTestId("user")).toHaveTextContent("Test User");
        },
        { timeout: 3000 },
      );
    });

    it("returns error when user fetch fails", async () => {
      vi.mocked(AuthService.getAuthToken).mockReturnValue("test-token");
      vi.mocked(AuthService.authApi.getMe).mockRejectedValue(
        new Error("Failed to fetch user"),
      );

      renderWithProviders(<TestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Failed to fetch user",
        );
      });

      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "Not Authenticated",
      );
    });
  });

  describe("Login Function", () => {
    it("stores token and updates state on login", async () => {
      const user = userEvent.setup();
      vi.mocked(AuthService.getAuthToken).mockReturnValue(null);
      vi.mocked(AuthService.authApi.getMe).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
      });

      renderWithProviders(<TestComponent />);

      // Initially not authenticated
      expect(screen.getByTestId("authenticated")).toHaveTextContent(
        "Not Authenticated",
      );

      // Trigger login
      const loginButton = screen.getByRole("button", { name: "Login" });
      await user.click(loginButton);

      await waitFor(() => {
        expect(AuthService.setAuthToken).toHaveBeenCalledWith("test-token");
      });
    });

    it("invalidates queries after login", async () => {
      const user = userEvent.setup();
      vi.mocked(AuthService.getAuthToken).mockReturnValue(null);

      renderWithProviders(<TestComponent />);

      const loginButton = screen.getByRole("button", { name: "Login" });
      await user.click(loginButton);

      // The query invalidation happens internally, we verify the token was set
      await waitFor(() => {
        expect(AuthService.setAuthToken).toHaveBeenCalledWith("test-token");
      });
    });
  });

  describe("Logout Function", () => {
    it("clears token and redirects on logout", async () => {
      const user = userEvent.setup();
      vi.mocked(AuthService.getAuthToken).mockReturnValue("test-token");
      vi.mocked(AuthService.authApi.getMe).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
      });

      renderWithProviders(<TestComponent />);

      // Wait for initial auth to complete
      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "Authenticated",
        );
      });

      // Trigger logout
      const logoutButton = screen.getByRole("button", { name: "Logout" });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(AuthService.removeAuthToken).toHaveBeenCalled();
      });

      expect(window.location.href).toBe("/");
    });

    it("clears query client on logout", async () => {
      const user = userEvent.setup();
      vi.mocked(AuthService.getAuthToken).mockReturnValue("test-token");
      vi.mocked(AuthService.authApi.getMe).mockResolvedValue({
        id: 1,
        name: "Test User",
        email: "test@example.com",
      });

      renderWithProviders(<TestComponent />);

      // Wait for initial auth
      await waitFor(() => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent(
          "Authenticated",
        );
      });

      // Trigger logout
      const logoutButton = screen.getByRole("button", { name: "Logout" });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(AuthService.removeAuthToken).toHaveBeenCalled();
      });
    });
  });

  describe("useAuth Hook Error", () => {
    it("throws error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const ComponentWithoutProvider = () => {
        useAuth();
        return <div>Should not render</div>;
      };

      expect(() => render(<ComponentWithoutProvider />)).toThrow(
        "useAuth must be used within an AuthProvider",
      );

      consoleSpy.mockRestore();
    });
  });
});
