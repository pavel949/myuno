import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { hasCookieConsent, subscribeCookieConsent } from '@/lib/cookieConsent';
import { canLoadPublicTelemetry, sanitizePublicTelemetry } from '@/lib/publicTelemetry';

type TelemetrySdk = {
  Analytics: typeof import('@vercel/analytics/react').Analytics;
  SpeedInsights: typeof import('@vercel/speed-insights/react').SpeedInsights;
};

// Read the current choice and route for every event, including after unmount/navigation.
const beforeSend = <T extends { url: string }>(event: T) =>
  sanitizePublicTelemetry(event, window.location.href, hasCookieConsent('analytics'));

export function PublicTelemetry() {
  const location = useLocation();
  const [sdk, setSdk] = useState<TelemetrySdk | null>(null);
  const [consent, setConsent] = useState(() => hasCookieConsent('analytics'));
  useEffect(() => subscribeCookieConsent(() => setConsent(hasCookieConsent('analytics'))), []);
  const allowed = canLoadPublicTelemetry({
    enabled: import.meta.env.VITE_VERCEL_TELEMETRY_ENABLED === 'true',
    production: import.meta.env.PROD,
    consent,
    href: window.location.href,
  });
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void Promise.all([import('@vercel/analytics/react'), import('@vercel/speed-insights/react')])
      .then(([analytics, speed]) => {
        if (active) setSdk({ Analytics: analytics.Analytics, SpeedInsights: speed.SpeedInsights });
      })
      .catch(() => { /* Optional instrumentation must never interrupt the app. */ });
    return () => { active = false; };
  }, [allowed]);
  if (!allowed || !sdk) return null;
  return (
    <>
      <sdk.Analytics mode="production" debug={false} beforeSend={beforeSend} />
      <sdk.SpeedInsights route={location.pathname} debug={false} beforeSend={beforeSend} />
    </>
  );
}
