import { z } from "zod";

export const UserSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  email: z.email(),
});

export const UserCreateSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
});

export const UserUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
});

export const TokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
});

export type User = z.infer<typeof UserSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type Token = z.infer<typeof TokenSchema>;
