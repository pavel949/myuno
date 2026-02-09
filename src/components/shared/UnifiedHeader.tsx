import React, { memo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  
  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  const isSearchInteractive = !!onSearchChange;
  const isSearchClickable = !!onSearchClick && !isSearchInteractive;

  return (
    <div className={cn("bg-background border-b border-border/50", className)}>
      <div className="px-4 py-3 max-w-7xl mx-auto">
        {/* Top row: back, title, badge, right action */}
        <div className="flex items-center gap-3 mb-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9 rounded-xl"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold truncate">{title}</h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
          
          {rightAction}
        </div>
        
        {/* Search row */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue ?? ''}
            onChange={isSearchInteractive ? (e) => onSearchChange(e.target.value) : undefined}
            onClick={isSearchClickable ? onSearchClick : undefined}
            readOnly={isSearchClickable}
            className={cn(
              "pl-12 pr-4 h-12 rounded-full bg-muted/60 border-0 text-base",
              isSearchClickable && "cursor-pointer"
            )}
          />
          
          {/* Search results dropdown */}
          {isSearching && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[60vh] overflow-y-auto">
              {searchResults}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
