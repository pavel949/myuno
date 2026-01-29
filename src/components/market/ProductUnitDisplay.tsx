import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatProductUnit, formatPricePerUnit, ProductUnitData } from '@/utils/formatProductUnit';
import { cn } from '@/lib/utils';

interface ProductUnitDisplayProps {
  product: ProductUnitData & { price: number };
  showPricePerUnit?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProductUnitDisplay: React.FC<ProductUnitDisplayProps> = ({
  product,
  showPricePerUnit = false,
  className,
  size = 'md',
}) => {
  const { language } = useLanguage();
  
  const unitString = formatProductUnit(product, language as 'en' | 'ru');
  const pricePerUnit = showPricePerUnit 
    ? formatPricePerUnit(product, language as 'en' | 'ru') 
    : null;
  
  if (!unitString) return null;
  
  const sizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };
  
  return (
    <span className={cn('text-muted-foreground', sizeClasses[size], className)}>
      {unitString}
      {pricePerUnit && (
        <span className="ml-1 opacity-70">
          ({pricePerUnit})
        </span>
      )}
    </span>
  );
};

// Compact badge-style display for cards
interface ProductUnitBadgeProps {
  product: ProductUnitData;
  className?: string;
}

export const ProductUnitBadge: React.FC<ProductUnitBadgeProps> = ({
  product,
  className,
}) => {
  const { language } = useLanguage();
  const unitString = formatProductUnit(product, language as 'en' | 'ru');
  
  if (!unitString) return null;
  
  return (
    <span className={cn(
      'inline-flex items-center px-1.5 py-0.5 rounded bg-muted/80 text-[10px] font-medium text-muted-foreground',
      className
    )}>
      {unitString}
    </span>
  );
};
