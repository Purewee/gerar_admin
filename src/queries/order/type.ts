import { z } from 'zod';
import { ProductSchema } from '../product/type';
import { CategorySchema } from '../category/type';

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
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
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

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrdersResponse = z.infer<typeof OrdersResponseSchema>;
