import { useNavigate, Link } from '@tanstack/react-router';
import { LogOut, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../ui/sidebar';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function NavUser({
  user,
}: {
  user: { name: string; email: string; avatar: string; role?: string };
}) {
  const { isMobile } = useSidebar();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate({ to: '/login' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "group w-full transition-all duration-200",
                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground",
                "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                <div className="relative">
                  <Avatar className="size-9 rounded-xl border border-border shadow-sm">
                    <AvatarImage src={user.avatar === '#' ? undefined : user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 size-2.5 bg-green-500 rounded-full border-2 border-background" />
                </div>
                
                <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-semibold leading-none">{user.name}</span>
                  <span className="truncate text-[11px] text-muted-foreground leading-none">{user.email}</span>
                </div>
                
                <div className="ml-auto group-data-[collapsible=icon]:hidden">
                  <UserCircle className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-xl border-border shadow-xl p-1.5"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={12}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-2 py-2.5 bg-muted/40 rounded-lg mb-1.5">
                <Avatar className="size-10 rounded-xl border border-border">
                  <AvatarImage src={user.avatar === '#' ? undefined : user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-xl bg-primary text-primary-foreground font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col min-w-0 leading-tight">
                  <span className="truncate text-sm font-bold text-foreground">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  {user.role && (
                    <div className="mt-1 flex">
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                        {user.role}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-1" />
            <DropdownMenuItem asChild className="rounded-md gap-3 px-2 py-2 cursor-pointer transition-colors focus:bg-primary/5 focus:text-primary">
              <Link to="/profile" className="w-full flex items-center">
                <UserCircle className="size-4" />
                <span className="font-medium text-sm">Профайл</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-1" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="rounded-md gap-3 px-2 py-2 cursor-pointer transition-colors text-destructive focus:bg-destructive/5 focus:text-destructive"
            >
              <LogOut className="size-4" />
              <span className="font-medium text-sm">Гарах</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
