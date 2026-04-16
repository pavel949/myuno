import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { MCSidebar } from './MCSidebar';
import { MCHeader } from './MCHeader';
import { MCMobileNav } from './MCMobileNav';
import { MCCommandPalette } from './MCCommandPalette';
import { useIsMobile } from '@/hooks/use-mobile';

interface MCLayoutProps {
  children?: React.ReactNode;
}

export function MCLayout({ children }: MCLayoutProps) {
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
        <MCSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 max-w-full">
          <MCHeader />
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-4 max-w-full scroll-smooth"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y pinch-zoom',
              paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 5rem)',
            }}
          >
            {children || <Outlet />}
          </main>
        </SidebarInset>
        <MCMobileNav />
        <MCCommandPalette />
      </div>
    </SidebarProvider>
  );
}
