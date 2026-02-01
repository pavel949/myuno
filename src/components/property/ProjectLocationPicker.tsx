import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Navigation, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProjectLocationPickerProps {
  value?: { lat: number; lng: number; address?: string };
  onChange: (location: { lat: number; lng: number; address: string }) => void;
}

// Popular locations in Phuket
const popularLocations = [
  { id: 'patong', nameEn: 'Patong Beach', nameRu: 'Пляж Патонг', lat: 7.8965, lng: 98.3008 },
  { id: 'kata', nameEn: 'Kata Beach', nameRu: 'Пляж Ката', lat: 7.8205, lng: 98.2988 },
  { id: 'karon', nameEn: 'Karon Beach', nameRu: 'Пляж Карон', lat: 7.8468, lng: 98.2947 },
  { id: 'rawai', nameEn: 'Rawai', nameRu: 'Равай', lat: 7.7773, lng: 98.3253 },
  { id: 'kamala', nameEn: 'Kamala Beach', nameRu: 'Камала Бич', lat: 7.9535, lng: 98.2812 },
  { id: 'surin', nameEn: 'Surin Beach', nameRu: 'Сурин Бич', lat: 7.9766, lng: 98.2781 },
  { id: 'bangtao', nameEn: 'Bang Tao', nameRu: 'Банг Тао', lat: 7.9895, lng: 98.2920 },
  { id: 'naiharn', nameEn: 'Nai Harn', nameRu: 'Най Харн', lat: 7.7697, lng: 98.3053 },
];

export function ProjectLocationPicker({ value, onChange }: ProjectLocationPickerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [isOpen, setIsOpen] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng, address: value.address || '' } : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

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
          <div class="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
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
  }, []);

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

    const center = value 
      ? [value.lng, value.lat] as [number, number]
      : [98.3923, 7.8804] as [number, number]; // Default Phuket

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: value ? 15 : 12,
    });

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

    // Set initial marker
    map.current.on('load', async () => {
      if (value) {
        updateMarker(value.lng, value.lat);
        if (!value.address) {
          const address = await reverseGeocode(value.lng, value.lat);
          if (address) {
            setSelectedLocation({ address, lat: value.lat, lng: value.lng });
          }
        }
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
  }, [mapboxToken, isOpen, value, updateMarker, reverseGeocode]);

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
      map.current.flyTo({ center: [location.lng, location.lat], zoom: 15 });
    }
    
    updateMarker(location.lng, location.lat);
    setSelectedLocation({
      address: language === 'ru' ? location.nameRu : location.nameEn,
      lat: location.lat,
      lng: location.lng,
    });
  };

  // Confirm selection
  const handleConfirm = () => {
    if (selectedLocation) {
      onChange(selectedLocation);
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{isRu ? 'Локация на карте' : 'Location on Map'}</Label>
      
      <div 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {value ? (
            <>
              <p className="text-sm font-medium truncate">
                {value.address || `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`}
              </p>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Нажмите, чтобы изменить' : 'Click to change'}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Нажмите, чтобы выбрать локацию' : 'Click to select location'}
            </p>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>
              {isRu ? 'Выберите локацию проекта' : 'Select Project Location'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col h-full">
            {/* Search */}
            <div className="px-4 py-2 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                  placeholder={isRu ? 'Поиск адреса...' : 'Search address...'}
                  className="pl-10"
                />
              </div>
              <Button onClick={searchLocation} size="icon" variant="outline">
                <Search className="w-4 h-4" />
              </Button>
              <Button 
                onClick={getCurrentLocation} 
                size="icon" 
                variant="outline"
                disabled={isGettingLocation}
              >
                {isGettingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Popular locations */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {popularLocations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => selectPopularLocation(location)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-primary/20 transition-colors"
                >
                  {isRu ? location.nameRu : location.nameEn}
                </button>
              ))}
            </div>

            {/* Map */}
            <div className="flex-1 relative" style={{ minHeight: '350px' }}>
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
              )}
            </div>

            {/* Selected address & confirm */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm truncate flex-1">
                  {selectedLocation?.address || (isRu ? 'Кликните на карту' : 'Click on the map')}
                </p>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={!selectedLocation}
                className="w-full"
              >
                {isRu ? 'Подтвердить локацию' : 'Confirm Location'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
