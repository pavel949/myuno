import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { GuestSidebar } from './GuestSidebar';
import { GuestHeader } from './GuestHeader';
import { useIsMobile } from '@/hooks/use-mobile';

interface GuestLayoutProps {
  children?: React.ReactNode;
}

export function GuestLayout({ children }: GuestLayoutProps) {
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
        <GuestSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <GuestHeader />
          <main className="flex-1 overflow-auto pb-20 md:pb-4">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
