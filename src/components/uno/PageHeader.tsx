import React, { ReactNode, forwardRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  fallbackPath?: string;
  badge?: string | number;
  actions?: ReactNode;
  className?: string;
  variant?: 'default' | 'sticky' | 'transparent';
}

export const PageHeader = memo(forwardRef<HTMLDivElement, PageHeaderProps>(
  function PageHeader({ 
    title, 
    subtitle,
    showBack = false, 
    fallbackPath = '/',
    badge, 
    actions,
    className,
    variant = 'default'
  }, ref) {
    const navigate = useNavigate();

    const handleBack = () => {
      // Always use fallback for reliability - history.length check is unreliable
      // in SPAs where history includes all internal navigations
      navigate(fallbackPath);
    };

    const variantClasses = {
      default: '',
      sticky: 'sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b py-3 -mx-4 px-4',
      transparent: 'absolute top-0 left-0 right-0 z-10 bg-transparent',
    };

    return (
      <div ref={ref} className={cn("flex items-center justify-between", variantClasses[variant], className)}>
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button 
              onClick={handleBack} 
              aria-label="Go back"
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                "hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "active:scale-95 touch-manipulation flex-shrink-0",
                variant === 'transparent' 
                  ? "bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm" 
                  : "bg-secondary/80 text-foreground"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight truncate">{title}</h1>
              {badge !== undefined && badge !== 0 && (
                <Badge variant="secondary" className="flex-shrink-0">{badge}</Badge>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    );
  }
));

PageHeader.displayName = 'PageHeader';
