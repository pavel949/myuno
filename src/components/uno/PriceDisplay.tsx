import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

type PriceUnit = 'hour' | 'day' | 'night' | 'person' | 'item' | 'session' | null;

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  currency?: string;
  unit?: PriceUnit;
  showFrom?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const currencySymbols: Record<string, string> = {
  THB: '฿',
  USD: '$',
  EUR: '€',
  RUB: '₽',
};

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
  currency = 'THB',
  unit,
  showFrom = false,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const { language, t } = useLanguage();
  const sizes = sizeClasses[size];
  const symbol = currencySymbols[currency] || currency;
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const formatPrice = (value: number) => {
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
        <span className={cn("text-muted-foreground line-through", sizes.original)}>
          {symbol}{formatPrice(originalPrice)}
        </span>
      )}

      {/* Main price */}
      <span className={cn("font-bold text-foreground", sizes.price)}>
        {symbol}{formatPrice(price)}
      </span>

      {/* Unit label */}
      {unit && unitLabels[unit] && (
        <span className={cn("text-muted-foreground", sizes.unit)}>
          {unitLabels[unit][language]}
        </span>
      )}

      {/* Discount badge */}
      {hasDiscount && (
        <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-destructive/20 text-destructive">
          -{discountPercent}%
        </span>
      )}
    </div>
  );
}
