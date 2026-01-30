import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./LoginForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as AuthContext from "@context/AuthContext";
import * as AuthService from "@services/auth";

// Mock the auth context
vi.mock("@context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock the auth service
vi.mock("@services/auth", () => ({
  authApi: {
    login: vi.fn(),
  },
}));

// Mock the entire tanstack router module
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

describe("LoginForm", () => {
  let queryClient: QueryClient;
  const mockLogin = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset all mocks
    vi.clearAllMocks();

    // Setup auth context mock
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      login: mockLogin,
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  describe("Rendering", () => {
    it("renders login form with email and password fields", () => {
      renderWithProviders(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i }),
      ).toBeInTheDocument();
    });

    it("renders with correct input types", () => {
      renderWithProviders(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        "type",
        "password",
      );
    });

    it("renders with autocomplete attributes for accessibility", () => {
      renderWithProviders(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute(
        "autocomplete",
        "email",
      );
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        "autocomplete",
        "current-password",
      );
    });
  });

  describe("Form Validation", () => {
    it("shows validation error for invalid email format", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it("shows validation error for empty password", async () => {
      const user = userEvent.setup();
      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it("disables submit button while form is submitting", async () => {
      const user = userEvent.setup();

      // Mock a delayed login response
      vi.mocked(AuthService.authApi.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Button should be disabled immediately after click
      expect(submitButton).toBeDisabled();
    });
  });

  describe("Successful Login", () => {
    it("calls login mutation with correct credentials", async () => {
      const user = userEvent.setup();
      const mockToken = { access_token: "test-token-123" };

      vi.mocked(AuthService.authApi.login).mockResolvedValue(mockToken);

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(AuthService.authApi.login).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("calls context login function with token on success", async () => {
      const user = userEvent.setup();
      const mockToken = { access_token: "test-token-123" };

      vi.mocked(AuthService.authApi.login).mockResolvedValue(mockToken);

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test-token-123");
      });
    });
  });

  describe("Error Handling", () => {
    it("displays user-friendly error message on login failure", async () => {
      const user = userEvent.setup();
      const errorMessage = "Invalid credentials";

      vi.mocked(AuthService.authApi.login).mockRejectedValue(
        new Error(errorMessage),
      );

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        // Should show user-friendly error message instead of raw error
        expect(
          screen.getByText(/invalid email or password/i),
        ).toBeInTheDocument();
      });
    });

    it("displays generic error message for unknown errors", async () => {
      const user = userEvent.setup();

      vi.mocked(AuthService.authApi.login).mockRejectedValue("Unknown error");

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading spinner while submitting", async () => {
      const user = userEvent.setup();

      // Mock a delayed login response
      vi.mocked(AuthService.authApi.login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ access_token: "token" }), 100),
          ),
      );

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });
    });

    it("disables button during submission", async () => {
      const user = userEvent.setup();

      vi.mocked(AuthService.authApi.login).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ access_token: "token" }), 100),
          ),
      );

      renderWithProviders(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });
});
