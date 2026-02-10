import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JoinGroupForm } from "./JoinGroupForm";
import { groupsApi } from "@services/groups";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits invite code to join group", async () => {
    const user = userEvent.setup();
    vi.mocked(groupsApi.joinGroup).mockResolvedValue({
      id: 1,
      name: "Joined Group",
      created_by: 2,
      invite_code: "JOIN1234AB",
      members: [],
      created_at: "2026-01-05T10:30:00Z",
      expense_count: 0,
      user_balance: 0,
      last_activity_at: null,
    });

    render(<JoinGroupForm />);

    await user.type(screen.getByLabelText(/invite code/i), "join-1234ab");
    await user.click(screen.getByRole("button", { name: /join group/i }));

    await waitFor(() => {
      expect(groupsApi.joinGroup).toHaveBeenCalledWith("JOIN1234AB");
    });
  });

  it("calls onSuccess with joined group", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const group = {
      id: 2,
      name: "Joined Group",
      created_by: 3,
      invite_code: "CODE123456",
      members: [],
      created_at: "2026-01-05T10:30:00Z",
      expense_count: 0,
      user_balance: 0,
      last_activity_at: null,
    };
    vi.mocked(groupsApi.joinGroup).mockResolvedValue(group);

    render(<JoinGroupForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/invite code/i), "code123456");
    await user.click(screen.getByRole("button", { name: /join group/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(group);
    });
  });
});
