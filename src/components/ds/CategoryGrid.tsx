import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

/**
 * DS2.0 CategoryGrid — Super-App home hub category navigation
 * Inspired by Gojek/Grab category grids.
 * 
 * Renders a responsive grid of category items with icon + label.
 */
export interface CategoryGridItem {
  id: string;
  icon: LucideIcon | string;
  label: string;
  color?: string;
  badge?: string;
  onClick?: () => void;
}

interface CategoryGridProps {
  items: CategoryGridItem[];
  columns?: 3 | 4 | 5;
  className?: string;
}

export function CategoryGrid({ items, columns = 4, className }: CategoryGridProps) {
  const gridCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8',
    5: 'grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10',
  };

  return (
    <div className={cn('grid gap-3', gridCols[columns], className)}>
      {items.map((item) => (
        <CategoryGridCell key={item.id} item={item} />
      ))}
    </div>
  );
}

function CategoryGridCell({ item }: { item: CategoryGridItem }) {
  const isStringIcon = typeof item.icon === 'string';
  const Icon = !isStringIcon ? (item.icon as LucideIcon) : null;

  return (
    <button
      onClick={item.onClick}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2',
        'rounded-none p-3 min-h-[88px]',
        'bg-card border border-border/60',
        '[box-shadow:var(--shadow-elevation-1)]',
        'hover:[box-shadow:var(--shadow-elevation-2)] hover:-translate-y-0.5 hover:border-primary/30',
        'active:scale-95',
        'transition-all duration-150',
        'group'
      )}
    >
      {/* Badge */}
      {item.badge && (
        <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
          {item.badge}
        </span>
      )}

      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-none flex items-center justify-center',
        'bg-gradient-to-br from-primary/15 to-primary/5',
        'group-hover:scale-110 transition-transform duration-150'
      )}>
        {isStringIcon ? (
          <span className="text-xl">{item.icon as string}</span>
        ) : Icon ? (
          <Icon className="w-5 h-5 text-primary" />
        ) : null}
      </div>

      {/* Label */}
      <span className="text-[10px] sm:text-[11px] font-medium text-center leading-tight line-clamp-2 text-muted-foreground group-hover:text-foreground transition-colors">
        {item.label}
      </span>
    </button>
  );
}
