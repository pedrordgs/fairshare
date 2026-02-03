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
});

export const AddMemberRequestSchema = z.object({
  user_id: z.number(),
});

export type ExpenseGroup = z.infer<typeof ExpenseGroupSchema>;
export type ExpenseGroupCreate = z.infer<typeof ExpenseGroupCreateSchema>;
export type ExpenseGroupUpdate = z.infer<typeof ExpenseGroupUpdateSchema>;
export type ExpenseGroupMember = z.infer<typeof ExpenseGroupMemberSchema>;
export type ExpenseGroupDetail = z.infer<typeof ExpenseGroupDetailSchema>;
export type AddMemberRequest = z.infer<typeof AddMemberRequestSchema>;
