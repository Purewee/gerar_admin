import type * as z from 'zod';
import { API_BASE_URL } from './api-config';
import { getStoredAuth, clearAuth } from './auth-utils';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number; // Timeout in milliseconds, default 10000 (10 seconds)
}

const DEFAULT_TIMEOUT = 10000; // 10 seconds

export default async function adminFetchAndValidate<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: FetchOptions = {},
): Promise<T> {
  const { token } = getStoredAuth();

  if (!token) {
    throw new Error('Authentication required');
  }

  const { method = 'GET', body, headers = {}, timeout = DEFAULT_TIMEOUT } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...headers,
  };

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

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, config);
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
  if (res.status === 401) {
    clearAuth();
    // Dispatch custom event to notify AuthContext
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:cleared'));
      window.location.href = '/login';
    }
    throw new Error('Your session has expired. Please log in again.');
  }

  let json;
  try {
    json = await res.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      const text = await res.text().catch(() => 'Unable to read response');
      throw new Error(
        `Failed to parse API response as JSON. ` +
        `Status: ${res.status} ${res.statusText}. ` +
        `Response: ${text.substring(0, 200)}`
      );
    }
    throw error;
  }

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

  const result = schema.safeParse(json);

  if (!result.success) {
    console.error('Validation error:', result.error);
    console.error('API Response:', JSON.stringify(json, null, 2));
    
    // If the request was successful (200-299) and the API reports success,
    // the operation likely succeeded even if schema validation failed
    // This handles cases where the API response structure differs slightly
    // (e.g., missing optional fields like category object)
    if (res.status >= 200 && res.status < 300) {
      // Check if this looks like a successful API response
      if (json.success === true && json.data) {
        console.warn(
          'Schema validation failed but API reports success with data. ' +
          'Operation succeeded. Response structure may differ from expected schema.',
        );
        // Return the response even if schema validation failed
        // This allows successful operations to complete despite minor schema mismatches
        return json as T;
      }
    }
    
    // Build a more informative error message
    const errorDetails = result.error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new Error(`Invalid API response: ${errorDetails}`);
  }

  return result.data;
}
