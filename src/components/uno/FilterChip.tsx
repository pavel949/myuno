import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  onToggle?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FilterChip({
  label,
  isActive = false,
  icon,
  onToggle,
  onRemove,
  size = 'md',
  className,
}: FilterChipProps) {
  const sizeClasses = {
    sm: 'h-7 px-2.5 text-xs gap-1',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-sm gap-2',
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all duration-200",
        "border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        sizeClasses[size],
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-secondary text-secondary-foreground border-border hover:border-primary/50 hover:bg-secondary/80",
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{label}</span>
      {onRemove && isActive && (
        <X
          className="w-3.5 h-3.5 ml-1 hover:text-destructive cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </button>
  );
}

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
