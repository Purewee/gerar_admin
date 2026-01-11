import { API_BASE_URL } from '@/lib/api-config';
import type { LoginRequest, LoginResponse } from './type';
import { LoginResponseSchema } from './type';

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  };

  const res = await fetch(`${API_BASE_URL}/auth/login`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.error?.message || data.message || 'Login failed',
    );
  }

  return LoginResponseSchema.parse(data);
};
