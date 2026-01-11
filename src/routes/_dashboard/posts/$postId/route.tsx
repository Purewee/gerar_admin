import { createFileRoute, Outlet } from '@tanstack/react-router';

const RouteComponent = () => <Outlet />;

export const Route = createFileRoute('/_dashboard/posts/$postId')({
  component: RouteComponent,
  loader: ({ params }) => {
    const { postId } = params;
    return {
      crumb: postId,
    };
  },
});
