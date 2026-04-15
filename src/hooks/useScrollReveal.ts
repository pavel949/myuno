import { useRef, useState, useEffect } from 'react';
import { prefersReducedMotion } from '@/lib/motionConfig';

/** Intersection ratio vs viewport (area), matches useSectionReveal fallback */
function elementIntersectionRatio(el: HTMLElement): number {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  if (rect.width <= 0 || rect.height <= 0) return 0;
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, vh);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, vw);
  const h = Math.max(0, bottom - top);
  const w = Math.max(0, right - left);
  const visibleArea = h * w;
  const elArea = rect.width * rect.height;
  return elArea > 0 ? visibleArea / elArea : 0;
}

interface UseScrollRevealOptions {
  threshold?: number;
  once?: boolean;
}

/**
 * useScrollReveal — returns a ref and isVisible flag.
 * Uses IntersectionObserver; respects prefers-reduced-motion.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.15, once = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const reveal = () => {
      setIsVisible(true);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal();
          if (once) observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '0px 0px 120px 0px' }
    );

    observer.observe(el);

    let cancelled = false;
    const runFallback = () => {
      if (cancelled) return;
      if (elementIntersectionRatio(el) >= threshold) {
        reveal();
        if (once) observer.unobserve(el);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runFallback);
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [threshold, once]);

  return { ref, isVisible };
}
