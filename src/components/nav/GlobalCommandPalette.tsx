/**
 * GlobalCommandPalette — role-aware ⌘K command palette.
 *
 * MIGRATION STAGE 1: Thin facade over existing role-specific palettes.
 * MCCommandPalette and AdminCommandPalette continue to own their search
 * logic; this module just dispatches to the right one. In a later phase the
 * implementations will be merged into a single role-driven component that
 * reads from `quickLinks` derived from `SIDEBAR_NAV[role]`.
 */
import React from 'react';
import { MCCommandPalette } from '@/components/mc/MCCommandPalette';
import { AdminCommandPalette } from '@/components/admin/AdminCommandPalette';
import type { NavRoleKey } from '@/lib/nav/navigationModel';

interface GlobalCommandPaletteProps {
  role: NavRoleKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalCommandPalette({ role, open, onOpenChange }: GlobalCommandPaletteProps) {
  if (role === 'owner') {
    return <MCCommandPalette open={open} onOpenChange={onOpenChange} />;
  }
  if (role === 'admin' || role === 'team') {
    return <AdminCommandPalette open={open} onOpenChange={onOpenChange} />;
  }
  // Consumer / vendor / mc_portal — handled by GlobalSearchModal in TopBar.
  return null;
}
