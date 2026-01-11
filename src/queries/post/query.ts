import type * as z from 'zod';
import { API_BASE_URL } from '@/lib/api-config';
import fetchAndValidate from '@/lib/fetcher';
import { CreatePostSchema, PostSchema } from './type';

export const createPost = async (post: z.infer<typeof CreatePostSchema>) => {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  };

  const res = await fetch(`${API_BASE_URL}/posts`, options);
  const data = await res.json();
  return CreatePostSchema.parse(data);
};

export const getPosts = async (): Promise<z.infer<typeof PostSchema>[]> => {
  const posts = await fetchAndValidate(
    `${API_BASE_URL}/posts`,
    PostSchema.array(),
  );
  return posts;
};

export const getPost = async (
  id: string,
): Promise<z.infer<typeof PostSchema>> => {
  const post = await fetchAndValidate(
    `${API_BASE_URL}/posts/${id}`,
    PostSchema,
  );
  return post;
};
