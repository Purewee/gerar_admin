import { Link, useLocation } from '@tanstack/react-router';
import type { LucideIcon } from 'lucide-react';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  useSidebar,
} from '../ui/sidebar';
import { cn } from '@/lib/utils';

export function NavMain({
  label,
  items,
}: {
  label: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const { setOpenMobile, isMobile } = useSidebar();
  const location = useLocation();

  return (
    <SidebarGroup className="py-2">
      <SidebarGroupLabel className="px-3 text-muted-foreground uppercase tracking-wider font-semibold text-[10px]">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
          
          return (
            <SidebarMenuButton
              onClick={() => isMobile && setOpenMobile(false)}
              key={item.title}
              asChild
              tooltip={item.title}
              isActive={isActive}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-lg",
                isActive 
                  ? "bg-primary/10 text-primary font-medium shadow-sm ring-1 ring-primary/20" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Link to={item.url} className="w-full">
                {item.icon && (
                  <item.icon 
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} 
                  />
                )}
                <span className="truncate">{item.title}</span>
                {isActive && (
                  <div className="absolute left-0 w-1 h-3/5 bg-primary rounded-r-full group-data-[collapsible=icon]:hidden" />
                )}
              </Link>
            </SidebarMenuButton>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
