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
    credentials: 'include' as RequestCredentials,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (error) {
    // Handle network errors and CORS errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        `CORS Error: Unable to connect to the API server. ` +
        `Please ensure the API server allows requests from the current origin.`
      );
    }
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      const text = await response.text().catch(() => 'Unable to read response');
      throw new Error(
        `Failed to parse API response as JSON. ` +
        `Status: ${response.status} ${response.statusText}. ` +
        `Response: ${text.substring(0, 200)}`
      );
    }
    throw error;
  }

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
