import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavShell } from '@/components/nav/NavShell';

interface VendorLayoutProps {
  children?: React.ReactNode;
}

/**
 * VendorLayout — vendor workspace shell.
 * Migrated to NavShell (Stage 4 of nav refactor).
 */
export function VendorLayout({ children }: VendorLayoutProps) {
  return (
    <NavShell role="vendor">
      {children || <Outlet />}
    </NavShell>
  );
}
