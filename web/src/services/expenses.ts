import api from "./api";
import {
  ExpenseCreateSchema,
  ExpenseListSchema,
  ExpenseSchema,
  type Expense,
  type ExpenseCreate,
  type ExpenseList,
} from "@schema/expenses";

const validateGroupId = (groupId: number): void => {
  if (!Number.isFinite(groupId) || !Number.isInteger(groupId) || groupId <= 0) {
    throw new Error(
      `Invalid group ID: ${groupId}. Must be a positive integer.`,
    );
  }
};

export interface GetGroupExpensesParams {
  offset?: number;
  limit?: number;
}

export const expensesApi = {
  createGroupExpense: async (
    groupId: number,
    data: ExpenseCreate,
  ): Promise<Expense> => {
    validateGroupId(groupId);
    const payload = ExpenseCreateSchema.parse(data);
    const response = await api.post(`/groups/${groupId}/expenses`, payload);
    return ExpenseSchema.parse(response.data);
  },

  listGroupExpenses: async (
    groupId: number,
    params: GetGroupExpensesParams = {},
  ): Promise<ExpenseList> => {
    validateGroupId(groupId);
    const { offset = 0, limit = 20 } = params;
    const response = await api.get(`/groups/${groupId}/expenses`, {
      params: { offset, limit },
    });
    return ExpenseListSchema.parse(response.data);
  },

  listAllGroupExpenses: async (groupId: number): Promise<ExpenseList> => {
    validateGroupId(groupId);
    const firstPage = await expensesApi.listGroupExpenses(groupId, {
      offset: 0,
      limit: 100,
    });
    if (firstPage.total <= firstPage.items.length) {
      return firstPage;
    }

    const remainingOffsets = [] as number[];
    for (
      let offset = firstPage.items.length;
      offset < firstPage.total;
      offset += 100
    ) {
      remainingOffsets.push(offset);
    }

    const remainingPages = await Promise.all(
      remainingOffsets.map((offset) =>
        expensesApi.listGroupExpenses(groupId, { offset, limit: 100 }),
      ),
    );

    const items = [
      ...firstPage.items,
      ...remainingPages.flatMap((page) => page.items),
    ];

    return {
      items,
      total: firstPage.total,
      offset: 0,
      limit: items.length,
    };
  },
};
