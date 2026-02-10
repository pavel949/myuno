import React, { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { BackButton } from '@/components/uno/BackButton';

interface CategoryItem {
  id: string;
  label: string;
}

interface CatalogHeaderProps {
  title: string;
  subtitle?: string;
  fallbackPath?: string;
  categories?: CategoryItem[];
  selectedCategory?: string;
  onCategoryChange?: (id: string) => void;
  actions?: ReactNode;
  /** Extra rows below the title row (quick links, sort, etc.) */
  children?: ReactNode;
  className?: string;
}

/**
 * CatalogHeader — Standard 48px sticky header for all catalog/listing pages.
 * 
 * Provides:
 * - BackButton + title + optional subtitle
 * - Optional horizontal category ribbon (pills)
 * - Optional action buttons (sort, filter, etc.)
 * - Optional children for extra rows (quick links)
 * 
 * All mini-app Index pages should use this for visual consistency.
 */
export const CatalogHeader = memo(function CatalogHeader({
  title,
  subtitle,
  fallbackPath = '/discover',
  categories,
  selectedCategory,
  onCategoryChange,
  actions,
  children,
  className,
}: CatalogHeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50",
      className
    )}>
      {/* Title row */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <BackButton fallbackPath={fallbackPath} variant="ghost" size="sm" />
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1 shrink-0">{actions}</div>
        )}
      </div>

      {/* Category ribbon */}
      {categories && categories.length > 0 && onCategoryChange && (
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary text-foreground border-border hover:border-foreground/30"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Extra content rows (quick links, etc.) */}
      {children}
    </header>
  );
});
