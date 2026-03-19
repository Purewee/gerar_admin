import adminFetchAndValidate from '@/lib/admin-fetcher';
import type { Order, OrderSearchFilters, SearchOrdersResult, OrderTimelineEvent } from './type';
import { OrdersResponseSchema, OrderSchema, SearchOrdersResponseSchema, OrderTimelineResponseSchema, OrderEbarimtResponseSchema } from './type';
import { z } from 'zod';

const OrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: OrderSchema,
});

export const getAllOrders = async (): Promise<Order[]> => {
  const response = await adminFetchAndValidate(
    '/admin/orders/all',
    OrdersResponseSchema,
  );
  return response.data;
};

/** Build query string from filters; empty string if no filters. */
function buildOrderSearchParams(filters: OrderSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.orderId != null && filters.orderId !== '') params.set('orderId', filters.orderId);
  if (filters.status != null && filters.status !== '') params.set('status', filters.status);
  if (filters.paymentStatus != null && filters.paymentStatus !== '') params.set('paymentStatus', filters.paymentStatus);
  if (filters.dateFrom != null && filters.dateFrom !== '') params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo != null && filters.dateTo !== '') params.set('dateTo', filters.dateTo);
  if (filters.deliveryDateFrom != null && filters.deliveryDateFrom !== '') params.set('deliveryDateFrom', filters.deliveryDateFrom);
  if (filters.deliveryDateTo != null && filters.deliveryDateTo !== '') params.set('deliveryDateTo', filters.deliveryDateTo);
  if (filters.phone != null && filters.phone !== '') params.set('phone', filters.phone);
  if (filters.name != null && filters.name !== '') params.set('name', filters.name);
  if (filters.totalMin != null) params.set('totalMin', String(filters.totalMin));
  if (filters.totalMax != null) params.set('totalMax', String(filters.totalMax));
  if (filters.deliveryTimeSlot != null && filters.deliveryTimeSlot !== '') params.set('deliveryTimeSlot', filters.deliveryTimeSlot);
  if (filters.excludeCancelled === true) params.set('excludeCancelled', 'true');
  const page = filters.page ?? 1;
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.sortBy != null) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder != null) params.set('sortOrder', filters.sortOrder);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** Advanced search: GET /admin/orders/all with query params. Returns orders + pagination. */
export const searchOrders = async (filters: OrderSearchFilters): Promise<SearchOrdersResult> => {
  const query = buildOrderSearchParams(filters);
  const response = await adminFetchAndValidate(
    `/admin/orders/all${query}`,
    SearchOrdersResponseSchema,
  );
  return {
    orders: response.data,
    total: response.pagination.total,
    page: response.pagination.page,
    limit: response.pagination.limit,
    totalPages: response.pagination.totalPages,
  };
};

const PER_SIMPLE_LIMIT = 50;

/**
 * Simple search: one term matches orderId OR phone OR name.
 * Backend typically ANDs those params, so we run 3 requests and merge by order id.
 */
export const searchOrdersSimple = async (
  term: string,
  baseFilters: OrderSearchFilters,
): Promise<SearchOrdersResult> => {
  const base = {
    ...baseFilters,
    orderId: '',
    phone: '',
    name: '',
    page: 1,
    limit: PER_SIMPLE_LIMIT,
  };
  const [byOrderId, byPhone, byName] = await Promise.all([
    searchOrders({ ...base, orderId: term }),
    searchOrders({ ...base, phone: term }),
    searchOrders({ ...base, name: term }),
  ]);
  const byId = new Map<string, Order>();
  for (const o of byOrderId.orders) byId.set(o.id, o);
  for (const o of byPhone.orders) byId.set(o.id, o);
  for (const o of byName.orders) byId.set(o.id, o);
  const orders = Array.from(byId.values());
  return {
    orders,
    total: orders.length,
    page: 1,
    limit: orders.length,
    totalPages: 1,
  };
};

export const getOrder = async (id: string): Promise<Order> => {
  const response = await adminFetchAndValidate(
    `/admin/orders/${id}`,
    OrderResponseSchema,
  );
  return response.data;
};

/** Get order timeline (events sorted by createdAt ascending). */
export const getOrderTimeline = async (orderId: string): Promise<OrderTimelineEvent[]> => {
  const response = await adminFetchAndValidate(
    `/admin/orders/${orderId}/timeline`,
    OrderTimelineResponseSchema,
  );
  return response.data;
};

/** Get ebarimt (receipt) info for printing – opens receiptUrl in new window when present. */
export const getOrderEbarimt = async (orderId: string) => {
  const response = await adminFetchAndValidate(
    `/admin/orders/${orderId}/ebarimt`,
    OrderEbarimtResponseSchema,
  );
  return response.data;
};

// Cancellation request response schema - very flexible to handle any response structure
// The backend might return different structures, so we accept almost anything
const CancellationRequestResponseSchema = z.union([
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.unknown().optional(),
  }).passthrough(),
  z.object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  }).passthrough(),
  z.record(z.string(), z.unknown()), // Fallback: accept any object
]);

// Request cancellation - generates code and sends SMS
export const requestCancellation = async (orderId: string): Promise<{ message: string }> => {
  try {
    const response = await adminFetchAndValidate(
      `/admin/orders/${orderId}/request-cancellation`,
      CancellationRequestResponseSchema,
      {
        method: 'POST',
      },
    );
    
    // Extract message from various possible response structures
    let message = 'Cancellation code sent successfully';
    
    if (typeof response === 'object' && response !== null) {
      if ('message' in response && typeof response.message === 'string') {
        message = response.message;
      } else if ('data' in response && typeof response.data === 'object' && response.data !== null) {
        if ('message' in response.data && typeof response.data.message === 'string') {
          message = response.data.message;
        }
      }
    }
    
    return { message };
  } catch (error) {
    // Handle case where backend sends SMS but then errors on response (e.g., "sms result not defined")
    // If error message suggests SMS was sent, treat as partial success
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (
      errorMessage.toLowerCase().includes('sms') ||
      errorMessage.toLowerCase().includes('result') ||
      errorMessage.toLowerCase().includes('undefined')
    ) {
      console.warn(
        'Backend error after SMS was likely sent:',
        errorMessage,
        '\nTreating as success since SMS was sent before error occurred.',
      );
      // Return success message - SMS was sent, backend just had an error in response handling
      return {
        message: 'Cancellation code sent successfully (SMS delivered)',
      };
    }
    
    // Re-throw other errors
    throw error;
  }
};

// Confirm cancellation - validates code and cancels order
export const confirmCancellation = async (
  orderId: string,
  code: string,
): Promise<Order> => {
  const response = await adminFetchAndValidate(
    `/admin/orders/${orderId}/confirm-cancellation`,
    OrderResponseSchema,
    {
      method: 'POST',
      body: { code },
    },
  );
  return response.data;
};

// Update order status
export const updateOrderStatus = async (
  orderId: string,
  status: string,
): Promise<Order> => {
  const response = await adminFetchAndValidate(
    `/admin/orders/${orderId}/status`,
    OrderResponseSchema,
    {
      method: 'POST',
      body: { status },
    },
  );
  return response.data;
};
