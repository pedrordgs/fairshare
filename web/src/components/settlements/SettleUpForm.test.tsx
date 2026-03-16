import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettleUpForm } from "./SettleUpForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SettlementsService from "@services/settlements";
import { toast } from "sonner";

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

  describe("Rendering", () => {
    it("renders the creditor selector and amount field", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
        />,
      );

      expect(screen.getByLabelText(/settle with/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /record payment/i }),
      ).toBeInTheDocument();
    });

    it("does not render a 'Record on behalf of' selector", () => {
      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
        />,
      );

      expect(
        screen.queryByLabelText(/record on behalf of/i),
      ).not.toBeInTheDocument();
    });

    it("shows each owed-to member with owed amount in the creditor dropdown", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <SettleUpForm
          groupId={1}
          owedByUser={owedByUser}
          membersById={membersById}
        />,
      );

      const creditorSelect = screen.getByLabelText(/settle with/i);
      await user.click(creditorSelect);

      const option = await screen.findByRole("option", {
        name: /Bob · Owe/i,
      });
      expect(option).toBeInTheDocument();
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
    it("submits with creditor_id and amount — no debtor_id", async () => {
      const mockGroupDetail = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        invite_code: "ABCD1234EF",
        members: [],
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

    it("calls onSuccess callback after successful submission", async () => {
      const mockGroupDetail = {
        id: 1,
        name: "Test Group",
        created_by: 1,
        invite_code: "ABCD1234EF",
        members: [],
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
