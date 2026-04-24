/**
 * useIPPLeadEvent — emit IPP §3 lead-scoring events to analytics_events.
 *
 * Fire-and-forget: errors are swallowed to never block UX. The server-side
 * `auto-lead-scoring` cron aggregates these into nb_leads.score and triggers
 * P8 WhatsApp escalation when score crosses P8_HOT_LEAD_SCORE_THRESHOLD.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  IPP_LEAD_EVENTS,
  type IPPLeadEventType,
} from '@/lib/leads/ippLeadEvents';

const SESSION_KEY = 'myuno_ipp_session_id';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

interface TrackArgs {
  eventType: IPPLeadEventType;
  projectId?: string | null;
  leadId?: string | null;
  meta?: Record<string, unknown>;
}

export function useIPPLeadEvent() {
  const { user } = useAuth();

  const track = useCallback(async ({ eventType, projectId, leadId, meta }: TrackArgs) => {
    const score_delta = IPP_LEAD_EVENTS[eventType] ?? 0;
    try {
      await supabase.from('analytics_events').insert({
        event_name: 'ipp_lead_event',
        session_id: getSessionId(),
        user_id: user?.id ?? null,
        page_path: typeof window !== 'undefined' ? window.location.pathname : null,
        event_data: {
          event_type: eventType,
          score_delta,
          project_id: projectId ?? null,
          lead_id: leadId ?? null,
          ...(meta ?? {}),
        },
      });

      // If we already have a lead, bump its score on the server-side counter
      // via auto-lead-scoring (fire-and-forget, gated server-side).
      if (leadId) {
        supabase.functions
          .invoke('auto-lead-scoring', {
            body: { leadId, source: 'ipp_event', eventType, scoreDelta: score_delta },
          })
          .catch(() => { /* swallow */ });
      }
    } catch {
      /* never block UX */
    }
  }, [user?.id]);

  return { track };
}
