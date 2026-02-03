import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupDetailPage } from "./GroupDetailPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as GroupsService from "@services/groups";
import * as AuthContext from "@context/AuthContext";
import * as ErrorUtils from "@utils/errorUtils";

const mockNavigate = vi.fn();
let mockGroupId = "1";

// Mock the groups service
vi.mock("@services/groups", () => ({
  groupsApi: {
    createGroup: vi.fn(),
    getGroup: vi.fn(),
  },
}));

// Mock the auth context
vi.mock("@context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock the error utils
vi.mock("@utils/errorUtils", () => ({
  logError: vi.fn(),
}));

// Mock tanstack router
vi.mock("@tanstack/react-router", () => ({
  getRouteApi: () => ({
    useParams: () => ({ groupId: mockGroupId }),
  }),
  useNavigate: () => mockNavigate,
}));

describe("GroupDetailPage", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockGroupId = "1";
    vi.clearAllMocks();

    // Setup auth context mock with authenticated user
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 1, email: "test@example.com", name: "Test User" },
      isLoading: false,
      isAuthenticated: true,
      error: null,
      login: vi.fn(),
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

  describe("Loading States", () => {
    it("shows loading spinner when auth is loading", () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      renderWithProviders(<GroupDetailPage />);

      expect(screen.getByText(/loading group/i)).toBeInTheDocument();
    });

    it("shows loading spinner when group is loading", () => {
      vi.mocked(GroupsService.groupsApi.getGroup).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({ id: 1, name: "Test", created_by: 1, members: [] }),
              100,
            ),
          ),
      );

      renderWithProviders(<GroupDetailPage />);

      expect(screen.getByText(/loading group/i)).toBeInTheDocument();
    });
  });

  describe("Successful Group Display", () => {
    it("renders group name in header", async () => {
      const mockGroup = {
        id: 1,
        name: "Weekend Trip",
        created_by: 1,
        members: [{ user_id: 1, name: "John Doe", email: "john@example.com" }],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Weekend Trip")).toBeInTheDocument();
      });
    });

    it("displays correct member count", async () => {
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        members: [
          { user_id: 1, name: "John Doe", email: "john@example.com" },
          { user_id: 2, name: "Jane Smith", email: "jane@example.com" },
        ],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/2 members/i)).toBeInTheDocument();
      });
    });

    it("displays group ID", async () => {
      const mockGroup = {
        id: 42,
        name: "Test Group",
        created_by: 1,
        members: [],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Group #42/i)).toBeInTheDocument();
      });
    });

    it("renders member list with avatars", async () => {
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        members: [{ user_id: 1, name: "John Doe", email: "john@example.com" }],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("shows 'No members yet' when members array is empty", async () => {
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        members: [],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/No members yet/i)).toBeInTheDocument();
      });
    });

    it("displays back to dashboard button", async () => {
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        members: [],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Back to Dashboard/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error States", () => {
    it("shows 'Group Not Found' for 404 error", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: "Group not found" },
        },
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockRejectedValue(
        notFoundError,
      );

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Group Not Found/i)).toBeInTheDocument();
      });
    });

    it("shows 'Access Denied' for 403 error", async () => {
      const forbiddenError = {
        response: {
          status: 403,
          data: { detail: "Access denied" },
        },
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockRejectedValue(
        forbiddenError,
      );

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
      });
    });

    it("shows 'Server Error' for 500 error with retry button", async () => {
      const serverError = {
        response: {
          status: 500,
          data: { detail: "Internal server error" },
        },
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockRejectedValue(
        serverError,
      );

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Server Error/i)).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Try Again/i }),
        ).toBeInTheDocument();
      });
    });

    it("shows generic error for network failures", async () => {
      vi.mocked(GroupsService.groupsApi.getGroup).mockRejectedValue(
        new Error("Network Error"),
      );

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Group/i)).toBeInTheDocument();
      });
    });

    it("navigates to dashboard when back button clicked on error", async () => {
      const user = userEvent.setup();
      const notFoundError = {
        response: {
          status: 404,
          data: { detail: "Group not found" },
        },
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockRejectedValue(
        notFoundError,
      );

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Group Not Found/i)).toBeInTheDocument();
      });

      const backButton = screen.getByRole("button", {
        name: /Back to Dashboard/i,
      });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith({ to: "/dashboard" });
    });

    it("calls refetch when Try Again button clicked", async () => {
      const user = userEvent.setup();
      const serverError = {
        response: {
          status: 500,
          data: { detail: "Internal server error" },
        },
      };

      vi.mocked(GroupsService.groupsApi.getGroup)
        .mockRejectedValueOnce(serverError)
        .mockResolvedValueOnce({
          id: 1,
          name: "Test Group",
          created_by: 1,
          members: [],
        });

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Try Again/i }),
        ).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByRole("button", { name: /Try Again/i });
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(GroupsService.groupsApi.getGroup).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Invalid Route Parameters", () => {
    it("shows error for invalid groupId parameter (non-numeric)", async () => {
      mockGroupId = "invalid";

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Group/i)).toBeInTheDocument();
      });

      expect(ErrorUtils.logError).toHaveBeenCalledWith(
        "VALIDATION_ERROR",
        expect.any(Error),
        expect.objectContaining({
          param: "invalid",
        }),
      );
    });

    it("shows error for negative groupId", async () => {
      mockGroupId = "-1";

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error Loading Group/i)).toBeInTheDocument();
      });
    });
  });

  describe("Query Configuration", () => {
    it("only fetches when user is authenticated", async () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
      });

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue({
        id: 1,
        name: "Test Group",
        created_by: 1,
        members: [],
      });

      renderWithProviders(<GroupDetailPage />);

      // Should not call API when not authenticated
      await waitFor(() => {
        expect(GroupsService.groupsApi.getGroup).not.toHaveBeenCalled();
      });
    });

    it("logs errors for debugging", async () => {
      const apiError = {
        response: {
          status: 500,
          data: { detail: "Server error" },
        },
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockRejectedValue(apiError);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(ErrorUtils.logError).toHaveBeenCalledWith(
          "NOT_FOUND",
          apiError,
          expect.objectContaining({
            groupId: "1",
            userId: 1,
          }),
        );
      });
    });
  });
});
