import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllSimpleOrders, getSimpleOrder, updateSimpleOrderStatus } from './query';

export function fetchSimpleOrdersOptions() {
  return queryOptions({
    queryKey: ['simple-orders'],
    queryFn: getAllSimpleOrders,
  });
}

export function fetchSimpleOrderOptions(id: number | string) {
  return queryOptions({
    queryKey: ['simple-orders', id],
    queryFn: () => getSimpleOrder(id),
  });
}

export function useUpdateSimpleOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number | string; status: string }) =>
      updateSimpleOrderStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['simple-orders'] });
      queryClient.invalidateQueries({ queryKey: ['simple-orders', variables.id] });
    },
  });
}
