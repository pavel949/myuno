/**
 * Breadcrumbs — unified header crumb trail.
 *
 * Reads pathname → `getRouteCrumbs()` from `src/lib/config/routeMeta.ts`
 * (single source of truth). Renders nothing when depth < 2 or on hidden routes.
 *
 * Hierarchy rule: `Surface > Section > Entity` (max 4 visible, middle collapses to `…`).
 *
 * See: docs/NAVIGATION_MAP.md, docs/HEADER_ROUTE_INVENTORY.md.
 */
import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getRouteCrumbs } from '@/lib/config/routeMeta';

interface BreadcrumbsProps {
  className?: string;
  /** Override pathname (for SSR / tests). Defaults to current location. */
  pathname?: string;
}

export const Breadcrumbs = memo(function Breadcrumbs({
  className,
  pathname,
}: BreadcrumbsProps) {
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const path = pathname ?? location.pathname;
  const crumbs = getRouteCrumbs(path);

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label={isRu ? 'Хлебные крошки' : 'Breadcrumbs'}
      className={cn(
        'flex items-center gap-1 text-[12px] text-muted-foreground min-w-0 overflow-hidden',
        className,
      )}
    >
      <ol className="flex items-center gap-1 min-w-0">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          const label = isRu ? crumb.labelRu : crumb.labelEn;
          const isEllipsis = label === '…';

          return (
            <li key={`${idx}-${label}`} className="flex items-center gap-1 min-w-0">
              {idx > 0 && (
                <ChevronRight
                  className="size-3 text-muted-foreground/50 shrink-0"
                  aria-hidden
                />
              )}
              {crumb.href && !isLast && !isEllipsis ? (
                <Link
                  to={crumb.href}
                  className="truncate hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {label}
                </Link>
              ) : (
                <span
                  className={cn(
                    'truncate',
                    isLast && !isEllipsis && 'text-foreground font-medium',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
