import React, { forwardRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { triggerRipple } from '@/hooks/useRipple';

interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  onToggle?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ label, isActive = false, icon, onToggle, onRemove, size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-6 px-2 text-[11px] gap-0.5',
      md: 'h-7 px-2.5 text-xs gap-1',
      lg: 'h-8 px-3 text-sm gap-1.5',
    };

    return (
      <button
        ref={ref}
        onClick={(e) => {
          triggerRipple(e);
          triggerHaptic('light');
          onToggle?.();
        }}
        className={cn(
          "relative overflow-hidden inline-flex items-center rounded-full font-medium transition-all duration-200",
          "border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
          "active:scale-95 active:opacity-90 flex-shrink-0 whitespace-nowrap",
          sizeClasses[size],
          isActive
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-secondary text-secondary-foreground border-border hover:border-primary/50 hover:bg-secondary/80",
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate max-w-[120px]">{label}</span>
        {onRemove && isActive && (
          <X
            className="w-3.5 h-3.5 ml-1 hover:text-destructive cursor-pointer flex-shrink-0"
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
  return (
    <div
      className={cn(
        "flex gap-2",
        scrollable 
          ? "overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4" 
          : "flex-wrap",
        className
      )}
    >
      {children}
    </div>
  );
}