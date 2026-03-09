import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate unique session ID
const generateSessionId = () => crypto.randomUUID();

// Get or create session ID from sessionStorage
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('user_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('user_session_id', sessionId);
  }
  return sessionId;
};

export function useUserTracking() {
  const location = useLocation();
  const sessionIdRef = useRef<string>(getSessionId());
  const lastPageRef = useRef<string | null>(null);
  const pageEntryTimeRef = useRef<Date>(new Date());
  const userIdRef = useRef<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id || null;
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      userIdRef.current = session?.user?.id || null;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track session start/update
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId) return;

    const sessionId = sessionIdRef.current;
    
    const upsertSession = async () => {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
      };

      // Detect device type
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && !(/Mobile/i.test(navigator.userAgent));
      const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';

      // Parse browser
      const browserMatch = navigator.userAgent.match(/(Chrome|Safari|Firefox|Edge|Opera)/i);
      const browser = browserMatch ? browserMatch[1] : 'Unknown';

      // Parse OS
      const osMatch = navigator.userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i);
      const os = osMatch ? osMatch[1] : 'Unknown';

      try {
        await supabase
          .from('user_sessions')
          .upsert({
            id: sessionId,
            user_id: userId,
            session_token: sessionId,
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
            device_type: deviceType,
            browser,
            os,
            is_active: true,
            referrer: document.referrer || null,
            utm_source: new URLSearchParams(window.location.search).get('utm_source'),
            utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
            utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign'),
          }, { onConflict: 'id' });
      } catch {
        // Silent fail for tracking
      }
    };

    upsertSession();

    // Update last_activity periodically
    const interval = setInterval(async () => {
      try {
        await supabase
          .from('user_sessions')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', sessionId);
      } catch {
        // Silent fail for tracking
      }
    }, 60000); // Every minute

    // End session on page unload — use keepalive fetch for PATCH with auth headers
    const handleUnload = () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?id=eq.${sessionId}`;
        const body = JSON.stringify({ is_active: false, ended_at: new Date().toISOString() });
        // sendBeacon only supports POST and cannot set custom headers (apikey/Authorization),
        // so we use keepalive fetch which supports PATCH + headers and survives page unload.
        fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Silent fail on unload
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Track page views
  useEffect(() => {
    const userId = userIdRef.current;
    if (!userId) return;

    const currentPage = location.pathname;
    const now = new Date();

    // Record time spent on previous page
    if (lastPageRef.current && lastPageRef.current !== currentPage) {
      const timeSpent = Math.round((now.getTime() - pageEntryTimeRef.current.getTime()) / 1000);
      
      supabase
        .from('page_views')
        .insert({
          user_id: userId,
          session_id: sessionIdRef.current,
          page_path: lastPageRef.current,
          page_title: document.title,
          viewed_at: pageEntryTimeRef.current.toISOString(),
          time_on_page: timeSpent,
          referrer_path: currentPage,
        })
        .then(() => {
          // Page view tracked
        });
    }

    lastPageRef.current = currentPage;
    pageEntryTimeRef.current = now;
  }, [location.pathname]);

  // Track custom events
  const trackEvent = useCallback(async (
    eventType: string,
    eventName: string,
    eventData?: Record<string, unknown>,
    eventCategory?: string
  ) => {
    const userId = userIdRef.current;
    if (!userId) return;

    try {
      await supabase
        .from('user_events')
        .insert([{
          user_id: userId,
          event_type: eventType,
          event_name: eventName,
          event_category: eventCategory,
          event_data: (eventData || {}) as unknown as import('@/integrations/supabase/types').Json,
          page_path: location.pathname,
          session_id: sessionIdRef.current,
        }]);
    } catch {
      // Silent fail for tracking
    }
  }, [location.pathname]);

  return { trackEvent, sessionId: sessionIdRef.current };
}

// Hook for tracking specific actions
export function useTrackAction() {
  const { trackEvent } = useUserTracking();

  return {
    trackSearch: (query: string, resultsCount: number) => 
      trackEvent('interaction', 'search', { query, resultsCount }, 'search'),
    
    trackViewItem: (itemType: string, itemId: string, itemName?: string) =>
      trackEvent('content', 'view_item', { itemType, itemId, itemName }, 'content'),
    
    trackAddToCart: (itemType: string, itemId: string, price: number, quantity: number) =>
      trackEvent('ecommerce', 'add_to_cart', { itemType, itemId, price, quantity }, 'cart'),
    
    trackPurchase: (orderId: string, totalAmount: number, items: unknown[]) =>
      trackEvent('ecommerce', 'purchase', { orderId, totalAmount, items }, 'order'),
    
    trackBooking: (serviceId: string, providerId: string, amount: number) =>
      trackEvent('ecommerce', 'booking', { serviceId, providerId, amount }, 'booking'),
    
    trackFavorite: (itemType: string, itemId: string, action: 'add' | 'remove') =>
      trackEvent('engagement', 'favorite', { itemType, itemId, action }, 'favorites'),
    
    trackShare: (itemType: string, itemId: string, platform: string) =>
      trackEvent('engagement', 'share', { itemType, itemId, platform }, 'social'),
  };
}
