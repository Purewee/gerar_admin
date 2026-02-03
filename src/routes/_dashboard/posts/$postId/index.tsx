import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { fetchPostOptions } from '@/queries/post/options';

const TITLE = 'Нийтлэл | Gerar';

export const Route = createFileRoute('/_dashboard/posts/$postId/')({
  head: () => ({ meta: [{ title: TITLE }] }),
  component: RouteComponent,
  pendingComponent: () => <div>Loading...</div>,
});

function RouteComponent() {
  const { postId } = useParams({ from: '/_dashboard/posts/$postId' });
  const { data } = useQuery(fetchPostOptions(postId));

  return <div>{JSON.stringify(data)}</div>;
}
