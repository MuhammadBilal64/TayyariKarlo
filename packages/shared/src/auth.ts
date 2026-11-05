import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Password is too long'),
  name: z.string().min(1, 'Enter your name').max(100),
  rolePreference: z.string().max(100).optional(),
  experienceLevel: z.string().max(100).optional(),
  technologyInterests: z.array(z.string().max(50)).max(20).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  rolePreference: z.string().nullable().optional(),
  experienceLevel: z.string().nullable().optional(),
  technologyInterests: z.array(z.string()).optional(),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const authTokensResponseSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});
export type AuthTokensResponse = z.infer<typeof authTokensResponseSchema>;
