import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';

/**
 * DS2.0 PromoBanner — promotional/feature banner
 * Inspired by Careem/Grab promo cards.
 * 
 * Full-width or card-sized promotional surface.
 */
interface PromoBannerProps {
  title: string;
  subtitle?: string;
  image?: string;
  ctaLabel?: string;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'hero';
  className?: string;
}

export function PromoBanner({
  title,
  subtitle,
  image,
  ctaLabel,
  onClick,
  variant = 'default',
  className,
}: PromoBannerProps) {
  const isHero = variant === 'hero';
  const isCompact = variant === 'compact';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={cn(
        'relative overflow-hidden rounded-none',
        'bg-gradient-to-br from-[hsl(222_47%_11%)] via-[hsl(224_55%_22%)] to-[hsl(222_47%_11%)]',
        '[box-shadow:var(--shadow-elevation-2)]',
        onClick && 'cursor-pointer hover:[box-shadow:var(--shadow-elevation-3)] hover:-translate-y-0.5 transition-all duration-150',
        isHero && 'min-h-[140px] md:min-h-[180px]',
        isCompact && 'min-h-[80px]',
        !isHero && !isCompact && 'min-h-[100px]',
        className
      )}
    >
      {/* Background image */}
      {image && (
        <>
          <OptimizedImage
            src={image}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
            width={600}
            quality={60}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(222_47%_11%/0.9)] via-[hsl(224_55%_22%/0.7)] to-transparent" />
        </>
      )}

      {/* Content */}
      <div className={cn(
        'relative z-10 flex flex-col justify-end h-full',
        isCompact ? 'p-3' : 'p-4 md:p-5'
      )}>
        <h3 className={cn(
          'font-display font-bold text-white',
          isHero ? 'text-lg md:text-xl' : isCompact ? 'text-sm' : 'text-base'
        )}>
          {title}
        </h3>
        {subtitle && (
          <p className={cn(
            'text-white/70 mt-0.5',
            isCompact ? 'text-[10px]' : 'text-xs'
          )}>
            {subtitle}
          </p>
        )}
        {ctaLabel && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs font-semibold text-white/90">{ctaLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 text-white/70" />
          </div>
        )}
      </div>

      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/20 to-transparent" />
    </div>
  );
}
