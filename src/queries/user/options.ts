import { queryOptions } from '@tanstack/react-query';
import { getUsers, getUser, type UserSearchParams } from './query';

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
