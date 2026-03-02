import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { PriceBreakdown } from './PriceBreakdown';

/**
 * DS2.0 CheckoutPanel — booking/checkout summary panel
 * Sticky bottom on mobile, sidebar on desktop.
 */
interface CheckoutPanelProps {
  title?: string;
  priceItems: { label: string; value: string | number; type?: 'normal' | 'discount' | 'fee' | 'total' }[];
  currency?: string;
  ctaLabel: string;
  onSubmit: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  secondaryAction?: { label: string; onClick: () => void };
  children?: React.ReactNode;
  className?: string;
}

export function CheckoutPanel({
  title,
  priceItems,
  currency,
  ctaLabel,
  onSubmit,
  isLoading,
  disabled,
  secondaryAction,
  children,
  className,
}: CheckoutPanelProps) {
  return (
    <Surface
      variant="card"
      padding="md"
      radius="xl"
      className={cn(
        'sticky bottom-0 md:static',
        '[box-shadow:var(--shadow-elevation-4)]',
        'md:[box-shadow:var(--shadow-elevation-2)]',
        className
      )}
    >
      {title && (
        <h3 className="font-display text-base font-semibold mb-3">{title}</h3>
      )}

      {children}

      <PriceBreakdown items={priceItems} currency={currency} className="mb-4" />

      <div className="flex flex-col gap-2">
        <Button
          onClick={onSubmit}
          disabled={disabled || isLoading}
          className="w-full h-11"
        >
          {isLoading ? '...' : ctaLabel}
        </Button>
        {secondaryAction && (
          <Button
            variant="ghost"
            onClick={secondaryAction.onClick}
            className="w-full"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </Surface>
  );
}
