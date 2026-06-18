/**
 * MapListItem — компактная карточка одного pin'а для списка под картой /map.
 */
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface MapListItemProps {
  id: string;
  icon?: React.ReactNode;
  color?: string;
  title: string;
  subtitle?: string;
  rating?: number;
  priceLabel?: string;
  isSelected?: boolean;
  onSelect: (id: string) => void;
}

export function MapListItem({
  id,
  icon,
  color,
  title,
  subtitle,
  rating,
  priceLabel,
  isSelected,
  onSelect,
}: MapListItemProps) {
  const ref = React.useRef<HTMLButtonElement | null>(null);

  // Auto-scroll into view when selected externally (e.g. pin click).
  React.useEffect(() => {
    if (isSelected && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isSelected]);

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isSelected}
      data-listing-id={id}
      onClick={() => onSelect(id)}
      className={cn(
        'w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/60 transition-colors',
        'hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-muted/60',
        isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary',
      )}
    >
      <span
        aria-hidden
        className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
        style={{ background: color ? `${color}1A` : 'hsl(var(--muted))', color: color || undefined }}
      >
        {icon ?? '·'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-foreground truncate">{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</div>
        )}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
          {typeof rating === 'number' && rating > 0 && <span>⭐ {rating.toFixed(1)}</span>}
          {priceLabel && <span className="text-primary font-medium">{priceLabel}</span>}
        </div>
      </div>
    </button>
  );
}
