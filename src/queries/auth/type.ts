import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  phoneNumber: z.string(),
  name: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LoginRequestSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^\d{8}$/, 'Phone number must be exactly 8 digits'),
  pin: z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    user: UserSchema,
    token: z.string(),
  }),
});

export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
