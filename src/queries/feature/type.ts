import { z } from 'zod';

export const FeatureSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  order: z.number(),
  createdBy: z.number().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  products: z.array(z.unknown()).optional(),
});

export const CreateFeatureSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export const UpdateFeatureSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export const FeatureResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: FeatureSchema,
});

export const FeaturesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(FeatureSchema),
});

export type Feature = z.infer<typeof FeatureSchema>;
export type CreateFeatureRequest = z.infer<typeof CreateFeatureSchema>;
export type UpdateFeatureRequest = z.infer<typeof UpdateFeatureSchema>;
export type FeatureResponse = z.infer<typeof FeatureResponseSchema>;
export type FeaturesResponse = z.infer<typeof FeaturesResponseSchema>;
