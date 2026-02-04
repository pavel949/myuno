import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminCommandPalette, useAdminCommandPalette } from './AdminCommandPalette';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useAdminCommandPalette();

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
          <main className="flex-1 overflow-y-auto overflow-x-hidden pb-4 max-w-full">
            {children || <Outlet />}
          </main>
        </SidebarInset>
      </div>
      
      {/* Command Palette */}
      <AdminCommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
    </SidebarProvider>
  );
}
