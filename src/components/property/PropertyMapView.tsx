import { surfaceFromProperty } from '@/lib/real-estate/listingViewModel';
import { publicJourneyState } from '@/lib/real-estate/publicJourney';
import { propertyDetailMode, propertyDetailHref } from '@/lib/real-estate/propertyDetailIntent';
/** Public property-map adapter over the canonical Phuket MapLibre/PMTiles map.
 * Catalogue data, price semantics and detail-return context remain unchanged.
 */

import React, { useRef, useState, useMemo, forwardRef } from 'react';
import { MapLibreMap, type MapLibreMapHandle } from '@/components/map/MapLibreMap';
import { isValidMapPosition } from '@/lib/map/basemap';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { Property } from '@/hooks/useProperties';
const DEFAULT_MAP_CENTER = { lat: 7.95, lng: 98.33 };
import { TrustStrip } from './TrustStrip';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

const DEFAULT_ZOOM = 10.5;
const FALLBACK_IMAGE = PLACEHOLDER_IMAGES.property;

interface PropertyMapViewProps {
  properties: Property[];
  hoveredProperty: string | null;
  onHover: (id: string | null) => void;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  mode?: 'rent' | 'buy' | 'all';
  nights?: number;
  className?: string;
}



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
  selectedId = null,
  onSelect,
  mode = 'rent',
  className,
}, ref) {
  const mapRef = useRef<MapLibreMapHandle | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  // External selection wins; fall back to local state for standalone usage.
  const [localOpenId, setLocalOpenId] = useState<string | null>(null);
  const openId = onSelect ? selectedId : localOpenId;
  const setOpenId = (id: string | null) => (onSelect ? onSelect(id) : setLocalOpenId(id));


  const validProps = useMemo(() => properties.filter((p) =>
    p.lat != null && p.lng != null && isValidMapPosition(Number(p.lat), Number(p.lng))
  ), [properties]);
  const markers = useMemo(() => validProps.map((property) => {
    const surface = surfaceFromProperty(property, mode === 'all' ? propertyDetailMode(property) : mode);
    const suffix = ({ per_night: '/n', per_week: '/wk', per_month: '/mo', per_year: '/yr' } as Record<string, string>)[surface.priceMode] ?? '';
    return { id: property.id, lat: Number(property.lat), lng: Number(property.lng),
      title: isRu ? property.title_ru : property.title_en,
      icon: surface.priceHintThb !== null ? `${formatPrice(surface.priceHintThb)}${suffix}` : '—' };
  }), [validProps, mode, isRu, formatPrice]);
  React.useEffect(() => {
    const property = validProps.find((p) => p.id === openId);
    if (property) mapRef.current?.flyTo(Number(property.lat), Number(property.lng));
  }, [openId, validProps]);

  const openProperty = openId ? (validProps.find((p) => p.id === openId) as PropertyTrustExt | undefined) : undefined;

  return (
    <div ref={ref} className={cn('relative w-full h-[400px] lg:h-[500px] rounded-none overflow-hidden border', className)}>
      <MapLibreMap ref={mapRef} center={DEFAULT_MAP_CENTER} zoom={DEFAULT_ZOOM}
        className="h-full w-full [&_[data-marker-id]]:!w-auto [&_[data-marker-id]]:!min-w-11 [&_[data-marker-id]]:!px-3 [&_[data-marker-id]]:!text-xs [&_[data-marker-id]]:!whitespace-nowrap" markers={markers} activeMarkerId={openId ?? hoveredProperty ?? undefined}
        onMarkerClick={(marker) => { setOpenId(marker.id); onHover(marker.id); }} showLocateButton={false} />
      {validProps.length === 0 && (
        <div role="status" className="absolute inset-x-4 top-4 bg-background border p-3 text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {isRu ? 'У этих объектов пока нет координат. Откройте карточку из списка.' : 'These homes have no map coordinates yet. Open a home from the list.'}
        </div>
      )}
      {openProperty && (
        <div className="pointer-events-none absolute inset-4 grid grid-cols-1 grid-rows-1 items-end justify-items-start">
        <section aria-label={isRu ? 'Объект на карте' : 'Home on map'} className="pointer-events-auto min-w-0 max-w-full max-h-full overflow-auto bg-background border shadow-lg p-3">
          <button type="button" onClick={() => setOpenId(null)} className="min-h-11 px-3 mb-2 text-sm" aria-label={isRu ? 'Закрыть карточку' : 'Close property card'}>{isRu ? 'Закрыть' : 'Close'}</button>
            <div className="w-[260px] max-w-full text-foreground">
              <button
                type="button"
                onClick={() => navigate(propertyDetailHref(openProperty.id, mode === 'all' ? propertyDetailMode(openProperty) : mode, location.search), { state: publicJourneyState(location) })}
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
                  {(() => {
                    const surface = surfaceFromProperty(openProperty, mode === 'all' ? propertyDetailMode(openProperty) : mode);
                    const suffix = ({ per_night: isRu ? '/ ночь' : '/ night', per_week: isRu ? '/ нед.' : '/ week', per_month: isRu ? '/ мес.' : '/ month', per_year: isRu ? '/ год' : '/ year' } as Record<string, string>)[surface.priceMode] ?? '';
                    return surface.priceHintThb === null ? (isRu ? 'По запросу' : 'On request') : `${formatPrice(surface.priceHintThb)} ${suffix}`;
                  })()}
                </p>
              </button>

              <TrustStrip
                titleDeedType={openProperty.title_deed_type ?? null}
                escrowOffered={openProperty.escrow_offered ?? null}
                clearviewBadge={openProperty.clearview_badge ?? null}
                clearviewRecommendation={openProperty.clearview_recommendation ?? null}
                floodRisk={openProperty.flood_risk ?? null}
                ownerVerified={null}
                isRu={isRu}
                className="mt-2 [&>div]:text-[10px] [&>div]:px-1.5 [&>div]:py-0.5 [&_svg]:w-3 [&_svg]:h-3"
              />

              <button
                type="button"
                onClick={() => navigate(propertyDetailHref(openProperty.id, mode === 'all' ? propertyDetailMode(openProperty) : mode, location.search), { state: publicJourneyState(location) })}
                className="mt-2 w-full text-[11px] font-semibold uppercase tracking-wide bg-foreground text-background py-1.5 hover:opacity-90"
              >
                {isRu ? 'Открыть' : 'View details'}
              </button>
            </div>
        </section>
        </div>
      )}

    </div>
  );
});

export default PropertyMapView;
