import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';

export interface QuickGridItem {
  icon: string;
  label: string;
  sublabel?: string;
  path?: string;
  onClick?: () => void;
  price?: string;
}

interface MiniAppQuickGridProps {
  items: QuickGridItem[];
  columns?: 3 | 4 | 5;
  className?: string;
}

export function MiniAppQuickGrid({ 
  items, 
  columns = 4,
  className 
}: MiniAppQuickGridProps) {
  const navigate = useNavigate();

  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={(e) => {
            triggerRipple(e);
            if (item.onClick) {
              item.onClick();
            } else if (item.path) {
              navigate(item.path);
            }
          }}
          className="relative overflow-hidden flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-95"
        >
          <span className="text-2xl mb-1">{item.icon}</span>
          <span className="text-xs font-medium text-center truncate w-full">{item.label}</span>
          {(item.sublabel || item.price) && (
            <span className="text-xs text-primary mt-0.5">{item.sublabel || item.price}</span>
          )}
        </button>
      ))}
    </div>
  );
}
