import { API_BASE_URL } from './api-config';
import { getStoredAuth, clearAuth, isTokenExpiredError } from './auth-utils';

/**
 * Upload a single file to the server
 * @param file - The file to upload
 * @param endpoint - Optional custom upload endpoint (defaults to /api/admin/upload)
 * @returns The URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  endpoint: string = '/admin/upload',
): Promise<string> {
  const { token } = getStoredAuth();

  if (!token) {
    throw new Error('Authentication required');
  }

  // Validate file type (images only)
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!validImageTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Only image files are allowed (JPEG, PNG, GIF, WebP).`);
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum limit of 10MB.`);
  }

  const formData = new FormData();
  // Backend accepts either 'file' or 'image' field - use only 'file' to avoid duplicate processing
  formData.append('file', file);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type - browser will set it with boundary for FormData
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
  } catch (error) {
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
        `Failed to parse upload response. ` +
        `Status: ${response.status} ${response.statusText}. ` +
        `Response: ${text.substring(0, 200)}`
      );
    }
    throw error;
  }

  if (!response.ok) {
    const errorMessage = data.error?.message || data.message || 'Upload failed';
    
    // Check if this is a token expiration/invalid token error
    if (response.status === 401 || isTokenExpiredError(errorMessage) || isTokenExpiredError(data)) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Your session has expired. Please log in again.');
    }
    
    throw new Error(errorMessage);
  }

  // Handle different response formats
  // Some APIs return { success: true, data: { url: "..." } }
  // Some return { url: "..." }
  // Some return { imageUrl: "..." }
  // Some return { path: "..." }
  let uploadedUrl: string;
  if (data.success && data.data) {
    uploadedUrl = data.data.url || data.data.imageUrl || data.data.path || data.data;
  } else if (data.url) {
    uploadedUrl = data.url;
  } else if (data.imageUrl) {
    uploadedUrl = data.imageUrl;
  } else if (data.path) {
    // If path is relative, make it absolute
    if (data.path.startsWith('/')) {
      uploadedUrl = `${API_BASE_URL.replace('/api', '')}${data.path}`;
    } else {
      uploadedUrl = data.path;
    }
  } else if (typeof data === 'string') {
    uploadedUrl = data;
  } else {
    throw new Error('Invalid upload response format. Expected URL in response.');
  }

  return uploadedUrl;
}

/**
 * Upload multiple files to the server using the multiple upload endpoint
 * @param files - Array of files to upload
 * @param endpoint - Optional custom upload endpoint (defaults to /admin/upload/multiple)
 * @param onProgress - Optional progress callback
 * @returns Array of uploaded file URLs
 */
export async function uploadFiles(
  files: File[],
  endpoint: string = '/admin/upload/multiple',
  onProgress?: (progress: number) => void,
): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  // If only one file, use single upload endpoint for efficiency
  if (files.length === 1) {
    const url = await uploadFile(files[0]);
    if (onProgress) {
      onProgress(100);
    }
    return [url];
  }

  const { token } = getStoredAuth();

  if (!token) {
    throw new Error('Authentication required');
  }

  // Validate all files
  const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  for (const file of files) {
    if (!validImageTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.name}. Only image files are allowed (JPEG, PNG, GIF, WebP).`);
    }
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum limit of 10MB: ${file.name}`);
    }
  }

  const formData = new FormData();
  // Backend expects 'files' field as an array for multiple uploads
  files.forEach((file) => {
    formData.append('files', file);
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    // Don't set Content-Type - browser will set it with boundary for FormData
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
  } catch (error) {
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
        `Failed to parse upload response. ` +
        `Status: ${response.status} ${response.statusText}. ` +
        `Response: ${text.substring(0, 200)}`
      );
    }
    throw error;
  }

  if (!response.ok) {
    const errorMessage = data.error?.message || data.message || 'Upload failed';
    
    // Check if this is a token expiration/invalid token error
    if (response.status === 401 || isTokenExpiredError(errorMessage) || isTokenExpiredError(data)) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Your session has expired. Please log in again.');
    }
    
    throw new Error(errorMessage);
  }

  // Handle different response formats for multiple uploads
  // Expected: { success: true, data: { urls: ["...", "..."] } }
  // Or: { success: true, data: ["...", "..."] }
  // Or: { urls: ["...", "..."] }
  let urls: string[] = [];

  if (data.success && data.data) {
    if (Array.isArray(data.data)) {
      // Response is array of URLs
      urls = data.data.map((item: any) => {
        if (typeof item === 'string') return item;
        return item.url || item.imageUrl || item.path || item;
      });
    } else if (data.data.urls && Array.isArray(data.data.urls)) {
      // Response has urls array
      urls = data.data.urls;
    } else if (data.data.url) {
      // Single URL in data
      urls = [data.data.url];
    }
  } else if (Array.isArray(data)) {
    // Response is directly an array
    urls = data.map((item: any) => {
      if (typeof item === 'string') return item;
      return item.url || item.imageUrl || item.path || item;
    });
  } else if (data.urls && Array.isArray(data.urls)) {
    // Response has urls field
    urls = data.urls;
  }

  if (urls.length === 0) {
    throw new Error('Invalid upload response format. Expected array of URLs in response.');
  }

  // Convert relative paths to absolute URLs if needed
  urls = urls.map((url) => {
    if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('http')) {
      return `${API_BASE_URL.replace('/api', '')}${url}`;
    }
    return url;
  });

  if (onProgress) {
    onProgress(100);
  }

  return urls;
}

/**
 * Delete an uploaded image from the server
 * @param imageUrl - The URL of the image to delete
 * @param endpoint - Optional custom delete endpoint (defaults to /admin/upload/delete)
 * @returns True if deletion was successful
 */
export async function deleteImage(
  imageUrl: string,
  endpoint: string = '/admin/upload/delete',
): Promise<boolean> {
  const { token } = getStoredAuth();

  if (!token) {
    throw new Error('Authentication required');
  }

  // Extract the image path/identifier from the URL
  // The URL might be full (https://...) or relative (/uploads/...)
  // We need to send the path to the server
  let imagePath = imageUrl;
  
  // If it's a full URL, try to extract the path
  try {
    const url = new URL(imageUrl);
    imagePath = url.pathname;
  } catch {
    // If it's not a valid URL, use it as-is (might be a relative path)
    if (!imageUrl.startsWith('/')) {
      imagePath = imageUrl;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageUrl, path: imagePath }),
      credentials: 'include',
    });
  } catch (error) {
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
        `Failed to parse delete response. ` +
        `Status: ${response.status} ${response.statusText}. ` +
        `Response: ${text.substring(0, 200)}`
      );
    }
    throw error;
  }

  if (!response.ok) {
    const errorMessage = data.error?.message || data.message || 'Delete failed';
    
    // Check if this is a token expiration/invalid token error
    if (response.status === 401 || isTokenExpiredError(errorMessage) || isTokenExpiredError(data)) {
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Your session has expired. Please log in again.');
    }
    
    // If image not found (404), it might already be deleted, consider it success
    if (response.status === 404) {
      return true;
    }
    
    throw new Error(errorMessage);
  }

  // Handle different response formats
  if (data.success !== undefined) {
    return data.success === true;
  }
  
  return true;
}
