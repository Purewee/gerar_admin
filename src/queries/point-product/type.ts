import { z } from 'zod';

export const PointProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  pointsPrice: z.union([z.number(), z.string()]),
  stock: z.union([z.number(), z.string()]).nullable().optional(),
  images: z.array(z.string()).nullable().optional(),
  firstImage: z.string().nullable().optional(),
  isHidden: z.boolean().optional(),
  deletedAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
}).passthrough();

export const CreatePointProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  pointsPrice: z.number().int().positive('Point price must be positive'),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  images: z.array(z.string().url('Each image must be a valid URL')).optional(),
});

export const UpdatePointProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  pointsPrice: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string().url('Each image must be a valid URL')).nullable().optional(),
  isHidden: z.boolean().optional(),
});

export const PointProductResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: PointProductSchema,
});

export const PointProductsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(PointProductSchema),
});

export const PaginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const PointProductsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(PointProductSchema),
  pagination: PaginationSchema.optional(),
});

export type PointProduct = z.infer<typeof PointProductSchema>;
export type CreatePointProductRequest = z.infer<typeof CreatePointProductSchema>;
export type UpdatePointProductRequest = z.infer<typeof UpdatePointProductSchema>;
export type PointProductResponse = z.infer<typeof PointProductResponseSchema>;
export type PointProductsResponse = z.infer<typeof PointProductsResponseSchema>;
export type PointProductsListResult = {
  products: PointProduct[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};
