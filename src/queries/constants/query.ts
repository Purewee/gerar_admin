import adminFetchAndValidate from '@/lib/admin-fetcher';
import type {
  DeliveryTimeSlotsResponse,
  DistrictsResponse,
  UpdateDeliveryTimeSlotsRequest,
  UpdateDistrictsRequest,
} from './type';
import {
  DeliveryTimeSlotsResponseSchema,
  DistrictsResponseSchema,
} from './type';

export const getDeliveryTimeSlots = async (): Promise<DeliveryTimeSlotsResponse['data']> => {
  const response = await adminFetchAndValidate<DeliveryTimeSlotsResponse>(
    '/admin/constants/delivery-time-slots',
    DeliveryTimeSlotsResponseSchema,
  );
  return response.data;
};

export const updateDeliveryTimeSlots = async (
  data: UpdateDeliveryTimeSlotsRequest,
): Promise<DeliveryTimeSlotsResponse['data']> => {
  const response = await adminFetchAndValidate<DeliveryTimeSlotsResponse>(
    '/admin/constants/delivery-time-slots',
    DeliveryTimeSlotsResponseSchema,
    {
      method: 'POST',
      body: data,
    },
  );
  return response.data;
};

export const getDistricts = async (): Promise<DistrictsResponse['data']> => {
  const response = await adminFetchAndValidate<DistrictsResponse>(
    '/admin/constants/districts',
    DistrictsResponseSchema,
  );
  return response.data;
};

export const updateDistricts = async (
  data: UpdateDistrictsRequest,
): Promise<DistrictsResponse['data']> => {
  const response = await adminFetchAndValidate<DistrictsResponse>(
    '/admin/constants/districts',
    DistrictsResponseSchema,
    {
      method: 'POST',
      body: data,
    },
  );
  return response.data;
};
