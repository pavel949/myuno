import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';

interface QuickPriceChipProps {
  /** Price in THB (will be converted to user's selected currency) */
  priceInTHB: number;
  className?: string;
}

/**
 * A small price chip that auto-converts to the user's selected currency.
 * Use in quickItems grids where you need compact price display.
 */
export function QuickPriceChip({ priceInTHB, className }: QuickPriceChipProps) {
  const { formatPrice } = useCurrency();
  
  return (
    <span className={cn("text-muted-foreground", className)}>
      {formatPrice(priceInTHB)}
    </span>
  );
}
