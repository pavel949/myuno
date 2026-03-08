import React, { useEffect, useRef, useState, useCallback, useMemo, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { hasGoogleMapsKey } from '@/lib/googleMaps';
import { Loader2, Navigation, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getMapCenter, PHUKET_LANDMARKS, DEFAULT_CITY } from '@/lib/config';

interface LocationPickerMapProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  type: 'pickup' | 'destination';
  initialLocation?: { lat: number; lng: number } | null;
}

// Default popular locations (using centralized landmarks for Phuket)
const defaultPopularLocations = [
  { id: 'patong', nameEn: PHUKET_LANDMARKS.patong.nameEn, nameRu: PHUKET_LANDMARKS.patong.nameRu, lat: PHUKET_LANDMARKS.patong.lat, lng: PHUKET_LANDMARKS.patong.lng },
  { id: 'kata', nameEn: PHUKET_LANDMARKS.kata.nameEn, nameRu: PHUKET_LANDMARKS.kata.nameRu, lat: PHUKET_LANDMARKS.kata.lat, lng: PHUKET_LANDMARKS.kata.lng },
  { id: 'karon', nameEn: PHUKET_LANDMARKS.karon.nameEn, nameRu: PHUKET_LANDMARKS.karon.nameRu, lat: PHUKET_LANDMARKS.karon.lat, lng: PHUKET_LANDMARKS.karon.lng },
  { id: 'rawai', nameEn: PHUKET_LANDMARKS.rawai.nameEn, nameRu: PHUKET_LANDMARKS.rawai.nameRu, lat: PHUKET_LANDMARKS.rawai.lat, lng: PHUKET_LANDMARKS.rawai.lng },
  { id: 'phuket-town', nameEn: PHUKET_LANDMARKS.phuketTown.nameEn, nameRu: PHUKET_LANDMARKS.phuketTown.nameRu, lat: PHUKET_LANDMARKS.phuketTown.lat, lng: PHUKET_LANDMARKS.phuketTown.lng },
  { id: 'airport', nameEn: PHUKET_LANDMARKS.airport.nameEn, nameRu: PHUKET_LANDMARKS.airport.nameRu, lat: PHUKET_LANDMARKS.airport.lat, lng: PHUKET_LANDMARKS.airport.lng },
  { id: 'central', nameEn: PHUKET_LANDMARKS.central.nameEn, nameRu: PHUKET_LANDMARKS.central.nameRu, lat: PHUKET_LANDMARKS.central.lat, lng: PHUKET_LANDMARKS.central.lng },
  { id: 'jungceylon', nameEn: 'Jungceylon', nameRu: 'Джангцейлон', lat: 7.8889, lng: 98.2962 },
];

// Popular locations by city
const cityPopularLocations: Record<string, typeof defaultPopularLocations> = {
  phuket: defaultPopularLocations,
  dubai: [
    { id: 'dubai-mall', nameEn: 'Dubai Mall', nameRu: 'Дубай Молл', lat: 25.1972, lng: 55.2744 },
    { id: 'marina', nameEn: 'Dubai Marina', nameRu: 'Дубай Марина', lat: 25.0805, lng: 55.1403 },
    { id: 'palm', nameEn: 'Palm Jumeirah', nameRu: 'Пальма Джумейра', lat: 25.1124, lng: 55.1390 },
    { id: 'jbr', nameEn: 'JBR Beach', nameRu: 'Пляж JBR', lat: 25.0763, lng: 55.1328 },
    { id: 'downtown', nameEn: 'Downtown Dubai', nameRu: 'Даунтаун Дубай', lat: 25.1977, lng: 55.2744 },
    { id: 'dxb-airport', nameEn: 'Dubai Airport', nameRu: 'Аэропорт Дубая', lat: 25.2532, lng: 55.3657 },
  ],
  bali: [
    { id: 'seminyak', nameEn: 'Seminyak', nameRu: 'Семиньяк', lat: -8.6913, lng: 115.1685 },
    { id: 'canggu', nameEn: 'Canggu', nameRu: 'Чангу', lat: -8.6478, lng: 115.1385 },
    { id: 'ubud', nameEn: 'Ubud', nameRu: 'Убуд', lat: -8.5069, lng: 115.2625 },
    { id: 'kuta', nameEn: 'Kuta Beach', nameRu: 'Пляж Кута', lat: -8.7181, lng: 115.1691 },
    { id: 'ngurah', nameEn: 'Ngurah Rai Airport', nameRu: 'Аэропорт Нгурах Рай', lat: -8.7467, lng: 115.1672 },
  ],
  danang: [
    { id: 'my-khe', nameEn: 'My Khe Beach', nameRu: 'Пляж Ми Кхе', lat: 16.0471, lng: 108.2468 },
    { id: 'son-tra', nameEn: 'Son Tra District', nameRu: 'Район Сон Тра', lat: 16.1065, lng: 108.2772 },
    { id: 'hoi-an', nameEn: 'Hoi An', nameRu: 'Хой Ан', lat: 15.8801, lng: 108.3380 },
    { id: 'danang-airport', nameEn: 'Da Nang Airport', nameRu: 'Аэропорт Дананга', lat: 16.0439, lng: 108.1999 },
  ],
  hongkong: [
    { id: 'central', nameEn: 'Central', nameRu: 'Централ', lat: 22.2800, lng: 114.1588 },
    { id: 'tst', nameEn: 'Tsim Sha Tsui', nameRu: 'Цим Ша Цуй', lat: 22.2988, lng: 114.1722 },
    { id: 'wan-chai', nameEn: 'Wan Chai', nameRu: 'Ван Чай', lat: 22.2780, lng: 114.1733 },
    { id: 'hk-airport', nameEn: 'Hong Kong Airport', nameRu: 'Аэропорт Гонконга', lat: 22.3080, lng: 113.9185 },
  ],
};

