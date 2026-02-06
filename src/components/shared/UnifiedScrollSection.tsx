import React, { memo, ReactNode, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface UnifiedScrollSectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted';
  noPadding?: boolean;
  showFadeIndicators?: boolean;
}

/**
 * Consistent horizontal scroll section for both Services and Products
 * Provides unified background styling, scroll behavior, and fade indicators
 */
export const UnifiedScrollSection = memo(function UnifiedScrollSection({
  children,
  className,
  variant = 'default',
  noPadding = false,
  showFadeIndicators = true,
}: UnifiedScrollSectionProps) {
  const bgClass = variant === 'muted' ? 'bg-muted/30' : 'bg-transparent';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(true);
  const [showLeftFade, setShowLeftFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !showFadeIndicators) return;

    const handleScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    };

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [showFadeIndicators]);
  
  return (
    <section className={cn("py-4 relative", bgClass, className)}>
      {/* Left fade indicator */}
      {showFadeIndicators && showLeftFade && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}
      
      {/* Right fade indicator */}
      {showFadeIndicators && showRightFade && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}
      
      <div 
        ref={scrollRef}
        className={cn(
          "flex gap-3 pb-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory",
          "overscroll-x-contain",
          !noPadding && "px-4",
          "max-w-7xl mx-auto"
        )}
        style={{ touchAction: 'pan-x pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {children}
      </div>
    </section>
  );
});

interface UnifiedGridSectionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'muted';
  columns?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

/**
 * Consistent grid section for both Services and Products
 */
export const UnifiedGridSection = memo(function UnifiedGridSection({
  children,
  className,
  variant = 'default',
  columns = { default: 2, sm: 3, md: 4, lg: 5 },
}: UnifiedGridSectionProps) {
  const bgClass = variant === 'muted' ? 'bg-muted/30' : 'bg-transparent';
  
  const gridCols = [
    `grid-cols-${columns.default}`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`,
  ].filter(Boolean).join(' ');
  
  return (
    <section className={cn("py-6 px-4", bgClass, className)}>
      <div className={cn(
        "grid gap-3 max-w-7xl mx-auto",
        gridCols
      )}>
        {children}
      </div>
    </section>
  );
});
