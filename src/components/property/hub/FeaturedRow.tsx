/**
 * FeaturedRow — a horizontal "rail" section for the Real Estate Hub.
 *
 * Presentational only: header with a "See all" link, an optional secondary
 * link, a horizontally-scrolling track of cards, skeletons while loading, and a
 * graceful empty state. Container rows (Rent/Offplan/Resale/Invest) own the data
 * and pass cards as children. Mirrors the rail pattern in InvestmentHubLanding.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecondaryLink {
  to: string;
  label: string;
}

interface FeaturedRowProps {
  title: string;
  seeAllTo: string;
  seeAllLabel: string;
  emptyLabel: string;
  isLoading: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
  secondary?: SecondaryLink;
  /** Width of each rail item wrapper. */
  itemWidthClassName?: string;
}

export function FeaturedRow({
  title,
  seeAllTo,
  seeAllLabel,
  emptyLabel,
  isLoading,
  isEmpty,
  children,
  secondary,
  itemWidthClassName = 'w-[280px]',
}: FeaturedRowProps) {
  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        <div className="flex items-center gap-3">
          {secondary && (
            <Link
              to={secondary.to}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {secondary.label}
            </Link>
          )}
          <Link
            to={seeAllTo}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
          >
            {seeAllLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={cn('shrink-0 animate-pulse rounded-none bg-muted', itemWidthClassName)}
              style={{ height: 220 }}
            />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="rounded-none border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {React.Children.map(children, (child) => (
            <div className={cn('shrink-0 snap-start', itemWidthClassName)}>{child}</div>
          ))}
        </div>
      )}
    </section>
  );
}
