import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminCommandPalette, useAdminCommandPalette } from './AdminCommandPalette';
import { AdminMobileBottomNav } from './AdminMobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMaintenance } from '@/contexts/MaintenanceContext';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useAdminCommandPalette();
  
  // Ensure admin routes always bypass maintenance mode
  const { canBypass } = useMaintenance();

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
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden max-w-[100vw]">
        <AdminSidebar />
        <SidebarInset className="flex-1 flex flex-col min-w-0 max-w-full">
          <AdminHeader onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
          <main className={`flex-1 overflow-y-auto overflow-x-hidden max-w-full ${isMobile ? 'pb-20' : 'pb-4'}`}>
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
      
      {/* Mobile Bottom Navigation */}
      {isMobile && <AdminMobileBottomNav />}
      
      {/* Command Palette */}
      <AdminCommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
    </SidebarProvider>
  );
}
