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
