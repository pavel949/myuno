import React, { forwardRef } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { resolveIcon } from '@/lib/iconMap';

interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isActive?: boolean;
  icon?: React.ReactNode | string;
  onToggle?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

// Standard icon sizes for consistency across the app
const iconSizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ label, isActive = false, icon, onToggle, onRemove, size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-6 px-2 text-[11px] gap-1',
      md: 'h-7 px-2.5 text-xs gap-1.5',
      lg: 'h-8 px-3 text-sm gap-2',
    };

    const renderIcon = () => {
      if (!icon) return null;
      
      // If icon is a string (emoji), resolve to Lucide icon
      if (typeof icon === 'string') {
        const Resolved = resolveIcon(icon);
        return <Resolved className={cn(iconSizeClasses[size], "flex-shrink-0")} />;
      }
      
      // React node (already an icon component)
      return <span className="flex-shrink-0">{icon}</span>;
    };

    return (
      <button
        ref={ref}
        onClick={(e) => {
          triggerHaptic('light');
          onToggle?.();
        }}
        className={cn(
          "relative overflow-hidden inline-flex items-center rounded-full font-medium transition-all duration-200",
          "border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          "flex-shrink-0",
          sizeClasses[size],
          isActive
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-secondary text-secondary-foreground border-border hover:border-primary/50 hover:bg-secondary/80",
          className
        )}
        {...props}
      >
        {renderIcon()}
        <span className="truncate max-w-[100px]">{label}</span>
        {onRemove && isActive && (
          <X
            className={cn(iconSizeClasses[size], "ml-1 hover:text-destructive cursor-pointer flex-shrink-0")}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          />
        )}
      </button>
    );
  }
);

FilterChip.displayName = 'FilterChip';

// Group component for organizing filter chips
interface FilterChipGroupProps {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function FilterChipGroup({ children, className, scrollable = false }: FilterChipGroupProps) {
  if (scrollable) {
    return (
      <div className="overflow-hidden -mx-4">
        <div
          className={cn(
            "flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 touch-pan-y",
            className
          )}
        >
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn("flex gap-2 flex-wrap", className)}>
      {children}
    </div>
  );
}