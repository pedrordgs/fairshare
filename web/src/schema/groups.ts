import { z } from "zod";

export const ExpenseGroupSchema = z.object({
  id: z.number().positive(),
  name: z.string().min(1).max(100),
  created_by: z.number().positive(),
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

export const ExpenseGroupDetailSchema = ExpenseGroupSchema.extend({
  members: z.array(ExpenseGroupMemberSchema),
  created_at: z.string().datetime(),
  expense_count: z.number().nonnegative(),
  user_balance: z.number(),
  last_activity_at: z.string().datetime().nullable(),
});

export const PaginatedGroupsResponseSchema = z.object({
  items: z.array(ExpenseGroupDetailSchema),
  total: z.number().nonnegative(),
  offset: z.number().nonnegative(),
  limit: z.number().positive(),
});

export const AddMemberRequestSchema = z.object({
  user_id: z.number(),
});

export type ExpenseGroup = z.infer<typeof ExpenseGroupSchema>;
export type ExpenseGroupCreate = z.infer<typeof ExpenseGroupCreateSchema>;
export type ExpenseGroupUpdate = z.infer<typeof ExpenseGroupUpdateSchema>;
export type ExpenseGroupMember = z.infer<typeof ExpenseGroupMemberSchema>;
export type ExpenseGroupDetail = z.infer<typeof ExpenseGroupDetailSchema>;
export type PaginatedGroupsResponse = z.infer<
  typeof PaginatedGroupsResponseSchema
>;
export type AddMemberRequest = z.infer<typeof AddMemberRequestSchema>;
