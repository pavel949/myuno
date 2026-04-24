/**
 * PropertyMapView — Airbnb-style map with price markers
 * Uses Google Maps (Maps JavaScript API). Requires VITE_GOOGLE_MAPS_API_KEY.
 *
 * Marker click opens an InfoWindow mini-card showing photo, title, price and
 * trust signals (TrustStrip) so users can validate listings without leaving
 * the map. A "View details" CTA navigates to the detail page.
 */

import React, { useRef, useCallback, useState, useMemo, forwardRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { cn } from '@/lib/utils';
import type { Property } from '@/hooks/useProperties';
import { DEFAULT_MAP_CENTER } from '@/lib/googleMaps';
import { APP_ROUTES } from '@/lib/config/routes';
import { TrustStrip } from './TrustStrip';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const DEFAULT_ZOOM = 10.5;
const FALLBACK_IMAGE = PLACEHOLDER_IMAGES.property;

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

type PropertyTrustExt = Property & {
  title_deed_type?: string | null;
  escrow_offered?: boolean | null;
  clearview_badge?: string | null;
  clearview_recommendation?: string | null;
  flood_risk?: string | null;
  sale_price?: number | null;
};

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
  const isRu = language === 'ru';
  const [openId, setOpenId] = useState<string | null>(null);

  const validProps = useMemo(() => {
    return properties.filter((p) => {
      const lat = typeof p.lat === 'number' ? p.lat : Number(p.lat);
      const lng = typeof p.lng === 'number' ? p.lng : Number(p.lng);
      return Number.isFinite(lat) && Number.isFinite(lng) && !(Math.abs(lat) < 1e-5 && Math.abs(lng) < 1e-5);
    });
  }, [properties]);

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
          'w-full h-[400px] lg:h-[500px] rounded-none overflow-hidden border flex flex-col items-center justify-center bg-muted/30 gap-2 p-4',
          className
        )}
      >
        <MapPin className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          {loadError?.message?.includes('auth')
            ? (isRu
              ? 'Ошибка авторизации Google Maps. Проверьте ограничения API-ключа в Google Cloud Console.'
              : 'Google Maps auth error. Check API key restrictions in Google Cloud Console.')
            : (isRu ? 'Карта недоступна' : 'Map unavailable')}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'w-full h-[400px] lg:h-[500px] rounded-none overflow-hidden border flex items-center justify-center bg-muted/30',
          className
        )}
      >
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const openProperty = openId ? (validProps.find((p) => p.id === openId) as PropertyTrustExt | undefined) : undefined;

  return (
    <div className={cn('w-full h-[400px] lg:h-[500px] rounded-none overflow-hidden border', className)}>
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
        onClick={() => setOpenId(null)}
      >
        {validProps.map((property) => {
          const ext = property as PropertyTrustExt;
          const price =
            mode === 'buy'
              ? (ext.sale_price || property.price || 0)
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
              title={isRu ? property.title_ru : property.title_en}
              onClick={() => {
                setOpenId(property.id);
                onHover?.(property.id);
              }}
            />
          );
        })}

        {openProperty && (
          <InfoWindow
            position={{ lat: openProperty.lat!, lng: openProperty.lng! }}
            onCloseClick={() => setOpenId(null)}
            options={{ pixelOffset: new google.maps.Size(0, -32), maxWidth: 280 }}
          >
            <div className="w-[260px] text-foreground">
              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.PROPERTY_DETAIL(openProperty.id))}
                className="block w-full text-left group"
              >
                <div className="aspect-[16/10] bg-muted overflow-hidden mb-2">
                  <img
                    src={openProperty.cover_image || openProperty.images?.[0] || FALLBACK_IMAGE}
                    alt={isRu ? openProperty.title_ru : openProperty.title_en}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-sm font-semibold leading-tight line-clamp-2 group-hover:underline">
                  {isRu ? openProperty.title_ru : openProperty.title_en}
                </h3>
                {openProperty.district && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">{openProperty.district}</p>
                )}
                <p className="text-sm font-semibold mt-1">
                  {mode === 'buy'
                    ? formatPrice(openProperty.sale_price ?? openProperty.price ?? 0)
                    : (
                      <>
                        {formatPrice(openProperty.price_per_night ?? openProperty.price ?? 0)}
                        <span className="font-normal text-muted-foreground">
                          {' '}/ {isRu ? 'ночь' : 'night'}
                        </span>
                      </>
                    )}
                </p>
              </button>

              <TrustStrip
                titleDeedType={openProperty.title_deed_type ?? null}
                escrowOffered={openProperty.escrow_offered ?? null}
                clearviewBadge={openProperty.clearview_badge ?? null}
                clearviewRecommendation={openProperty.clearview_recommendation ?? null}
                floodRisk={openProperty.flood_risk ?? null}
                ownerVerified={openProperty.is_verified ?? null}
                isRu={isRu}
                className="mt-2 [&>div]:text-[10px] [&>div]:px-1.5 [&>div]:py-0.5 [&_svg]:w-3 [&_svg]:h-3"
              />

              <button
                type="button"
                onClick={() => navigate(APP_ROUTES.PROPERTY_DETAIL(openProperty.id))}
                className="mt-2 w-full text-[11px] font-semibold uppercase tracking-wide bg-foreground text-background py-1.5 hover:opacity-90"
              >
                {isRu ? 'Открыть' : 'View details'}
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
});

export default PropertyMapView;
