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
  /** True after at least one source returned a value (cache or network). */
  hasAnyData: boolean;
  /** Set when a network round-trip completed but every source failed. */
  hasError: boolean;
  fetchedAt: number | null;
  /** Force a fresh network round-trip (bypasses the 30-min cache). */
  retry: () => void;
}

// Bumped to v4 (2026-04-27) when the hook stopped caching em-dash
// placeholders — old v3 entries with empty values must not survive.
const CACHE_KEY = 'myuno-phuket-conditions-v4';
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

/** Internal data shape persisted to localStorage (no transient flags). */
type PhuketData = Pick<
  PhuketConditions,
  'temp' | 'aqi' | 'rate' | 'weatherCode' | 'aqiBand' | 'rateDelta' | 'fetchedAt'
>;

const EMPTY_DATA: PhuketData = {
  temp: '—',
  aqi: '—',
  rate: '—',
  weatherCode: null,
  aqiBand: 'unknown',
  rateDelta: '',
  fetchedAt: null,
};

export function usePhuketConditions(): PhuketConditions {
  const [data, setData] = useState<PhuketData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAnyData, setHasAnyData] = useState(false);
  const [hasError, setHasError] = useState(false);
  // Bumped to force a refetch when the user taps "Retry".
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    // 1) Hydrate from cache for instant paint (skip on explicit retry — the
    //    user is asking for fresh data, so we don't want to mask a network
    //    success with an old cached value).
    if (retryCount === 0) {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { ts, value } = JSON.parse(cached) as { ts: number; value: PhuketData };
          if (value && typeof ts === 'number') {
            setData(value);
            setHasAnyData(true);
            setIsLoading(false);
            // If cache is fresh, do not refetch.
            if (Date.now() - ts < CACHE_TTL) return () => { cancelled = true; };
          }
        }
      } catch { /* ignore */ }
    } else {
      // Retry: clear error flag and show loading state.
      setHasError(false);
      setIsLoading(true);
    }

    // 2) Refresh from network in parallel; partial failures are OK.
    //    A "fulfilled" promise that returned the em-dash placeholder is
    //    treated as a soft-failure — we don't want to show three blank cells
    //    and pretend everything is fine. This also stops us from caching a
    //    useless `{ temp:'—', aqi:'—', rate:'—' }` payload that survives
    //    across reloads (the bug seen in the user's screenshot).
    (async () => {
      const [w, a, r] = await Promise.allSettled([fetchWeather(), fetchAqi(), fetchRate()]);
      if (cancelled) return;

      const wOk = w.status === 'fulfilled' && w.value.temp !== '—';
      const aOk = a.status === 'fulfilled' && a.value.aqi !== '—';
      const rOk = r.status === 'fulfilled' && r.value.rate !== '—';
      const anySuccess = wOk || aOk || rOk;

      setData(prev => {
        const next: PhuketData = {
          temp:        wOk ? w.value.temp        : prev.temp,
          weatherCode: wOk ? w.value.weatherCode : prev.weatherCode,
          aqi:         aOk ? a.value.aqi         : prev.aqi,
          aqiBand:     aOk ? a.value.aqiBand     : prev.aqiBand,
          rate:        rOk ? r.value.rate        : prev.rate,
          rateDelta:   rOk ? r.value.rateDelta   : prev.rateDelta,
          fetchedAt:   Date.now(),
        };
        if (anySuccess) {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), value: next }));
          } catch { /* ignore */ }
        }
        return next;
      });

      // Decide error state by inspecting the *resulting* data, not the
      // closed-over `hasAnyData` (which may be stale on first paint).
      setHasAnyData(prevHad => {
        const haveSomething = prevHad || anySuccess;
        setHasError(!haveSomething);
        return haveSomething;
      });
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const retry = () => setRetryCount((n) => n + 1);

  return { ...data, isLoading, hasAnyData, hasError, retry };
}
