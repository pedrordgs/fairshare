import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettleUpForm } from "./SettleUpForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SettlementsService from "@services/settlements";
import { toast } from "sonner";
import type { ExpenseGroupMemberPublic } from "@schema/groups";

// Mock the settlements service
vi.mock("@services/settlements", () => ({
  settlementsApi: {
    createGroupSettlement: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const defaultMembers: ExpenseGroupMemberPublic[] = [
  { user_id: 1, name: "Alice", email: "alice@example.com", is_admin: true },
  { user_id: 2, name: "Bob", email: "bob@example.com", is_admin: false },
  { user_id: 3, name: "Carol", email: "carol@example.com", is_admin: false },
];

const membersById = new Map([
  [1, "Alice"],
  [2, "Bob"],
  [3, "Carol"],
]);

// Alice owes Bob $50
const owedByUser = [{ user_id: 2, amount: 50 }];

describe("SettleUpForm", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  describe("Non-admin rendering", () => {
    it("renders the creditor selector and amount field", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={false}
        />,
      );

      expect(screen.getByLabelText(/settle with/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /record payment/i }),
      ).toBeInTheDocument();
    });

    it("does not show debtor selector when isAdmin is false", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={false}
          members={defaultMembers}
          currentUserId={1}
        />,
      );

      expect(
        screen.queryByLabelText(/record on behalf of/i),
      ).not.toBeInTheDocument();
    });

    it("does not show debtor selector when isAdmin is not provided", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          members={defaultMembers}
          currentUserId={1}
        />,
      );

      expect(
        screen.queryByLabelText(/record on behalf of/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Admin rendering", () => {
    it("shows debtor selector when isAdmin is true and members are provided", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={true}
          members={defaultMembers}
          currentUserId={1}
        />,
      );

      expect(screen.getByLabelText(/record on behalf of/i)).toBeInTheDocument();
    });

    it("debtor selector excludes the currently selected creditor", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={true}
          members={defaultMembers}
          currentUserId={1}
        />,
      );

      const debtorSelect = screen.getByLabelText(/record on behalf of/i);
      const options = Array.from(debtorSelect.querySelectorAll("option")).map(
        (o) => o.textContent,
      );

      // Bob (user_id=2) is the creditor (from owedByUser), so Bob should not be in debtor options
      expect(options).not.toContain("Bob");
      // Alice and Carol should be available
      expect(options.some((o) => o?.includes("Alice"))).toBe(true);
      expect(options.some((o) => o?.includes("Carol"))).toBe(true);
    });

    it("debtor selector defaults to 'Yourself' blank option", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={true}
          members={defaultMembers}
          currentUserId={1}
        />,
      );

      const debtorSelect = screen.getByLabelText(/record on behalf of/i);
      // Default value should be blank (self)
      expect((debtorSelect as HTMLSelectElement).value).toBe("");
    });

    it("submits without debtor_id when debtor selector is left blank", async () => {
      const mockGroupDetail = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        invite_code: "ABCD1234EF",
        members: defaultMembers,
        is_admin: false,
        created_at: "2026-01-05T10:30:00Z",
        expense_count: 0,
        owed_by_user_total: 0,
        owed_to_user_total: 0,
        owed_by_user: [],
        owed_to_user: [],
        group_transfers: [],
        last_activity_at: null,
      };
      vi.mocked(
        SettlementsService.settlementsApi.createGroupSettlement,
      ).mockResolvedValue(mockGroupDetail);

      const user = userEvent.setup();

      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={true}
          members={defaultMembers}
          currentUserId={1}
        />,
      );

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "20");

      await user.click(screen.getByRole("button", { name: /record payment/i }));

      await waitFor(() => {
        expect(
          SettlementsService.settlementsApi.createGroupSettlement,
        ).toHaveBeenCalledWith(1, {
          creditor_id: 2,
          amount: 20,
        });
      });
    });

    it("includes debtor_id in payload when a debtor is selected", async () => {
      const mockGroupDetail = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        invite_code: "ABCD1234EF",
        members: defaultMembers,
        is_admin: false,
        created_at: "2026-01-05T10:30:00Z",
        expense_count: 0,
        owed_by_user_total: 0,
        owed_to_user_total: 0,
        owed_by_user: [],
        owed_to_user: [],
        group_transfers: [],
        last_activity_at: null,
      };
      vi.mocked(
        SettlementsService.settlementsApi.createGroupSettlement,
      ).mockResolvedValue(mockGroupDetail);

      const user = userEvent.setup();

      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={true}
          members={defaultMembers}
          currentUserId={1}
        />,
      );

      // Select Carol (user_id=3) as the debtor
      const debtorSelect = screen.getByLabelText(/record on behalf of/i);
      await user.selectOptions(debtorSelect, "3");

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "25");

      await user.click(screen.getByRole("button", { name: /record payment/i }));

      await waitFor(() => {
        expect(
          SettlementsService.settlementsApi.createGroupSettlement,
        ).toHaveBeenCalledWith(1, {
          creditor_id: 2,
          amount: 25,
          debtor_id: 3,
        });
      });
    });

    it("does not show debtor selector when members list is empty", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          isAdmin={true}
          members={[]}
          currentUserId={1}
        />,
      );

      expect(
        screen.queryByLabelText(/record on behalf of/i),
      ).not.toBeInTheDocument();
    });
  });

  describe("Amount validation", () => {
    it("shows error when amount exceeds outstanding debt", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
        />,
      );

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "999");

      await user.click(screen.getByRole("button", { name: /record payment/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/amount exceeds outstanding debt/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Successful submission", () => {
    it("calls onSuccess callback after successful submission", async () => {
      const mockGroupDetail = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        invite_code: "ABCD1234EF",
        members: defaultMembers,
        is_admin: false,
        created_at: "2026-01-05T10:30:00Z",
        expense_count: 0,
        owed_by_user_total: 0,
        owed_to_user_total: 0,
        owed_by_user: [],
        owed_to_user: [],
        group_transfers: [],
        last_activity_at: null,
      };
      vi.mocked(
        SettlementsService.settlementsApi.createGroupSettlement,
      ).mockResolvedValue(mockGroupDetail);

      const onSuccess = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
          onSuccess={onSuccess}
        />,
      );

      const amountInput = screen.getByLabelText(/amount/i);
      await user.type(amountInput, "10");

      await user.click(screen.getByRole("button", { name: /record payment/i }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalledWith("Settlement recorded");
      });
    });
  });
});
