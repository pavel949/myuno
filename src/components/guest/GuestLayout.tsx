import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

interface GuestLayoutProps {
  children?: React.ReactNode;
}

/** Hotel-guest workspace shell — `AppLayout` + `navRole="guest"`. */
export function GuestLayout({ children }: GuestLayoutProps) {
  return (
    <AppLayout variant="workspace" navRole="guest" usePageContainer={false} showFooter={false}>
      {children || <Outlet />}
    </AppLayout>
  );
}
