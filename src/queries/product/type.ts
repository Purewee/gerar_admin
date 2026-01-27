import { z } from 'zod';
import { CategorySchema, AdminUserSchema } from '../category/type';

// Base product schema - handles both old (single category) and new (multiple categories) formats
export const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.string(),
  originalPrice: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
  firstImage: z.string().nullable().optional(),
  hasDiscount: z.boolean().optional(),
  discountAmount: z.string().nullable().optional(),
  discountPercentage: z.number().nullable().optional(),
  stock: z.number(),
  // New format: array of categories
  categories: z.array(CategorySchema).optional(),
  // Old format: single category ID (required in old API, optional in new)
  categoryId: z.union([z.number(), z.null()]).optional(),
  // Old format: single category object
  category: CategorySchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.number().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  creator: AdminUserSchema.nullable().optional(),
  updater: AdminUserSchema.nullable().optional(),
}).passthrough(); // Allow additional fields that might be in the API response

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  originalPrice: z.number().positive('Original price must be positive').nullable().optional(),
  stock: z.number().int().min(0, 'Stock must be non-negative'),
  categoryId: z.number().int().positive('Category is required').optional(),
  categoryIds: z.array(z.number().int().positive()).min(1, 'At least one category is required').optional(),
  images: z.array(z.string().url('Each image must be a valid URL')).optional(),
}).refine((data) => data.categoryId || (data.categoryIds && data.categoryIds.length > 0), {
  message: 'At least one category is required',
  path: ['categoryIds'],
});

export const UpdateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  originalPrice: z.number().positive('Original price must be positive').nullable().optional(),
  stock: z.number().int().min(0).optional(),
  categoryId: z.number().int().positive().optional(),
  categoryIds: z.array(z.number().int().positive()).min(1).optional(),
  categoryOrders: z.union([
    z.record(z.string(), z.number()), // Object format: { "1": 0, "2": 1 }
    z.array(z.object({ categoryId: z.number(), order: z.number() })), // Array format: [{categoryId: 1, order: 0}]
  ]).optional(),
  images: z.array(z.string().url('Each image must be a valid URL')).nullable().optional(),
});

export const ProductResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: ProductSchema,
});

export const ProductsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(ProductSchema),
});

export type Product = z.infer<typeof ProductSchema>;
export type CreateProductRequest = z.infer<typeof CreateProductSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type ProductsResponse = z.infer<typeof ProductsResponseSchema>;
