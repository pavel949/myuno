import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  variant?: 'icon' | 'full';
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function WishlistButton({ 
  productId, 
  variant = 'icon', 
  className,
  size = 'default'
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isWishlisted = isInWishlist(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await toggleWishlist(productId);
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all',
          'border border-border/50 shadow-sm',
          className
        )}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={cn(
            iconSize,
            'transition-colors',
            isWishlisted 
              ? 'fill-red-500 text-red-500' 
              : 'text-muted-foreground hover:text-red-500'
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant={isWishlisted ? 'default' : 'outline'}
      size={size}
      onClick={handleClick}
      className={cn(
        isWishlisted && 'bg-red-500 hover:bg-red-600 text-white',
        className
      )}
    >
      <Heart
        className={cn(
          size === 'sm' ? 'w-4 h-4 mr-1.5' : 'w-5 h-5 mr-2',
          isWishlisted && 'fill-current'
        )}
      />
      {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
    </Button>
  );
}
