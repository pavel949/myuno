import React from 'react';

interface Props {
  price: number | null;
  priceTo?: number | null;
  showFrom?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function formatThb(value: number): string {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value.toLocaleString()}`;
}

const sizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

export function NbPriceDisplay({ price, priceTo, showFrom = true, size = 'md', className = '' }: Props) {
  if (!price) return null;
  
  return (
    <span className={`nb-mono font-bold ${sizes[size]} ${className}`} style={{ color: 'hsl(var(--nb-gold))' }}>
      {showFrom && <span className="text-xs font-normal mr-1" style={{ color: 'hsl(var(--nb-muted))' }}>от</span>}
      {formatThb(price)}
      {priceTo && priceTo > price && (
        <span className="font-normal text-xs ml-1" style={{ color: 'hsl(var(--nb-muted))' }}>
          – {formatThb(priceTo)}
        </span>
      )}
    </span>
  );
}
