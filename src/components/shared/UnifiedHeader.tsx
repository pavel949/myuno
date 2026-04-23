import React, { memo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  subtitle?: string;
  badge?: ReactNode;
  showBack?: boolean;
  fallbackPath?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClick?: () => void;
  searchResults?: ReactNode;
  isSearching?: boolean;
  rightAction?: ReactNode;
  className?: string;
}

export const UnifiedHeader = memo(function UnifiedHeader({
  title,
  subtitle,
  badge,
  showBack = true,
  fallbackPath = '/',
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  onSearchClick,
  searchResults,
  isSearching,
  rightAction,
  className,
}: UnifiedHeaderProps) {
  const navigate = useNavigate();

  const isSearchInteractive = !!onSearchChange;
  const isSearchClickable = !!onSearchClick && !isSearchInteractive;
  const shouldBindSearchValue = isSearchInteractive || isSearchClickable;

  return (
    <div className={cn(ECOSYSTEM_STICKY_SURFACE, className)}>
      <div className={cn(ECOSYSTEM_PAGE_CONTAINER, "py-2.5")}>
        {/* Top row: back, title, badge, right action */}
        <div className="flex items-center gap-3 mb-2">
          {showBack && (
            <BackButton fallbackPath={fallbackPath} variant="ghost" size="sm" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className={ECOSYSTEM_HEADER_TITLE}>{title}</h1>
              {badge}
            </div>
            {subtitle && (
              <p className={ECOSYSTEM_HEADER_SUBTITLE}>{subtitle}</p>
            )}
          </div>
          
          {rightAction}
        </div>
        
        {/* Search row */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={shouldBindSearchValue ? (searchValue ?? '') : undefined}
            onChange={isSearchInteractive ? (e) => onSearchChange(e.target.value) : undefined}
            onClick={isSearchClickable ? onSearchClick : undefined}
            readOnly={isSearchClickable}
            className={cn(
              "pl-10 pr-4 h-10 rounded-full bg-muted/60 border-0 text-sm",
              isSearchClickable && "cursor-pointer"
            )}
          />
          
          {/* Search results dropdown */}
          {isSearching && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-none [box-shadow:var(--shadow-elevation-4)] z-50 overflow-hidden max-h-[60vh] overflow-y-auto">
              {searchResults}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
