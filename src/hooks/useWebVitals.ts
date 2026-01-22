import { useEffect, useState } from 'react';
import { reportWebVitals, getStoredVitals, getRating, vitalsThresholds } from '@/lib/webVitals';

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  unit: string;
  description: string;
}

export function useWebVitals(debug = false) {
  const [vitals, setVitals] = useState<VitalMetric[]>([]);

  useEffect(() => {
    // Initialize reporting
    reportWebVitals(undefined, { debug });

    const metricInfo: Record<string, { unit: string; description: string }> = {
      LCP: { unit: 'ms', description: 'Largest Contentful Paint' },
      FID: { unit: 'ms', description: 'First Input Delay' },
      CLS: { unit: '', description: 'Cumulative Layout Shift' },
      FCP: { unit: 'ms', description: 'First Contentful Paint' },
      TTFB: { unit: 'ms', description: 'Time to First Byte' },
      INP: { unit: 'ms', description: 'Interaction to Next Paint' },
    };

    const updateVitals = () => {
      const stored = getStoredVitals();
      const metrics: VitalMetric[] = [];

      Object.entries(stored).forEach(([name, data]) => {
        if (metricInfo[name]) {
          metrics.push({
            name,
            value: data.value,
            rating: getRating(name, data.value),
            unit: metricInfo[name].unit,
            description: metricInfo[name].description,
          });
        }
      });

      setVitals(metrics);
    };

    // Initial update
    updateVitals();

    // Poll every 5 seconds instead of 1 second for better performance
    const interval = setInterval(updateVitals, 5000);

    return () => clearInterval(interval);
  }, [debug]);

  return { vitals, thresholds: vitalsThresholds };
}
