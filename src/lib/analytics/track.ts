/**
 * Lightweight platform-wide analytics helper.
 *
 * Emits events into `public.analytics_events`. Fire-and-forget — never
 * blocks UX, never throws. Use for product-level instrumentation that
 * does not require a logged-in user (auth user_id is best-effort).
 *
 * For richer logged-in session tracking see `useUserTracking` (it also
 * writes `page_views` rows for authed users).
 */
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'myuno_analytics_session_id';

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

let cachedUserId: string | null = null;
function getUserIdSync(): string | null {
  return cachedUserId;
}
// Refresh cached user id on auth changes so trackEvent does not need to await.
if (typeof window !== 'undefined') {
  void supabase.auth.getUser().then(({ data }) => {
    cachedUserId = data.user?.id ?? null;
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null;
  });
}

export function trackEvent(
  eventName: string,
  data?: Record<string, unknown>,
): void {
  void (async () => {
    try {
      await supabase.from('analytics_events').insert([{
        event_name: eventName,
        session_id: getSessionId(),
        user_id: getUserIdSync(),
        page_path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        event_data: (data ?? {}) as never,
      }]);
    } catch {
      /* never block UX */
    }
  })();
}

export interface SituationClickContext {
  /** Where the click originated, e.g. 'navigator_v3_for_you', 'cluster_section', 'situation_card', 'related_situations'. */
  source: string;
  /** Master Taxonomy cluster id, if known. */
  cluster?: string;
  /** Resolved destination URL (override landing or /discover/:code). */
  href: string;
  /** Active role at the time of click. */
  role?: string;
  /** Service count badge value, if shown. */
  count?: number;
}

export function trackSituationClick(
  situationCode: string,
  ctx: SituationClickContext,
): void {
  trackEvent('situation_click', {
    situation_code: situationCode,
    ...ctx,
  });
}
