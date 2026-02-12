import { z } from "zod";

const ExpenseValueSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return Number(value);
  }
  return value;
}, z.number().positive());

const ExpenseValueInputSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with up to 2 decimals")
  .refine((value) => Number(value) > 0, "Amount must be greater than 0");

export const ExpenseSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  description: z.string().optional(),
  value: ExpenseValueSchema,
  group_id: z.number(),
  created_by: z.number(),
  created_at: z.iso.datetime({ local: true }),
  updated_at: z.iso.datetime({ local: true }),
});

export const ExpenseCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  value: ExpenseValueInputSchema,
});

export const ExpenseUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  value: ExpenseValueInputSchema.optional(),
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
