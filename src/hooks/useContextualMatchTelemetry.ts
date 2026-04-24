/**
 * useContextualMatchTelemetry — IPP §25 / M10f instrumentation.
 *
 * Measures the skeleton-to-real-CTA funnel for ContextualCTA blocks driven
 * by useContextualOffplanMatches. Emits three event types into
 * `analytics_events` so we can compute:
 *
 *   1. skeleton_shown  — block mounted while count was still loading
 *   2. resolved        — count finished loading (success or zero)
 *   3. cta_revealed    — count > 0, the real transactional CTA materialized
 *
 * Combined with the existing `ipp_cross_cta_click` event, you get the full
 * funnel: shown → revealed → clicked, plus latency and zero-result rate.
 *
 * Design choices:
 *  - Fire-and-forget (errors swallowed; never blocks UX).
 *  - Per-mount dedup via refs so React StrictMode and re-renders don't
 *    inflate counts. The cross-mount dedup in eventDedup.ts is intentionally
 *    NOT used here — each fresh mount represents a real user impression.
 *  - Latency is measured from first observed loading=true to first
 *    observed loading=false within this mount.
 */
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'myuno_ipp_session_id';

function getSessionId(): string {
  try {
    return sessionStorage.getItem(SESSION_KEY) || `s_${Date.now()}`;
  } catch {
    return `s_${Date.now()}`;
  }
}

function emit(
  eventName: string,
  payload: Record<string, unknown>,
): void {
  void (async () => {
    try {
      await supabase.from('analytics_events').insert([{
        event_name: eventName,
        session_id: getSessionId(),
        page_path: typeof window !== 'undefined' ? window.location.pathname : null,
        event_data: payload as never,
      }]);
    } catch {
      /* never block UX */
    }
  })();
}

interface Args {
  /** Module the user is in, e.g. 'roi_calculator', 'knowledge_pillar'. */
  sourceModule: string;
  /** Stable identifier for the action whose data is loading. */
  actionId: string;
  /** Current loading state from the data hook. */
  isLoading: boolean;
  /** Resolved count (0 if no matches). */
  count: number;
  /** True only when this telemetry should be active (e.g. block has a band). */
  enabled?: boolean;
  /** Extra context appended to every event (project_id, preset, district…). */
  context?: Record<string, unknown>;
}

/**
 * Mount once per ContextualCTA block that depends on async match counts.
 * Emits skeleton_shown immediately if loading, then resolved + cta_revealed
 * once the data settles. Subsequent reloads in the same mount are ignored.
 */
export function useContextualMatchTelemetry({
  sourceModule,
  actionId,
  isLoading,
  count,
  enabled = true,
  context,
}: Args): void {
  const startedAtRef = useRef<number | null>(null);
  const skeletonFiredRef = useRef(false);
  const resolvedFiredRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // First time we see loading=true within this mount → record start +
    // emit skeleton_shown impression.
    if (isLoading && !skeletonFiredRef.current) {
      startedAtRef.current = Date.now();
      skeletonFiredRef.current = true;
      emit('contextual_match_skeleton_shown', {
        source_module: sourceModule,
        action_id: actionId,
        ...(context ?? {}),
      });
      return;
    }

    // Loading finished → emit resolved (always) and cta_revealed (when count > 0).
    if (!isLoading && skeletonFiredRef.current && !resolvedFiredRef.current) {
      resolvedFiredRef.current = true;
      const latencyMs = startedAtRef.current ? Date.now() - startedAtRef.current : null;

      emit('contextual_match_resolved', {
        source_module: sourceModule,
        action_id: actionId,
        count,
        latency_ms: latencyMs,
        zero_result: count === 0,
        ...(context ?? {}),
      });

      if (count > 0) {
        emit('contextual_cta_revealed', {
          source_module: sourceModule,
          action_id: actionId,
          count,
          latency_ms: latencyMs,
          ...(context ?? {}),
        });
      }
    }
    // We intentionally do not depend on `context` to avoid re-firing when the
    // page re-creates the object identity each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isLoading, count, sourceModule, actionId]);
}
