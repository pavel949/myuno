/**
 * Google Maps Diagnostics
 * /admin/diagnostics/google-maps
 *
 * Покажет:
 *  - какой API-ключ загружен в браузер (managed vs custom, маска + длина)
 *  - текущий origin / referrer (важно для REQUEST_DENIED)
 *  - живой статус Maps JS API (загрузка скрипта, инициализация карты)
 *  - живой тест Places API (New) через connector gateway
 *  - живой тест Geocoding API через connector gateway
 *  - живой тест Maps JS API (через прямой REST вызов с browser key — выявит RefererNotAllowedMapError)
 *
 * Цель: дать одной страницей понять, где REQUEST_DENIED — referrer, API не включён, или ключ не тот.
 */
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type CheckStatus = 'idle' | 'running' | 'ok' | 'fail' | 'warn';

interface CheckResult {
  status: CheckStatus;
  message?: string;
  detail?: unknown;
}

const MASK = (v: string | undefined | null) => {
  if (!v) return '—';
  if (v.length < 12) return '***';
  return `${v.slice(0, 6)}…${v.slice(-4)} (len=${v.length})`;
};

const looksLikeGoogleKey = (v: string | undefined | null) => Boolean(v && /^AIza[0-9A-Za-z_-]{20,}$/.test(v));

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin" />;
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (status === 'fail') return <XCircle className="h-4 w-4 text-red-600" />;
  if (status === 'warn') return <AlertCircle className="h-4 w-4 text-amber-600" />;
  return <span className="inline-block h-4 w-4 rounded-full border border-border" />;
}

