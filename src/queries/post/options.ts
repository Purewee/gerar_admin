import { queryOptions } from '@tanstack/react-query';
import { getPost, getPosts } from './query';

export function fetchPostsOptions() {
  return queryOptions({
    queryKey: ['posts'],
    queryFn: getPosts,
  });
}

export function fetchPostOptions(id: string) {
  return queryOptions({
    queryKey: ['post', id],
    queryFn: () => getPost(id),
  });
}