/**
 * LocationPickerMap - Mapbox-based location picker for taxi booking
 * Uses forwardRef to properly handle ref passing from parent components
 */
const LocationPickerMap = forwardRef<HTMLDivElement, LocationPickerMapProps>(({
  isOpen,
  onClose,
  onLocationSelect,
  type,
  initialLocation,
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { language } = useLanguage();
  const { getCityConfig, currentCity } = useLocationContext();
  const googleGeocode = useGoogleGeocode(language);
  const useGoogle = hasGoogleMapsKey();

  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  
  // Get city config for dynamic center - using centralized geography config
  const cityConfig = getCityConfig();
  const mapCenter: [number, number] = useMemo(() => 
    cityConfig ? [cityConfig.lng, cityConfig.lat] : getMapCenter(DEFAULT_CITY),
    [cityConfig]
  );
  
  // Get popular locations for current city
  const popularLocations = useMemo(() => {
    const citySlug = currentCity?.slug || 'phuket';
    return cityPopularLocations[citySlug] || defaultPopularLocations;
  }, [currentCity]);

  // Fetch Mapbox token
  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!isMounted) return;
        
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch Mapbox token:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    fetchToken();
    
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Update marker position
  const updateMarker = useCallback((lng: number, lat: number) => {
    if (!map.current) return;
    
    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'location-marker';
      el.innerHTML = `
        <div class="relative">
          <div class="w-10 h-10 rounded-full ${type === 'pickup' ? 'bg-success' : 'bg-primary'} flex items-center justify-center shadow-lg animate-bounce">
            <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/50 rounded-full blur-sm"></div>
        </div>
      `;
      markerRef.current = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
  }, [type]);

  // Reverse geocode to get address
  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    if (!mapboxToken) return null;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=${language}`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
    } catch (err) {
      console.error('Geocoding error:', err);
    }
    return null;
  }, [mapboxToken, language]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !isOpen) return;

    mapboxgl.accessToken = mapboxToken;

    const center = initialLocation 
      ? [initialLocation.lng, initialLocation.lat] as [number, number]
      : mapCenter;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: false }),
      'top-right'
    );

    // Handle map click
    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);
      
      const address = await reverseGeocode(lng, lat);
      if (address) {
        setSelectedLocation({ address, lat, lng });
      }
    });

    // Handle map move end (for dragging pin)
    map.current.on('moveend', async () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      updateMarker(center.lng, center.lat);
      
      const address = await reverseGeocode(center.lng, center.lat);
      if (address) {
        setSelectedLocation({ address, lat: center.lat, lng: center.lng });
      }
    });

    // Set initial marker at center
    map.current.on('load', async () => {
      const center = map.current!.getCenter();
      updateMarker(center.lng, center.lat);
      
      const address = await reverseGeocode(center.lng, center.lat);
      if (address) {
        setSelectedLocation({ address, lat: center.lat, lng: center.lng });
      }
    });

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, isOpen, initialLocation, mapCenter, updateMarker, reverseGeocode]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (map.current) {
          map.current.flyTo({ center: [longitude, latitude], zoom: 16 });
        }
        
        updateMarker(longitude, latitude);
        const address = await reverseGeocode(longitude, latitude);
        if (address) {
          setSelectedLocation({ address, lat: latitude, lng: longitude });
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  }, [updateMarker, reverseGeocode]);

  // Select popular location
  const selectPopularLocation = useCallback(async (location: typeof popularLocations[0]) => {
    if (map.current) {
      map.current.flyTo({ center: [location.lng, location.lat], zoom: 16 });
    }
    
    updateMarker(location.lng, location.lat);
    setSelectedLocation({
      address: language === 'ru' ? location.nameRu : location.nameEn,
      lat: location.lat,
      lng: location.lng,
    });
  }, [updateMarker, language]);

  // Search for location (Google when key set, else Mapbox)
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;
    try {
      const countryCode = cityConfig?.countryCode || 'TH';
      if (useGoogle) {
        const results = await googleGeocode.searchAddress(searchQuery, { country: countryCode });
        if (results.length > 0) {
          const r = results[0];
          if (map.current) map.current.flyTo({ center: [r.lng, r.lat], zoom: 16 });
          updateMarker(r.lng, r.lat);
          setSelectedLocation({ address: r.address, lat: r.lat, lng: r.lng });
        }
        return;
      }
      if (!mapboxToken) return;
      const proximity = `${mapCenter[0]},${mapCenter[1]}`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&proximity=${proximity}&country=${countryCode}`
      );
      const data = await response.json();
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].center;
        const address = data.features[0].place_name;
        if (map.current) map.current.flyTo({ center: [lng, lat], zoom: 16 });
        updateMarker(lng, lat);
        setSelectedLocation({ address, lat, lng });
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [searchQuery, mapboxToken, cityConfig, mapCenter, updateMarker, useGoogle, googleGeocode]);

  // Confirm selection
  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  }, [selectedLocation, onLocationSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">
              {type === 'pickup' 
                ? (language === 'ru' ? 'Откуда забрать?' : 'Pickup location')
                : (language === 'ru' ? 'Куда едем?' : 'Where to?')}
            </h2>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="px-4 pb-3 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
              placeholder={language === 'ru' ? 'Поиск адреса...' : 'Search address...'}
              className="pl-10"
            />
          </div>
          <Button onClick={searchLocation} size="icon" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-28">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div ref={mapContainer} className="w-full h-full" />
        )}
        
        {/* Center crosshair */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-1 h-1 bg-primary rounded-full shadow-lg" />
        </div>
      </div>

      {/* My Location Button */}
      <button
        onClick={getCurrentLocation}
        disabled={isGettingLocation}
        className="absolute right-4 bottom-52 z-10 w-12 h-12 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        {isGettingLocation ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <Navigation className="w-5 h-5 text-primary" />
        )}
      </button>

      {/* Bottom panel */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border rounded-t-2xl">
        {/* Popular locations - FIXED: Added touch-pan-y and snap for stable mobile scrolling */}
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2">
            {language === 'ru' ? 'Популярные места' : 'Popular locations'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory touch-pan-y">
            {popularLocations.slice(0, 5).map((location) => (
              <button
                key={location.id}
                onClick={() => selectPopularLocation(location)}
                className="flex-shrink-0 px-3 py-2 rounded-full bg-muted text-sm hover:bg-primary/20 transition-colors snap-start"
              >
                {language === 'ru' ? location.nameRu : location.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Selected address */}
        <div className="px-4 pb-4">
          <div className="p-3 rounded-xl bg-muted/50 border border-border/50 mb-3 flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              type === 'pickup' ? "bg-success/20" : "bg-primary/20"
            )}>
              <MapPin className={cn(
                "w-4 h-4",
                type === 'pickup' ? "text-success" : "text-primary"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                {type === 'pickup' 
                  ? (language === 'ru' ? 'Место подачи' : 'Pickup point')
                  : (language === 'ru' ? 'Место назначения' : 'Destination')}
              </p>
              <p className="text-sm truncate">
                {selectedLocation?.address || (language === 'ru' ? 'Выберите на карте' : 'Select on map')}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleConfirm}
            disabled={!selectedLocation}
            className="w-full"
            size="lg"
          >
            {language === 'ru' ? 'Подтвердить' : 'Confirm location'}
          </Button>
        </div>
      </div>
    </div>
  );
});

LocationPickerMap.displayName = 'LocationPickerMap';

export default LocationPickerMap;