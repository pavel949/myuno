import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { resolveIcon } from '@/lib/iconMap';
import type { LucideIcon } from 'lucide-react';

export interface QuickGridItem {
  icon: string | LucideIcon;
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

export const MiniAppQuickGrid = forwardRef<HTMLDivElement, MiniAppQuickGridProps>(
  function MiniAppQuickGrid({ items, columns = 4, className }, ref) {
  const navigate = useNavigate();

  const gridCols = {
    3: 'grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
    4: 'grid-cols-4 md:grid-cols-5 lg:grid-cols-8',
    5: 'grid-cols-5 md:grid-cols-6 lg:grid-cols-8',
  };

  const renderIcon = (icon: string | LucideIcon) => {
    const Resolved = resolveIcon(icon);
    return <Resolved className="w-5 h-5 text-primary" strokeWidth={2.2} />;
  };

  return (
    <div ref={ref} className={cn("grid gap-3", gridCols[columns], className)}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={(e) => {
            triggerRipple(e);
            const settings = getFeedbackSettings();
            if (settings.hapticEnabled) {
              triggerHaptic('light');
            }
            if (settings.soundEnabled) {
              playSound('click');
            }
            if (item.onClick) {
              item.onClick();
            } else if (item.path) {
              navigate(item.path);
            }
          }}
          className="relative overflow-hidden flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-95 shadow-sm"
        >
          <div className="mb-1.5 flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
            {renderIcon(item.icon)}
          </div>
          <span className="text-xs font-medium text-center truncate w-full text-foreground">{item.label}</span>
          {(item.sublabel || item.price) && (
            <span className="text-xs text-primary mt-0.5">{item.sublabel || item.price}</span>
          )}
        </button>
      ))}
    </div>
  );
});
