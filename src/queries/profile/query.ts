import { z } from 'zod';
import adminFetchAndValidate from '@/lib/admin-fetcher';
import type {
    AdminProfile,
    AdminProfileResponse,
    UpdateProfileRequest,
    ChangePinRequest,
} from './type';
import { AdminProfileResponseSchema } from './type';

const ChangePinResponseSchema = z.object({
    success: z.boolean(),
    message: z.string(),
});

/**
 * GET /admin/profile
 * Fetches the current admin's profile information.
 */
export const getAdminProfile = async (): Promise<AdminProfile> => {
    const response = await adminFetchAndValidate<AdminProfileResponse>(
        '/admin/profile',
        AdminProfileResponseSchema,
    );
    return response.data;
};

/**
 * PUT /admin/profile
 * Updates the current admin's profile information.
 */
export const updateAdminProfile = async (
    data: UpdateProfileRequest,
): Promise<AdminProfile> => {
    const response = await adminFetchAndValidate<AdminProfileResponse>(
        '/admin/profile',
        AdminProfileResponseSchema,
        {
            method: 'POST',
            body: data,
        },
    );
    return response.data;
};

/**
 * POST /admin/profile/change-pin
 * Changes the current admin's PIN code.
 */
export const changeAdminPin = async (
    data: ChangePinRequest,
): Promise<{ success: boolean; message: string }> => {
    const response = await adminFetchAndValidate<{ success: boolean; message: string }>(
        '/admin/profile/change-pin',
        ChangePinResponseSchema,
        {
            method: 'POST',
            body: data,
        },
    );
    return response;
};
