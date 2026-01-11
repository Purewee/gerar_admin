import * as z from 'zod';

export const CreatePostSchema = z.object({
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});

export const PostSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
});
