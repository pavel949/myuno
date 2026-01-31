import React, { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface FilterRibbonItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  emoji?: string;
  image?: string;
  variant?: 'default' | 'primary' | 'accent';
}

interface UnifiedFilterRibbonProps {
  items: FilterRibbonItem[];
  activeId?: string;
  onSelect: (id: string) => void;
  leadingAction?: ReactNode;
  trailingAction?: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export const UnifiedFilterRibbon = memo(function UnifiedFilterRibbon({
  items,
  activeId,
  onSelect,
  leadingAction,
  trailingAction,
  className,
  scrollable = true,
}: UnifiedFilterRibbonProps) {
  const containerClass = scrollable 
    ? "flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-x pb-1"
    : "flex items-center gap-2 flex-wrap";

  return (
    <div className={cn("bg-card border-b border-border/50", className)}>
      <div className="px-3 py-2.5 max-w-7xl mx-auto">
        <div className={containerClass}>
          {leadingAction}
          
          {leadingAction && items.length > 0 && (
            <div className="w-px h-6 bg-border shrink-0" />
          )}
          
          {items.map((item) => (
            <RibbonButton
              key={item.id}
              item={item}
              isActive={activeId === item.id}
              onClick={() => onSelect(item.id)}
            />
          ))}
          
          {trailingAction}
        </div>
      </div>
    </div>
  );
});

interface RibbonButtonProps {
  item: FilterRibbonItem;
  isActive: boolean;
  onClick: () => void;
}

const RibbonButton = memo(function RibbonButton({ item, isActive, onClick }: RibbonButtonProps) {
  const Icon = item.icon;
  
  const baseClasses = "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors shrink-0";
  
  const variantClasses = {
    default: cn(
      "bg-muted/60 hover:bg-muted text-foreground",
      isActive && "bg-primary/15 text-primary border border-primary/30"
    ),
    primary: cn(
      "bg-primary/10 hover:bg-primary/20 text-primary",
      isActive && "bg-primary text-primary-foreground"
    ),
    accent: cn(
      "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30",
      "hover:from-orange-200 hover:to-amber-200 text-orange-700 dark:text-orange-300",
      isActive && "ring-2 ring-orange-400"
    ),
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, variantClasses[item.variant || 'default'])}
    >
      {item.image && (
        <img src={item.image} alt="" className="w-4 h-4 rounded object-cover" />
      )}
      {item.emoji && <span className="text-base">{item.emoji}</span>}
      {Icon && <Icon className="w-4 h-4" />}
      <span className="whitespace-nowrap">{item.label}</span>
    </button>
  );
});
