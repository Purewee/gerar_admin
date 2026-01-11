import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  parentId: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  children: z.array(z.lazy(() => CategorySchema)).optional(),
  // Keep subcategories for backwards compatibility, but prefer children
  subcategories: z.array(z.lazy(() => CategorySchema)).optional(),
});

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  parentId: z.number().nullable().optional(),
});

export const UpdateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  parentId: z.number().nullable().optional(),
});

export const CategoryResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CategorySchema,
});

export const CategoriesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(CategorySchema),
});

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof UpdateCategorySchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
