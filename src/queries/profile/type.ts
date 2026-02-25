import { z } from 'zod';

// Profile data returned from GET /admin/profile
export const AdminProfileSchema = z.object({
    id: z.number(),
    phoneNumber: z.string(),
    name: z.string(),
    email: z.string().nullable().optional(),
    role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN']),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const AdminProfileResponseSchema = z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: AdminProfileSchema,
});

// Update profile request body
export const UpdateProfileRequestSchema = z.object({
    name: z.string().min(1, 'Нэр оруулна уу'),
    email: z.string().email('И-мэйл хаяг буруу байна').nullable().optional(),
    phoneNumber: z.string().regex(/^\d{8}$/, 'Утасны дугаар 8 оронтой байх ёстой').optional(),
});

// Change PIN request body
export const ChangePinRequestSchema = z.object({
    currentPin: z.string().regex(/^\d{4}$/, 'Одоогийн ПИН 4 оронтой байх ёстой'),
    newPin: z.string().regex(/^\d{4}$/, 'Шинэ ПИН 4 оронтой байх ёстой'),
    confirmPin: z.string().regex(/^\d{4}$/, 'ПИН баталгаажуулалт 4 оронтой байх ёстой'),
});

export type AdminProfile = z.infer<typeof AdminProfileSchema>;
export type AdminProfileResponse = z.infer<typeof AdminProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type ChangePinRequest = z.infer<typeof ChangePinRequestSchema>;
