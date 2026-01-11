import { queryOptions } from '@tanstack/react-query';
import { getAllOrders, getOrder } from './query';

export function fetchOrdersOptions() {
  return queryOptions({
    queryKey: ['orders'],
    queryFn: getAllOrders,
  });
}

export function fetchOrderOptions(id: number) {
  return queryOptions({
    queryKey: ['orders', id],
    queryFn: () => getOrder(id),
  });
}
