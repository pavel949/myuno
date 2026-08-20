/**
 * useSituationTracking — the single analytics layer for situation lists.
 *
 * Both `SituationList` variants (compact and prominent) and any future
 * situation surface route their instrumentation through this hook, so the
 * emitted payload is identical everywhere:
 *   - `situation_impression` once per list, when it first scrolls into view
 *     (de-duplicated per source+variant for the lifetime of the page);
 *   - `situation_click` per row, always carrying source, variant, cluster,
 *     resolved href and the service count that was actually shown.
 *
 * Components must never call `trackSituationClick` / `trackSituationImpression`
 * directly — that is how compact and prominent rows drifted apart before.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  trackSituationClick,
  trackSituationImpression,
} from '@/lib/analytics/track';

export interface UseSituationTrackingOptions {
  /** Situation codes currently rendered, in render order. */
  codes: readonly string[];
  /** Analytics source, e.g. 'navigator_v3_for_you' or 'cluster_section'. */
  source: string;
  /** Visual variant of the list — part of every payload. */
  variant?: string;
  /** Extra analytics payload merged into every event (cluster id, etc). */
  context?: Record<string, unknown>;
}

export interface SituationTracking {
  /** Attach to the list container to enable impression tracking. */
  containerRef: (node: HTMLElement | null) => void;
  /** Call from a row's onClick. */
  onSituationClick: (
    code: string,
    payload: { href: string; count?: number },
  ) => void;
}

/** Impressions already sent this page-load: `${source}|${variant}|${code}`. */
const seenImpressions = new Set<string>();

export function useSituationTracking({
  codes,
  source,
  variant,
  context,
}: UseSituationTrackingOptions): SituationTracking {
  const codesKey = codes.join(',');
  const latest = useRef({ codes, source, variant, context });
  latest.current = { codes, source, variant, context };

  const nodeRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const emitImpression = useCallback(() => {
    const { codes: list, source: src, variant: v, context: ctx } = latest.current;
    const fresh = list.filter((code) => {
      const key = `${src}|${v ?? 'default'}|${code}`;
      if (seenImpressions.has(key)) return false;
      seenImpressions.add(key);
      return true;
    });
    trackSituationImpression(fresh, { source: src, variant: v, ...ctx });
  }, []);

  const observe = useCallback(() => {
    const node = nodeRef.current;
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node || latest.current.codes.length === 0) return;

    if (typeof IntersectionObserver === 'undefined') {
      emitImpression();
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        emitImpression();
        observer.disconnect();
        observerRef.current = null;
      }
    }, { threshold: 0.25 });
    observer.observe(node);
    observerRef.current = observer;
  }, [emitImpression]);

  const containerRef = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
    observe();
  }, [observe]);

  // Re-arm when the rendered set changes (filter/search/role switch).
  useEffect(() => {
    observe();
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [observe, codesKey, source, variant]);

  const onSituationClick = useCallback<SituationTracking['onSituationClick']>(
    (code, { href, count }) => {
      const { source: src, variant: v, context: ctx } = latest.current;
      trackSituationClick(code, {
        source: src,
        variant: v,
        href,
        count,
        ...ctx,
      });
    },
    [],
  );

  return useMemo(
    () => ({ containerRef, onSituationClick }),
    [containerRef, onSituationClick],
  );
}
