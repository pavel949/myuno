import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminCommandPalette, useAdminCommandPalette } from './AdminCommandPalette';
import { AdminKeyboardShortcuts } from './AdminKeyboardShortcuts';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * AdminLayout — platform admin workspace shell (`AppLayout` + admin command palette).
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useAdminCommandPalette();

  return (
    <AppLayout variant="workspace" navRole="admin" usePageContainer={false} showFooter={false}>
      {children || <Outlet />}
      <AdminCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <AdminKeyboardShortcuts />
    </AppLayout>
  );
}
