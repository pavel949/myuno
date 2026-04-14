import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { CapitalSidebar } from './CapitalSidebar';
import { CapitalHeader } from './CapitalHeader';
import { CapitalMobileNav } from './CapitalMobileNav';
import { useIsMobile } from '@/hooks/use-mobile';

export function CapitalLayout() {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden max-w-[100vw]">
        <CapitalSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 max-w-full">
          <CapitalHeader />
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-4 max-w-full scroll-smooth"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y pinch-zoom',
              paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 5rem)',
            }}
          >
            <Outlet />
          </main>
        </SidebarInset>
        <CapitalMobileNav />
      </div>
    </SidebarProvider>
  );
}
