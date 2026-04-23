import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';

type PriceUnit = 'hour' | 'day' | 'night' | 'person' | 'item' | 'session' | null;

interface PriceDisplayProps {
  /** Price value - if sourceCurrency is not specified, treated as THB */
  price: number;
  originalPrice?: number;
  /** Source currency of the price data (default: THB). Will be converted to user's selected currency */
  sourceCurrency?: string;
  unit?: PriceUnit;
  showFrom?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** If true, skip conversion and display as-is with user's selected currency symbol */
  skipConversion?: boolean;
}

const sizeClasses = {
  sm: { price: 'text-sm', original: 'text-xs', unit: 'text-xs' },
  md: { price: 'text-lg', original: 'text-sm', unit: 'text-sm' },
  lg: { price: 'text-2xl', original: 'text-base', unit: 'text-sm' },
  xl: { price: 'text-3xl', original: 'text-lg', unit: 'text-base' },
};

const unitLabels: Record<PriceUnit & string, { ru: string; en: string }> = {
  hour: { ru: '/час', en: '/hr' },
  day: { ru: '/день', en: '/day' },
  night: { ru: '/ночь', en: '/night' },
  person: { ru: '/чел', en: '/person' },
  item: { ru: '/шт', en: '/item' },
  session: { ru: '/сеанс', en: '/session' },
};

export function PriceDisplay({
  price,
  originalPrice,
  sourceCurrency = 'THB',
  unit,
  showFrom = false,
  size = 'md',
  className,
  skipConversion = false,
}: PriceDisplayProps) {
  const { language, t } = useLanguage();
  const { currencyInfo, convertPrice } = useCurrency();
  const sizes = sizeClasses[size];
  
  // Convert prices from source currency to user's selected currency
  const displayPrice = skipConversion ? price : convertPrice(price);
  const displayOriginalPrice = originalPrice !== undefined && !skipConversion 
    ? convertPrice(originalPrice) 
    : originalPrice;
  
  const symbol = currencyInfo.symbol;
  const hasDiscount = displayOriginalPrice !== undefined && displayOriginalPrice > displayPrice;
  const discountPercent = hasDiscount
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : 0;

  const formatPriceValue = (value: number) => {
    return value.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US');
  };

  return (
    <div className={cn("flex flex-wrap items-baseline gap-1.5", className)}>
      {/* "From" prefix */}
      {showFrom && (
        <span className={cn("text-muted-foreground", sizes.unit)}>
          {t('label.from')}
        </span>
      )}

      {/* Original price (if discounted) */}
      {hasDiscount && (
        <span className={cn("line-through text-muted-foreground font-mono tabular-nums", sizes.original)}>
          {symbol}{formatPriceValue(displayOriginalPrice!)}
        </span>
      )}

      {/* Main price */}
      <span className={cn("font-mono font-medium text-primary tabular-nums", sizes.price)}>
        {symbol}{formatPriceValue(displayPrice)}
      </span>

      {/* Unit label */}
      {unit && unitLabels[unit] && (
        <span className={cn("text-muted-foreground", sizes.unit)}>
          {unitLabels[unit][language]}
        </span>
      )}

      {/* Discount badge */}
      {hasDiscount && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded-none bg-destructive/20 text-destructive">
          -{discountPercent}%
        </span>
      )}
    </div>
  );
}
