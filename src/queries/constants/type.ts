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

/** 0 = Sunday, 1 = Monday, ... 6 = Saturday */
export const OffDeliveryDatesSchema = z.object({
  offWeekdays: z.array(z.number().min(0).max(6)),
  offDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const OffDeliveryDatesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: OffDeliveryDatesSchema,
});

export const UpdateOffDeliveryDatesRequestSchema = z.object({
  offWeekdays: z.array(z.number().min(0).max(6)),
  offDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export type DeliveryTimeSlots = z.infer<typeof DeliveryTimeSlotsSchema>;
export type Districts = z.infer<typeof DistrictsSchema>;
export type DeliveryTimeSlotsResponse = z.infer<typeof DeliveryTimeSlotsResponseSchema>;
export type DistrictsResponse = z.infer<typeof DistrictsResponseSchema>;
export type OffDeliveryDates = z.infer<typeof OffDeliveryDatesSchema>;
export type OffDeliveryDatesResponse = z.infer<typeof OffDeliveryDatesResponseSchema>;
export type UpdateOffDeliveryDatesRequest = z.infer<typeof UpdateOffDeliveryDatesRequestSchema>;
export type UpdateDeliveryTimeSlotsRequest = z.infer<typeof UpdateDeliveryTimeSlotsRequestSchema>;
export type UpdateDistrictsRequest = z.infer<typeof UpdateDistrictsRequestSchema>;
