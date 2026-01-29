import { API_BASE_URL } from './api-config';
import { clearAuth } from './auth-utils';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  token?: string | null;
  timeout?: number; // Timeout in milliseconds, default 10000 (10 seconds)
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', headers = {}, body, token, timeout = DEFAULT_TIMEOUT } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include' as RequestCredentials,
    signal: controller.signal,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: The server took longer than ${timeout}ms to respond.`);
    }
    
    // Handle network errors and CORS errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        `CORS Error: Unable to connect to the API server. ` +
        `Please ensure the API server allows requests from the current origin.`
      );
    }
    throw error;
  }

  // Check status code BEFORE parsing JSON to fail fast on 401
  if (token && response.status === 401) {
    clearAuth();
    // Dispatch custom event to notify AuthContext
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:cleared'));
      window.location.href = '/login';
    }
    throw new Error('Your session has expired. Please log in again.');
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
    
    // Handle 403 Forbidden as well
    if (token && response.status === 403) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:cleared'));
        window.location.href = '/login';
      }
      throw new Error('Access denied. Please log in again.');
    }

    throw new Error(errorMessage);
  }

  return data;
}
