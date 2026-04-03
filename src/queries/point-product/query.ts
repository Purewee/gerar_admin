import adminFetchAndValidate from '@/lib/admin-fetcher';
import type {
  CreatePointProductRequest,
  UpdatePointProductRequest,
  PointProduct,
  PointProductsListResult,
} from './type';
import {
  PointProductResponseSchema,
  PointProductsListResponseSchema,
} from './type';

export interface PointProductSearchParams {
  search?: string;
  sortBy?: 'name' | 'pointsPrice' | 'stock' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getPointProducts = async (params?: PointProductSearchParams): Promise<PointProductsListResult> => {
  const queryParams = new URLSearchParams();
  if (params) {
    if (params.search) queryParams.set('search', params.search);
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params.page) queryParams.set('page', String(params.page));
    if (params.limit) queryParams.set('limit', String(params.limit));
  }
  const qs = queryParams.toString();
  const endpoint = `/admin/point-products${qs ? `?${qs}` : ''}`;

  const response = await adminFetchAndValidate(
    endpoint,
    PointProductsListResponseSchema,
  );

  let products: PointProduct[] = [];
  let paginationResult = { total: 0, page: 1, limit: 20, totalPages: 1 };

  if (Array.isArray(response)) {
    products = response;
    paginationResult = {
      total: products.length,
      page: 1,
      limit: products.length || 20,
      totalPages: 1,
    };
  } else {
    products = response.data;
    paginationResult = response.pagination || {
      total: products.length,
      page: 1,
      limit: products.length || 20,
      totalPages: 1,
    };
  }

  return { products, pagination: paginationResult };
};

export const getPointProduct = async (id: number): Promise<PointProduct> => {
  const response = await adminFetchAndValidate(
    `/admin/point-products/${id}`,
    PointProductResponseSchema,
  );
  return response.data;
};

export const createPointProduct = async (
  product: CreatePointProductRequest,
): Promise<PointProduct> => {
  const response = await adminFetchAndValidate(
    '/admin/point-products',
    PointProductResponseSchema,
    {
      method: 'POST',
      body: product,
    },
  );
  return response.data;
};

export const updatePointProduct = async (
  id: number,
  updates: UpdatePointProductRequest,
): Promise<PointProduct> => {
  const response = await adminFetchAndValidate(
    `/admin/point-products/${id}`,
    PointProductResponseSchema,
    {
      method: 'PUT',
      body: updates,
    },
  );
  return response.data;
};

export const deletePointProduct = async (id: number): Promise<PointProduct> => {
  const response = await adminFetchAndValidate(
    `/admin/point-products/${id}`,
    PointProductResponseSchema,
    {
      method: 'DELETE',
    },
  );
  return response.data;
};
