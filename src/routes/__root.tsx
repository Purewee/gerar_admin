import { createRootRoute, HeadContent, Outlet } from '@tanstack/react-router';

const APP_TITLE = 'Gerar';

export const Route = createRootRoute({
  head: () => ({
    meta: [{ title: APP_TITLE }],
  }),
  component: () => {
    return (
      <>
        <HeadContent />
        <Outlet />
      </>
    );
  },
});
