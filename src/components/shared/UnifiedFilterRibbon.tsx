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
    ? "flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 touch-pan-y snap-x snap-mandatory"
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
  
  const baseClasses = cn(
    "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium shrink-0",
    "transition-all duration-200"
  );
  
  const variantClasses = {
    default: cn(
      "bg-white/80 dark:bg-white/10",
      "backdrop-blur-md",
      "border border-white/50 dark:border-white/20",
      "shadow-sm hover:shadow-md",
      isActive && "bg-primary/15 text-primary border-primary/30 shadow-primary/10"
    ),
    primary: cn(
      "bg-gradient-to-r from-primary/10 to-amber-500/10",
      "border border-primary/20 hover:border-primary/40",
      "text-primary",
      isActive && "bg-primary text-primary-foreground border-primary"
    ),
    accent: cn(
      "bg-gradient-to-r from-orange-500/15 to-amber-500/15",
      "border border-amber-500/30 hover:border-amber-500/50",
      "text-amber-700 dark:text-amber-300",
      isActive && "ring-2 ring-orange-400"
    ),
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, variantClasses[item.variant || 'default'])}
    >
      {item.image && (
        <div className="w-5 h-5 rounded-md overflow-hidden shadow-sm">
          <img src={item.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {item.emoji && (
        <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
          <span className="text-xs">{item.emoji}</span>
        </div>
      )}
      {Icon && <Icon className="w-4 h-4" />}
      <span className="whitespace-nowrap">{item.label}</span>
    </button>
  );
});
