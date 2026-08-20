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
let cachedRole: string | null = null;

function getUserIdSync(): string | null {
  return cachedUserId;
}

async function refreshRole(userId: string | null): Promise<void> {
  if (!userId) {
    cachedRole = null;
    return;
  }
  try {
    const { data } = await supabase
      .from('profiles')
      .select('primary_role')
      .eq('id', userId)
      .maybeSingle();
    cachedRole = (data?.primary_role as string | null) ?? null;
  } catch {
    cachedRole = null;
  }
}

// Refresh cached user id on auth changes so trackEvent does not need to await.
if (typeof window !== 'undefined') {
  void supabase.auth.getUser().then(({ data }) => {
    cachedUserId = data.user?.id ?? null;
    void refreshRole(cachedUserId);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null;
    void refreshRole(cachedUserId);
  });
}

function getLanguageSync(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('myuno-language');
  } catch {
    return null;
  }
}

export function trackEvent(
  eventName: string,
  data?: Record<string, unknown>,
): void {
  void (async () => {
    try {
      const enriched = {
        language: getLanguageSync(),
        role: cachedRole,
        ...(data ?? {}),
      };
      await supabase.from('analytics_events').insert([{
        event_name: eventName,
        session_id: getSessionId(),
        user_id: getUserIdSync(),
        page_path: typeof window !== 'undefined' ? window.location.pathname + window.location.search : null,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        event_data: enriched as never,
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

export interface SituationImpressionContext {
  /** Where the list is rendered, e.g. 'navigator_v3_for_you', 'cluster_section'. */
  source: string;
  /** Visual variant of the row list ('compact' | 'prominent'). */
  variant?: string;
  /** Master Taxonomy cluster id, if the list belongs to one. */
  cluster?: string;
}

/**
 * One event per visible situation list — codes are sent as a batch so a screen
 * with six sections produces six rows, not sixty.
 */
export function trackSituationImpression(
  situationCodes: readonly string[],
  ctx: SituationImpressionContext,
): void {
  if (situationCodes.length === 0) return;
  trackEvent('situation_impression', {
    situation_codes: [...situationCodes],
    count: situationCodes.length,
    ...ctx,
  });
}

