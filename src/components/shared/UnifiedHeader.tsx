import React, { memo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BackButton } from '@/components/uno/BackButton';
import { cn } from '@/lib/utils';

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

  return (
    <div className={cn("bg-background/95 backdrop-blur-md border-b border-border/50", className)}>
      <div className="px-4 py-2.5 max-w-[1536px] mx-auto">
        {/* Top row: back, title, badge, right action */}
        <div className="flex items-center gap-3 mb-2">
          {showBack && (
            <BackButton fallbackPath={fallbackPath} variant="ghost" size="sm" />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold truncate">{title}</h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          
          {rightAction}
        </div>
        
        {/* Search row */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue ?? ''}
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl [box-shadow:var(--shadow-elevation-4)] z-50 overflow-hidden max-h-[60vh] overflow-y-auto">
              {searchResults}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
