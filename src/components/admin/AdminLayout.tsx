import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavShell } from '@/components/nav/NavShell';
import { AdminCommandPalette, useAdminCommandPalette } from './AdminCommandPalette';
import { AdminKeyboardShortcuts } from './AdminKeyboardShortcuts';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

/**
 * AdminLayout — platform admin workspace shell.
 *
 * Migrated to NavShell (Stage 4 of nav refactor). Admin-specific extras
 * (command palette + keyboard shortcuts) remain mounted alongside the shell.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useAdminCommandPalette();

  return (
    <NavShell role="admin">
      {children || <Outlet />}
      <AdminCommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <AdminKeyboardShortcuts />
    </NavShell>
  );
}
