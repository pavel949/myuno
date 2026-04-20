import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavShell } from '@/components/nav/NavShell';

interface GuestLayoutProps {
  children?: React.ReactNode;
}

/**
 * GuestLayout — hotel-guest workspace shell.
 * Migrated to NavShell (Stage 4 of nav refactor).
 */
export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <NavShell role="guest">
      {children || <Outlet />}
    </NavShell>
  );
}
