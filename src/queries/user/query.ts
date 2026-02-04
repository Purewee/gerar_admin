import adminFetchAndValidate from '@/lib/admin-fetcher';
import { API_BASE_URL } from '@/lib/api-config';
import { getStoredAuth, clearAuth } from '@/lib/auth-utils';
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
  role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  page?: number;
  limit?: number;
  createdAfter?: string;
  createdBefore?: string;
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
    if (params.createdAfter) {
      url.searchParams.append('createdAfter', params.createdAfter);
    }
    if (params.createdBefore) {
      url.searchParams.append('createdBefore', params.createdBefore);
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Create AbortController for timeout (10 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout: The server took longer than 10s to respond.');
    }
    throw error;
  }

  // Check status code BEFORE parsing JSON to fail fast on 401
  if (res.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:cleared'));
      window.location.href = '/login';
    }
    throw new Error('Your session has expired. Please log in again.');
  }

  const json = await res.json();

  if (!res.ok) {
    const errorMessage = json.error?.message || json.message || `Request failed with status ${res.status}`;

    // Handle 403 Forbidden as well
    if (res.status === 403) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:cleared'));
        window.location.href = '/login';
      }
      throw new Error('Access denied. Please log in again.');
    }

    throw new Error(errorMessage);
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

export interface UpdateUserRoleRequest {
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export const updateUserRole = async (
  userId: number,
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN',
): Promise<User> => {
  const response = await adminFetchAndValidate<UserResponse>(
    `/admin/users/${userId}/role`,
    UserResponseSchema,
    {
      method: 'POST',
      body: { role },
    },
  );
  return response.data;
};
