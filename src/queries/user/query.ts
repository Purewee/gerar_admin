import adminFetchAndValidate from '@/lib/admin-fetcher';
import { API_BASE_URL } from '@/lib/api-config';
import { getStoredAuth } from '@/lib/auth-utils';
import type {
  User,
  UserDetail,
  UserResponse,
} from './type';
import {
  UsersResponseSchema,
  UserResponseSchema,
} from './type';

export interface UserSearchParams {
  search?: string;
  role?: 'USER' | 'ADMIN';
  page?: number;
  limit?: number;
}

export const getUsers = async (params?: UserSearchParams): Promise<{
  users: User[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> => {
  const { token } = getStoredAuth();
  
  const url = new URL(`${API_BASE_URL}/admin/users`);
  
  if (params) {
    if (params.search) {
      url.searchParams.append('search', params.search);
    }
    if (params.role) {
      url.searchParams.append('role', params.role);
    }
    if (params.page !== undefined) {
      url.searchParams.append('page', String(params.page));
    }
    if (params.limit !== undefined) {
      url.searchParams.append('limit', String(params.limit));
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    headers,
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json.error?.message || json.message || `Request failed with status ${res.status}`,
    );
  }

  // Validate response if it has the expected structure
  if (json.success && json.data && Array.isArray(json.data)) {
    const validated = UsersResponseSchema.safeParse(json);
    if (validated.success) {
      return {
        users: validated.data.data,
        pagination: validated.data.pagination,
      };
    }
    // If validation fails but data exists, return it anyway
    return {
      users: json.data,
      pagination: json.pagination,
    };
  }

  throw new Error('Invalid API response format');
};

export const getUser = async (id: number): Promise<UserDetail> => {
  const response = await adminFetchAndValidate<UserResponse>(
    `/admin/users/${id}`,
    UserResponseSchema,
  );
  return response.data;
};
