import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupDetailPage } from "./GroupDetailPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as GroupsService from "@services/groups";
import * as ExpensesService from "@services/expenses";
import * as SettlementsService from "@services/settlements";
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

vi.mock("@services/expenses", () => ({
  expensesApi: {
    listGroupExpenses: vi.fn(),
    listAllGroupExpenses: vi.fn(),
  },
}));

vi.mock("@services/settlements", () => ({
  settlementsApi: {
    listGroupSettlements: vi.fn(),
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

    vi.mocked(
      ExpensesService.expensesApi.listAllGroupExpenses,
    ).mockResolvedValue({
      items: [],
      total: 0,
      offset: 0,
      limit: 20,
    });

    mockSettlements();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  const mockSettlements = (
    items: Array<{
      id: number;
      group_id: number;
      debtor_id: number;
      creditor_id: number;
      amount: number;
      created_at: string;
    }> = [],
    total = 0,
  ) => {
    vi.mocked(
      SettlementsService.settlementsApi.listGroupSettlements,
    ).mockResolvedValue({
      items,
      total,
      offset: 0,
      limit: 8,
    });
  };

  const baseGroup = {
    id: 1,
    name: "Test Group",
    created_by: 1,
    invite_code: "ABCD1234EF",
    members: [],
    created_at: "2026-01-05T10:30:00Z",
    expense_count: 0,
    owed_by_user_total: 0,
    owed_to_user_total: 0,
    owed_by_user: [],
    owed_to_user: [],
    last_activity_at: null,
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
            setTimeout(() => resolve({ ...baseGroup, name: "Test" }), 100),
          ),
      );

      renderWithProviders(<GroupDetailPage />);

      expect(screen.getByText(/loading group/i)).toBeInTheDocument();
    });
  });

  describe("Successful Group Display", () => {
    it("renders group name in header", async () => {
      const mockGroup = {
        ...baseGroup,
        name: "Weekend Trip",
        members: [{ user_id: 1, name: "John Doe", email: "john@example.com" }],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [
          {
            id: 1,
            name: "Dinner",
            description: "Team dinner",
            value: 45.5,
            group_id: 1,
            created_by: 1,
            created_at: "2026-01-05T12:00:00Z",
            updated_at: "2026-01-05T12:00:00Z",
          },
        ],
        total: 1,
        offset: 0,
        limit: 20,
      });
      mockSettlements(
        [
          {
            id: 10,
            group_id: 1,
            debtor_id: 1,
            creditor_id: 2,
            amount: 25,
            created_at: "2026-01-05T12:30:00Z",
          },
        ],
        1,
      );

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Weekend Trip")).toBeInTheDocument();
      });
    });

    it("displays correct member count", async () => {
      const mockGroup = {
        ...baseGroup,
        members: [
          { user_id: 1, name: "John Doe", email: "john@example.com" },
          { user_id: 2, name: "Jane Smith", email: "jane@example.com" },
        ],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/2 members/i)).toBeInTheDocument();
      });
    });

    it("displays group ID", async () => {
      const mockGroup = {
        ...baseGroup,
        id: 42,
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/Group #42/i)).toBeInTheDocument();
      });
    });

    it("renders member list with avatars", async () => {
      const mockGroup = {
        ...baseGroup,
        members: [{ user_id: 1, name: "John Doe", email: "john@example.com" }],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("shows 'No members yet' when members array is empty", async () => {
      const mockGroup = {
        ...baseGroup,
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(screen.getByText(/No members yet/i)).toBeInTheDocument();
      });
    });

    it("displays back to dashboard button", async () => {
      const mockGroup = {
        ...baseGroup,
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
          ...baseGroup,
        });
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
        ...baseGroup,
      });
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

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

  describe("Settlement History", () => {
    it("renders settlement rows with member names", async () => {
      const mockGroup = {
        ...baseGroup,
        members: [
          { user_id: 1, name: "John Doe", email: "john@example.com" },
          { user_id: 2, name: "Jane Smith", email: "jane@example.com" },
        ],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements(
        [
          {
            id: 1,
            group_id: 1,
            debtor_id: 1,
            creditor_id: 2,
            amount: 12.5,
            created_at: "2026-01-10T09:00:00Z",
          },
        ],
        1,
      );

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: "Settlements" }),
        ).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole("tab", { name: "Settlements" }));

      const settlementsPanel = screen.getByRole("tabpanel");

      await waitFor(() => {
        expect(
          within(settlementsPanel).getByText(/John Doe paid Jane Smith/i),
        ).toBeInTheDocument();
      });
    });

    it("renders empty state when no settlements", async () => {
      const mockGroup = {
        ...baseGroup,
        members: [{ user_id: 1, name: "John Doe", email: "john@example.com" }],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      mockSettlements();

      renderWithProviders(<GroupDetailPage />);

      const user = userEvent.setup();

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: "Settlements" }),
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("tab", { name: "Settlements" }));

      const settlementsPanel = screen.getByRole("tabpanel");

      await waitFor(() => {
        expect(
          within(settlementsPanel).getByText(/No settlements yet/i),
        ).toBeInTheDocument();
      });
    });

    it("renders settlements from the API", async () => {
      const mockGroup = {
        ...baseGroup,
        members: [
          { user_id: 1, name: "John Doe", email: "john@example.com" },
          { user_id: 2, name: "Jane Smith", email: "jane@example.com" },
          { user_id: 3, name: "Eli Kay", email: "eli@example.com" },
        ],
      };

      vi.mocked(GroupsService.groupsApi.getGroup).mockResolvedValue(mockGroup);
      vi.mocked(
        ExpensesService.expensesApi.listAllGroupExpenses,
      ).mockResolvedValue({
        items: [],
        total: 0,
        offset: 0,
        limit: 20,
      });
      const settlementMine = {
        id: 1,
        group_id: 1,
        debtor_id: 1,
        creditor_id: 2,
        amount: 12.5,
        created_at: "2026-01-10T09:00:00Z",
      };
      const settlementOther = {
        id: 2,
        group_id: 1,
        debtor_id: 3,
        creditor_id: 2,
        amount: 7.25,
        created_at: "2026-01-12T11:00:00Z",
      };

      mockSettlements([settlementMine, settlementOther], 2);

      renderWithProviders(<GroupDetailPage />);

      await waitFor(() => {
        expect(
          screen.getByRole("tab", { name: "Settlements" }),
        ).toBeInTheDocument();
      });

      const user = userEvent.setup();
      await user.click(screen.getByRole("tab", { name: "Settlements" }));

      const settlementsPanel = screen.getByRole("tabpanel");

      await waitFor(() => {
        expect(
          within(settlementsPanel).getByText(/John Doe paid Jane Smith/i),
        ).toBeInTheDocument();
        expect(
          within(settlementsPanel).getByText(/Eli Kay paid Jane Smith/i),
        ).toBeInTheDocument();
      });
    });
  });
});
