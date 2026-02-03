import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { VendorSidebar } from './VendorSidebar';
import { VendorHeader } from './VendorHeader';
import { useIsMobile } from '@/hooks/use-mobile';

interface VendorLayoutProps {
  children?: React.ReactNode;
}

export function VendorLayout({ children }: VendorLayoutProps) {
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
      <div className="min-h-screen flex w-full bg-background">
        <VendorSidebar />
        <SidebarInset className="flex-1 flex flex-col min-h-0">
          <VendorHeader />
          {/* SINGLE SCROLL CONTAINER - P0 Critical */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth pb-20 md:pb-4">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
