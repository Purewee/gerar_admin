import { Link } from '@tanstack/react-router';
import type * as z from 'zod';
import type { PostSchema } from '@/queries/post/type';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
export default function PostCard({
  post,
}: {
  post: z.infer<typeof PostSchema>;
}) {
  return (
    <Link
      to="/posts/$postId"
      params={{
        postId: post.id.toString(),
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
          <CardDescription>user: {post.userId}</CardDescription>
        </CardHeader>
        <CardContent>{post.body}</CardContent>
      </Card>
    </Link>
  );
}
