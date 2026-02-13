import api from "./api";
import {
  GroupSettlementCreateSchema,
  type GroupSettlementCreate,
  PaginatedGroupSettlementsSchema,
  type PaginatedGroupSettlements,
} from "@schema/settlements";
import { ExpenseGroupDetailSchema } from "@schema/groups";
import type { ExpenseGroupDetail } from "@schema/groups";

const validateGroupId = (groupId: number): void => {
  if (!Number.isFinite(groupId) || !Number.isInteger(groupId) || groupId <= 0) {
    throw new Error(
      `Invalid group ID: ${groupId}. Must be a positive integer.`,
    );
  }
};

export const settlementsApi = {
  createGroupSettlement: async (
    groupId: number,
    data: GroupSettlementCreate,
  ): Promise<ExpenseGroupDetail> => {
    validateGroupId(groupId);
    const payload = GroupSettlementCreateSchema.parse(data);
    const response = await api.post(`/groups/${groupId}/settlements/`, payload);
    return ExpenseGroupDetailSchema.parse(response.data);
  },
  listGroupSettlements: async (
    groupId: number,
    params: { offset?: number; limit?: number } = {},
  ): Promise<PaginatedGroupSettlements> => {
    validateGroupId(groupId);
    const { offset = 0, limit = 10 } = params;
    const response = await api.get(`/groups/${groupId}/settlements/`, {
      params: { offset, limit },
    });
    return PaginatedGroupSettlementsSchema.parse(response.data);
  },
};
