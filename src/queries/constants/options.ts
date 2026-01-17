import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDeliveryTimeSlots,
  getDistricts,
  updateDeliveryTimeSlots,
  updateDistricts,
} from './query';
import type {
  UpdateDeliveryTimeSlotsRequest,
  UpdateDistrictsRequest,
} from './type';

export function fetchDeliveryTimeSlotsOptions() {
  return queryOptions({
    queryKey: ['constants', 'delivery-time-slots'],
    queryFn: getDeliveryTimeSlots,
  });
}

export function fetchDistrictsOptions() {
  return queryOptions({
    queryKey: ['constants', 'districts'],
    queryFn: getDistricts,
  });
}

export function useUpdateDeliveryTimeSlots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDeliveryTimeSlotsRequest) => updateDeliveryTimeSlots(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constants', 'delivery-time-slots'] });
    },
  });
}

export function useUpdateDistricts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateDistrictsRequest) => updateDistricts(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constants', 'districts'] });
    },
  });
}
