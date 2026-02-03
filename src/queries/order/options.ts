import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderSearchFilters } from './type';
import { getAllOrders, getOrder, getOrderTimeline, requestCancellation, confirmCancellation, updateOrderStatus, searchOrders, searchOrdersSimple } from './query';

function isSimpleSearch(filters: OrderSearchFilters): boolean {
  const term = filters.orderId?.trim() ?? '';
  return (
    term !== '' &&
    term === (filters.phone?.trim() ?? '') &&
    term === (filters.name?.trim() ?? '')
  );
}

export function fetchOrdersOptions() {
  return queryOptions({
    queryKey: ['orders'],
    queryFn: getAllOrders,
  });
}

export function fetchOrdersSearchOptions(filters: OrderSearchFilters) {
  const simple = isSimpleSearch(filters);
  return queryOptions({
    queryKey: ['orders', 'search', simple ? 'simple' : null, filters],
    queryFn: () =>
      simple
        ? searchOrdersSimple(filters.orderId!.trim(), filters)
        : searchOrders(filters),
  });
}

export function fetchOrderOptions(id: string) {
  return queryOptions({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
  });
}

export function fetchOrderTimelineOptions(orderId: string) {
  return queryOptions({
    queryKey: ['orders', orderId, 'timeline'],
    queryFn: () => getOrderTimeline(orderId),
  });
}

export function useRequestCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => requestCancellation(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'timeline'] });
    },
  });
}

export function useConfirmCancellation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      confirmCancellation(orderId, code),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId, 'timeline'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.orderId, 'timeline'] });
    },
  });
}
