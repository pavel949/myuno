import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { Loader2 } from 'lucide-react';
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

const SalonMap: React.FC<SalonMapProps> = ({
  salons,
  onSalonSelect,
  userLocation,
  distanceFilter,
  className = '',
  icon = '💆',
}) => {
  const { language } = useLanguage();
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const { getCityConfig } = useLocationContext();
  const [selectedSalon, setSelectedSalon] = useState<SalonMarker | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const filteredSalons = useMemo(() => salons.filter(salon => {
    if (!distanceFilter || !userLocation) return true;
    return calculateDistance(userLocation.lat, userLocation.lng, salon.lat, salon.lng) <= distanceFilter;
  }), [salons, distanceFilter, userLocation]);

  const defaultCenter = useMemo(() => {
    if (userLocation) return userLocation;
    const cityConfig = getCityConfig();
    if (cityConfig) return { lat: cityConfig.lat, lng: cityConfig.lng };
    const c = getMapCenter(DEFAULT_CITY);
    return { lat: c[1], lng: c[0] };
  }, [userLocation, getCityConfig]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    if (filteredSalons.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredSalons.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, 50);
    }
  }, [filteredSalons, userLocation]);

  useEffect(() => {
    if (!mapRef.current || filteredSalons.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    filteredSalons.forEach(s => bounds.extend({ lat: s.lat, lng: s.lng }));
    if (userLocation) bounds.extend(userLocation);
    mapRef.current.fitBounds(bounds, 50);
  }, [filteredSalons, userLocation]);

  if (!hasKey || !isLoaded) {
    return (
      <div className={`flex items-center justify-center bg-card ${className}`}>
        {loadError ? (
          <p className="text-muted-foreground">{loadError.message}</p>
        ) : (
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={12}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            mapTypeControl: false,
          }}
        >
          {filteredSalons.map(salon => (
            <Marker
              key={salon.id}
              position={{ lat: salon.lat, lng: salon.lng }}
              label={{ text: icon, fontSize: '16px' }}
              title={language === 'ru' ? salon.nameRu : salon.name}
              onClick={() => {
                setSelectedSalon(salon);
                onSalonSelect?.(salon.id);
              }}
            />
          ))}
          {selectedSalon && (
            <InfoWindow
              position={{ lat: selectedSalon.lat, lng: selectedSalon.lng }}
              onCloseClick={() => setSelectedSalon(null)}
            >
              <div className="min-w-[180px] p-1">
                {selectedSalon.image && (
                  <img src={selectedSalon.image} alt="" className="w-full h-24 object-cover rounded mb-2" />
                )}
                <h3 className="font-semibold text-sm">
                  {language === 'ru' ? selectedSalon.nameRu : selectedSalon.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                  <span>⭐ {selectedSalon.rating}</span>
                  <span>฿{selectedSalon.priceFrom}+</span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default SalonMap;
