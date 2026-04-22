import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

interface MCLayoutProps {
  children?: React.ReactNode;
}

/**
 * MCLayout — Management Company / Owner workspace shell.
 *
 * Thin adapter over `AppLayout` (`variant="workspace"`, `navRole="owner"`).
 */
export function MCLayout({ children }: MCLayoutProps) {
  return (
    <AppLayout variant="workspace" navRole="owner" usePageContainer={false} showFooter={false}>
      {children || <Outlet />}
    </AppLayout>
  );
}
