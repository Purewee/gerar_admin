import adminFetchAndValidate from '@/lib/admin-fetcher';
import { SimpleOrderResponseSchema, SimpleOrdersResponseSchema } from './type';
import type { SimpleOrder } from './type';

/** Get all simple orders: GET /admin/simple-orders/all */
export const getAllSimpleOrders = async (): Promise<SimpleOrder[]> => {
  const response = await adminFetchAndValidate(
    '/admin/simple-orders/all',
    SimpleOrdersResponseSchema,
  );
  return response.data;
};

/** Get single simple order details: GET /admin/simple-orders/:id */
export const getSimpleOrder = async (id: number | string): Promise<SimpleOrder> => {
  const response = await adminFetchAndValidate(
    `/admin/simple-orders/${id}`,
    SimpleOrderResponseSchema,
  );
  return response.data;
};

/** Update simple order status: POST /admin/simple-orders/:id/status */
export const updateSimpleOrderStatus = async (
  id: number | string,
  status: string,
): Promise<SimpleOrder> => {
  const response = await adminFetchAndValidate(
    `/admin/simple-orders/${id}/status`,
    SimpleOrderResponseSchema,
    {
      method: 'POST',
      body: { status },
    },
  );
  return response.data;
};
