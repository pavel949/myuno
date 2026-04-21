import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { StaffSidebar } from './StaffSidebar';
import { StaffHeader } from './StaffHeader';
import { BottomBar } from '@/components/nav/BottomBar';
import { useIsMobile } from '@/hooks/use-mobile';

interface StaffLayoutProps {
  children?: React.ReactNode;
}

/**
 * StaffLayout — workspace shell for /staff/*.
 *
 * Renders the existing StaffSidebar + StaffHeader (desktop chrome) and adds
 * the canonical mobile <BottomBar role="team" /> so /staff is consistent
 * with the rest of the platform navigation. The sidebar handles desktop
 * navigation; the bottom bar handles <md viewports.
 */
export function StaffLayout({ children }: StaffLayoutProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        const trigger = document.querySelector('[data-sidebar="trigger"]') as HTMLButtonElement;
        if (trigger) trigger.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden max-w-[100vw]">
        <StaffSidebar />
        <SidebarInset className="flex-1 flex flex-col min-h-0 min-w-0 max-w-full">
          <StaffHeader />
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden pb-safe md:pb-4 max-w-full"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y pinch-zoom',
              paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 5rem)',
            }}
          >
            {children || <Outlet />}
          </main>
        </SidebarInset>
        <BottomBar role="team" />
      </div>
    </SidebarProvider>
  );
}
