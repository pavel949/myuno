import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Navigation, Loader2, X, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { hasGoogleMapsKey } from '@/lib/googleMaps';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AddressPickerInputProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  type?: 'pickup' | 'delivery' | 'service';
}

const popularLocations = [
  { name: 'Patong Beach', nameRu: 'Пляж Патонг', lat: 7.8965, lng: 98.3014 },
  { name: 'Phuket Town', nameRu: 'Пхукет Таун', lat: 7.8836, lng: 98.3957 },
  { name: 'Kata Beach', nameRu: 'Пляж Ката', lat: 7.8205, lng: 98.2983 },
  { name: 'Karon Beach', nameRu: 'Пляж Карон', lat: 7.8466, lng: 98.2946 },
  { name: 'Kamala Beach', nameRu: 'Пляж Камала', lat: 7.9524, lng: 98.2815 },
  { name: 'Bang Tao Beach', nameRu: 'Пляж Бангтао', lat: 7.9850, lng: 98.2940 },
  { name: 'Surin Beach', nameRu: 'Пляж Сурин', lat: 7.9725, lng: 98.2778 },
  { name: 'Central Phuket', nameRu: 'Централ Пхукет', lat: 7.8939, lng: 98.3523 },
];

export function AddressPickerInput({
  value,
  onChange,
  placeholder,
  label,
  required = false,
  className,
  type = 'delivery',
}: AddressPickerInputProps) {
  const { language } = useLanguage();
  const { latitude, longitude, getPosition, loading: geoLoading, hasLocation } = useGeolocation();
  const googleGeocode = useGoogleGeocode(language);
  const useGoogle = hasGoogleMapsKey();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; address: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(value);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(true);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    let isMounted = true;
    
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!isMounted) return;
        
        if (data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch mapbox token:', err);
        }
      }
    };
    fetchToken();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize map when dialog opens
  useEffect(() => {
    if (!isOpen || !mapboxToken || !mapContainer.current) return;

    setIsLoadingMap(true);
    mapboxgl.accessToken = mapboxToken;

    const initialCenter = selectedCoords 
      ? [selectedCoords.lng, selectedCoords.lat] as [number, number]
      : [98.3380, 7.8804] as [number, number]; // Default to Phuket center

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: 14,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoadingMap(false);
      
      if (selectedCoords) {
        updateMarker(selectedCoords.lng, selectedCoords.lat);
      }
    });

    map.current.on('click', async (e) => {
      const { lng, lat } = e.lngLat;
      updateMarker(lng, lat);
      await reverseGeocode(lng, lat);
    });

    return () => {
      if (marker.current) marker.current.remove();
      if (map.current) map.current.remove();
    };
  }, [isOpen, mapboxToken]);

  const updateMarker = (lng: number, lat: number) => {
    if (!map.current) return;
    
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new mapboxgl.Marker({ color: '#8B5CF6', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map.current);
      
      marker.current.on('dragend', async () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          await reverseGeocode(lngLat.lng, lngLat.lat);
        }
      });
    }
    
    setSelectedCoords({ lat, lng });
  };

  const reverseGeocode = async (lng: number, lat: number): Promise<void> => {
    if (useGoogle) {
      const result = await googleGeocode.reverseGeocode(lat, lng);
      if (result) {
        setSelectedAddress(result.address);
        setSelectedCoords({ lat, lng });
      }
      return;
    }
    if (!mapboxToken) return;
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&language=${language}`
      );
      const data = await response.json();
      if (data.features?.length > 0) {
        const address = data.features[0].place_name;
        setSelectedAddress(address);
        setSelectedCoords({ lat, lng });
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      if (useGoogle) {
        const results = await googleGeocode.searchAddress(searchQuery, { country: 'TH' });
        setSearchResults(
          results.map((r) => ({
            name: r.address.split(',')[0]?.trim() || r.address,
            address: r.address,
            lat: r.lat,
            lng: r.lng,
          }))
        );
        setIsSearching(false);
        return;
      }
      if (!mapboxToken) {
        setIsSearching(false);
        return;
      }
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&proximity=98.3380,7.8804&language=${language}&limit=5`
      );
      const data = await response.json();
      const results =
        data.features?.map((feature: { text: string; place_name: string; center: [number, number] }) => ({
          name: feature.text,
          address: feature.place_name,
          lat: feature.center[1],
          lng: feature.center[0],
        })) || [];
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = async () => {
    getPosition();
  };

  // Handle geolocation result
  useEffect(() => {
    if (hasLocation && latitude && longitude && isOpen) {
      updateMarker(longitude, latitude);
      map.current?.flyTo({ center: [longitude, latitude], zoom: 16 });
      reverseGeocode(longitude, latitude);
    }
  }, [hasLocation, latitude, longitude, isOpen]);

  const selectLocation = (lat: number, lng: number, address: string) => {
    setSelectedAddress(address);
    setSelectedCoords({ lat, lng });
    updateMarker(lng, lat);
    map.current?.flyTo({ center: [lng, lat], zoom: 16 });
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleConfirm = () => {
    onChange(selectedAddress, selectedCoords || undefined);
    setIsOpen(false);
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'pickup':
        return language === 'ru' ? 'Адрес забора' : 'Pickup Address';
      case 'service':
        return language === 'ru' ? 'Адрес' : 'Service Address';
      default:
        return language === 'ru' ? 'Адрес доставки' : 'Delivery Address';
    }
  };

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            {label}
            {required && <span className="text-destructive">*</span>}
          </label>
        )}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl border bg-card text-left transition-all",
            "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
            value ? "border-border" : "border-dashed border-muted-foreground/30"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-muted-foreground">
              {label || getTypeLabel()}
            </div>
            {value ? (
              <div className="font-medium truncate">{value}</div>
            ) : (
              <div className="text-muted-foreground">
                {placeholder || (language === 'ru' ? 'Нажмите для выбора' : 'Tap to select')}
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
        </button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 pb-2 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {label || getTypeLabel()}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 p-4 pt-2 gap-3">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
                  placeholder={language === 'ru' ? 'Поиск адреса...' : 'Search address...'}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button onClick={searchLocation} disabled={isSearching} size="icon">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
              <Button
                onClick={getCurrentLocation}
                disabled={geoLoading}
                size="icon"
                variant="outline"
              >
                {geoLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="bg-muted/50 rounded-lg divide-y divide-border overflow-hidden">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectLocation(result.lat, result.lng, result.address)}
                    className="w-full p-3 text-left hover:bg-muted transition-colors flex items-start gap-3"
                  >
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="font-medium text-sm">{result.name}</div>
                      <div className="text-xs text-muted-foreground">{result.address}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Popular Locations */}
            {!searchResults.length && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {language === 'ru' ? 'Популярные места' : 'Popular Locations'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularLocations.map((loc) => (
                    <button
                      key={loc.name}
                      type="button"
                      onClick={() => selectLocation(loc.lat, loc.lng, language === 'ru' ? loc.nameRu : loc.name)}
                      className="px-3 py-1.5 text-sm bg-muted/50 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {language === 'ru' ? loc.nameRu : loc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="flex-1 relative rounded-xl overflow-hidden border min-h-[200px]">
              {isLoadingMap && (
                <div className="absolute inset-0 bg-muted flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              <div ref={mapContainer} className="absolute inset-0" />
            </div>

            {/* Selected Address */}
            {selectedAddress && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">
                  {language === 'ru' ? 'Выбранный адрес:' : 'Selected address:'}
                </div>
                <div className="font-medium text-sm">{selectedAddress}</div>
              </div>
            )}

            {/* Confirm Button */}
            <Button
              onClick={handleConfirm}
              disabled={!selectedAddress}
              className="w-full"
              size="lg"
            >
              {language === 'ru' ? 'Подтвердить адрес' : 'Confirm Address'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