export default function AdminGoogleMapsDiagnostics() {
  const env = import.meta.env as Record<string, string | undefined>;

  const browserKey = env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY;
  const trackingId = env.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLovableDomain = /\.lovable\.app$|\.lovableproject\.com$/.test(host);
  const isCustomDomain = !isLovableDomain && host !== 'localhost' && host !== '';

  const [mapsJsCheck, setMapsJsCheck] = useState<CheckResult>({ status: 'idle' });
  const [placesCheck, setPlacesCheck] = useState<CheckResult>({ status: 'idle' });
  const [geocodeCheck, setGeocodeCheck] = useState<CheckResult>({ status: 'idle' });
  const [browserRestCheck, setBrowserRestCheck] = useState<CheckResult>({ status: 'idle' });

  const allEnvKeys = useMemo(
    () => Object.keys(env).filter((k) => k.includes('GOOGLE') || k.includes('LOVABLE')).sort(),
    [env],
  );

  // 1. Maps JS API — попробовать загрузить скрипт и инициализировать карту в офскрин-div
  const runMapsJsCheck = async () => {
    setMapsJsCheck({ status: 'running' });
    if (!browserKey) {
      setMapsJsCheck({ status: 'fail', message: 'VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY отсутствует' });
      return;
    }
    try {
      // если уже загружен — переиспользуем
      const w = window as unknown as { google?: { maps?: unknown } };
      if (!w.google?.maps) {
        await new Promise<void>((resolve, reject) => {
          const cbName = `__diagInitMap_${Date.now()}`;
          (window as unknown as Record<string, unknown>)[cbName] = () => resolve();
          const s = document.createElement('script');
          s.async = true;
          s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
            browserKey,
          )}&loading=async&callback=${cbName}${trackingId ? `&channel=${encodeURIComponent(trackingId)}` : ''}`;
          s.onerror = () => reject(new Error('Не удалось загрузить maps.googleapis.com (network/CSP)'));
          // Перехватим ошибки авторизации от Google
          (window as unknown as Record<string, unknown>).gm_authFailure = () =>
            reject(new Error('gm_authFailure: ключ не авторизован для этого referrer/API'));
          document.head.appendChild(s);
          setTimeout(() => reject(new Error('Таймаут 10с загрузки Maps JS API')), 10000);
        });
      }
      const w2 = window as unknown as { google: { maps: { Map: new (el: HTMLElement, opts: unknown) => unknown } } };
      const div = document.createElement('div');
      div.style.width = '1px';
      div.style.height = '1px';
      document.body.appendChild(div);
      new w2.google.maps.Map(div, { center: { lat: 7.88, lng: 98.39 }, zoom: 10 });
      document.body.removeChild(div);
      setMapsJsCheck({ status: 'ok', message: 'Maps JS API загружен и карта инициализирована' });
    } catch (e) {
      setMapsJsCheck({ status: 'fail', message: e instanceof Error ? e.message : String(e) });
    }
  };

  // 2. Прямой REST к maps.googleapis.com Geocoding — этот endpoint browser key НЕ авторизует, должен вернуть REQUEST_DENIED
  const runBrowserRestCheck = async () => {
    setBrowserRestCheck({ status: 'running' });
    if (!browserKey) {
      setBrowserRestCheck({ status: 'fail', message: 'browser key отсутствует' });
      return;
    }
    try {
      const r = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Phuket&key=${encodeURIComponent(browserKey)}`,
      );
      const j = await r.json();
      if (j.status === 'OK') {
        setBrowserRestCheck({
          status: 'warn',
          message: 'Geocoding ответил OK на browser key — необычно. Обычно browser key для геокодинга не авторизован; используйте gateway.',
          detail: j.status,
        });
      } else {
        setBrowserRestCheck({
          status: 'ok',
          message: `Ожидаемый ответ Google: ${j.status}. ${j.error_message ?? ''} → для server-side API используйте gateway, не browser key.`,
          detail: j,
        });
      }
    } catch (e) {
      setBrowserRestCheck({ status: 'fail', message: e instanceof Error ? e.message : String(e) });
    }
  };

  // 3. Backend connector → Geocoding API
  const runGeocodeCheck = async () => {
    setGeocodeCheck({ status: 'running' });
    try {
      const r = await fetch(
        `${env.VITE_SUPABASE_URL}/functions/v1/geocode-address?query=Phuket&language=en`,
        { headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '' } },
      );
      const j = await r.json().catch(() => ({}));
      if (r.ok && Array.isArray(j.results)) {
        setGeocodeCheck({ status: 'ok', message: `Backend Geocoding OK (${j.results.length} результатов)`, detail: j.results?.[0]?.address });
      } else {
        setGeocodeCheck({
          status: 'fail',
          message: `HTTP ${r.status} • ${j.error ?? ''}`,
          detail: j,
        });
      }
    } catch (e) {
      setGeocodeCheck({ status: 'fail', message: e instanceof Error ? e.message : String(e) });
    }
  };

  // 4. Backend connector → Places API (New) searchText/details
  const runPlacesCheck = async () => {
    setPlacesCheck({ status: 'running' });
    try {
      const { data, error } = await supabase.functions.invoke('place-details', {
        body: { query: { name: 'Central Phuket', lat: 7.8939, lng: 98.3523 } },
      });
      if (!error && data?.place) {
        setPlacesCheck({ status: 'ok', message: `Places API (New) OK — ${data.place.name ?? data.place.place_id ?? 'place loaded'}` });
      } else {
        setPlacesCheck({
          status: 'fail',
          message: error?.message ?? 'Places backend returned no place',
          detail: data,
        });
      }
    } catch (e) {
      setPlacesCheck({ status: 'fail', message: e instanceof Error ? e.message : String(e) });
    }
  };

  const runAll = () => {
    void runMapsJsCheck();
    void runBrowserRestCheck();
    void runGeocodeCheck();
    void runPlacesCheck();
  };

  useEffect(() => {
    runAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = (label: string, v: string) => {
    void navigator.clipboard.writeText(v);
    toast.success(`${label} скопировано`);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Google Maps — Диагностика</h1>
        <p className="text-sm text-muted-foreground">
          Быстрая проверка конфигурации, чтобы локализовать REQUEST_DENIED / RefererNotAllowedMapError.
        </p>
      </div>

      {/* Окружение */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Окружение браузера</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Origin" value={origin} onCopy={() => copy('Origin', origin)} />
          <Row label="Host" value={host} />
          <Row
            label="Тип домена"
            value={
              isLovableDomain
                ? 'Lovable (*.lovable.app / *.lovableproject.com) — managed key работает'
                : isCustomDomain
                  ? 'Custom domain — managed key НЕ работает, нужен свой API-ключ'
                  : 'localhost'
            }
          />
          <Row label="Referrer-паттерны, которые должны быть в Google Cloud" value={`${origin}/* (и ${host.includes('.') ? `https://*.${host.split('.').slice(-2).join('.')}/*` : '—'})`} />
        </CardContent>
      </Card>

      {/* Ключи */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Активные ключи (browser-side)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row
            label="VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"
            value={MASK(browserKey)}
            badge={
              browserKey
                ? looksLikeGoogleKey(browserKey)
                  ? <Badge variant="secondary">формат OK (AIza…)</Badge>
                  : <Badge variant="destructive">не похож на Google API key</Badge>
                : <Badge variant="destructive">отсутствует</Badge>
            }
            onCopy={browserKey ? () => copy('Key', browserKey) : undefined}
          />
          <Row label="VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID" value={trackingId ?? '—'} />
          <Row
            label="Backend gateway credentials"
            value="server-side only"
            badge={<Badge variant="secondary">не экспонируются в браузер</Badge>}
          />
          <details className="pt-2">
            <summary className="cursor-pointer text-xs text-muted-foreground">Все env-переменные с GOOGLE/LOVABLE ({allEnvKeys.length})</summary>
            <ul className="mt-2 space-y-1 font-mono text-xs">
              {allEnvKeys.map((k) => (
                <li key={k}>
                  <span className="text-muted-foreground">{k}</span> = {MASK(env[k])}
                </li>
              ))}
            </ul>
          </details>
        </CardContent>
      </Card>

      {/* Живые проверки */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Live-проверки API</CardTitle>
          <Button size="sm" onClick={runAll}>Перезапустить</Button>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <CheckRow
            title="Maps JavaScript API (browser key, текущий referrer)"
            hint="Если упадёт с gm_authFailure / RefererNotAllowedMapError — добавь домен в HTTP referrers ключа."
            result={mapsJsCheck}
            onRun={runMapsJsCheck}
          />
          <CheckRow
            title="Geocoding API напрямую с browser key"
            hint="Browser key не авторизован для Geocoding — ожидаемый ответ REQUEST_DENIED. Это нормально."
            result={browserRestCheck}
            onRun={runBrowserRestCheck}
          />
          <CheckRow
            title="Backend → Geocoding API"
            hint="Server-side путь через connector. Должен вернуть OK."
            result={geocodeCheck}
            onRun={runGeocodeCheck}
          />
          <CheckRow
            title="Backend → Places API (New) search/details"
            hint="Если 403 PERMISSION_DENIED — Places API (New) не включён в Google Cloud проекте custom key."
            result={placesCheck}
            onRun={runPlacesCheck}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Шпаргалка по ошибкам</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>RefererNotAllowedMapError / REQUEST_DENIED на Maps JS:</strong> текущий <code>{origin}</code> не в HTTP referrers ключа. Добавь <code>https://myuno.app/*</code> и <code>https://*.myuno.app/*</code>.</p>
          <p><strong>REQUEST_DENIED на Geocoding через browser key:</strong> это by design — используй gateway.</p>
          <p><strong>PERMISSION_DENIED через gateway:</strong> соответствующий API (Places New / Geocoding / Routes) не включён в Google Cloud проекте, к которому привязан custom key.</p>
          <p><strong>API key not authorized for this service:</strong> в Google Cloud → Credentials → твой ключ → API restrictions: включи нужные API.</p>
          <p><strong>BILLING_NOT_ACTIVATED:</strong> у Google Cloud проекта нет активного биллинга.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  label,
  value,
  badge,
  onCopy,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
  onCopy?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 font-mono text-xs">
        <span>{value}</span>
        {badge}
        {onCopy && (
          <button onClick={onCopy} className="text-muted-foreground hover:text-foreground" aria-label="copy">
            <Copy className="h-3 w-3" />
          </button>
        )}
      </span>
    </div>
  );
}

function CheckRow({
  title,
  hint,
  result,
  onRun,
}: {
  title: string;
  hint: string;
  result: CheckResult;
  onRun: () => void;
}) {
  return (
    <div className="rounded border border-border p-3">
      <div className="flex items-start gap-3">
        <StatusIcon status={result.status} />
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium">{title}</p>
            <Button size="sm" variant="ghost" onClick={onRun}>Run</Button>
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
          {result.message && (
            <p className={`mt-1 text-xs ${result.status === 'fail' ? 'text-red-600' : result.status === 'warn' ? 'text-amber-600' : 'text-foreground'}`}>
              {result.message}
            </p>
          )}
          {result.detail !== undefined && result.status === 'fail' && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs text-muted-foreground">raw response</summary>
              <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(result.detail, null, 2)}</pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
