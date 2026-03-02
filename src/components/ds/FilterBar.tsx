import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * DS2.0 FilterBar — listing page filter/sort bar
 * Used at top of listing pages below header.
 * 
 * Pattern: Results count + Sort dropdown + Filter button
 */
interface FilterBarProps {
  resultsCount?: number;
  resultsLabel?: string;
  sortOptions?: { id: string; label: string }[];
  activeSort?: string;
  onSortChange?: (id: string) => void;
  filterCount?: number;
  onFilterClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  resultsCount,
  resultsLabel = 'results',
  sortOptions,
  activeSort,
  onSortChange,
  filterCount = 0,
  onFilterClick,
  children,
  className,
}: FilterBarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2 py-2',
      className
    )}>
      {/* Left: Results count */}
      <div className="text-sm text-muted-foreground min-w-0">
        {resultsCount !== undefined && (
          <span>
            <span className="font-semibold text-foreground">{resultsCount}</span>
            {' '}{resultsLabel}
          </span>
        )}
      </div>

      {/* Right: Sort + Filter */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {children}

        {sortOptions && onSortChange && (
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs bg-card border border-border/60 rounded-lg px-2 py-1.5 text-foreground [box-shadow:var(--shadow-elevation-1)]"
          >
            {sortOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        )}

        {onFilterClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFilterClick}
            className="relative h-8 gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {filterCount > 0 && (
              <Badge className="h-4 w-4 p-0 flex items-center justify-center text-[9px] ml-0.5">
                {filterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
