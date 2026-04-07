import { Link } from '@tanstack/react-router';
import { SquareTerminal, FolderTree, Package, ShoppingCart, Users, ArrowUpDown, Settings, BarChart3, Image, Star, PackageOpen } from 'lucide-react';

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
  navGroups: [
    {
      label: 'Үндсэн',
      items: [
        {
          title: 'Самбар',
          url: '/',
          icon: SquareTerminal,
        },
        {
          title: 'Захиалга',
          url: '/orders',
          icon: ShoppingCart,
        },
        {
          title: 'Simple захиалга',
          url: '/simple-orders',
          icon: PackageOpen,
        },
        {
          title: 'Бүтээгдэхүүн',
          url: '/products',
          icon: Package,
        },
        {
          title: 'Хэрэглэгчид',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Аналитик',
          url: '/analytics',
          icon: BarChart3,
        },
        {
          title: 'Лояалти дэлгүүр',
          url: '/point-products',
          icon: Star,
        },
      ],
    },
    {
      label: 'Контент',
      items: [
        {
          title: 'Ангилал',
          url: '/categories',
          icon: FolderTree,
        },
        {
          title: 'Баннер',
          url: '/banners',
          icon: Image,
        },
        {
          title: 'Онцлох',
          url: '/features',
          icon: Star,
        },
      ],
    },
    {
      label: 'Удирдлага',
      items: [
        {
          title: 'Барааны дараалал',
          url: '/products/order',
          icon: ArrowUpDown,
        },
        {
          title: 'Ангиллын дараалал',
          url: '/categories/order',
          icon: ArrowUpDown,
        },
        {
          title: 'Тогтмол утгууд',
          url: '/constants',
          icon: Settings,
        },
      ],
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
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link to="/" className="flex items-center gap-3">
                <div className="bg-primary text-primary-foreground flex aspect-square size-9 items-center justify-center rounded-xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                  <SquareTerminal className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                  <span className="text-lg font-bold tracking-tight">Gerar</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {data.navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {userInfo && <NavUser user={userInfo} />}
      </SidebarFooter>
    </Sidebar>
  );
}
