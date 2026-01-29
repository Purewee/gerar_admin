import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, getUser, updateUserRole, type UserSearchParams } from './query';

export function fetchUsersOptions(params?: UserSearchParams) {
  return queryOptions({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
  });
}

export function fetchUserOptions(id: number) {
  return queryOptions({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'USER' | 'ADMIN' | 'SUPER_ADMIN' }) =>
      updateUserRole(userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
    },
  });
}
