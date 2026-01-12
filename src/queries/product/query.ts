import adminFetchAndValidate from '@/lib/admin-fetcher';
import { API_BASE_URL } from '@/lib/api-config';
import { getStoredAuth, clearAuth, isTokenExpiredError } from '@/lib/auth-utils';
import type {
  CreateProductRequest,
  UpdateProductRequest,
  Product,
} from './type';
import {
  ProductResponseSchema,
} from './type';

export interface ProductSearchParams {
  categoryId?: number;
  categoryIds?: number[];
  search?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
  maxStock?: number;
  createdAfter?: string;
  createdBefore?: string;
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getProducts = async (params?: ProductSearchParams): Promise<Product[]> => {
  const { token } = getStoredAuth();
  
  // Use admin endpoint for advanced search with filters
  const url = new URL(`${API_BASE_URL}/admin/products`);
  
  if (params) {
    if (params.categoryId) {
      url.searchParams.append('categoryId', String(params.categoryId));
    }
    if (params.categoryIds && params.categoryIds.length > 0) {
      params.categoryIds.forEach(id => {
        url.searchParams.append('categoryIds[]', String(id));
      });
    }
    if (params.search) {
      url.searchParams.append('search', params.search);
    }
    if (params.inStock !== undefined) {
      url.searchParams.append('inStock', String(params.inStock));
    }
    if (params.minPrice !== undefined) {
      url.searchParams.append('minPrice', String(params.minPrice));
    }
    if (params.maxPrice !== undefined) {
      url.searchParams.append('maxPrice', String(params.maxPrice));
    }
    if (params.minStock !== undefined) {
      url.searchParams.append('minStock', String(params.minStock));
    }
    if (params.maxStock !== undefined) {
      url.searchParams.append('maxStock', String(params.maxStock));
    }
    if (params.createdAfter) {
      url.searchParams.append('createdAfter', params.createdAfter);
    }
    if (params.createdBefore) {
      url.searchParams.append('createdBefore', params.createdBefore);
    }
    if (params.sortBy) {
      url.searchParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      url.searchParams.append('sortOrder', params.sortOrder);
    }
    if (params.page !== undefined) {
      url.searchParams.append('page', String(params.page));
    }
    if (params.limit !== undefined) {
      url.searchParams.append('limit', String(params.limit));
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    headers,
  });
  const json = await res.json();

  if (!res.ok) {
    const errorMessage = json.error?.message || json.message || `Request failed with status ${res.status}`;
    
    // Check if this is a token expiration/invalid token error
    if (res.status === 401 || (token && (isTokenExpiredError(errorMessage) || isTokenExpiredError(json)))) {
      // Clear auth data and redirect to login
      clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('Your session has expired. Please log in again.');
    }
    
    throw new Error(errorMessage);
  }

  // Handle response format - could be wrapped or direct array
  if (Array.isArray(json)) {
    return json;
  }
  if (json.success && json.data) {
    return json.data;
  }
  throw new Error('Invalid API response format');
};

export const getProduct = async (id: number): Promise<Product> => {
  // Use public endpoint for fetching single product
  const res = await fetch(`${API_BASE_URL}/products/${id}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json.error?.message || json.message || `Request failed with status ${res.status}`,
    );
  }

  // Handle response format
  if (json.success && json.data) {
    return json.data;
  }
  if (json.id) {
    return json;
  }
  throw new Error('Invalid API response format');
};

export const createProduct = async (
  product: CreateProductRequest,
): Promise<Product> => {
  const response = await adminFetchAndValidate(
    '/admin/products',
    ProductResponseSchema,
    {
      method: 'POST',
      body: product,
    },
  );
  return response.data;
};

export const updateProduct = async (
  id: number,
  updates: UpdateProductRequest,
): Promise<Product> => {
  const response = await adminFetchAndValidate(
    `/admin/products/${id}/update`,
    ProductResponseSchema,
    {
      method: 'POST',
      body: updates,
    },
  );
  return response.data;
};

export const deleteProduct = async (id: number): Promise<Product> => {
  const response = await adminFetchAndValidate(
    `/admin/products/${id}/delete`,
    ProductResponseSchema,
    {
      method: 'POST',
    },
  );
  return response.data;
}
