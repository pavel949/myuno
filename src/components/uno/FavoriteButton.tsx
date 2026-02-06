import React, { forwardRef } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUserCollections } from '@/hooks/useUserCollections';

interface FavoriteButtonProps {
  itemType: string;
  itemId: string;
  itemData?: any;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'ghost' | 'secondary' | 'outline';
  className?: string;
}

export const FavoriteButton = forwardRef<HTMLButtonElement, FavoriteButtonProps>(
  function FavoriteButton({ 
    itemType, 
    itemId, 
    itemData, 
    size = 'default', 
    variant = 'ghost',
    className 
  }, ref) {
    const { isInCollection, toggleCollection } = useUserCollections();
    const isActive = isInCollection(itemType as any, itemId);

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

    const handleClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      await toggleCollection(itemType as any, itemId, itemData);
    };

    return (
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        onClick={handleClick}
        className={cn(
          sizeClasses[size],
          className
        )}
      >
        <Heart
          className={cn(
            iconSizes[size],
            'transition-all',
            isActive ? 'fill-red-500 text-red-500' : ''
          )}
        />
      </Button>
    );
  }
);
