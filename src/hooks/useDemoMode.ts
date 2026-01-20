import { useLocation, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

export interface DemoSession {
  token?: string;
  type: 'public' | 'vendor' | 'investor';
  startedAt: Date;
  source?: string;
}

export const useDemoMode = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isDemo = useMemo(() => {
    return location.pathname.startsWith('/demo');
  }, [location.pathname]);

  const demoType = useMemo((): DemoSession['type'] => {
    if (location.pathname.includes('/demo/vendor')) return 'vendor';
    if (location.pathname.includes('/demo/investor')) return 'investor';
    return 'public';
  }, [location.pathname]);

  const demoToken = searchParams.get('token');
  const demoSource = searchParams.get('utm_source') || searchParams.get('source');

  const demoSession: DemoSession | null = useMemo(() => {
    if (!isDemo) return null;
    return {
      token: demoToken || undefined,
      type: demoType,
      startedAt: new Date(),
      source: demoSource || undefined,
    };
  }, [isDemo, demoType, demoToken, demoSource]);

  const trackDemoAction = (action: string, metadata?: Record<string, unknown>) => {
    if (!isDemo) return;
    
    console.log('[Demo Tracking]', {
      action,
      type: demoType,
      token: demoToken,
      source: demoSource,
      timestamp: new Date().toISOString(),
      ...metadata,
    });

    // Store in localStorage for analytics
    const demoActions = JSON.parse(localStorage.getItem('demo_actions') || '[]');
    demoActions.push({
      action,
      type: demoType,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
    localStorage.setItem('demo_actions', JSON.stringify(demoActions.slice(-50)));
  };

  return {
    isDemo,
    demoType,
    demoToken,
    demoSource,
    demoSession,
    trackDemoAction,
  };
};

export const DEMO_USER = {
  id: 'demo-user-00000000-0000-0000-0000-000000000000',
  email: 'demo@myuno.app',
  name: 'Demo User',
  avatar: null,
};

export const DEMO_VENDOR = {
  id: 'demo-vendor-00000000-0000-0000-0000-000000000000',
  email: 'partner@myuno.app',
  businessName: 'Paradise Tours Phuket',
  category: 'tours',
};
