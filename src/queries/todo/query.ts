import type * as z from 'zod';
import { API_BASE_URL } from '../../lib/api-config';
import fetchAndValidate from '../../lib/fetcher';
import { TodoSchema } from './type';

export const getTodos = async (): Promise<z.infer<typeof TodoSchema>[]> => {
  const todos = await fetchAndValidate(
    `${API_BASE_URL}/todos`,
    TodoSchema.array(),
  );

  return todos;
};
