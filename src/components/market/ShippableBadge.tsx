import React, { forwardRef } from 'react';
import { Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ShippableBadgeProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export const ShippableBadge = forwardRef<HTMLDivElement, ShippableBadgeProps>(
  ({ className, variant = 'default' }, ref) => {
    const { language } = useLanguage();

    if (variant === 'compact') {
      return (
        <Badge 
          ref={ref}
          className={cn(
            "bg-sky-500 text-white text-[10px] font-semibold px-1.5 py-0.5 shadow-md gap-0.5",
            className
          )}
        >
          <Plane className="w-2.5 h-2.5" />
        </Badge>
      );
    }

    return (
      <Badge 
        ref={ref}
        className={cn(
          "bg-gradient-to-r from-sky-500 to-blue-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-md gap-1",
          className
        )}
      >
        <Plane className="w-3 h-3" />
        <span>{language === 'ru' ? 'Домой' : 'Ship Home'}</span>
      </Badge>
    );
  }
);

ShippableBadge.displayName = 'ShippableBadge';
