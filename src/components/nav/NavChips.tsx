/**
 * NavChips — horizontal scrollable chips strip.
 *
 * Use cases (Phase 2 of nav refactor):
 *  - /discover cluster filter (All · Arrive · Live · …)
 *  - Home contextual quick-actions ("Find a service", "My objects", …)
 *  - Workspace filter chips (Status · Type · Priority)
 *
 * Behaviour:
 *  - Fixed height (32px), 44px touch target via vertical padding tweaks
 *  - Active chip uses semantic `--primary`; inactive uses `--muted`
 *  - Scrolls horizontally with momentum, scrollbar hidden
 *  - Sticky=true wraps in a sticky container with backdrop blur
 *  - Pure CSS tokens — no hardcoded hex
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface NavChipItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional accent color override (cluster color). Falls back to primary. */
  accentColor?: string;
  /** Optional small badge / count shown on the right. */
  count?: number | string;
}

export interface NavChipsProps {
  items: NavChipItem[];
  activeId?: string | null;
  onChange: (id: string) => void;
  /** Wrap in a sticky-top container with backdrop blur. */
  sticky?: boolean;
  /** Top offset when sticky (e.g. height of HomeTopBar). Defaults to 0. */
  stickyTop?: number;
  className?: string;
  ariaLabel?: string;
  /**
   * Background tone the chips sit on. `default` = cream/page surface,
   * `onNavy` = canonical navy brand band (used by the home header).
   * Anything other than `default` swaps the active/inactive contract so
   * the chips read as part of the band, not stranded on top of it.
   */
  tone?: 'default' | 'onNavy';
}

export function NavChips({
  items,
  activeId,
  onChange,
  sticky,
  stickyTop = 0,
  className,
  ariaLabel,
  tone = 'default',
}: NavChipsProps) {
  const isOnNavy = tone === 'onNavy';
  const content = (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'flex items-center gap-2 overflow-x-auto scrollbar-hide',
        '-mx-4 px-4 py-1 snap-x',
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = item.icon;
        const accent = item.accentColor;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex items-center gap-1.5 shrink-0 snap-start',
              'h-9 px-3.5 rounded-full',
              'text-[13px] font-medium whitespace-nowrap',
              'transition-colors duration-150',
              'border',
              isOnNavy
                ? active
                  // Inverted: cream pill on navy reads as the strongest CTA
                  // without breaking the canonical navy/cream/orange triad.
                  ? 'bg-primary-foreground text-primary border-primary-foreground shadow-sm'
                  : 'bg-primary-foreground/[0.08] text-primary-foreground/85 border-primary-foreground/15 hover:bg-primary-foreground/[0.14] hover:text-primary-foreground hover:border-primary-foreground/25'
                : active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-[hsl(var(--bg-elevated))] text-muted-foreground border-border/60 hover:text-foreground hover:border-border',
            )}
            style={
              active && accent && !isOnNavy
                ? { background: accent, borderColor: accent, color: 'hsl(var(--primary-foreground))' }
                : undefined
            }
          >
            {Icon && <Icon className="w-3.5 h-3.5" aria-hidden />}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-mono',
                  active
                    ? isOnNavy
                      ? 'bg-primary/10 text-primary'
                      : 'bg-white/25 text-current'
                    : isOnNavy
                      ? 'bg-primary-foreground/10 text-primary-foreground/70'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  if (!sticky) return content;

  return (
    <div
      className={cn(
        'sticky z-30 border-b',
        isOnNavy
          ? 'bg-primary border-primary-foreground/10'
          : 'bg-[hsl(var(--bg-base)/0.85)] border-border/40',
      )}
      style={{ top: stickyTop }}
    >
      {content}
    </div>
  );
}

