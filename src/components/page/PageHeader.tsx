/**
 * PageHeader — universal page header.
 * Title + optional subtitle + breadcrumbs + actions.
 * Responsive: on mobile, secondary actions collapse into an overflow menu.
 */
import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export interface PageBreadcrumb {
  label: string;
  href?: string;
}

export interface PageAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
  /** Hide on mobile (collapse into overflow menu). Defaults to true for non-primary. */
  mobileHidden?: boolean;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: PageBreadcrumb[];
  actions?: ReactNode | PageAction[];
  badge?: string | number;
  showBack?: boolean;
  fallbackPath?: string;
  className?: string;
  /** Sticky header (collapses on scroll). */
  sticky?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  badge,
  showBack = false,
  fallbackPath = '/',
  className,
  sticky = false,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  const isActionArray = Array.isArray(actions);
  const actionList = isActionArray ? (actions as PageAction[]) : [];
  const visibleActions = isMobile
    ? actionList.filter((a) => !a.mobileHidden && a.variant === 'primary')
    : actionList;
  const overflowActions = isMobile
    ? actionList.filter((a) => a.mobileHidden ?? a.variant !== 'primary')
    : [];

  return (
    <header
      className={cn(
        'mb-[var(--section-gap)]',
        sticky && 'sticky top-0 z-30 -mx-[var(--page-padding-x)] px-[var(--page-padding-x)] py-3 bg-background/85 border-b border-border/40',
        className,
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
              {bc.href ? (
                <button
                  onClick={() => navigate(bc.href!)}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {bc.label}
                </button>
              ) : (
                <span className="truncate max-w-[120px]">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={() => navigate(fallbackPath)}
              aria-label="Back"
              className={cn(
                'flex items-center justify-center rounded-full bg-secondary/80 text-foreground',
                'hover:bg-secondary transition-all active:scale-95 touch-manipulation flex-shrink-0',
                'h-[var(--touch-target)] w-[var(--touch-target)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-bold tracking-tight text-foreground truncate">
                {title}
              </h1>
              {badge !== undefined && badge !== 0 && (
                <Badge variant="secondary" className="flex-shrink-0">{badge}</Badge>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm md:text-base text-muted-foreground line-clamp-2">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isActionArray && actions}
            {isActionArray && (
              <>
                {visibleActions.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={i}
                      onClick={a.onClick}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-none text-sm font-medium transition-all active:scale-95',
                        'h-[var(--touch-target)] px-3',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        a.variant === 'primary'
                          ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                          : 'bg-secondary text-foreground hover:bg-secondary/80',
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="hidden sm:inline">{a.label}</span>
                    </button>
                  );
                })}
                {overflowActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="More actions"
                        className={cn(
                          'flex items-center justify-center rounded-full bg-secondary/80 text-foreground',
                          'hover:bg-secondary transition-all active:scale-95',
                          'h-[var(--touch-target)] w-[var(--touch-target)]',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        )}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {overflowActions.map((a, i) => {
                        const Icon = a.icon;
                        return (
                          <DropdownMenuItem key={i} onClick={a.onClick}>
                            {Icon && <Icon className="w-4 h-4 mr-2" />}
                            {a.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
