import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
} from './query';
import type { CreateBannerRequest, UpdateBannerRequest } from './type';

export function fetchBannersOptions() {
  return queryOptions({
    queryKey: ['banners'],
    queryFn: getBanners,
  });
}

export function fetchBannerOptions(id: number) {
  return queryOptions({
    queryKey: ['banners', id],
    queryFn: () => getBanner(id),
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBannerRequest) => createBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBannerRequest }) =>
      updateBanner(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners', variables.id] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}
