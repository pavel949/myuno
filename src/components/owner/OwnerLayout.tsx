import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { OwnerSidebar } from './OwnerSidebar';
import { OwnerHeader } from './OwnerHeader';
import { OwnerMobileNav } from './OwnerMobileNav';
import { OwnerOnboardingTour } from './onboarding/OwnerOnboardingTour';
import { useIsMobile } from '@/hooks/use-mobile';

interface OwnerLayoutProps {
  children?: React.ReactNode;
}

export function OwnerLayout({ children }: OwnerLayoutProps) {
  const isMobile = useIsMobile();

  // Keyboard shortcut Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        // Toggle sidebar via the SidebarProvider's internal mechanism
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
        <OwnerSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <OwnerHeader />
          <main className="flex-1 overflow-auto pb-20 md:pb-4">
            {children || <Outlet />}
          </main>
        </SidebarInset>
        
        {/* Mobile Bottom Navigation */}
        <OwnerMobileNav />
        
        {/* Onboarding Tour */}
        <OwnerOnboardingTour autoStart />
      </div>
    </SidebarProvider>
  );
}
