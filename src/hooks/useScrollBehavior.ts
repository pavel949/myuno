/**
 * useScrollBehavior — scroll-driven effects for nav and section reveal.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { prefersReducedMotion } from '@/lib/motionConfig';

/** Returns true when scrollY > threshold */
export function useScrolled(threshold = 60): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return scrolled;
}

/** True if at least `ratio` of the element's box intersects the viewport */
function isElementVisibleRatio(el: HTMLElement, ratio: number): boolean {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  if (rect.width <= 0 || rect.height <= 0) return false;
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, vh);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, vw);
  const h = Math.max(0, bottom - top);
  const w = Math.max(0, right - left);
  const visibleArea = h * w;
  const elArea = rect.width * rect.height;
  return visibleArea / elArea >= ratio;
}

/** Adds 'section-visible' when the element enters the viewport (IO + layout fallback for iframes / first paint). */
export function useSectionReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const apply = () => {
      el.classList.add('section-visible');
    };

    if (prefersReducedMotion()) {
      apply();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          apply();
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px 120px 0px' }
    );

    observer.observe(el);

    let cancelled = false;
    const runFallback = () => {
      if (cancelled) return;
      if (el.classList.contains('section-visible')) return;
      if (isElementVisibleRatio(el, 0.08)) {
        apply();
        observer.unobserve(el);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runFallback);
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  return ref;
}
