import api from "./api";
import {
  GroupSettlementCreateSchema,
  GroupSettlementListItemSchema,
  GroupSettlementUpdateSchema,
  type GroupSettlementCreate,
  type GroupSettlementUpdate,
  PaginatedGroupSettlementsSchema,
  type PaginatedGroupSettlements,
  type GroupSettlementListItem,
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

const validateSettlementId = (settlementId: number): void => {
  if (
    !Number.isFinite(settlementId) ||
    !Number.isInteger(settlementId) ||
    settlementId <= 0
  ) {
    throw new Error(
      `Invalid settlement ID: ${settlementId}. Must be a positive integer.`,
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

  updateSettlement: async (
    groupId: number,
    settlementId: number,
    data: GroupSettlementUpdate,
  ): Promise<GroupSettlementListItem> => {
    validateGroupId(groupId);
    validateSettlementId(settlementId);
    const payload = GroupSettlementUpdateSchema.parse(data);
    const response = await api.patch(
      `/groups/${groupId}/settlements/${settlementId}/`,
      payload,
    );
    return GroupSettlementListItemSchema.parse(response.data);
  },

  deleteSettlement: async (
    groupId: number,
    settlementId: number,
  ): Promise<void> => {
    validateGroupId(groupId);
    validateSettlementId(settlementId);
    await api.delete(`/groups/${groupId}/settlements/${settlementId}/`);
  },
};
