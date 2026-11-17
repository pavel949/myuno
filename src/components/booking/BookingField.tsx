import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

interface BookingFieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  children: ReactNode;
}

export function BookingField({ id, label, error, children }: BookingFieldProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p id={`${id}-error`} className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
