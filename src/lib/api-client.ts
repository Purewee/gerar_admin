import { API_BASE_URL } from './api-config';
import { clearAuth, isTokenExpiredError } from './auth-utils';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', headers = {}, body, token } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error?.message || data.message || 'Request failed';
    
    // Check if this is a token expiration/invalid token error
    // Only handle token errors if a token was provided in the request
    if (token && (response.status === 401 || isTokenExpiredError(errorMessage) || isTokenExpiredError(data))) {
      // Clear auth data and redirect to login
      clearAuth();
      // Redirect to login page - the router will handle this on next navigation
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Your session has expired. Please log in again.');
    }
    
    throw new Error(errorMessage);
  }

  return data;
}
