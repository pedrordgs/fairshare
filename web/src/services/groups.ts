import api from "./api";
import {
  type ExpenseGroup,
  type ExpenseGroupCreate,
  type ExpenseGroupDetail,
  ExpenseGroupSchema,
  ExpenseGroupDetailSchema,
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

export const groupsApi = {
  /**
   * Creates a new expense group.
   *
   * @param groupData - The group data containing the name
   * @returns Promise resolving to the created group
   */
  createGroup: async (groupData: ExpenseGroupCreate): Promise<ExpenseGroup> => {
    const response = await api.post("/groups/", groupData);
    // Runtime validation with Zod schema
    return ExpenseGroupSchema.parse(response.data);
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
    const response = await api.get(`/groups/${groupId}`);
    // Runtime validation with Zod schema
    return ExpenseGroupDetailSchema.parse(response.data);
  },
};
