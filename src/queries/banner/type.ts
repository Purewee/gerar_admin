import { z } from 'zod';

export const BannerSchema = z.object({
  id: z.number(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  imageDesktop: z.string(),
  imageMobile: z.string(),
  linkUrl: z.string().nullable(),
  order: z.number(),
  isActive: z.boolean(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdBy: z.number().nullable().optional(),
  updatedBy: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateBannerSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  imageDesktop: z.string().min(1, 'Desktop image is required'),
  imageMobile: z.string().min(1, 'Mobile image is required'),
  linkUrl: z.string().nullable().optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export const UpdateBannerSchema = CreateBannerSchema.partial();

export const BannerResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: BannerSchema,
});

export const BannersResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.array(BannerSchema),
});

export type Banner = z.infer<typeof BannerSchema>;
export type CreateBannerRequest = z.infer<typeof CreateBannerSchema>;
export type UpdateBannerRequest = z.infer<typeof UpdateBannerSchema>;
export type BannerResponse = z.infer<typeof BannerResponseSchema>;
export type BannersResponse = z.infer<typeof BannersResponseSchema>;
