import React from 'react';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';

export interface QuickAction {
  icon: string;
  label: string;
  price?: string;
  onClick?: () => void;
}

interface MiniAppQuickActionsProps {
  actions: QuickAction[];
  columns?: 3 | 4;
  className?: string;
}

export function MiniAppQuickActions({
  actions,
  columns = 4,
  className,
}: MiniAppQuickActionsProps) {
  return (
    <div className={cn(
      "grid gap-3",
      columns === 4 ? "grid-cols-4" : "grid-cols-3",
      className
    )}>
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={(e) => {
            triggerRipple(e);
            action.onClick?.();
          }}
          className="relative overflow-hidden flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-95"
        >
          <span className="text-2xl mb-1">{action.icon}</span>
          <span className="text-xs font-medium text-center truncate w-full">
            {action.label}
          </span>
          {action.price && (
            <span className="text-xs text-primary mt-1">{action.price}</span>
          )}
        </button>
      ))}
    </div>
  );
}
