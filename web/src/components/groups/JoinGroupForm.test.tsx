import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinGroupForm } from "./JoinGroupForm";
import { groupsApi } from "@services/groups";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { JoinGroupRequestPublic } from "@schema/groups";

vi.mock("@services/groups", () => ({
  groupsApi: {
    joinGroup: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("JoinGroupForm", () => {
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
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  it("submits invite code to join group", async () => {
    const user = userEvent.setup();
    vi.mocked(groupsApi.joinGroup).mockResolvedValue({
      id: 1,
      group_id: 2,
      status: "pending",
      created_at: "2026-01-05T10:30:00Z",
      requester: {
        user_id: 5,
        name: "Requester",
        email: "requester@example.com",
      },
    } as JoinGroupRequestPublic);

    renderWithProviders(<JoinGroupForm />);

    await user.type(screen.getByLabelText(/invite code/i), "join-1234ab");
    await user.click(screen.getByRole("button", { name: /join group/i }));

    await waitFor(() => {
      expect(groupsApi.joinGroup).toHaveBeenCalledWith("JOIN1234AB");
    });
  });

  it("calls onSuccess with joined group", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const joinRequest: JoinGroupRequestPublic = {
      id: 2,
      group_id: 3,
      status: "pending",
      created_at: "2026-01-05T10:30:00Z",
      requester: {
        user_id: 6,
        name: "Requester",
        email: "requester@example.com",
      },
    };
    vi.mocked(groupsApi.joinGroup).mockResolvedValue(joinRequest);

    renderWithProviders(<JoinGroupForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/invite code/i), "code123456");
    await user.click(screen.getByRole("button", { name: /join group/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(joinRequest);
    });
  });
});
