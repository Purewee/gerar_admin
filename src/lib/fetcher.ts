import type * as z from 'zod';

export default async function fetchAndValidate<T>(
  url: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();

  const result = schema.safeParse(json);

  if (!result.success) {
    throw new Error('invalid API response');
  }

  return result.data;
}
