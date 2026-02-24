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
          "flex gap-3 pb-2 overflow-x-auto scrollbar-hide snap-x snap-proximity",
          "overscroll-x-contain",
          !noPadding && "px-4",
          "max-w-[1536px] mx-auto"
        )}
        style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
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
  
  // Use a lookup map instead of dynamic class construction
  // (Tailwind purges dynamically constructed classes)
  const colsMap: Record<number, string> = {
    1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3',
    4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6',
  };
  const smMap: Record<number, string> = {
    1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6',
  };
  const mdMap: Record<number, string> = {
    1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3',
    4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6',
  };
  const lgMap: Record<number, string> = {
    1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
  };
  const xlMap: Record<number, string> = {
    1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3',
    4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6',
  };

  const gridCols = cn(
    colsMap[columns.default],
    columns.sm && smMap[columns.sm],
    columns.md && mdMap[columns.md],
    columns.lg && lgMap[columns.lg],
    columns.xl && xlMap[columns.xl],
  );
  
  return (
    <section className={cn("py-6 px-4", bgClass, className)}>
      <div className={cn(
        "grid gap-3 max-w-[1536px] mx-auto",
        gridCols
      )}>
        {children}
      </div>
    </section>
  );
});
