import api from "./api";
import { type ExpenseGroup, type ExpenseGroupCreate } from "@schema/groups";

export const groupsApi = {
  /**
   * Creates a new expense group.
   *
   * @param groupData - The group data containing the name
   * @returns Promise resolving to the created group
   */
  createGroup: async (groupData: ExpenseGroupCreate): Promise<ExpenseGroup> => {
    const response = await api.post("/groups/", groupData);
    return response.data;
  },
};
