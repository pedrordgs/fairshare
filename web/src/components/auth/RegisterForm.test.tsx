import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./RegisterForm";
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
    register: vi.fn(),
  },
}));

// Mock the entire tanstack router module
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  RouterProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  createRouter: () => ({}),
  createRootRoute: () => ({}),
}));

describe("RegisterForm", () => {
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
    it("renders registration form with all required fields", () => {
      renderWithProviders(<RegisterForm />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i }),
      ).toBeInTheDocument();
    });

    it("renders with correct input types", () => {
      renderWithProviders(<RegisterForm />);

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute(
        "type",
        "text",
      );
      expect(screen.getByLabelText(/email/i)).toHaveAttribute("type", "email");
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        "type",
        "password",
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
        "type",
        "password",
      );
    });

    it("renders with autocomplete attributes for accessibility", () => {
      renderWithProviders(<RegisterForm />);

      expect(screen.getByLabelText(/full name/i)).toHaveAttribute(
        "autocomplete",
        "name",
      );
      expect(screen.getByLabelText(/email/i)).toHaveAttribute(
        "autocomplete",
        "email",
      );
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute(
        "autocomplete",
        "new-password",
      );
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute(
        "autocomplete",
        "new-password",
      );
    });
  });

  describe("Form Validation", () => {
    it("shows validation error for name less than 2 characters", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, "A");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/name must be at least 2 characters/i),
        ).toBeInTheDocument();
      });
    });

    it("shows validation error for invalid email format", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "invalid-email");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it("shows validation error for password less than 6 characters", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, "12345");
      await user.tab();

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 6 characters/i),
        ).toBeInTheDocument();
      });
    });

    it("shows validation error when passwords don't match", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "differentpassword");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });
    });

    it("clears password match error when passwords match", async () => {
      const user = userEvent.setup();
      renderWithProviders(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      // First make them not match
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "differentpassword");
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      // Then make them match
      await user.clear(confirmPasswordInput);
      await user.type(confirmPasswordInput, "password123");

      await waitFor(() => {
        expect(
          screen.queryByText(/passwords don't match/i),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Successful Registration", () => {
    it("calls register mutation with correct data (without confirmPassword)", async () => {
      const user = userEvent.setup();
      const mockToken = {
        access_token: "test-token-123",
        token_type: "bearer" as const,
      };

      vi.mocked(AuthService.authApi.register).mockResolvedValue(mockToken);

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(AuthService.authApi.register).toHaveBeenCalledWith(
          {
            name: "John Doe",
            email: "john@example.com",
            password: "password123",
          },
          expect.any(Object),
        );
      });

      // Ensure confirmPassword is NOT sent
      const callArgs = vi.mocked(AuthService.authApi.register).mock.calls[0][0];
      expect(callArgs).not.toHaveProperty("confirmPassword");
    });

    it("calls context login function with token on success", async () => {
      const user = userEvent.setup();
      const mockToken = {
        access_token: "test-token-123",
        token_type: "bearer" as const,
      };

      vi.mocked(AuthService.authApi.register).mockResolvedValue(mockToken);

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith("test-token-123");
      });
    });

    it("calls onSuccess callback after successful registration", async () => {
      const user = userEvent.setup();
      const onSuccessMock = vi.fn();
      const mockToken = {
        access_token: "test-token-123",
        token_type: "bearer" as const,
      };

      vi.mocked(AuthService.authApi.register).mockResolvedValue(mockToken);

      renderWithProviders(<RegisterForm onSuccess={onSuccessMock} />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Error Handling", () => {
    it("displays user-friendly error message on registration failure", async () => {
      const user = userEvent.setup();

      // Mock 409 conflict error with email already exists message
      vi.mocked(AuthService.authApi.register).mockRejectedValue({
        response: {
          status: 409,
          data: {
            detail: "A user with this email already exists",
          },
        },
      });

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        // Should show user-friendly error message for existing email
        expect(
          screen.getByText(/a user with this email already exists/i),
        ).toBeInTheDocument();
      });
    });

    it("displays generic error message for unknown errors", async () => {
      const user = userEvent.setup();

      // Mock general server error with detail message
      vi.mocked(AuthService.authApi.register).mockRejectedValue({
        response: {
          status: 500,
          data: {
            detail: "Internal server error",
          },
        },
      });

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        // Should show the API error detail message
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });

    it("displays field-level validation errors from API", async () => {
      const user = userEvent.setup();

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "string_too_short",
                loc: ["body", "name"],
                msg: "Name must be at least 5 characters",
                input: "Jo",
              },
            ],
          },
        },
      };

      vi.mocked(AuthService.authApi.register).mockRejectedValue(
        validationError,
      );

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "Jo");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/name must be at least 5 characters/i),
        ).toBeInTheDocument();
      });
    });

    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();

      const networkError = new Error("Network Error");

      vi.mocked(AuthService.authApi.register).mockRejectedValue(networkError);

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });
      await user.click(submitButton);

      // Form should not crash and button should be re-enabled after error
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      // Form fields should still be present
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading spinner while submitting", async () => {
      const user = userEvent.setup();

      vi.mocked(AuthService.authApi.register).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  access_token: "token",
                  token_type: "bearer" as const,
                }),
              100,
            ),
          ),
      );

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });
    });

    it("disables button during submission", async () => {
      const user = userEvent.setup();

      vi.mocked(AuthService.authApi.register).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  access_token: "token",
                  token_type: "bearer" as const,
                }),
              100,
            ),
          ),
      );

      renderWithProviders(<RegisterForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "password123",
      );
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });
});
