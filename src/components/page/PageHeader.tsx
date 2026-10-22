/**
 * PageHeader — universal page header.
 * Title + optional subtitle + breadcrumbs + actions.
 * Responsive: on mobile, secondary actions collapse into an overflow menu.
 */
import React, { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
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
  /** @deprecated Legacy `uno/PageHeader` API. Use `sticky` boolean instead. `'transparent'` is treated as `'default'`. */
  variant?: 'default' | 'sticky' | 'transparent';
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
  variant,
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const label = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const { isMobile } = useBreakpoint();
  // Backwards-compat: legacy `variant="sticky"` maps to `sticky={true}`.
  const isSticky = sticky || variant === 'sticky';

  const isActionArray = Array.isArray(actions);
  const actionList = isActionArray ? (actions as PageAction[]) : [];
  const visibleActions = isMobile
    ? actionList.filter((a) => !(a.mobileHidden ?? a.variant !== 'primary'))
    : actionList;
  const overflowActions = isMobile
    ? actionList.filter((a) => a.mobileHidden ?? a.variant !== 'primary')
    : [];

  return (
    <header
      className={cn(
        'mb-[var(--section-gap)]',
        isSticky && 'sticky top-[var(--shell-header-height,0px)] z-30 -mx-[var(--page-padding-x)] px-[var(--page-padding-x)] py-3 bg-background/85 border-b border-border/40',
        className,
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label={label('Навигация', 'Breadcrumb', 'เส้นทางนำทาง')} className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={i}>
              {i > 0 && <ChevronRight className="w-3 h-3 opacity-50" />}
              {bc.href ? (
                <Link
                  to={bc.href}
                  className="hover:text-foreground transition-colors truncate max-w-[120px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {bc.label}
                </Link>
              ) : (
                <span className="truncate max-w-[120px]">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={() => navigate(fallbackPath)}
              type="button"
              aria-label={label('Назад', 'Back', 'กลับ')}
              className={cn(
                'flex items-center justify-center rounded-none bg-secondary/80 text-foreground',
                'hover:bg-secondary transition-all touch-manipulation flex-shrink-0',
                'h-[var(--touch-target)] w-[var(--touch-target)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-display font-bold tracking-tight text-foreground break-words">
                {title}
              </h1>
              {badge !== undefined && badge !== 0 && (
                <Badge variant="secondary" className="flex-shrink-0">{badge}</Badge>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 break-words text-sm md:text-base text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2 sm:max-w-[50%]">
            {!isActionArray && actions}
            {isActionArray && (
              <>
                {visibleActions.map((a, i) => {
                  const Icon = a.icon;
                  return (
                    <Button
                      type="button"
                      variant={a.variant === 'primary' ? 'default' : 'secondary'}
                      key={i}
                      onClick={a.onClick}
                      aria-label={a.label}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-none text-sm font-medium transition-all ',
                        'h-auto min-h-[var(--touch-target)] max-w-full px-3 py-2',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        a.variant === 'primary'
                          ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                          : 'bg-secondary text-foreground hover:bg-secondary/80',
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      <span className="whitespace-normal break-words text-left leading-snug">{a.label}</span>
                    </Button>
                  );
                })}
                {overflowActions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label={label('Другие действия', 'More actions', 'การดำเนินการเพิ่มเติม')}
                        className={cn(
                          'flex items-center justify-center rounded-none bg-secondary/80 text-foreground',
                          'hover:bg-secondary transition-all ',
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
