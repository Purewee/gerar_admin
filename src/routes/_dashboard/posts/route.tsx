import { createFileRoute, Outlet } from '@tanstack/react-router';

const RouteComponent = () => <Outlet />;

export const Route = createFileRoute('/_dashboard/posts')({
  component: RouteComponent,
  loader: () => {
    return {
      crumb: 'Posts',
    };
  },
});
