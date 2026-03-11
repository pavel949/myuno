import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

type VitalsCallback = (metric: Metric) => void;

const vitalsUrl = 'https://vitals.vercel-analytics.com/v1/vitals';

function getConnectionSpeed(): string {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string };
  };
  return nav.connection?.effectiveType || '';
}

function sendToAnalytics(metric: Metric, options: { analyticsId?: string; debug?: boolean } = {}) {
  const { analyticsId, debug = false } = options;
  
  const body = {
    dsn: analyticsId,
    id: metric.id,
    page: window.location.pathname,
    href: window.location.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: getConnectionSpeed(),
  };

  if (debug) {
    logger.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }

  // Store in localStorage for admin dashboard
  try {
    const stored = localStorage.getItem('web_vitals') || '{}';
    const vitals = JSON.parse(stored);
    vitals[metric.name] = {
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
    };
    localStorage.setItem('web_vitals', JSON.stringify(vitals));
  } catch (e) {
    // Ignore storage errors
  }

  // Send to analytics endpoint if configured
  if (analyticsId) {
    const blob = new Blob([JSON.stringify(body)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(vitalsUrl, blob);
    } else {
      fetch(vitalsUrl, {
        body: blob,
        method: 'POST',
        credentials: 'omit',
        keepalive: true,
      });
    }
  }
}

export function reportWebVitals(callback?: VitalsCallback, options?: { analyticsId?: string; debug?: boolean }) {
  const handleMetric: VitalsCallback = (metric) => {
    sendToAnalytics(metric, options);
    callback?.(metric);
  };

  onCLS(handleMetric);
  onFCP(handleMetric);
  onINP(handleMetric);
  onLCP(handleMetric);
  onTTFB(handleMetric);
}

export function getStoredVitals(): Record<string, { value: number; rating: string; timestamp: number }> {
  try {
    const stored = localStorage.getItem('web_vitals');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Thresholds based on Google's recommendations
export const vitalsThresholds = {
  LCP: { good: 2500, needsImprovement: 4000 },
  FID: { good: 100, needsImprovement: 300 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = vitalsThresholds[name as keyof typeof vitalsThresholds];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.needsImprovement) return 'needs-improvement';
  return 'poor';
}
