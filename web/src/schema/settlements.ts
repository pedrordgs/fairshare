import { z } from "zod";

const SettlementAmountInputSchema = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with up to 2 decimals")
  .refine((value) => Number(value) > 0, "Amount must be greater than 0");

export const GroupSettlementCreateInputSchema = z.object({
  creditor_id: z.number().int().positive(),
  amount: SettlementAmountInputSchema,
});

export const GroupSettlementCreateSchema = z.object({
  creditor_id: z.number().int().positive(),
  amount: z.preprocess((value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  }, z.number().positive()),
});

export const GroupSettlementListItemSchema = z.object({
  id: z.number().positive(),
  group_id: z.number().positive(),
  created_by: z.number().positive(),
  debtor_id: z.number().positive(),
  creditor_id: z.number().positive(),
  amount: z.number().positive().finite(),
  created_at: z.iso.datetime({ local: true }),
});

export const PaginatedGroupSettlementsSchema = z.object({
  items: z.array(GroupSettlementListItemSchema),
  total: z.number().nonnegative(),
  offset: z.number().nonnegative(),
  limit: z.number().positive(),
});

export type GroupSettlementCreateInput = z.infer<
  typeof GroupSettlementCreateInputSchema
>;

export type GroupSettlementCreate = z.infer<typeof GroupSettlementCreateSchema>;
export type GroupSettlementListItem = z.infer<
  typeof GroupSettlementListItemSchema
>;
export type PaginatedGroupSettlements = z.infer<
  typeof PaginatedGroupSettlementsSchema
>;
