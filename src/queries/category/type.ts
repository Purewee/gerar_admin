import { z } from 'zod';

// Admin user schema for creator/updater fields
export const AdminUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  phoneNumber: z.string(),
  email: z.string().nullable(),
});

// Define the type first to avoid circular reference in the schema
type CategoryType = {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  order?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  updatedBy?: number | null;
  creator?: z.infer<typeof AdminUserSchema> | null;
  updater?: z.infer<typeof AdminUserSchema> | null;
  children?: CategoryType[];
  subcategories?: CategoryType[];
};

export const CategorySchema: z.ZodType<CategoryType> = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  parentId: z.number().nullable(),
  order: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.number().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  creator: AdminUserSchema.nullable().optional(),
  updater: AdminUserSchema.nullable().optional(),
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
  order: z.number().optional(),
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
