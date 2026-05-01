/**
 * UnifiedCatalogMap — single Google Map renderer for ALL mini-app catalogs.
 *
 * Replaces per-vertical map components (SalonMap, etc.). Accepts a normalized
 * marker array — vertical-specific shape lives in `src/lib/adapters/mapMarkerAdapter.ts`.
 *
 * Distance filter is applied here (km radius from userLocation). Rendering is
 * intentionally lightweight — no clustering yet (added when >200 markers per page).
 */
import React, { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { Loader2 } from 'lucide-react';
import { createMapPopupHtml, escapeHtml } from '@/lib/sanitize';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';
import { cn } from '@/lib/utils';

export interface UnifiedMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  titleRu?: string;
  rating?: number;
  priceLabel?: string;
  image?: string;
  badge?: string;
}

interface UnifiedCatalogMapProps {
  markers: UnifiedMapMarker[];
  onSelect?: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  /** Radius in km. 0 / undefined = no filter. */
  distanceKm?: number;
  className?: string;
  /** Single-char emoji or symbol for marker labels. */
  iconChar?: string;
  emptyMessage?: string;
}

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const UnifiedCatalogMap: React.FC<UnifiedCatalogMapProps> = ({
  markers,
  onSelect,
  userLocation,
  distanceKm: radius,
  className = '',
  iconChar,
  emptyMessage,
}) => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const { language } = useLanguage();
  const { getCityConfig } = useLocationContext();
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const defaultCenter = useMemo(() => {
    const cityConfig = getCityConfig();
    if (cityConfig) return { lat: cityConfig.lat, lng: cityConfig.lng };
    const c = getMapCenter(DEFAULT_CITY);
    return { lat: c[1], lng: c[0] };
  }, [getCityConfig]);

  const filtered = useMemo(() => {
    const valid = markers.filter(
      (m) => Number.isFinite(m.lat) && Number.isFinite(m.lng) && m.lat !== 0 && m.lng !== 0,
    );
    if (!userLocation || !radius || radius <= 0) return valid;
    return valid.filter(
      (m) => distanceKm(userLocation.lat, userLocation.lng, m.lat, m.lng) <= radius,
    );
  }, [markers, radius, userLocation]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (!mapRef.current || filtered.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    filtered.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
    if (userLocation) bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    mapRef.current.fitBounds(bounds, 60);
  }, [filtered, userLocation]);

  if (!hasKey || loadError) {
    return (
      <div className={cn('flex items-center justify-center bg-card', className)}>
        <p className="text-muted-foreground text-sm">
          {loadError?.message ?? (language === 'ru' ? 'Карта недоступна' : 'Map unavailable')}
        </p>
      </div>
    );
  }

  if (hasKey && !isLoaded) {
    return (
      <div className={cn('flex items-center justify-center bg-card', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const labelOptions =
    iconChar && iconChar.length === 1 && iconChar.charCodeAt(0) < 128
      ? { text: iconChar, color: 'white', fontWeight: 'bold', fontSize: '14px' }
      : undefined;

  return (
    <div className={cn('relative min-h-0', className)}>
      {filtered.length === 0 && emptyMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-card/95 border border-border px-3 py-1.5 text-xs text-muted-foreground shadow">
          {emptyMessage}
        </div>
      )}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {filtered.map((m) => (
          <Marker
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            title={language === 'ru' && m.titleRu ? m.titleRu : m.title}
            label={labelOptions}
            onClick={() => setSelectedId(m.id)}
          />
        ))}
        {selectedId && (() => {
          const m = filtered.find((x) => x.id === selectedId);
          if (!m) return null;
          return (
            <InfoWindow
              position={{ lat: m.lat, lng: m.lng }}
              onCloseClick={() => setSelectedId(null)}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect?.(m.id)}
                onKeyDown={(e) => e.key === 'Enter' && onSelect?.(m.id)}
                className="min-w-[200px] max-w-[240px] text-left cursor-pointer"
                dangerouslySetInnerHTML={{
                  __html: createMapPopupHtml({
                    name: language === 'ru' && m.titleRu ? m.titleRu : m.title,
                    rating: m.rating ?? 0,
                    price: escapeHtml(m.priceLabel ?? ''),
                    image: m.image,
                  }),
                }}
              />
            </InfoWindow>
          );
        })()}
      </GoogleMap>
    </div>
  );
};

export default UnifiedCatalogMap;
