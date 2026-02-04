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
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden max-w-[100vw]">
        <VendorSidebar />
        <SidebarInset className="flex-1 flex flex-col min-h-0 min-w-0 max-w-full">
          <VendorHeader />
          {/* SINGLE SCROLL CONTAINER - Mobile-optimized with safe-area support */}
          <main 
            className="flex-1 overflow-y-auto overflow-x-hidden pb-safe md:pb-4 max-w-full"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              // Allow both vertical and horizontal gestures for nested scrollable content
              touchAction: 'pan-x pan-y pinch-zoom',
              paddingBottom: 'max(env(safe-area-inset-bottom, 20px), 5rem)',
            }}
          >
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
