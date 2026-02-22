import api from "./api";
import {
  type ExpenseGroupCreate,
  type ExpenseGroupDetail,
  type JoinGroupRequest,
  type JoinGroupRequestPublic,
  type PaginatedGroupsResponse,
  ExpenseGroupListItemSchema,
  ExpenseGroupDetailSchema,
  JoinGroupRequestSchema,
  JoinGroupRequestPublicSchema,
  PaginatedGroupsResponseSchema,
} from "@schema/groups";

/**
 * Validates that a group ID is a positive integer.
 */
const validateGroupId = (groupId: number): void => {
  if (!Number.isFinite(groupId) || !Number.isInteger(groupId) || groupId <= 0) {
    throw new Error(
      `Invalid group ID: ${groupId}. Must be a positive integer.`,
    );
  }
};

export interface GetUserGroupsParams {
  offset?: number;
  limit?: number;
}

export const groupsApi = {
  /**
   * Creates a new expense group.
   *
   * @param groupData - The group data containing the name
   * @returns Promise resolving to the created group
   */
  createGroup: async (
    groupData: ExpenseGroupCreate,
  ): Promise<ExpenseGroupDetail> => {
    const response = await api.post("/groups/", groupData);
    // Runtime validation with Zod schema
    return ExpenseGroupDetailSchema.parse(response.data);
  },

  /**
   * Fetches a single expense group with its members.
   *
   * @param groupId - The ID of the group to fetch (must be positive integer)
   * @returns Promise resolving to the group detail with members
   * @throws Error if groupId is invalid
   */
  getGroup: async (groupId: number): Promise<ExpenseGroupDetail> => {
    validateGroupId(groupId);
    const response = await api.get(`/groups/${groupId}/`);
    // Runtime validation with Zod schema
    return ExpenseGroupDetailSchema.parse(response.data);
  },

  /**
   * Fetches paginated list of groups where the authenticated user is a member.
   *
   * @param params - Pagination parameters (offset and limit)
   * @returns Promise resolving to paginated groups response
   */
  getUserGroups: async (
    params: GetUserGroupsParams = {},
  ): Promise<PaginatedGroupsResponse> => {
    const { offset = 0, limit = 12 } = params;
    const response = await api.get("/groups/", {
      params: { offset, limit },
    });
    // Runtime validation with Zod schema
    PaginatedGroupsResponseSchema.parse(response.data);
    return {
      ...response.data,
      items: response.data.items.map((item: unknown) =>
        ExpenseGroupListItemSchema.parse(item),
      ),
    } as PaginatedGroupsResponse;
  },

  /**
   * Requests to join an expense group using an invite code.
   *
   * @param code - The invite code provided by the group owner
   * @returns Promise resolving to the join request details
   */
  joinGroup: async (code: string): Promise<JoinGroupRequestPublic> => {
    const payload: JoinGroupRequest = JoinGroupRequestSchema.parse({ code });
    const response = await api.post("/groups/join/", payload);
    return JoinGroupRequestPublicSchema.parse(response.data);
  },

  /**
   * Lists pending join requests for a group (owner only).
   */
  listJoinRequests: async (
    groupId: number,
  ): Promise<JoinGroupRequestPublic[]> => {
    validateGroupId(groupId);
    const response = await api.get(`/groups/${groupId}/join-requests/`, {
      params: { status: "pending" },
    });
    return response.data.map((item: unknown) =>
      JoinGroupRequestPublicSchema.parse(item),
    ) as JoinGroupRequestPublic[];
  },

  /**
   * Accepts a join request (owner only).
   */
  acceptJoinRequest: async (
    groupId: number,
    requestId: number,
  ): Promise<JoinGroupRequestPublic> => {
    validateGroupId(groupId);
    const response = await api.post(
      `/groups/${groupId}/join-requests/${requestId}/accept/`,
    );
    return JoinGroupRequestPublicSchema.parse(response.data);
  },

  /**
   * Declines a join request (owner only).
   */
  declineJoinRequest: async (
    groupId: number,
    requestId: number,
  ): Promise<JoinGroupRequestPublic> => {
    validateGroupId(groupId);
    const response = await api.post(
      `/groups/${groupId}/join-requests/${requestId}/decline/`,
    );
    return JoinGroupRequestPublicSchema.parse(response.data);
  },
};
