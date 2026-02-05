/**
 * ProviderFieldHint - Displays non-blocking hints and warnings for provider input fields
 * Used to improve catalog quality through guidance
 */

import React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderFieldHintProps {
  hint?: string | null;
  warning?: string | null;
  className?: string;
}

export function ProviderFieldHint({ hint, warning, className }: ProviderFieldHintProps) {
  if (!hint && !warning) return null;

  return (
    <div className={cn("space-y-1", className)}>
      {hint && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{hint}</span>
        </div>
      )}
      {warning && (
        <div className="flex items-start gap-1.5 text-xs text-warning">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}

export default ProviderFieldHint;
