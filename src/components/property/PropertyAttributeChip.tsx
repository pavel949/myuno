import React from 'react';
import { cn } from '@/lib/utils';

/** Shared chip styling for listing / unit / project attribute pills */
export const PROPERTY_ATTRIBUTE_CHIP_CLASS =
  'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-sm';

export function PropertyAttributeChip({
  icon,
  children,
  className,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(PROPERTY_ATTRIBUTE_CHIP_CLASS, className)}>
      {icon}
      {children}
    </div>
  );
}
