/**
 * Exclusive Badge — "Only on myUNO" indicator
 * 
 * Shows on listings that are platform-exclusive.
 * Creates supply lock-in perception.
 */
import React from 'react';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ExclusiveBadgeProps {
  variant?: 'default' | 'card' | 'ribbon';
  className?: string;
}

export const ExclusiveBadge: React.FC<ExclusiveBadgeProps> = ({
  variant = 'default',
  className,
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (variant === 'ribbon') {
    return (
      <div className={cn(
        'absolute top-3 left-0 z-10',
        className
      )}>
        <div className="flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1 text-[11px] font-semibold rounded-r-full shadow-md">
          <Sparkles className="w-3 h-3" />
          {isRu ? 'Только на myUNO' : 'Only on myUNO'}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-md',
        className
      )}>
        <Sparkles className="w-3 h-3 text-primary" />
        <span className="text-[11px] font-semibold text-primary">
          {isRu ? 'Эксклюзив' : 'Exclusive'}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full',
      className
    )}>
      <Sparkles className="w-3.5 h-3.5 text-primary" />
      <span className="text-xs font-semibold text-primary">
        {isRu ? 'Только на myUNO' : 'Only on myUNO'}
      </span>
    </div>
  );
};
