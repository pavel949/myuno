import { useState, useEffect } from 'react';

interface PhuketConditions {
  temp: string;
  aqi: string;
  rate: string;
  isLoading: boolean;
}

const CACHE_KEY = 'myuno-phuket-conditions';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export function usePhuketConditions(): PhuketConditions {
  const [data, setData] = useState<Omit<PhuketConditions, 'isLoading'>>({ temp: '–', aqi: '–', rate: '–' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, value } = JSON.parse(cached) as { ts: number; value: Omit<PhuketConditions, 'isLoading'> };
        if (Date.now() - ts < CACHE_TTL) {
          setData(value);
          setIsLoading(false);
          return;
        }
      }
    } catch { /* ignore */ }

    // Static fallback — replace with real API calls when keys are available
    const fallback = { temp: '29°', aqi: '34', rate: '34.82' };
    setData(fallback);
    setIsLoading(false);
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), value: fallback }));
    } catch { /* ignore */ }
  }, []);

  return { ...data, isLoading };
}
