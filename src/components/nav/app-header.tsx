import { BreadcrumbNav } from '../breadrumb-nav';
import { ModeToggle } from '../mode-toggle';
import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';

export function AppHeader() {
  return (
    <header className="flex gap-4 h-(--header-height) shrink-0 items-center border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
        <BreadcrumbNav />
        <div className="flex ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
