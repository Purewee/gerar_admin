import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProfile, updateAdminProfile, changeAdminPin } from './query';
import type { UpdateProfileRequest, ChangePinRequest } from './type';

export function fetchAdminProfileOptions() {
    return queryOptions({
        queryKey: ['admin-profile'],
        queryFn: () => getAdminProfile(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useUpdateAdminProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateProfileRequest) => updateAdminProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
        },
    });
}

export function useChangeAdminPin() {
    return useMutation({
        mutationFn: (data: ChangePinRequest) => changeAdminPin(data),
    });
}
