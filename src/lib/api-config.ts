// Get API base URL from environment variable, or use current origin in production
// In development, defaults to localhost:3000, in production uses current domain
const getApiBaseUrl = () => {
	// If environment variable is set, use it
	if (import.meta.env.VITE_API_BASE_URL) {
		const url = import.meta.env.VITE_API_BASE_URL;
		console.log('[API Config] Using VITE_API_BASE_URL:', url);
		return url;
	}
	
	// In development, use localhost
	if (import.meta.env.DEV) {
		const url = 'http://localhost:3000/api';
		console.log('[API Config] Development mode, using:', url);
		return url;
	}
	
	// In production, use the current origin + /api
	if (typeof window !== 'undefined') {
		const url = `${window.location.origin}/api`;
		console.log('[API Config] Production mode, using:', url);
		console.log('[API Config] Current origin:', window.location.origin);
		return url;
	}
	
	// Fallback (shouldn't happen in browser context)
	const url = '/api';
	console.log('[API Config] Fallback, using:', url);
	return url;
};

export const API_BASE_URL = getApiBaseUrl();