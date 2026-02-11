import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFeatures,
  getFeature,
  createFeature,
  updateFeature,
  deleteFeature,
} from './query';
import type { CreateFeatureRequest, UpdateFeatureRequest } from './type';

export function fetchFeaturesOptions() {
  return queryOptions({
    queryKey: ['features'],
    queryFn: getFeatures,
  });
}

export function fetchFeatureOptions(id: number) {
  return queryOptions({
    queryKey: ['features', id],
    queryFn: () => getFeature(id),
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFeatureRequest) => createFeature(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateFeatureRequest }) =>
      updateFeature(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['features', variables.id] });
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFeature(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
    },
  });
}
