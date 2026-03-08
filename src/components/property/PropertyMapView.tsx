/**
 * PropertyMapView — Google Maps with price markers
 * Shows properties on a map with clickable price pins
 */

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { GoogleMap, OverlayView } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { Property } from '@/hooks/useProperties';

const DEFAULT_CENTER = { lat: 7.8804, lng: 98.3381 };
const DEFAULT_ZOOM = 10.5;

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

interface PropertyMapViewProps {
  properties: Property[];
  hoveredProperty: string | null;
  onHover: (id: string | null) => void;
  mode?: 'rent' | 'buy';
  nights?: number;
  className?: string;
}

function PricePin({
  property,
  isHovered,
  onHover,
  onClick,
  mode,
  shortPrice,
}: {
  property: Property;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  mode: string;
  shortPrice: (p: number) => string;
}) {
  const price = mode === 'buy'
    ? ((property as any).sale_price || property.price || 0)
    : (property.price || 0);
  const priceLabel = `฿${shortPrice(price)}`;

  return (
    <div
      className={cn(
        'px-2 py-1 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap shadow-md border transition-all duration-150',
        isHovered
          ? 'bg-primary text-primary-foreground border-primary scale-110 z-10'
          : 'bg-background text-foreground border-border hover:scale-105'
      )}
      onMouseEnter={() => onHover(property.id)}
      onMouseLeave={() => onHover(null)}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {priceLabel}
    </div>
  );
}

export function PropertyMapView({
  properties,
  hoveredProperty,
  onHover,
  mode = 'rent',
  nights,
  className,
}: PropertyMapViewProps) {
  const { hasKey, isLoaded } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();

  const shortPrice = useCallback((price: number) => {
    if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
    if (price >= 1_000) return `${Math.round(price / 1_000)}K`;
    return `${price}`;
  }, []);

  const validProps = useMemo(() => properties.filter(p => p.lat && p.lng), [properties]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (validProps.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      validProps.forEach(p => bounds.extend({ lat: p.lat!, lng: p.lng! }));
      map.fitBounds(bounds, 60);
    }
  }, [validProps]);

  useEffect(() => {
    if (!mapRef.current || validProps.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    validProps.forEach(p => bounds.extend({ lat: p.lat!, lng: p.lng! }));
    mapRef.current.fitBounds(bounds, 60);
  }, [validProps]);

  if (!hasKey || !isLoaded) {
    return (
      <div className={cn('w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border flex items-center justify-center bg-card', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn('w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border', className)}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
            { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          ],
        }}
      >
        {validProps.map(property => (
          <OverlayView
            key={property.id}
            position={{ lat: property.lat!, lng: property.lng! }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <PricePin
              property={property}
              isHovered={property.id === hoveredProperty}
              onHover={onHover}
              onClick={() => navigate(`/property/${property.id}`)}
              mode={mode}
              shortPrice={shortPrice}
            />
          </OverlayView>
        ))}
      </GoogleMap>
    </div>
  );
}

export default PropertyMapView;
