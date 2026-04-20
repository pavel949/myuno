import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavShell } from '@/components/nav/NavShell';

interface MCLayoutProps {
  children?: React.ReactNode;
}

/**
 * MCLayout — Management Company / Owner workspace shell.
 *
 * Migrated to NavShell (Stage 3 of nav refactor). NavShell composes:
 *  - SideRail (full sidebar on desktop, mini-collapse on tablet)
 *  - TopBar (header with sidebar trigger + utilities)
 *  - BottomBar (mobile only, role-aware)
 *  - ContextualFAB (mobile quick actions)
 * All sourced from the unified navigation model.
 */
export function MCLayout({ children }: MCLayoutProps) {
  return (
    <NavShell role="owner">
      {children || <Outlet />}
    </NavShell>
  );
}
