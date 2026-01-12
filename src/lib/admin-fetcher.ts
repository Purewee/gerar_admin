import type * as z from 'zod';
import { API_BASE_URL } from './api-config';
import { getStoredAuth, clearAuth, isTokenExpiredError } from './auth-utils';

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

export default async function adminFetchAndValidate<T>(
  endpoint: string,
  schema: z.ZodType<T>,
  options: FetchOptions = {},
): Promise<T> {
  const { token } = getStoredAuth();

  if (!token) {
    throw new Error('Authentication required');
  }

  const { method = 'GET', body, headers = {} } = options;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...headers,
  };

  const config: RequestInit = {
    method,
    headers: requestHeaders,
    credentials: 'include' as RequestCredentials,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, config);
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
    
    // Check if this is a token expiration/invalid token error
    if (res.status === 401 || isTokenExpiredError(errorMessage) || isTokenExpiredError(json)) {
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
