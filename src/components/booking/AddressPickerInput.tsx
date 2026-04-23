import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Navigation, Loader2, X, ChevronRight } from 'lucide-react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { DEFAULT_MAP_CENTER } from '@/lib/googleMaps';
import { cn } from '@/lib/utils';

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

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

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
  const { hasKey, isLoaded } = useGoogleMaps();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; address: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(value);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<google.maps.Map | null>(null);

  const mapCenter = selectedCoords ?? DEFAULT_MAP_CENTER;

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<void> => {
      const result = await googleGeocode.reverseGeocode(lat, lng);
      if (result) {
        setSelectedAddress(result.address);
        setSelectedCoords({ lat, lng });
      }
    },
    [googleGeocode]
  );

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat != null && lng != null) reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat != null && lng != null) reverseGeocode(lat, lng);
    },
    [reverseGeocode]
  );

  useEffect(() => {
    if (!isOpen || !selectedCoords) return;
    setSelectedAddress(value);
    setSelectedCoords(selectedCoords);
  }, [isOpen]);

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await googleGeocode.searchAddress(searchQuery, { country: 'TH' });
      setSearchResults(
        results.map((r) => ({
          name: r.address.split(',')[0]?.trim() || r.address,
          address: r.address,
          lat: r.lat,
          lng: r.lng,
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (hasLocation && latitude != null && longitude != null && isOpen) {
      setSelectedCoords({ lat: latitude, lng: longitude });
      reverseGeocode(latitude, longitude);
      mapRef.current?.panTo({ lat: latitude, lng: longitude });
      mapRef.current?.setZoom(16);
    }
  }, [hasLocation, latitude, longitude, isOpen, reverseGeocode]);

  const selectLocation = (lat: number, lng: number, address: string) => {
    setSelectedAddress(address);
    setSelectedCoords({ lat, lng });
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(16);
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

  const showMap = hasKey && isLoaded;
  const mapPlaceholder = !hasKey && (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted p-4 text-center text-sm text-muted-foreground">
      <p>{language === 'ru' ? 'Задайте VITE_GOOGLE_MAPS_API_KEY в .env' : 'Set VITE_GOOGLE_MAPS_API_KEY in .env'}</p>
    </div>
  );

  return (
    <>
      <div className={cn('space-y-2', className)}>
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
            'w-full flex items-center gap-3 p-3 rounded-none border bg-card text-left transition-all',
            'hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20',
            value ? 'border-border' : 'border-dashed border-muted-foreground/30'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-muted-foreground">{label || getTypeLabel()}</div>
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
              <Button onClick={getPosition} disabled={geoLoading} size="icon" variant="outline">
                {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-muted/50 rounded-none divide-y divide-border overflow-hidden">
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

            <div className="flex-1 relative rounded-none overflow-hidden border min-h-[200px]">
              {mapPlaceholder}
              {showMap && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={selectedCoords ? 15 : 12}
                  onLoad={onMapLoad}
                  onUnmount={onMapUnmount}
                  onClick={handleMapClick}
                  options={{
                    mapTypeControl: true,
                    streetViewControl: false,
                    fullscreenControl: true,
                    zoomControl: true,
                  }}
                >
                  {selectedCoords && (
                    <Marker
                      position={selectedCoords}
                      draggable
                      onDragEnd={handleMarkerDragEnd}
                    />
                  )}
                </GoogleMap>
              )}
              {hasKey && !isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            {selectedAddress && (
              <div className="p-3 bg-primary/5 rounded-none border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1">
                  {language === 'ru' ? 'Выбранный адрес:' : 'Selected address:'}
                </div>
                <div className="font-medium text-sm">{selectedAddress}</div>
              </div>
            )}

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
