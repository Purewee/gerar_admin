import { Outlet } from '@tanstack/react-router';

export function PublicLayout() {
  return (
    <div className="@container/main flex flex-1 flex-col">
      <Outlet />
    </div>
  );
}
