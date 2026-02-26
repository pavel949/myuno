import React from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { cn } from '@/lib/utils';

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  /** IntersectionObserver threshold (default 0.15) */
  threshold?: number;
}

/**
 * RevealOnScroll — wraps children with a smooth opacity + translateY
 * reveal animation triggered when scrolled into view.
 * Respects prefers-reduced-motion via useScrollReveal.
 */
export function RevealOnScroll({ children, className, threshold }: RevealOnScrollProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold });

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-300 ease-out',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-3',
        className
      )}
    >
      {children}
    </div>
  );
}
