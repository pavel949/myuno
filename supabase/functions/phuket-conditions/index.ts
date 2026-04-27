/**
 * phuket-conditions — server-side proxy for the home-screen "Now in Phuket"
 * row (temperature, AQI, THB/USD).
 *
 * Why: external APIs (open-meteo, jsdelivr) are blocked from the Lovable
 * preview iframe by browser CORS / CSP, leaving the widget with three em-dash
 * cells. Proxying through an edge function gives us a stable, cacheable
 * single endpoint with permissive CORS that works in preview, prod and any
 * future embed surface.
 *
 * Returns 200 with whatever sources succeeded; missing fields use null so
 * the client can render partial state without throwing.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const LAT = 7.8804;
const LON = 98.3923;

interface ConditionsResponse {
  temp: number | null;
  weatherCode: number | null;
  aqi: number | null;
  rate: number | null;        // 1 USD = X THB
  rateYesterday: number | null;
  fetchedAt: string;
}

async function fetchWeather(): Promise<{ temp: number | null; weatherCode: number | null }> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Asia/Bangkok`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`weather ${r.status}`);
    const j = await r.json();
    const t = j?.current?.temperature_2m;
    const wc = j?.current?.weather_code;
    return {
      temp: typeof t === 'number' ? Math.round(t) : null,
      weatherCode: typeof wc === 'number' ? wc : null,
    };
  } catch (e) {
    console.error('[phuket-conditions] weather failed', e);
    return { temp: null, weatherCode: null };
  }
}

async function fetchAqi(): Promise<number | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}&current=us_aqi&timezone=Asia/Bangkok`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`aqi ${r.status}`);
    const j = await r.json();
    const a = j?.current?.us_aqi;
    return typeof a === 'number' ? Math.round(a) : null;
  } catch (e) {
    console.error('[phuket-conditions] aqi failed', e);
    return null;
  }
}

async function fetchRate(): Promise<{ rate: number | null; rateYesterday: number | null }> {
  try {
    const todayUrl = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json';
    const r = await fetch(todayUrl);
    if (!r.ok) throw new Error(`rate ${r.status}`);
    const j = await r.json();
    const today = j?.usd?.thb;
    if (typeof today !== 'number') return { rate: null, rateYesterday: null };

    let yesterday: number | null = null;
    try {
      const y = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
      const yUrl = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${y}/v1/currencies/usd.json`;
      const ys = await fetch(yUrl);
      if (ys.ok) {
        const yj = await ys.json();
        const yr = yj?.usd?.thb;
        if (typeof yr === 'number') yesterday = yr;
      }
    } catch { /* delta is optional */ }

    return { rate: today, rateYesterday: yesterday };
  } catch (e) {
    console.error('[phuket-conditions] rate failed', e);
    return { rate: null, rateYesterday: null };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const [w, aqi, fx] = await Promise.all([fetchWeather(), fetchAqi(), fetchRate()]);

  const result: ConditionsResponse = {
    temp: w.temp,
    weatherCode: w.weatherCode,
    aqi,
    rate: fx.rate,
    rateYesterday: fx.rateYesterday,
    fetchedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      // Cache at the edge for 15 min — these values change slowly and the
      // home screen mounts on every nav.
      'Cache-Control': 'public, max-age=900, s-maxage=900',
    },
  });
});
