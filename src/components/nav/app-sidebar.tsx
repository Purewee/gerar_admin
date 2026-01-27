import { Link } from '@tanstack/react-router';
import { SquareTerminal, FolderTree, Package, ShoppingCart, Users, ArrowUpDown, Settings, BarChart3 } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { useAuth } from '@/lib/auth-context';

const data = {
  navMain: [
    {
      title: 'Самбар',
      url: '/',
      icon: SquareTerminal,
      isActive: false,
    },
    {
      title: 'Аналитик',
      url: '/analytics',
      icon: BarChart3,
      isActive: false,
    },
    {
      title: 'Ангилал',
      url: '/categories',
      icon: FolderTree,
      isActive: false,
    },
    {
      title: 'Бүтээгдэхүүн',
      url: '/products',
      icon: Package,
      isActive: false,
    },
    {
      title: 'Захиалга',
      url: '/orders',
      icon: ShoppingCart,
      isActive: false,
    },
    {
      title: 'Хэрэглэгчид',
      url: '/users',
      icon: Users,
      isActive: false,
    },
    {
      title: 'Барааны дараалал',
      url: '/products/order',
      icon: ArrowUpDown,
      isActive: false,
    },
    {
      title: 'Ангиллын дараалал',
      url: '/categories/order',
      icon: ArrowUpDown,
      isActive: false,
    },
    {
      title: 'Тогтмол утгууд',
      url: '/constants',
      icon: Settings,
      isActive: false,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();

  // Create user object for NavUser component
  const userInfo = user
    ? {
        name: user.name,
        email: user.phoneNumber, // Using phoneNumber as email since API doesn't have email
        avatar: '#',
        role: user.role,
      }
    : null;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="bg-zinc-700 text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <SquareTerminal className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Gerar</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {userInfo && <NavUser user={userInfo} />}
      </SidebarFooter>
    </Sidebar>
  );
}
