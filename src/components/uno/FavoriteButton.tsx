import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onClick: () => void;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function FavoriteButton({ isFavorite, onClick, size = 'default', className }: FavoriteButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        sizeClasses[size],
        'rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all',
        isFavorite && 'bg-red-500/20 hover:bg-red-500/30',
        className
      )}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-all',
          isFavorite ? 'fill-red-500 text-red-500' : 'text-white'
        )}
      />
    </Button>
  );
}
