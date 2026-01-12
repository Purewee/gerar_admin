// Get API base URL from environment variable, or use current origin in production
// In development, defaults to localhost:3000, in production uses current domain
const getApiBaseUrl = () => {
	// If environment variable is set, use it
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}
	
	// In development, use localhost
	if (import.meta.env.DEV) {
		return 'http://localhost:3000/api';
	}
	
	// In production, use the current origin + /api
	if (typeof window !== 'undefined') {
		return `${window.location.origin}/api`;
	}
	
	// Fallback (shouldn't happen in browser context)
	return '/api';
};

export const API_BASE_URL = getApiBaseUrl();
