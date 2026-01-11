import { queryOptions } from '@tanstack/react-query';
import { getTodos } from './query';

export function fetchTodosOptions() {
  return queryOptions({
    queryKey: ['todos'],
    queryFn: getTodos,
  });
}
