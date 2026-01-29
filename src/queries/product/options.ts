import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  hideProduct,
  unhideProduct,
  restoreProduct,
  type ProductSearchParams,
} from './query';
import type { CreateProductRequest, UpdateProductRequest } from './type';

export function fetchProductsOptions(params?: ProductSearchParams) {
  return queryOptions({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  });
}

export function fetchProductOptions(id: number) {
  return queryOptions({
    queryKey: ['products', id],
    queryFn: () => getProduct(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductRequest) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) =>
      updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useHideProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => hideProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function useUnhideProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => unhideProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}

export function useRestoreProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => restoreProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  });
}
