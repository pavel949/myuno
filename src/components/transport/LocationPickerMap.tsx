import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Navigation, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocationPickerMapProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: { address: string; lat: number; lng: number }) => void;
  type: 'pickup' | 'destination';
  initialLocation?: { lat: number; lng: number } | null;
}

// Popular locations in Phuket
const popularLocations = [
  { id: 'patong', nameEn: 'Patong Beach', nameRu: 'Пляж Патонг', lat: 7.8965, lng: 98.3008 },
  { id: 'kata', nameEn: 'Kata Beach', nameRu: 'Пляж Ката', lat: 7.8205, lng: 98.2988 },
  { id: 'karon', nameEn: 'Karon Beach', nameRu: 'Пляж Карон', lat: 7.8468, lng: 98.2947 },
  { id: 'rawai', nameEn: 'Rawai', nameRu: 'Равай', lat: 7.7773, lng: 98.3253 },
  { id: 'phuket-town', nameEn: 'Phuket Town', nameRu: 'Пхукет Таун', lat: 7.8804, lng: 98.3923 },
  { id: 'airport', nameEn: 'Phuket Airport', nameRu: 'Аэропорт Пхукета', lat: 8.1132, lng: 98.3169 },
  { id: 'central', nameEn: 'Central Festival', nameRu: 'Централ Фестиваль', lat: 7.8917, lng: 98.3648 },
  { id: 'jungceylon', nameEn: 'Jungceylon', nameRu: 'Джангцейлон', lat: 7.8889, lng: 98.2962 },
];

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  type,
  initialLocation,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const { language } = useLanguage();
  
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([98.3923, 7.8804]); // Default to Phuket

  // Fetch Mapbox token
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchToken();
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
          <div class="w-10 h-10 rounded-full ${type === 'pickup' ? 'bg-green-500' : 'bg-primary'} flex items-center justify-center shadow-lg animate-bounce">
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
  const getCurrentLocation = () => {
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
  };

  // Select popular location
  const selectPopularLocation = async (location: typeof popularLocations[0]) => {
    if (map.current) {
      map.current.flyTo({ center: [location.lng, location.lat], zoom: 16 });
    }
    
    updateMarker(location.lng, location.lat);
    setSelectedLocation({
      address: language === 'ru' ? location.nameRu : location.nameEn,
      lat: location.lat,
      lng: location.lng,
    });
  };

  // Search for location
  const searchLocation = async () => {
    if (!searchQuery.trim() || !mapboxToken) return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&proximity=98.3923,7.8804&country=TH`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const address = data.features[0].place_name;
        
        if (map.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 16 });
        }
        
        updateMarker(lng, lat);
        setSelectedLocation({ address, lat, lng });
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
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
        {/* Popular locations */}
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2">
            {language === 'ru' ? 'Популярные места' : 'Popular locations'}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {popularLocations.slice(0, 5).map((location) => (
              <button
                key={location.id}
                onClick={() => selectPopularLocation(location)}
                className="flex-shrink-0 px-3 py-2 rounded-full bg-muted text-sm hover:bg-primary/20 transition-colors"
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
              type === 'pickup' ? "bg-green-500/20" : "bg-primary/20"
            )}>
              <MapPin className={cn(
                "w-4 h-4",
                type === 'pickup' ? "text-green-500" : "text-primary"
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
};

export default LocationPickerMap;
