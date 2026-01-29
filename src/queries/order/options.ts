import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderSearchFilters } from './type';
import { getAllOrders, getOrder, requestCancellation, confirmCancellation, updateOrderStatus, searchOrders } from './query';

export function fetchOrdersOptions() {
  return queryOptions({
    queryKey: ['orders'],
    queryFn: getAllOrders,
  });
}

export function fetchOrdersSearchOptions(filters: OrderSearchFilters) {
  return queryOptions({
    queryKey: ['orders', 'search', filters],
    queryFn: () => searchOrders(filters),
  });
}

export function fetchOrderOptions(id: number) {
  return queryOptions({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
  });
}

export function useRequestCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => requestCancellation(orderId),
    onSuccess: (_, orderId) => {
      // Invalidate orders list and specific order to refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}

export function useConfirmCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, code }: { orderId: number; code: string }) =>
      confirmCancellation(orderId, code),
    onSuccess: (_, variables) => {
      // Invalidate orders list and specific order to refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      // Invalidate orders list and specific order to refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
    },
  });
}
