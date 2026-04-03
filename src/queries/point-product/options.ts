import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPointProducts,
  getPointProduct,
  createPointProduct,
  updatePointProduct,
  deletePointProduct,
  type PointProductSearchParams,
} from './query';
import type { CreatePointProductRequest, UpdatePointProductRequest } from './type';

export const pointProductKeys = {
  all: ['point-products'] as const,
  lists: () => [...pointProductKeys.all, 'list'] as const,
  list: (params: PointProductSearchParams) => [...pointProductKeys.lists(), params] as const,
  details: () => [...pointProductKeys.all, 'detail'] as const,
  detail: (id: number) => [...pointProductKeys.details(), id] as const,
};

export const fetchPointProductsOptions = (params: PointProductSearchParams = {}) =>
  queryOptions({
    queryKey: pointProductKeys.list(params),
    queryFn: () => getPointProducts(params),
  });

export const fetchPointProductOptions = (id: number) =>
  queryOptions({
    queryKey: pointProductKeys.detail(id),
    queryFn: () => getPointProduct(id),
  });

export const useCreatePointProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (product: CreatePointProductRequest) => createPointProduct(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointProductKeys.lists() });
    },
  });
};

export const useUpdatePointProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdatePointProductRequest }) =>
      updatePointProduct(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: pointProductKeys.lists() });
      queryClient.invalidateQueries({ queryKey: pointProductKeys.detail(id) });
    },
  });
};

export const useDeletePointProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePointProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pointProductKeys.lists() });
    },
  });
};
