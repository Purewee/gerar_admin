import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import type * as z from 'zod';
import PostCard from '@/components/post-card';
import { Button } from '@/components/ui/button';
import { fetchPostsOptions } from '@/queries/post/options';
import { createPost } from '@/queries/post/query';
import type { PostSchema } from '@/queries/post/type';

export const Route = createFileRoute('/_dashboard/posts/')({
  component: Posts,
});

function Posts() {
  const { data: posts, isLoading } = useQuery(fetchPostsOptions());

  const { mutate } = useMutation({
    mutationFn: (post: z.infer<typeof PostSchema>) => createPost(post),
    onSuccess: (createdPost) => {
      toast.success('Success!');
      console.log(createdPost);
    },
  });

  const handleCreate = async () => {
    const post: z.infer<typeof PostSchema> = {
      id: 1,
      userId: 1,
      body: 'body',
      title: 'title',
    };
    mutate(post);
  };

  if (isLoading) {
    return <div>Fetching posts...</div>;
  }

  if (!posts || posts.length === 0) {
    return <span>No posts to display.</span>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={handleCreate} className="w-24 mx-auto">
        Create Post
      </Button>
      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
