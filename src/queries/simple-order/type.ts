import { z } from 'zod';

export const SimpleOrderItemSchema = z.object({
  productId: z.number(),
  quantity: z.number(),
  price: z.string(),
  product: z.object({
    name: z.string(),
    description: z.string().optional().nullable(),
    price: z.string().optional().nullable(),
    images: z.array(z.string()).optional().nullable(),
    firstImage: z.string().optional().nullable(),
  }).passthrough().optional().nullable(),
}).passthrough();

export const SimpleOrderSchema = z.object({
  id: z.number(),
  phoneNumber: z.string(),
  address: z.string(),
  addressNote: z.string().optional().nullable(),
  totalAmount: z.string(),
  status: z.enum(['PENDING', 'PROCESSING', 'DELIVERING', 'DELIVERED', 'CANCELLED']),
  createdAt: z.string(),
  items: z.array(SimpleOrderItemSchema),
}).passthrough();

export const SimpleOrdersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(SimpleOrderSchema),
});

export const SimpleOrderResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: SimpleOrderSchema,
});

export type SimpleOrder = z.infer<typeof SimpleOrderSchema>;
export type SimpleOrderItem = z.infer<typeof SimpleOrderItemSchema>;
export type SimpleOrdersResponse = z.infer<typeof SimpleOrdersResponseSchema>;
export type SimpleOrderResponse = z.infer<typeof SimpleOrderResponseSchema>;
