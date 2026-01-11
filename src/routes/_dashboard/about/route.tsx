import { createFileRoute, Outlet } from '@tanstack/react-router';

const RouteComponent = () => <Outlet />;

export const Route = createFileRoute('/_dashboard/about')({
  component: RouteComponent,
  loader: () => {
    return {
      crumb: 'About',
    };
  },
});
