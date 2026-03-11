import React, { useRef, useState, useMemo, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { Loader2 } from 'lucide-react';
import { createMapPopupHtml, escapeHtml } from '@/lib/sanitize';
import { getMapCenter, DEFAULT_CITY } from '@/lib/config';

export interface SalonMarker {
  id: string;
  name: string;
  nameRu: string;
  lat: number;
  lng: number;
  rating: number;
  priceFrom: number;
  image?: string;
}

interface SalonMapProps {
  salons: SalonMarker[];
  onSalonSelect?: (salonId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  distanceFilter?: number;
  className?: string;
  icon?: string;
  iconBgColor?: string;
}

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const SalonMap: React.FC<SalonMapProps> = ({
  salons,
  onSalonSelect,
  userLocation,
  distanceFilter,
  className = '',
  icon = '💆',
  iconBgColor = 'bg-primary',
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

  const filteredSalons = useMemo(() => {
    if (!distanceFilter || !userLocation) return salons;
    return salons.filter((salon) => {
      const d = calculateDistance(userLocation.lat, userLocation.lng, salon.lat, salon.lng);
      return d <= distanceFilter;
    });
  }, [salons, distanceFilter, userLocation]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  React.useEffect(() => {
    if (!mapRef.current || filteredSalons.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    filteredSalons.forEach((s) => bounds.extend({ lat: s.lat, lng: s.lng }));
    if (userLocation) bounds.extend({ lat: userLocation.lat, lng: userLocation.lng });
    mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
  }, [filteredSalons, userLocation]);

  if (!hasKey || loadError) {
    return (
      <div className={`flex items-center justify-center bg-card ${className}`}>
        <p className="text-muted-foreground">{loadError?.message ?? 'Map unavailable'}</p>
      </div>
    );
  }

  if (hasKey && !isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-card ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={12}
        onLoad={onMapLoad}
        onUnmount={onMapUnmount}
        options={{
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        }}
      >
        {filteredSalons.map((salon) => (
          <Marker
            key={salon.id}
            position={{ lat: salon.lat, lng: salon.lng }}
            label={{ text: icon, color: 'white', fontWeight: 'bold', fontSize: '14px' }}
            onClick={() => {
              setSelectedId(salon.id);
              onSalonSelect?.(salon.id);
            }}
          />
        ))}
        {selectedId && (() => {
          const salon = filteredSalons.find((s) => s.id === selectedId);
          if (!salon) return null;
          return (
            <InfoWindow
              position={{ lat: salon.lat, lng: salon.lng }}
              onCloseClick={() => setSelectedId(null)}
            >
              <div
                className="min-w-[200px] max-w-[240px] text-left"
                dangerouslySetInnerHTML={{
                  __html: createMapPopupHtml({
                    name: language === 'ru' ? salon.nameRu : salon.name,
                    rating: salon.rating,
                    price: `฿${escapeHtml(String(salon.priceFrom))}+`,
                    image: salon.image,
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

export default SalonMap;
