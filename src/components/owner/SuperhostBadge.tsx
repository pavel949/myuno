import { Award, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface SuperhostBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function SuperhostBadge({ size = 'md', showLabel = true, className }: SuperhostBadgeProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold flex items-center bg-gradient-to-r from-accent-amber/20 to-warning/20',
        'border-accent-amber/50 text-accent-amber',
        'shadow-sm',
        sizeClasses[size],
        className
      )}
    >
      <Award className={cn(iconSizes[size], 'text-accent-amber')} />
      {showLabel && (
        <span>{isRu ? 'Суперхозяин' : 'Superhost'}</span>
      )}
    </Badge>
  );
}

interface SuperhostIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SuperhostIcon({ size = 'md', className }: SuperhostIconProps) {
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-accent-amber to-warning',
        'shadow-lg shadow-accent-amber/30',
        size === 'sm' ? 'p-1' : size === 'md' ? 'p-1.5' : 'p-2',
        className
      )}
    >
      <Award className={cn(iconSizes[size], 'text-white')} />
      <div className="absolute -top-0.5 -right-0.5">
        <Star className="h-2.5 w-2.5 text-white fill-white" />
      </div>
    </div>
  );
}
