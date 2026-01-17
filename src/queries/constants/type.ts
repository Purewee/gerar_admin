import { z } from 'zod';

export const DeliveryTimeSlotsSchema = z.object({
  slots: z.record(z.string(), z.string()),
  validSlots: z.array(z.string()).optional(),
});

export const DeliveryTimeSlotsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: DeliveryTimeSlotsSchema,
});

export const DistrictsSchema = z.object({
  districts: z.record(z.string(), z.number()),
});

export const DistrictsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: DistrictsSchema,
});

export const UpdateDeliveryTimeSlotsRequestSchema = z.object({
  slots: z.record(z.string(), z.string()),
});

export const UpdateDistrictsRequestSchema = z.object({
  districts: z.record(z.string(), z.number()),
});

export type DeliveryTimeSlots = z.infer<typeof DeliveryTimeSlotsSchema>;
export type Districts = z.infer<typeof DistrictsSchema>;
export type DeliveryTimeSlotsResponse = z.infer<typeof DeliveryTimeSlotsResponseSchema>;
export type DistrictsResponse = z.infer<typeof DistrictsResponseSchema>;
export type UpdateDeliveryTimeSlotsRequest = z.infer<typeof UpdateDeliveryTimeSlotsRequestSchema>;
export type UpdateDistrictsRequest = z.infer<typeof UpdateDistrictsRequestSchema>;
