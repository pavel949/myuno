import React, { memo, ReactNode } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/uno/BackButton';
import { cn } from '@/lib/utils';
import {
  ECOSYSTEM_HEADER_SUBTITLE,
  ECOSYSTEM_HEADER_TITLE,
  ECOSYSTEM_PAGE_CONTAINER,
  ECOSYSTEM_STICKY_SURFACE,
} from '@/design-system/ecosystemLayout';

interface UnifiedHeaderProps {
  title: string;
  /** The page owns an H1 when it renders an entry masthead. */
  hideHeading?: boolean;
  subtitle?: string;
  badge?: ReactNode;
  showBack?: boolean;
  /** A marketplace masthead already owns navigation and the page title. */
  compactOverview?: boolean;
  fallbackPath?: string;
  onBack?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClick?: () => void;
  searchResults?: ReactNode;
  isSearching?: boolean;
  rightAction?: ReactNode;
  className?: string;
  /** Opt-in feature frame; does not change other mini-app/detail headers. */
  containerClassName?: string;
}

export const UnifiedHeader = memo(function UnifiedHeader({
  title,
  hideHeading = false,
  subtitle,
  badge,
  showBack = true,
  compactOverview = false,
  fallbackPath = '/',
  onBack,
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  onSearchClick,
  searchResults,
  isSearching,
  rightAction,
  className,
  containerClassName,
}: UnifiedHeaderProps) {
  const isSearchInteractive = !!onSearchChange;
  const isSearchClickable = !!onSearchClick && !isSearchInteractive;
  const shouldBindSearchValue = isSearchInteractive || isSearchClickable;

  return (
    <div className={cn(ECOSYSTEM_STICKY_SURFACE, className)}>
      <div data-marketplace-toolbar={compactOverview ? '' : undefined}
        className={cn(ECOSYSTEM_PAGE_CONTAINER, 'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2', compactOverview ? 'py-3' : 'gap-y-2 py-2.5', containerClassName)}>
        {!compactOverview && <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-3">
          {showBack && <BackButton fallbackPath={fallbackPath} onClick={onBack} variant="ghost" size="sm" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {!hideHeading && <h1 className={ECOSYSTEM_HEADER_TITLE}>{title}</h1>}
              {badge}
            </div>
            {!hideHeading && subtitle && <p className={ECOSYSTEM_HEADER_SUBTITLE}>{subtitle}</p>}
          </div>
        </div>}
        {/* Preserve the mounted input when its first keystroke switches from overview to results. */}
        {(isSearchInteractive || isSearchClickable) && <div className={cn('relative min-w-0', compactOverview ? 'col-start-1 row-start-1' : 'col-span-2 row-start-2')}>
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
          <Input
            aria-label={searchPlaceholder}
            type="search"
            placeholder={searchPlaceholder}
            value={shouldBindSearchValue ? (searchValue ?? '') : undefined}
            onChange={isSearchInteractive ? (e) => onSearchChange(e.target.value) : undefined}
            onClick={isSearchClickable ? onSearchClick : undefined}
            readOnly={isSearchClickable}
            className={cn("ux-search-control pl-10 pr-4 text-sm", isSearchClickable && "cursor-pointer")}
          />
          {isSearching && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-none [box-shadow:var(--shadow-elevation-4)] z-50 overflow-hidden max-h-[60vh] overflow-y-auto">
              {searchResults}
            </div>
          )}
        </div>}
        {rightAction && <div className="col-start-2 row-start-1 justify-self-end">{rightAction}</div>}
      </div>
    </div>
  );
});
