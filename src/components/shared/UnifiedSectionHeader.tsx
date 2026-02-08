import React, { memo, forwardRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';

interface UnifiedSectionHeaderProps {
  icon?: LucideIcon;
  iconEmoji?: string;
  iconImage?: string;
  iconColor?: string;
  title: string;
  count?: number;
  viewAllPath?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  className?: string;
  children?: ReactNode;
}

export const UnifiedSectionHeader = memo(forwardRef<HTMLDivElement, UnifiedSectionHeaderProps>(function UnifiedSectionHeader({
  icon: Icon,
  iconEmoji,
  iconImage,
  iconColor = 'text-primary',
  title,
  count,
  viewAllPath,
  viewAllLabel = 'All',
  onViewAll,
  className,
  children,
}, ref) {
  const navigate = useNavigate();

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else if (viewAllPath) {
      navigate(viewAllPath);
    }
  };

  const showViewAll = viewAllPath || onViewAll;

  return (
    <div ref={ref} className={cn("flex items-center justify-between mb-4", className)}>
      <div className="flex items-center gap-2 min-w-0">
        {/* Icon variants */}
        {iconImage ? (
          <img 
            src={iconImage} 
            alt="" 
            className="w-10 h-10 rounded-xl object-cover shrink-0"
          />
        ) : iconEmoji ? (
          (() => {
            const ResolvedIcon = resolveIcon(iconEmoji);
            return (
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                <ResolvedIcon className="w-5 h-5 text-primary" />
              </div>
            );
          })()
        ) : Icon ? (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
            <Icon className={cn("w-5 h-5", iconColor)} />
          </div>
        ) : null}
        
        <div className="min-w-0">
          <h2 className="text-lg font-bold truncate">{title}</h2>
          {children}
        </div>
        
        {count !== undefined && count > 0 && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {count}
          </Badge>
        )}
      </div>
      
      {showViewAll && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-primary gap-1 shrink-0"
          onClick={handleViewAll}
        >
          {viewAllLabel}
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}));
