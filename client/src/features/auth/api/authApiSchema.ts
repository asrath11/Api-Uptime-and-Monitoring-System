import { z } from "zod";
import type { loginSchema, signupSchema } from "../schemas/authSchemas";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export const authResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  user: userSchema,
});

export const errorResponseSchema = z.object({
  message: z.string().optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

export type AuthUser = z.infer<typeof userSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type SignupCredentials = z.infer<typeof signupSchema>;
