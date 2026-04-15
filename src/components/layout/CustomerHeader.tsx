import React from 'react';
import { AppHeader } from './AppHeader';

interface CustomerHeaderProps {
  title?: string;
  className?: string;
}

/**
 * Canonical header for customer/public surfaces.
 * Keeps existing AppHeader behavior while giving layouts a stable contract.
 */
export function CustomerHeader({ title, className }: CustomerHeaderProps) {
  return <AppHeader title={title} className={className} />;
}
