import React from 'react';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { resolveIcon } from '@/lib/iconMap';
import { Box, type LucideIcon } from 'lucide-react';

export interface QuickAction {
  icon: string | LucideIcon;
  label: string;
  price?: string;
  onClick?: () => void;
}

interface MiniAppQuickActionsProps {
  actions: QuickAction[];
  columns?: 3 | 4;
  className?: string;
}

const renderActionIcon = (icon: string | LucideIcon) => {
  const Resolved = resolveIcon(icon);
  return (
    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
      <Resolved className="w-5 h-5 text-primary" strokeWidth={2.2} />
    </div>
  );
};

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
          className="relative overflow-hidden flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-95 shadow-sm"
        >
          <div className="mb-1.5">{renderActionIcon(action.icon)}</div>
          <span className="text-xs font-medium text-center truncate w-full text-foreground">
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
