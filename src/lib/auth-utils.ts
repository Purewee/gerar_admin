import type { User } from '@/queries/auth/type';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function getStoredAuth(): { token: string | null; user: User | null } {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (token && storedUser) {
    try {
      const user = JSON.parse(storedUser) as User;
      return { token, user };
    } catch (error) {
      // Invalid stored data, clear it
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { token: null, user: null };
    }
  }

  return { token: null, user: null };
}

export function isAuthenticated(): boolean {
  const { token, user } = getStoredAuth();
  return !!token && !!user;
}

export function isAdmin(): boolean {
  const { user } = getStoredAuth();
  return user?.role === 'ADMIN';
}

export function requireAdmin(): { token: string; user: User } {
  const { token, user } = getStoredAuth();

  if (!token || !user) {
    throw new Error('Not authenticated');
  }

  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required');
  }

  return { token, user };
}

/**
 * Clears authentication data from localStorage.
 * Can be called from anywhere (not just React components).
 */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Checks if an error indicates token expiration or invalid token.
 */
export function isTokenExpiredError(error: unknown): boolean {
  if (typeof error === 'string') {
    return (
      error.toLowerCase().includes('invalid') ||
      error.toLowerCase().includes('expired') ||
      error.toLowerCase().includes('token')
    );
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('invalid') ||
      message.includes('expired') ||
      message.includes('token') ||
      message.includes('unauthorized')
    );
  }
  
  return false;
}
