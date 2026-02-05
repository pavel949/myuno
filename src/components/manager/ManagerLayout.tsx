/**
 * @module ManagerLayout
 * @description Layout wrapper for Property Manager pages
 */

import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ManagerSidebar } from './ManagerSidebar';
import { ManagerMobileNav } from './ManagerMobileNav';
import { ManagerHeader } from './ManagerHeader';
import { useIsMobile } from '@/hooks/use-mobile';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';

export function ManagerLayout() {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Desktop Sidebar */}
        <ManagerSidebar />
        
        <SidebarInset className="flex flex-col min-w-0 max-w-full overflow-x-hidden">
          {/* Header */}
          <ManagerHeader />
          
          {/* Main Content */}
          <main 
            id="main-content" 
            className="flex-1 pb-20 md:pb-6 min-w-0 max-w-full overflow-x-hidden"
          >
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <LoadingSpinner size="lg" />
              </div>
            }>
              <Outlet />
            </Suspense>
          </main>
          
          {/* Mobile Bottom Navigation */}
          {isMobile && <ManagerMobileNav />}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
