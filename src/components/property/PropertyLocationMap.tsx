import React, { useRef, useCallback, useMemo } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { DEFAULT_MAP_CENTER } from '@/lib/googleMaps';
import { cn } from '@/lib/utils';

interface PropertyLocationMapProps {
  lat?: number | null;
  lng?: number | null;
  district?: string;
  address?: string;
  /** When false, hides the default H2 (use parent section title instead). */
  showHeading?: boolean;
}

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

export function PropertyLocationMap({
  lat,
  lng,
  district,
  address,
  showHeading = true,
}: PropertyLocationMapProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);

  const hasCoords = lat != null && lng != null && lat !== 0 && lng !== 0;
  const center = useMemo(() => {
    if (hasCoords) return { lat: lat!, lng: lng! };
    return DEFAULT_MAP_CENTER;
  }, [hasCoords, lat, lng]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const noKey = !hasKey || loadError;
  const isLoading = hasKey && !isLoaded;

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;

  return (
    <div>
      {showHeading && (
        <h2 className="text-xl font-semibold mb-3">
          {isRu ? 'Где вы будете' : "Where you'll be"}
        </h2>
      )}

      <div className={cn('rounded-none overflow-hidden border border-border h-[300px] relative', showHeading && 'mb-3')}>
        {noKey && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 gap-3 p-4">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              {loadError?.message?.includes('auth')
                ? (isRu
                  ? 'Ошибка авторизации Google Maps. Проверьте ограничения API-ключа.'
                  : 'Google Maps auth error. Check API key restrictions.')
                : (isRu ? 'Карта недоступна' : 'Map unavailable')}
            </p>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {isRu ? 'Открыть в Google Картах' : 'Open in Google Maps'}
              </a>
            )}
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {hasKey && isLoaded && !loadError && (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={hasCoords ? 14 : 11}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            options={{
              mapTypeControl: true,
              streetViewControl: false,
              fullscreenControl: true,
              zoomControl: true,
            }}
          >
            {hasCoords && <Marker position={center} />}
          </GoogleMap>
        )}
        {/* Fallback when embed shows "didn't load correctly" (e.g. key restrictions or billing) */}
        {hasKey && isLoaded && !loadError && googleMapsUrl && (
          <div className="absolute bottom-2 right-2 z-10">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-background/95 hover:bg-background border border-border rounded-none px-2 py-1.5 shadow-sm text-primary hover:underline"
            >
              {isRu ? 'Открыть в Google Картах' : 'Open in Google Maps'}
            </a>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 text-muted-foreground">
        <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{district || 'Phuket'}</p>
          {address && <p className="text-sm">{address}</p>}
          {hasCoords && (
            <p className="text-xs mt-1">
              {isRu
                ? 'Точное местоположение будет предоставлено после бронирования'
                : 'Exact location provided after booking'}
            </p>
          )}
          {googleMapsUrl && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              {isRu ? 'Показать на Google Картах' : 'Show on Google Maps'}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
