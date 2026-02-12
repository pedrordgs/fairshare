import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { groupsApi } from "./groups";
import api from "./api";

// Mock the api module
vi.mock("./api", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("Groups Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("groupsApi.createGroup", () => {
    it("sends POST request to /groups/ with group data", async () => {
      const mockResponse = {
        data: {
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
        },
      };
      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const groupData = { name: "Test Group" };
      const result = await groupsApi.createGroup(groupData);

      expect(api.post).toHaveBeenCalledWith("/groups/", groupData);
      expect(result).toEqual(mockResponse.data);
    });

    it("validates response data against schema", async () => {
      const validResponse = {
        data: {
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
        },
      };
      vi.mocked(api.post).mockResolvedValue(validResponse);

      const result = await groupsApi.createGroup({ name: "Test Group" });

      expect(result).toEqual(validResponse.data);
    });

    it("throws error when response data is invalid", async () => {
      const invalidResponse = {
        data: {
          id: -1, // Invalid: should be positive
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
        },
      };
      vi.mocked(api.post).mockResolvedValue(invalidResponse);

      await expect(
        groupsApi.createGroup({ name: "Test Group" }),
      ).rejects.toThrow();
    });

    it("throws error when required fields are missing", async () => {
      const incompleteResponse = {
        data: {
          id: 1,
          // Missing name and created_by
        },
      };
      vi.mocked(api.post).mockResolvedValue(incompleteResponse);

      await expect(
        groupsApi.createGroup({ name: "Test Group" }),
      ).rejects.toThrow();
    });

    it("throws error on API failure", async () => {
      const apiError = new Error("Network Error");
      vi.mocked(api.post).mockRejectedValue(apiError);

      await expect(
        groupsApi.createGroup({ name: "Test Group" }),
      ).rejects.toThrow("Network Error");
    });
  });

  describe("groupsApi.getGroup", () => {
    const validGroupDetail = {
      id: 1,
      name: "Test Group",
      created_by: 1,
      invite_code: "ABCD1234EF",
      members: [
        {
          user_id: 1,
          name: "John Doe",
          email: "john@example.com",
        },
      ],
      created_at: "2026-01-05T10:30:00Z",
      expense_count: 5,
      owed_by_user_total: 5.5,
      owed_to_user_total: 31,
      owed_by_user: [{ user_id: 2, amount: 5.5 }],
      owed_to_user: [{ user_id: 3, amount: 31 }],
      last_activity_at: "2026-01-05T14:20:00Z",
    };

    it("sends GET request to /groups/${groupId}", async () => {
      const mockResponse = { data: validGroupDetail };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await groupsApi.getGroup(1);

      expect(api.get).toHaveBeenCalledWith("/groups/1");
      expect(result).toEqual(mockResponse.data);
    });

    it("validates response data against ExpenseGroupDetailSchema", async () => {
      const validResponse = { data: validGroupDetail };
      vi.mocked(api.get).mockResolvedValue(validResponse);

      const result = await groupsApi.getGroup(1);

      expect(result).toEqual(validResponse.data);
    });

    it("throws error when groupId is not a positive integer", async () => {
      await expect(groupsApi.getGroup(0)).rejects.toThrow("Invalid group ID");
      await expect(groupsApi.getGroup(-1)).rejects.toThrow("Invalid group ID");
      await expect(groupsApi.getGroup(1.5)).rejects.toThrow("Invalid group ID");
      await expect(groupsApi.getGroup(NaN)).rejects.toThrow("Invalid group ID");
    });

    it("throws error when response data is invalid", async () => {
      const invalidResponse = {
        data: {
          id: 1,
          name: "Test Group",
          created_by: 1,
          invite_code: "ABCD1234EF",
          members: [
            {
              user_id: -1, // Invalid: should be positive
              name: "John Doe",
              email: "john@example.com",
            },
          ],
          created_at: "2026-01-05T10:30:00Z",
          expense_count: 5,
          owed_by_user_total: "25.5",
          owed_to_user_total: 0,
          owed_by_user: [],
          owed_to_user: [],
          last_activity_at: "2026-01-05T14:20:00Z",
        },
      };
      vi.mocked(api.get).mockResolvedValue(invalidResponse);

      await expect(groupsApi.getGroup(1)).rejects.toThrow();
    });

    it("throws error when members field is missing", async () => {
      const incompleteResponse = {
        data: {
          id: 1,
          name: "Test Group",
          created_by: 1,
          invite_code: "ABCD1234EF",
          created_at: "2026-01-05T10:30:00Z",
          expense_count: 5,
          owed_by_user_total: "25.5",
          owed_to_user_total: 0,
          owed_by_user: [],
          owed_to_user: [],
          last_activity_at: "2026-01-05T14:20:00Z",
          // Missing members array
        },
      };
      vi.mocked(api.get).mockResolvedValue(incompleteResponse);

      await expect(groupsApi.getGroup(1)).rejects.toThrow();
    });

    it("throws error on 404 response", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            detail: "Group not found",
          },
        },
      };
      vi.mocked(api.get).mockRejectedValue(notFoundError);

      await expect(groupsApi.getGroup(999)).rejects.toEqual(notFoundError);
    });

    it("throws error on 403 response", async () => {
      const forbiddenError = {
        response: {
          status: 403,
          data: {
            detail: "Access denied",
          },
        },
      };
      vi.mocked(api.get).mockRejectedValue(forbiddenError);

      await expect(groupsApi.getGroup(1)).rejects.toEqual(forbiddenError);
    });

    it("throws error on network failure", async () => {
      const networkError = new Error("Network Error");
      vi.mocked(api.get).mockRejectedValue(networkError);

      await expect(groupsApi.getGroup(1)).rejects.toThrow("Network Error");
    });

    it("handles empty members array", async () => {
      const responseWithNoMembers = {
        data: {
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
        },
      };
      vi.mocked(api.get).mockResolvedValue(responseWithNoMembers);

      const result = await groupsApi.getGroup(1);

      expect(result.members).toEqual([]);
    });
  });

  describe("groupsApi.getUserGroups", () => {
    it("returns list items with totals", async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: 1,
              name: "Trip",
              created_by: 1,
              invite_code: "ABC123",
              created_at: "2026-01-05T10:30:00Z",
              expense_count: 2,
              owed_by_user_total: 10,
              owed_to_user_total: 5,
              last_activity_at: null,
            },
          ],
          total: 1,
          offset: 0,
          limit: 12,
        },
      };
      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await groupsApi.getUserGroups();

      expect(result.items[0]).toEqual(mockResponse.data.items[0]);
    });

    it("ignores detail fields on list items", async () => {
      const responseWithExtras = {
        data: {
          items: [
            {
              id: 1,
              name: "Trip",
              created_by: 1,
              invite_code: "ABC123",
              created_at: "2026-01-05T10:30:00Z",
              expense_count: 2,
              owed_by_user_total: 10,
              owed_to_user_total: 5,
              owed_by_user: [],
              owed_to_user: [],
              last_activity_at: null,
            },
          ],
          total: 1,
          offset: 0,
          limit: 12,
        },
      };
      vi.mocked(api.get).mockResolvedValue(responseWithExtras);

      const result = await groupsApi.getUserGroups();

      expect(result.items[0]).toEqual({
        id: 1,
        name: "Trip",
        created_by: 1,
        invite_code: "ABC123",
        created_at: "2026-01-05T10:30:00Z",
        expense_count: 2,
        owed_by_user_total: 10,
        owed_to_user_total: 5,
        last_activity_at: null,
      });
    });
  });

  describe("groupsApi.joinGroup", () => {
    const validGroupDetail = {
      id: 1,
      name: "Joined Group",
      created_by: 2,
      invite_code: "JOIN1234AB",
      members: [
        {
          user_id: 2,
          name: "Owner",
          email: "owner@example.com",
        },
        {
          user_id: 1,
          name: "Member",
          email: "member@example.com",
        },
      ],
      created_at: "2026-01-05T10:30:00Z",
      expense_count: 0,
      owed_by_user_total: 0,
      owed_to_user_total: 0,
      owed_by_user: [],
      owed_to_user: [],
      last_activity_at: null,
    };

    it("sends POST request to /groups/join with code", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: validGroupDetail });
      const result = await groupsApi.joinGroup("JOIN1234AB");

      expect(api.post).toHaveBeenCalledWith("/groups/join", {
        code: "JOIN1234AB",
      });
      expect(result).toEqual(validGroupDetail);
    });

    it("validates response data against schema", async () => {
      vi.mocked(api.post).mockResolvedValue({ data: validGroupDetail });
      const result = await groupsApi.joinGroup("JOIN1234AB");
      expect(result).toEqual(validGroupDetail);
    });

    it("throws error for invalid response", async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: {
          id: 1,
          name: "Joined Group",
          created_by: 2,
          members: [],
        },
      });

      await expect(groupsApi.joinGroup("JOIN1234AB")).rejects.toThrow();
    });
  });
});
