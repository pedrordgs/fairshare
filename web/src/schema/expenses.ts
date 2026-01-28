import { z } from 'zod';

export const ExpenseSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.number().positive(),
  group_id: z.number(),
  created_by: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ExpenseCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.number().positive(),
});

export const ExpenseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  value: z.number().positive().optional(),
});

export const ExpenseListSchema = z.object({
  items: z.array(ExpenseSchema),
  total: z.number(),
  offset: z.number(),
  limit: z.number(),
});

export type Expense = z.infer<typeof ExpenseSchema>;
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;
export type ExpenseUpdate = z.infer<typeof ExpenseUpdateSchema>;
export type ExpenseList = z.infer<typeof ExpenseListSchema>;