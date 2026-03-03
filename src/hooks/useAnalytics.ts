import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'myuno_analytics_session';

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

/** Fire-and-forget analytics event insert */
async function trackEvent(
  eventName: string,
  eventData: Record<string, any> = {},
  userId?: string,
  pagePath?: string
) {
  try {
    await (supabase as any).from('analytics_events').insert({
      user_id: userId || null,
      session_id: getSessionId(),
      event_name: eventName,
      event_data: eventData,
      page_path: pagePath || window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
    });
  } catch {
    // analytics should never crash the app
  }
}

export function useAnalytics() {
  const { user } = useAuth();
  const location = useLocation();
  const lastPath = useRef('');

  // Auto-track page views
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      trackEvent('page_view', { path: location.pathname }, user?.id, location.pathname);
    }
  }, [location.pathname, user?.id]);

  const track = useCallback(
    (eventName: string, data: Record<string, any> = {}) => {
      trackEvent(eventName, data, user?.id);
    },
    [user?.id]
  );

  return { track };
}
