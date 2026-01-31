import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateGroupForm } from "./CreateGroupForm";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as GroupsService from "@services/groups";
import { toast } from "sonner";

// Mock the groups service
vi.mock("@services/groups", () => ({
  groupsApi: {
    createGroup: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe("CreateGroupForm", () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    );
  };

  describe("Rendering", () => {
    it("renders form with group name input", () => {
      renderWithProviders(<CreateGroupForm />);

      expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create group/i }),
      ).toBeInTheDocument();
    });

    it("renders with correct placeholder", () => {
      renderWithProviders(<CreateGroupForm />);

      expect(
        screen.getByPlaceholderText(/weekend trip, apartment bills/i),
      ).toBeInTheDocument();
    });

    it("renders with autoFocus on input", () => {
      renderWithProviders(<CreateGroupForm />);

      expect(screen.getByLabelText(/group name/i)).toHaveFocus();
    });
  });

  describe("Form Validation", () => {
    it("shows validation error for empty group name", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      // Type and clear to trigger validation
      await user.type(nameInput, "a");
      await user.clear(nameInput);
      await user.click(submitButton);

      await waitFor(() => {
        // Check that an error is displayed (Zod validation error)
        const errorElement = screen.getByRole("alert");
        expect(errorElement).toBeInTheDocument();
      });
    });

    it("prevents submission with invalid data", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateGroupForm />);

      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(GroupsService.groupsApi.createGroup).not.toHaveBeenCalled();
      });
    });
  });

  describe("Successful Creation", () => {
    it("calls createGroup API with correct data", async () => {
      const user = userEvent.setup();
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
      };

      vi.mocked(GroupsService.groupsApi.createGroup).mockResolvedValue(
        mockGroup,
      );

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(GroupsService.groupsApi.createGroup).toHaveBeenCalledWith({
          name: "Test Group",
        });
      });
    });

    it("shows success toast notification", async () => {
      const user = userEvent.setup();
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
      };

      vi.mocked(GroupsService.groupsApi.createGroup).mockResolvedValue(
        mockGroup,
      );

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Group created successfully!",
        );
      });
    });

    it("calls onSuccess callback with created group", async () => {
      const user = userEvent.setup();
      const onSuccessMock = vi.fn();
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
      };

      vi.mocked(GroupsService.groupsApi.createGroup).mockResolvedValue(
        mockGroup,
      );

      renderWithProviders(<CreateGroupForm onSuccess={onSuccessMock} />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccessMock).toHaveBeenCalledWith(mockGroup);
      });
    });

    it("clears previous errors before submission", async () => {
      const user = userEvent.setup();
      const mockGroup = {
        id: 1,
        name: "Test Group",
        created_by: 1,
      };

      // First fail, then succeed
      vi.mocked(GroupsService.groupsApi.createGroup)
        .mockRejectedValueOnce({
          response: {
            data: {
              detail: "An error occurred",
            },
          },
        })
        .mockResolvedValueOnce(mockGroup);

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      // First submission - fail
      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument();
      });

      // Second submission - succeed
      await user.clear(nameInput);
      await user.type(nameInput, "Another Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Group created successfully!",
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("displays general error message on API failure", async () => {
      const user = userEvent.setup();

      const apiError = {
        response: {
          data: {
            detail: "Failed to create group",
          },
        },
      };

      vi.mocked(GroupsService.groupsApi.createGroup).mockRejectedValue(
        apiError,
      );

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create group/i)).toBeInTheDocument();
      });
    });

    it("displays field-level validation errors from API", async () => {
      const user = userEvent.setup();

      const validationError = {
        response: {
          data: {
            detail: [
              {
                type: "value_error",
                loc: ["body", "name"],
                msg: "Group name already exists",
                input: "Existing Group",
              },
            ],
          },
        },
      };

      vi.mocked(GroupsService.groupsApi.createGroup).mockRejectedValue(
        validationError,
      );

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Existing Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/group name already exists/i),
        ).toBeInTheDocument();
      });
    });

    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();

      vi.mocked(GroupsService.groupsApi.createGroup).mockRejectedValue(
        new Error("Network Error"),
      );

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      // Form should not crash and button should be re-enabled after error
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("shows loading state during submission", async () => {
      const user = userEvent.setup();

      vi.mocked(GroupsService.groupsApi.createGroup).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ id: 1, name: "Test", created_by: 1 }),
              100,
            ),
          ),
      );

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument();
      });
    });

    it("disables button during submission", async () => {
      const user = userEvent.setup();

      vi.mocked(GroupsService.groupsApi.createGroup).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ id: 1, name: "Test", created_by: 1 }),
              100,
            ),
          ),
      );

      renderWithProviders(<CreateGroupForm />);

      const nameInput = screen.getByLabelText(/group name/i);
      const submitButton = screen.getByRole("button", {
        name: /create group/i,
      });

      await user.type(nameInput, "Test Group");
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });
});
