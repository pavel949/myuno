import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { getGoogleMapsKey } from '@/lib/googleMaps';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle2, XCircle, Loader2, RefreshCw, Upload } from 'lucide-react';
import { toast } from 'sonner';

const TEST_LAT = 7.8804;
const TEST_LNG = 98.3923;

type GeocodeTestStatus = 'idle' | 'running' | 'ok' | 'fail';

function getGeocodeFailReason(status: string, isRu: boolean): string {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'GEOCODER_NOT_READY':
      return isRu ? 'Геокодер не готов (ключ или скрипт карты)' : 'Geocoder not ready (key or map script)';
    case 'OVER_QUERY_LIMIT':
      return isRu
        ? 'Превышена квота запросов. Включите биллинг в Google Cloud или дождитесь сброса лимита.'
        : 'Quota exceeded. Enable billing in Google Cloud or wait for the limit to reset.';
    case 'REQUEST_DENIED':
      return isRu
        ? 'Запрос отклонён: проверьте ключ API, ограничения по сайтам и включён ли Geocoding API.'
        : 'Request denied: check API key, website restrictions, and that Geocoding API is enabled.';
    case 'ZERO_RESULTS':
      return isRu ? 'По координатам адрес не найден' : 'No results for this location';
    case 'UNKNOWN_ERROR':
      return isRu ? 'Временная ошибка Google. Повторите позже.' : 'Temporary Google error. Try again later.';
    default:
      return isRu ? `Ответ API: ${status}` : `API status: ${status}`;
  }
}

export function GoogleMapsStatusCard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { hasKey, isLoaded, loadError, apiAvailable } = useGoogleMaps();
  const { reverseGeocodeWithStatus } = useGoogleGeocode(language === 'ru' ? 'ru' : 'en');
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeTestStatus>('idle');
  const [geocodeFailReason, setGeocodeFailReason] = useState<string | null>(null);
  const [geocodeRawStatus, setGeocodeRawStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const runValidation = async () => {
    setGeocodeStatus('running');
    setGeocodeFailReason(null);
    setGeocodeRawStatus(null);
    toast.info(isRu ? 'Проверка геокодинга…' : 'Testing geocoding…', { id: 'geocode-test', duration: 2000 });
    try {
      const timeoutMs = 10000;
      const resultPromise = reverseGeocodeWithStatus(TEST_LAT, TEST_LNG);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(isRu ? 'Таймаут (10 с). Возможны: сеть, квота или ограничения ключа.' : 'Timeout (10s). Possible: network, quota, or key restrictions.')), timeoutMs)
      );
      const { result, status } = await Promise.race([resultPromise, timeoutPromise]);
      if (result?.address) {
        setGeocodeStatus('ok');
        toast.success(isRu ? 'Геокодинг работает' : 'Geocoding OK', { id: 'geocode-test' });
        return;
      }
      setGeocodeStatus('fail');
      setGeocodeRawStatus(status || null);
      const reason = getGeocodeFailReason(status, isRu);
      setGeocodeFailReason(reason);
      toast.error(reason, { id: 'geocode-test' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setGeocodeStatus('fail');
      setGeocodeFailReason(msg);
      setGeocodeRawStatus('timeout_or_error');
      toast.error(msg, { id: 'geocode-test' });
    }
  };

  const syncKey = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-maps-key', { method: 'POST' });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(isRu ? 'Ключ синхронизирован! Перезагрузите страницу.' : 'Key synced! Please reload the page.');
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const currentKey = getGoogleMapsKey();
  const keyLabel = hasKey
    ? isRu ? 'Ключ задан' : 'Key set'
    : isRu ? 'Ключ не задан (используется бэкенд)' : 'Key not set (using backend)';
  const keyHint = hasKey && currentKey
    ? `…${currentKey.slice(-6)}`
    : '';

  const scriptLabel = !hasKey
    ? (isRu ? 'Через Edge Function' : 'Via Edge Function')
    : loadError
      ? (isRu ? 'Ошибка загрузки' : 'Load error')
      : isLoaded
        ? (isRu ? 'Загружен' : 'Loaded')
        : (isRu ? 'Загрузка…' : 'Loading…');

  const geocodeLabel =
    geocodeStatus === 'idle'
      ? (isRu ? 'Не проверялся' : 'Not tested')
      : geocodeStatus === 'running'
        ? (isRu ? 'Проверка…' : 'Testing…')
        : geocodeStatus === 'ok'
          ? (isRu ? 'Работает' : 'OK')
          : (isRu ? 'Ошибка' : 'Failed');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-5 w-5 text-primary" />
          Google Maps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          {apiAvailable ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
              <span className="font-medium text-green-700 dark:text-green-400">
                {isRu ? 'API доступен' : 'API available'}
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                {!hasKey
                  ? (isRu ? 'Ключ не задан' : 'Key not set')
                  : loadError
                    ? (isRu ? 'Ошибка загрузки скрипта' : 'Script load error')
                    : (isRu ? 'Загрузка…' : 'Loading…')}
              </span>
            </>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            {hasKey ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
            ) : (
              <span className="h-4 w-4 flex-shrink-0 text-muted-foreground">—</span>
            )}
            <span className="text-muted-foreground">{isRu ? 'Фронтенд ключ:' : 'Frontend key:'}</span>
            <span className="font-medium truncate">{keyLabel} {keyHint}</span>
          </div>
          <div className="flex items-center gap-2">
            {!hasKey ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
            ) : loadError ? (
              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            ) : isLoaded ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-muted-foreground">{isRu ? 'Карта:' : 'Map:'}</span>
            <span className="font-medium truncate">{scriptLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {geocodeStatus === 'running' ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
            ) : geocodeStatus === 'ok' ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
            ) : geocodeStatus === 'fail' ? (
              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            ) : (
              <span className="h-4 w-4 flex-shrink-0 text-muted-foreground">—</span>
            )}
            <span className="text-muted-foreground">{isRu ? 'Геокодинг:' : 'Geocoding:'}</span>
            <span className="font-medium truncate">{geocodeLabel}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {!hasKey && (
            <Button
              variant="default"
              size="sm"
              onClick={syncKey}
              disabled={syncing}
              className="gap-2"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isRu ? 'Синхронизировать ключ' : 'Sync key from backend'}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => runValidation()}
            disabled={geocodeStatus === 'running'}
            className="gap-2"
            aria-label={isRu ? 'Проверить геокодинг' : 'Test geocoding'}
          >
            {geocodeStatus === 'running' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRu ? 'Проверить геокодинг' : 'Test geocoding'}
          </Button>
        </div>
        {loadError && (
          <p className="text-xs text-destructive mt-1">
            {loadError.message}
          </p>
        )}
        {geocodeStatus === 'fail' && geocodeFailReason && (
          <div className="mt-2 p-3 rounded-md bg-destructive/10 border border-destructive/20" role="alert">
            <p className="text-sm font-medium text-destructive">
              {isRu ? 'Проверка не прошла' : 'Check failed'}
            </p>
            <p className="text-xs text-destructive mt-1">{geocodeFailReason}</p>
            {geocodeRawStatus && (
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {isRu ? 'Код ответа' : 'Response code'}: {geocodeRawStatus}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
