import { z } from 'zod';
import { ProductSchema } from '../product/type';
import { CategorySchema } from '../category/type';

/** Used when admin marks order as out for delivery; backend sends SMS: Таны #<orderId> хүргэлтэд гарлаа. GERAR.MN */
export const STATUS_DELIVERY_STARTED = 'DELIVERY_STARTED';

/** Orders cancelled via admin SMS confirmation flow (code sent to user, admin confirms). */
export const STATUS_CANCELLED_BY_ADMIN = 'CANCELLED_BY_ADMIN';

export const CANCELLED_STATUSES = ['CANCELLED', STATUS_CANCELLED_BY_ADMIN] as const;

export function isOrderCancelled(status: string): boolean {
  return CANCELLED_STATUSES.includes(status as (typeof CANCELLED_STATUSES)[number]);
}

export const OrderItemSchema = z.object({
  id: z.number(),
  orderId: z.number(),
  productId: z.number(),
  quantity: z.number(),
  price: z.string(),
  product: ProductSchema.extend({
    category: CategorySchema.optional(),
  }).optional(),
});

export const OrderSchema = z.object({
  id: z.number(),
  userId: z.number(),
  totalAmount: z.string(),
  status: z.union([
    z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'CANCELLED_BY_ADMIN', 'DELIVERED', 'DELIVERY_STARTED']),
    z.string(), // Allow any string status for flexibility (e.g., "Хүргэгдсэн")
  ]),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z
    .object({
      id: z.number(),
      phoneNumber: z.string(),
      name: z.string(),
    })
    .optional(),
  items: z.array(OrderItemSchema),
});

export const OrdersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(OrderSchema),
});

/** Query params for advanced order search (GET /admin/orders/all?...) */
export interface OrderSearchFilters {
  orderId?: string;
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  deliveryDateFrom?: string;
  deliveryDateTo?: string;
  phone?: string;
  name?: string;
  totalMin?: number;
  totalMax?: number;
  deliveryTimeSlot?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'totalAmount' | 'status' | 'paymentStatus' | 'deliveryDate';
  sortOrder?: 'asc' | 'desc';
}

/** Response shape when calling GET /admin/orders/all with any query param (advanced search) */
export const SearchOrdersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(OrderSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;
export type SearchOrdersResponse = z.infer<typeof SearchOrdersResponseSchema>;

export interface SearchOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
