import { API_BASE_URL } from '@/lib/api-config';
import type { LoginRequest, LoginResponse } from './type';
import { LoginResponseSchema } from './type';

export const login = async (
  credentials: LoginRequest,
): Promise<LoginResponse> => {
  const url = `${API_BASE_URL}/auth/login`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  };

  const res = await fetch(url, options);
  
  // Check content type before parsing
  const contentType = res.headers.get('content-type');
  let data;
  
  try {
    const text = await res.text();
    
    // If response is not JSON, throw a helpful error
    if (!contentType || !contentType.includes('application/json')) {
      console.error('API Error: Expected JSON but received:', contentType);
      console.error('Response text (first 500 chars):', text.substring(0, 500));
      console.error('Request URL:', url);
      throw new Error(
        `API endpoint returned HTML instead of JSON. ` +
        `The API server may not be running or configured correctly. ` +
        `Tried to reach: ${url}`
      );
    }
    
    data = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(
        `Failed to parse API response as JSON. ` +
        `The API endpoint may not be available at: ${url}. ` +
        `Please check your API server configuration.`
      );
    }
    throw error;
  }

  if (!res.ok) {
    throw new Error(
      data.error?.message || data.message || 'Login failed',
    );
  }

  return LoginResponseSchema.parse(data);
};
