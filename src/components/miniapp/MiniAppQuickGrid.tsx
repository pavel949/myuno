import React, { forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { getIconForEmoji, isEmoji } from '@/lib/iconMap';
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
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  const renderIcon = (icon: string | LucideIcon) => {
    // If it's already a Lucide component
    if (typeof icon !== 'string') {
      const IconComponent = icon;
      return <IconComponent className="w-6 h-6 text-primary" />;
    }
    
    // If it's an emoji string, try to get a Lucide icon
    if (isEmoji(icon)) {
      const LucideIcon = getIconForEmoji(icon);
      if (LucideIcon) {
        return <LucideIcon className="w-6 h-6 text-primary" />;
      }
    }
    
    // Fallback to displaying the emoji/string
    return <span className="text-2xl">{icon}</span>;
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
          className="relative overflow-hidden flex flex-col items-center p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all active:scale-95"
        >
          <div className="mb-1.5 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            {renderIcon(item.icon)}
          </div>
          <span className="text-xs font-medium text-center truncate w-full">{item.label}</span>
          {(item.sublabel || item.price) && (
            <span className="text-xs text-primary mt-0.5">{item.sublabel || item.price}</span>
          )}
        </button>
      ))}
    </div>
  );
});
