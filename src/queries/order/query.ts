import adminFetchAndValidate from '@/lib/admin-fetcher';
import type { OrdersResponse, Order } from './type';
import { OrdersResponseSchema, OrderSchema } from './type';
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

export const getOrder = async (id: number): Promise<Order> => {
  const response = await adminFetchAndValidate(
    `/orders/${id}`,
    OrderResponseSchema,
  );
  return response.data;
}
