/**
 * usePhuketConditions — real-time weather, AQI and FX rate for Phuket.
 *
 * Sources (all keyless / public, CORS-enabled):
 *  - Weather (temp + condition):   Open-Meteo  https://open-meteo.com/en/docs
 *  - Air quality (US AQI):         Open-Meteo  https://open-meteo.com/en/docs/air-quality-api
 *  - FX rate THB/USD:              fawazahmed0/currency-api (jsDelivr CDN)
 *                                  https://github.com/fawazahmed0/exchange-api
 *
 * Note: previously used exchangerate.host, which started returning 403
 * "missing_access_key" in 2026 after switching to a paid model. The new
 * source is fully open and updated daily.
 *
 * Cached in localStorage for 30 minutes to avoid re-fetching on every mount.
 * If a request fails, we fall back to the last-known cached value, then to
 * an em-dash placeholder (—). Never returns hard-coded mock data.
 */
import { useEffect, useState } from 'react';

interface PhuketConditions {
  temp: string;       // "29°"
  aqi: string;        // "34"
  rate: string;       // "34.82"
  weatherCode: number | null;
  aqiBand: 'good' | 'moderate' | 'unhealthy' | 'hazardous' | 'unknown';
  rateDelta: string;  // "+0.12" — change vs prev day
  isLoading: boolean;
  fetchedAt: number | null;
}

const CACHE_KEY = 'myuno-phuket-conditions-v2';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

// Phuket city centre
const LAT = 7.8804;
const LON = 98.3923;

function aqiBandFor(aqi: number): PhuketConditions['aqiBand'] {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 200) return 'unhealthy';
  return 'hazardous';
}

async function fetchWeather(): Promise<{ temp: string; weatherCode: number | null }> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Asia%2FBangkok`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const json = await res.json();
  const t = json?.current?.temperature_2m;
  const wc = json?.current?.weather_code;
  return {
    temp: typeof t === 'number' ? `${Math.round(t)}°` : '—',
    weatherCode: typeof wc === 'number' ? wc : null,
  };
}

async function fetchAqi(): Promise<{ aqi: string; aqiBand: PhuketConditions['aqiBand'] }> {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=us_aqi&timezone=Asia%2FBangkok`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`aqi ${res.status}`);
  const json = await res.json();
  const a = json?.current?.us_aqi;
  if (typeof a !== 'number') return { aqi: '—', aqiBand: 'unknown' };
  return { aqi: String(Math.round(a)), aqiBand: aqiBandFor(a) };
}

async function fetchRate(): Promise<{ rate: string; rateDelta: string }> {
  // fawazahmed0/currency-api returns: { date, usd: { thb: <rate>, ... } }
  // i.e. 1 USD = X THB — exactly what we display as "THB/USD".
  // Primary host = jsDelivr; if it ever rate-limits we could add a Cloudflare
  // mirror as a fallback, but for now the CDN is rock-solid.
  const todayUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
  const res = await fetch(todayUrl);
  if (!res.ok) throw new Error(`rate ${res.status}`);
  const j = await res.json();
  const r = j?.usd?.thb;
  if (typeof r !== 'number') return { rate: '—', rateDelta: '' };

  let delta = '';
  try {
    const y = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const yUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${y}/v1/currencies/usd.json`;
    const ys = await fetch(yUrl);
    if (ys.ok) {
      const yj = await ys.json();
      const yr = yj?.usd?.thb;
      if (typeof yr === 'number') {
        const d = r - yr;
        delta = `${d >= 0 ? '+' : ''}${d.toFixed(2)}`;
      }
    }
  } catch { /* ignore — delta is optional */ }

  return { rate: r.toFixed(2), rateDelta: delta };
}

export function usePhuketConditions(): PhuketConditions {
  const [data, setData] = useState<Omit<PhuketConditions, 'isLoading'>>({
    temp: '—',
    aqi: '—',
    rate: '—',
    weatherCode: null,
    aqiBand: 'unknown',
    rateDelta: '',
    fetchedAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // 1) Hydrate from cache for instant paint
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { ts, value } = JSON.parse(cached) as { ts: number; value: Omit<PhuketConditions, 'isLoading'> };
        if (value && typeof ts === 'number') {
          setData(value);
          setIsLoading(false);
          // If cache is fresh, do not refetch.
          if (Date.now() - ts < CACHE_TTL) return () => { cancelled = true; };
        }
      }
    } catch { /* ignore */ }

    // 2) Refresh from network in parallel; partial failures are OK.
    (async () => {
      const [w, a, r] = await Promise.allSettled([fetchWeather(), fetchAqi(), fetchRate()]);
      if (cancelled) return;

      setData(prev => {
        const next = {
          temp:        w.status === 'fulfilled' ? w.value.temp        : prev.temp,
          weatherCode: w.status === 'fulfilled' ? w.value.weatherCode : prev.weatherCode,
          aqi:         a.status === 'fulfilled' ? a.value.aqi         : prev.aqi,
          aqiBand:     a.status === 'fulfilled' ? a.value.aqiBand     : prev.aqiBand,
          rate:        r.status === 'fulfilled' ? r.value.rate        : prev.rate,
          rateDelta:   r.status === 'fulfilled' ? r.value.rateDelta   : prev.rateDelta,
          fetchedAt:   Date.now(),
        };
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), value: next }));
        } catch { /* ignore */ }
        return next;
      });
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, []);

  return { ...data, isLoading };
}
