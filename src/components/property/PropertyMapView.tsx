/**
 * PropertyMapView — Airbnb-style map with price markers
 * Uses Google Maps (Maps JavaScript API). Requires VITE_GOOGLE_MAPS_API_KEY.
 */

import React, { useRef, useCallback, useState, useMemo, forwardRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { cn } from '@/lib/utils';
import type { Property } from '@/hooks/useProperties';
import { DEFAULT_MAP_CENTER } from '@/lib/googleMaps';
import { APP_ROUTES } from '@/lib/config/routes';

const DEFAULT_ZOOM = 10.5;

interface PropertyMapViewProps {
  properties: Property[];
  hoveredProperty: string | null;
  onHover: (id: string | null) => void;
  mode?: 'rent' | 'buy';
  nights?: number;
  className?: string;
}

function shortPrice(price: number): string {
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
  return `${price}`;
}

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

export const PropertyMapView = forwardRef<HTMLDivElement, PropertyMapViewProps>(function PropertyMapView({
  properties,
  hoveredProperty,
  onHover,
  mode = 'rent',
  className,
}, ref) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const { hasKey, isLoaded, loadError } = useGoogleMaps();

  const validProps = useMemo(
    () => properties.filter((p) => p.lat && p.lng),
    [properties]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  React.useEffect(() => {
    if (!mapRef.current || validProps.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    validProps.forEach((p) => bounds.extend({ lat: p.lat!, lng: p.lng! }));
    mapRef.current.fitBounds(bounds, 60);
  }, [validProps]);

  const noKey = !hasKey || loadError;
  const isLoading = hasKey && !isLoaded;

  if (noKey) {
    return (
      <div
        className={cn(
          'w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border flex flex-col items-center justify-center bg-muted/30 gap-2 p-4',
          className
        )}
      >
        <MapPin className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          {loadError?.message?.includes('auth')
            ? (language === 'ru'
              ? 'Ошибка авторизации Google Maps. Проверьте ограничения API-ключа в Google Cloud Console.'
              : 'Google Maps auth error. Check API key restrictions in Google Cloud Console.')
            : (language === 'ru' ? 'Карта недоступна' : 'Map unavailable')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border flex items-center justify-center bg-muted/30',
          className
        )}
      >
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className={cn('w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border', className)}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {validProps.map((property) => {
          const price =
            mode === 'buy'
              ? ((property as Property & { sale_price?: number }).sale_price || property.price || 0)
              : property.price || 0;
          const priceLabel = `฿${shortPrice(price)}`;

          return (
            <Marker
              key={property.id}
              position={{ lat: property.lat!, lng: property.lng! }}
              label={{
                text: priceLabel,
                color: 'hsl(var(--foreground))',
                fontWeight: '600',
                fontSize: '12px',
              }}
              title={language === 'ru' ? property.title_ru : property.title_en}
              onClick={() => navigate(APP_ROUTES.PROPERTY_DETAIL(property.id))}
            />
          );
        })}
      </GoogleMap>
    </div>
  );
});

export default PropertyMapView;
