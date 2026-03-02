import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, BadgeCheck, Star } from 'lucide-react';

/**
 * DS2.0 TrustBadge — verified/trusted indicator
 * Used on provider cards, property details, service pages.
 */
type TrustLevel = 'verified' | 'premium' | 'top-rated';

interface TrustBadgeProps {
  level: TrustLevel;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

const trustConfig: Record<TrustLevel, { icon: typeof Shield; color: string; defaultLabel: string }> = {
  verified: { icon: BadgeCheck, color: 'text-primary', defaultLabel: 'Verified' },
  premium: { icon: Shield, color: 'text-primary', defaultLabel: 'Premium' },
  'top-rated': { icon: Star, color: 'text-warning', defaultLabel: 'Top Rated' },
};

export function TrustBadge({ level, label, className, size = 'sm' }: TrustBadgeProps) {
  const config = trustConfig[level];
  const Icon = config.icon;
  const isSm = size === 'sm';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 font-medium',
      isSm ? 'text-[10px]' : 'text-xs',
      config.color,
      className
    )}>
      <Icon className={cn(isSm ? 'w-3 h-3' : 'w-3.5 h-3.5', level === 'top-rated' && 'fill-current')} />
      {label || config.defaultLabel}
    </span>
  );
}
