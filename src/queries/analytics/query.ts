import adminFetchAndValidate from '@/lib/admin-fetcher';
import {
  RevenueOverviewResponseSchema,
  RevenueTrendsResponseSchema,
  RevenueByProductResponseSchema,
  RevenueByCategoryResponseSchema,
  RevenueByCustomerResponseSchema,
  RevenueByPaymentMethodResponseSchema,
  DashboardSummaryResponseSchema,
  type RevenueOverviewData,
  type TrendDataPoint,
  type ProductRevenue,
  type CategoryRevenue,
  type CustomerRevenue,
  type PaymentMethodRevenue,
  type DashboardSummaryData,
} from './type';

/**
 * Get revenue overview with optional period comparison
 */
export const getRevenueOverview = async (
  params?: {
    startDate?: string;
    endDate?: string;
    compareWithPrevious?: boolean;
  },
): Promise<RevenueOverviewData> => {
  const searchParams = new URLSearchParams();
  
  if (params?.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.append('endDate', params.endDate);
  }
  if (params?.compareWithPrevious !== undefined) {
    searchParams.append('compareWithPrevious', String(params.compareWithPrevious));
  }

  const queryString = searchParams.toString();
  const endpoint = `/admin/analytics/revenue/overview${queryString ? `?${queryString}` : ''}`;

  const response = await adminFetchAndValidate(
    endpoint,
    RevenueOverviewResponseSchema,
  );
  
  return response.data;
};

/**
 * Get revenue trends over time
 */
export const getRevenueTrends = async (
  params: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    startDate: string;
    endDate: string;
    groupBy?: 'status' | 'paymentStatus';
  },
): Promise<TrendDataPoint[]> => {
  const searchParams = new URLSearchParams();
  searchParams.append('period', params.period);
  searchParams.append('startDate', params.startDate);
  searchParams.append('endDate', params.endDate);
  
  if (params.groupBy) {
    searchParams.append('groupBy', params.groupBy);
  }

  const endpoint = `/admin/analytics/revenue/trends?${searchParams.toString()}`;

  const response = await adminFetchAndValidate(
    endpoint,
    RevenueTrendsResponseSchema,
  );
  
  return response.data;
};

/**
 * Get revenue by product
 */
export const getRevenueByProduct = async (
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortBy?: 'revenue' | 'quantity' | 'orders';
    sortOrder?: 'asc' | 'desc';
  },
): Promise<{ products: ProductRevenue[]; total: number }> => {
  const searchParams = new URLSearchParams();
  
  if (params?.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.append('endDate', params.endDate);
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', String(params.limit));
  }
  if (params?.sortBy) {
    searchParams.append('sortBy', params.sortBy);
  }
  if (params?.sortOrder) {
    searchParams.append('sortOrder', params.sortOrder);
  }

  const queryString = searchParams.toString();
  const endpoint = `/admin/analytics/revenue/products${queryString ? `?${queryString}` : ''}`;

  const response = await adminFetchAndValidate(
    endpoint,
    RevenueByProductResponseSchema,
  );
  
  return response.data;
};

/**
 * Get revenue by category
 */
export const getRevenueByCategory = async (
  params?: {
    startDate?: string;
    endDate?: string;
    includeSubcategories?: boolean;
  },
): Promise<{ categories: CategoryRevenue[]; total: number }> => {
  const searchParams = new URLSearchParams();
  
  if (params?.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.append('endDate', params.endDate);
  }
  if (params?.includeSubcategories !== undefined) {
    searchParams.append('includeSubcategories', String(params.includeSubcategories));
  }

  const queryString = searchParams.toString();
  const endpoint = `/admin/analytics/revenue/categories${queryString ? `?${queryString}` : ''}`;

  const response = await adminFetchAndValidate(
    endpoint,
    RevenueByCategoryResponseSchema,
  );
  
  return response.data;
};

/**
 * Get revenue by customer
 */
export const getRevenueByCustomer = async (
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    sortBy?: 'revenue' | 'orders' | 'avgOrderValue';
    sortOrder?: 'asc' | 'desc';
  },
): Promise<{ customers: CustomerRevenue[]; total: number }> => {
  const searchParams = new URLSearchParams();
  
  if (params?.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.append('endDate', params.endDate);
  }
  if (params?.limit !== undefined) {
    searchParams.append('limit', String(params.limit));
  }
  if (params?.sortBy) {
    searchParams.append('sortBy', params.sortBy);
  }
  if (params?.sortOrder) {
    searchParams.append('sortOrder', params.sortOrder);
  }

  const queryString = searchParams.toString();
  const endpoint = `/admin/analytics/revenue/customers${queryString ? `?${queryString}` : ''}`;

  const response = await adminFetchAndValidate(
    endpoint,
    RevenueByCustomerResponseSchema,
  );
  
  return response.data;
};

/**
 * Get revenue by payment method
 */
export const getRevenueByPaymentMethod = async (
  params?: {
    startDate?: string;
    endDate?: string;
  },
): Promise<{
  paymentMethods: PaymentMethodRevenue[];
  total: number;
  totalRevenue: number;
}> => {
  const searchParams = new URLSearchParams();
  
  if (params?.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.append('endDate', params.endDate);
  }

  const queryString = searchParams.toString();
  const endpoint = `/admin/analytics/revenue/payment-methods${queryString ? `?${queryString}` : ''}`;

  const response = await adminFetchAndValidate(
    endpoint,
    RevenueByPaymentMethodResponseSchema,
  );
  
  return response.data;
};

/**
 * Get dashboard summary with all key metrics
 */
export const getDashboardSummary = async (): Promise<DashboardSummaryData> => {
  const response = await adminFetchAndValidate(
    '/admin/analytics/revenue/dashboard',
    DashboardSummaryResponseSchema,
  );
  
  return response.data;
};
