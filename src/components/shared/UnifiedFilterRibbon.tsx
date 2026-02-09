import React, { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { resolveIcon } from '@/lib/iconMap';

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
      "bg-secondary",
      "border border-border",
      isActive && "bg-primary/15 text-primary border-primary/30"
    ),
    primary: cn(
      "bg-primary/10",
      "border border-primary/20 hover:border-primary/40",
      "text-primary",
      isActive && "bg-primary text-primary-foreground border-primary"
    ),
    accent: cn(
      "bg-accent",
      "border border-border hover:border-primary/30",
      "text-accent-foreground",
      isActive && "bg-primary/15 text-primary border-primary/30"
    ),
  };

  return (
    <button
      onClick={onClick}
      className={cn(baseClasses, variantClasses[item.variant || 'default'])}
    >
      {item.image && (
        <div className="w-5 h-5 rounded-md overflow-hidden">
          <img src={item.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {item.emoji && (() => {
        const EmojiIcon = resolveIcon(item.emoji);
        return <EmojiIcon className="w-4 h-4" />;
      })()}
      {Icon && <Icon className="w-4 h-4" />}
      <span className="whitespace-nowrap">{item.label}</span>
    </button>
  );
});
