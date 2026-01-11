import { createFileRoute, redirect } from '@tanstack/react-router';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { isAuthenticated, isAdmin } from '@/lib/auth-utils';

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: ({ location }) => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login/',
        search: {
          redirect: location.href,
        },
      });
    }

    // Check if user has ADMIN role
    if (!isAdmin()) {
      throw redirect({
        to: '/login/',
        search: {
          redirect: location.href,
          error: 'admin_required',
        },
      });
    }
  },
  component: DashboardLayout,
  loader: () => {
    return {
      crumb: 'Home',
    };
  },
});
