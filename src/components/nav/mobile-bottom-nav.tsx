import { Link, useRouterState } from '@tanstack/react-router';
import { SquareTerminal, Package, ShoppingCart, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrdersSearchOptions } from '@/queries/order/options';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const items = [
  { title: 'Самбар', url: '/', icon: SquareTerminal },
  { title: 'Бүтээгдэхүүн', url: '/products', icon: Package },
  { title: 'Захиалга', url: '/orders', icon: ShoppingCart, showBadge: true },
  { title: 'Хэрэглэгчид', url: '/users', icon: Users },
] as const;

export function MobileBottomNav() {
  const isMobile = useIsMobile();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  const paidCountFilters = { status: 'PAID' as const, page: 1, limit: 1 };
  const paidCountQuery = useQuery(
    fetchOrdersSearchOptions(paidCountFilters),
  );
  const paidCount = paidCountQuery.data?.total ?? 0;

  if (!isMobile) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur md:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex h-14 items-center justify-around">
        {items.map(({ title, url, icon: Icon, showBadge }) => {
          const isActive =
            url === '/'
              ? pathname === '/' || pathname === ''
              : pathname.startsWith(url);
          return (
            <Link
              key={url}
              to={url}
              className={cn(
                'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="relative inline-flex">
                <Icon
                  className={cn('size-6 shrink-0', isActive && 'stroke-[2.5]')}
                  aria-hidden
                />
                {showBadge && paidCount > 0 && (
                  <span
                    className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground"
                    aria-label={`${paidCount} Төлөгдсөн захиалга`}
                  >
                    {paidCount > 99 ? '99+' : paidCount}
                  </span>
                )}
              </span>
              <span>{title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
