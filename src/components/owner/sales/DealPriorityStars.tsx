import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  priority: number;
  onChange?: (priority: number) => void;
  size?: 'sm' | 'md';
}

export function DealPriorityStars({ priority, onChange, size = 'sm' }: Props) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map(level => (
        <button
          key={level}
          type="button"
          onClick={() => onChange?.(priority === level ? 0 : level)}
          disabled={!onChange}
          className={cn(
            'transition-colors',
            onChange ? 'cursor-pointer hover:text-warning' : 'cursor-default',
          )}
        >
          <Star
            className={cn(
              iconSize,
              level <= priority
                ? 'fill-warning text-warning'
                : 'text-muted-foreground/30',
            )}
          />
        </button>
      ))}
    </div>
  );
}
