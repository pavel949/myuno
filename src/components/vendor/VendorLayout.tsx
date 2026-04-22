import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';

interface VendorLayoutProps {
  children?: React.ReactNode;
}

/** Vendor workspace shell — `AppLayout` + `navRole="vendor"`. */
export function VendorLayout({ children }: VendorLayoutProps) {
  return (
    <AppLayout variant="workspace" navRole="vendor" usePageContainer={false} showFooter={false}>
      {children || <Outlet />}
    </AppLayout>
  );
}
