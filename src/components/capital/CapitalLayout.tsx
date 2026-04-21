import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { CapitalSidebar } from './CapitalSidebar';
import { CapitalHeader } from './CapitalHeader';
import { BottomBar } from '@/components/nav/BottomBar';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * CapitalLayout — workspace shell for /capital/*.
 *
 * Capital is an admin-uno_team workflow (sales/CRM/pipelines for the
 * platform's own outbound). Desktop keeps the existing CapitalSidebar +
 * CapitalHeader. Mobile uses the canonical role-aware <BottomBar role="admin" />
 * instead of the legacy CapitalMobileNav so navigation matches the rest of
 * the platform. To get capital-specific 5-tab nav, add a `capital` role to
 * `src/lib/nav/navigationModel.ts` in a follow-up.
 */
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
        <BottomBar role="admin" />
      </div>
    </SidebarProvider>
  );
}
