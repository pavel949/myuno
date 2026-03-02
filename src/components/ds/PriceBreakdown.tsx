import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

/**
 * DS2.0 PriceBreakdown — checkout/booking price summary
 * Used in CheckoutPanel, BookingSummary, OrderDetail.
 */
interface PriceLineItem {
  label: string;
  value: string | number;
  type?: 'normal' | 'discount' | 'fee' | 'total';
}

interface PriceBreakdownProps {
  items: PriceLineItem[];
  currency?: string;
  className?: string;
}

export function PriceBreakdown({ items, currency = '฿', className }: PriceBreakdownProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item, i) => {
        const isTotal = item.type === 'total';
        const isDiscount = item.type === 'discount';

        if (isTotal && i > 0) {
          return (
            <React.Fragment key={i}>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">{item.label}</span>
                <span className="text-base font-bold text-foreground">
                  {typeof item.value === 'number' ? `${currency}${item.value.toLocaleString()}` : item.value}
                </span>
              </div>
            </React.Fragment>
          );
        }

        return (
          <div key={i} className="flex justify-between items-center">
            <span className={cn(
              'text-sm',
              isTotal ? 'font-bold text-foreground' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
            <span className={cn(
              'text-sm font-medium',
              isDiscount ? 'text-success' : isTotal ? 'font-bold text-foreground' : 'text-foreground'
            )}>
              {isDiscount && '-'}
              {typeof item.value === 'number' ? `${currency}${Math.abs(item.value).toLocaleString()}` : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
