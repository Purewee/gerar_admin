import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDeliveryTimeSlots,
  getDistricts,
  getOffDeliveryDates,
  updateDeliveryTimeSlots,
  updateDistricts,
  updateOffDeliveryDates,
} from './query';
import type {
  UpdateDeliveryTimeSlotsRequest,
  UpdateDistrictsRequest,
  UpdateOffDeliveryDatesRequest,
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

export function fetchOffDeliveryDatesOptions() {
  return queryOptions({
    queryKey: ['constants', 'off-delivery-dates'],
    queryFn: getOffDeliveryDates,
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

export function useUpdateOffDeliveryDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOffDeliveryDatesRequest) => updateOffDeliveryDates(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constants', 'off-delivery-dates'] });
    },
  });
}
