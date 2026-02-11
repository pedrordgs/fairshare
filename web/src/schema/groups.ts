import { z } from "zod";

export const ExpenseGroupSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1).max(100),
  created_by: z.number().positive(),
  invite_code: z.string().min(1),
});

export const ExpenseGroupCreateSchema = z.object({
  name: z.string().min(1),
});

export const ExpenseGroupUpdateSchema = z.object({
  name: z.string().min(1).optional(),
});

export const ExpenseGroupMemberSchema = z.object({
  user_id: z.number().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export const ExpenseGroupDebtItemSchema = z.object({
  user_id: z.number().positive(),
  amount: z.number(),
});

export const ExpenseGroupListItemSchema = ExpenseGroupSchema.extend({
  created_at: z.iso.datetime({ local: true }),
  expense_count: z.number().nonnegative(),
  owed_by_user_total: z.number(),
  owed_to_user_total: z.number(),
  last_activity_at: z.iso.datetime({ local: true }).nullable(),
});

export const ExpenseGroupDetailSchema = ExpenseGroupSchema.extend({
  members: z.array(ExpenseGroupMemberSchema),
  created_at: z.iso.datetime({ local: true }),
  expense_count: z.number().nonnegative(),
  owed_by_user_total: z.number(),
  owed_to_user_total: z.number(),
  owed_by_user: z.array(ExpenseGroupDebtItemSchema),
  owed_to_user: z.array(ExpenseGroupDebtItemSchema),
  last_activity_at: z.iso.datetime({ local: true }).nullable(),
});

export const PaginatedGroupsResponseSchema = z.object({
  items: z.array(ExpenseGroupListItemSchema),
  total: z.number().nonnegative(),
  offset: z.number().nonnegative(),
  limit: z.number().positive(),
});

export const JoinGroupRequestSchema = z.object({
  code: z.string().trim().min(1),
});

export type ExpenseGroup = z.infer<typeof ExpenseGroupSchema>;
export type ExpenseGroupCreate = z.infer<typeof ExpenseGroupCreateSchema>;
export type ExpenseGroupUpdate = z.infer<typeof ExpenseGroupUpdateSchema>;
export type ExpenseGroupMember = z.infer<typeof ExpenseGroupMemberSchema>;
export type ExpenseGroupDebtItem = z.infer<typeof ExpenseGroupDebtItemSchema>;
export type ExpenseGroupListItem = z.infer<typeof ExpenseGroupListItemSchema>;
export type ExpenseGroupDetail = z.infer<typeof ExpenseGroupDetailSchema>;
export type PaginatedGroupsResponse = z.infer<
  typeof PaginatedGroupsResponseSchema
>;
export type JoinGroupRequest = z.infer<typeof JoinGroupRequestSchema>;
