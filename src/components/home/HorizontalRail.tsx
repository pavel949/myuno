import { Children, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** Native scrolling keeps touch, trackpad and Tab navigation available without JS gestures. */
export function HorizontalRail({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const { language } = useLanguage();
  const id = useId();
  const viewport = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const measure = () =>
      setEdges({
        start: el.scrollLeft <= 2,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
      });
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    Array.from(el.children).forEach((child) => resize.observe(child));
    const mutation = new MutationObserver(measure);
    mutation.observe(el, { attributes: true, childList: true, subtree: true });
    el.addEventListener('scroll', measure, { passive: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
      el.removeEventListener('scroll', measure);
    };
  }, [children]);
  const move = (direction: number) => {
    const el = viewport.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.85,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  };
  const previous = pickLang(language, {
    ru: 'Назад',
    en: 'Previous',
    th: 'ก่อนหน้า',
  });
  const next = pickLang(language, { ru: 'Далее', en: 'Next', th: 'ถัดไป' });
  return (
    <div className={`home-rail${compact ? ' home-rail--compact' : ''}${Children.count(children) <= 3 ? ' home-rail--short' : ''}`}>
      <div className="home-rail-controls" hidden={edges.start && edges.end}>
        <button
          type="button"
          aria-label={`${previous}: ${label}`}
          aria-controls={id}
          aria-disabled={edges.start}
          onClick={() => !edges.start && move(-1)}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`${next}: ${label}`}
          aria-controls={id}
          aria-disabled={edges.end}
          onClick={() => !edges.end && move(1)}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
      <div
        ref={viewport}
        id={id}
        className="home-rail-viewport"
        role="region"
        aria-label={label}
        tabIndex={0}
        onKeyDown={(event) => {
          // Do not steal arrow keys from selects, card carousels or other nested controls.
          if (event.target !== event.currentTarget) return;
          const el = event.currentTarget;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            move(event.key === 'ArrowLeft' ? -1 : 1);
          }
          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            el.scrollTo({ left: event.key === 'Home' ? 0 : el.scrollWidth });
          }
        }}
        onFocusCapture={(event) => {
          if (event.target !== event.currentTarget)
            event.target.scrollIntoView({
              block: 'nearest',
              inline: 'nearest',
            });
        }}
      >
        {children}
      </div>
    </div>
  );
}
