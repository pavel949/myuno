import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { GOOGLE_MAPS_API_KEY } from '@/lib/googleMaps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, CheckCircle2, XCircle, Loader2, RefreshCw } from 'lucide-react';

const TEST_LAT = 7.8804;
const TEST_LNG = 98.3923;

type GeocodeTestStatus = 'idle' | 'running' | 'ok' | 'fail';

export function GoogleMapsStatusCard() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const { reverseGeocode } = useGoogleGeocode(language === 'ru' ? 'ru' : 'en');
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeTestStatus>('idle');

  const runValidation = async () => {
    setGeocodeStatus('running');
    try {
      const result = await reverseGeocode(TEST_LAT, TEST_LNG);
      setGeocodeStatus(result?.address ? 'ok' : 'fail');
    } catch {
      setGeocodeStatus('fail');
    }
  };

  const keyLabel = hasKey
    ? isRu ? 'Ключ задан' : 'Key set'
    : isRu ? 'Ключ не задан (используется бэкенд)' : 'Key not set (using backend)';
  const keyHint = hasKey && GOOGLE_MAPS_API_KEY
    ? `…${GOOGLE_MAPS_API_KEY.slice(-6)}`
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
        <Button
          variant="outline"
          size="sm"
          onClick={runValidation}
          disabled={geocodeStatus === 'running'}
          className="gap-2"
        >
          {geocodeStatus === 'running' ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRu ? 'Проверить геокодинг' : 'Test geocoding'}
        </Button>
        {loadError && (
          <p className="text-xs text-destructive mt-1">
            {loadError.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
