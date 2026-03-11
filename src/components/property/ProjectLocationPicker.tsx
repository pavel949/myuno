import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { Loader2, Navigation, MapPin, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DEFAULT_MAP_CENTER } from '@/lib/googleMaps';
import { cn } from '@/lib/utils';
import type { PropertyProject } from '@/hooks/usePropertyProjects';

interface ProjectLocationPickerProps {
  value?: { lat: number; lng: number; address?: string };
  onChange: (location: { lat: number; lng: number; address: string }) => void;
}

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

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

export function ProjectLocationPicker({ value, onChange }: ProjectLocationPickerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const googleGeocode = useGoogleGeocode(language);
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const { data: projects = [] } = usePropertyProjects();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng, address: value.address || '' } : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const markerPosition = useMemo(() => {
    if (selectedLocation) return { lat: selectedLocation.lat, lng: selectedLocation.lng };
    if (value) return { lat: value.lat, lng: value.lng };
    return DEFAULT_MAP_CENTER;
  }, [selectedLocation, value]);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      const result = await googleGeocode.reverseGeocode(lat, lng);
      return result?.address ?? null;
    },
    [googleGeocode]
  );

  // When dialog opens: sync from value, or set default center + reverse geocode so user can confirm without typing (Airbnb-style)
  useEffect(() => {
    if (!isOpen || !hasKey) return;
    if (value?.address) {
      setSelectedLocation({ lat: value.lat, lng: value.lng, address: value.address });
      return;
    }
    if (value?.lat != null && value?.lng != null) {
      reverseGeocode(value.lat, value.lng).then((address) => {
        setSelectedLocation({ lat: value.lat, lng: value.lng, address: address || '' });
      });
      return;
    }
    // No value: start with default center and get address so user can confirm immediately
    setSelectedLocation(null);
    setIsGeocoding(true);
    const { lat, lng } = DEFAULT_MAP_CENTER;
    reverseGeocode(lat, lng)
      .then((address) => {
        setSelectedLocation({ lat, lng, address: address || (isRu ? 'Пхукет, Таиланд' : 'Phuket, Thailand') });
      })
      .finally(() => setIsGeocoding(false));
  }, [isOpen, hasKey, value?.lat, value?.lng, value?.address, reverseGeocode, isRu]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setTimeout(() => window.google?.maps?.event?.trigger(map, 'resize'), 150);
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return;
      setIsGeocoding(true);
      const address = await reverseGeocode(lat, lng);
      setSelectedLocation({ address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
      setIsGeocoding(false);
    },
    [reverseGeocode]
  );

  const handleMarkerDragEnd = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      const lat = e.latLng?.lat();
      const lng = e.latLng?.lng();
      if (lat == null || lng == null) return;
      setIsGeocoding(true);
      const address = await reverseGeocode(lat, lng);
      setSelectedLocation({ address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
      setIsGeocoding(false);
    },
    [reverseGeocode]
  );

  // Search: Google addresses + property projects (debounced)
  const [addressResults, setAddressResults] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
  const [searching, setSearching] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>();

  const matchingProjects = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        (p.name_en?.toLowerCase().includes(q) || p.name_ru?.toLowerCase().includes(q) || p.address?.toLowerCase().includes(q) || p.district?.toLowerCase().includes(q)) &&
        p.lat != null &&
        p.lng != null
    );
  }, [projects, searchQuery]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setAddressResults([]);
      return;
    }
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await googleGeocode.searchAddress(searchQuery, { country: 'TH' });
        setAddressResults(results.slice(0, 5));
      } catch {
        setAddressResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchDebounce.current) clearTimeout(searchDebounce.current);
    };
  }, [searchQuery, googleGeocode]);

  const showSearchDropdown = searchFocused && searchQuery.length >= 2;

  const pickAddress = (item: { address: string; lat: number; lng: number }) => {
    setSelectedLocation(item);
    setSearchQuery('');
    setSearchFocused(false);
    mapRef.current?.panTo({ lat: item.lat, lng: item.lng });
    mapRef.current?.setZoom(16);
  };

  const pickProject = (p: PropertyProject) => {
    const address = p.address || (isRu ? p.name_ru : p.name_en) || '';
    setSelectedLocation({ lat: p.lat!, lng: p.lng!, address });
    setSearchQuery('');
    setSearchFocused(false);
    mapRef.current?.panTo({ lat: p.lat!, lng: p.lng! });
    mapRef.current?.setZoom(16);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setIsGeocoding(true);
        const address = await reverseGeocode(lat, lng);
        setSelectedLocation({ address: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng });
        setIsGeocoding(false);
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(16);
        setIsGettingLocation(false);
      },
      () => setIsGettingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  const selectPopularLocation = (location: (typeof popularLocations)[0]) => {
    setSelectedLocation({
      address: isRu ? location.nameRu : location.nameEn,
      lat: location.lat,
      lng: location.lng,
    });
    mapRef.current?.panTo({ lat: location.lat, lng: location.lng });
    mapRef.current?.setZoom(15);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onChange(selectedLocation);
      setIsOpen(false);
    }
  };

  const showMap = hasKey && isLoaded && !loadError;
  const canConfirm = selectedLocation != null;

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
              {isRu ? 'Нажмите, чтобы выбрать локацию' : 'Click on map or search address'}
            </p>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 overflow-visible flex flex-col">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{isRu ? 'Выберите локацию проекта' : 'Select Project Location'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 overflow-visible">
            {/* Search: address + projects (Airbnb-style) */}
            <div className="px-4 py-2 relative overflow-visible" ref={containerRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                  placeholder={isRu ? 'Адрес или название проекта' : 'Address or project name'}
                  className="pl-10 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {/* Dropdown: addresses + projects */}
              {showSearchDropdown && (
                <div className="absolute top-full left-4 right-4 z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searching && (
                    <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRu ? 'Поиск...' : 'Searching...'}
                    </div>
                  )}
                  {!searching && matchingProjects.length > 0 && (
                    <div className="py-1">
                      <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                        {isRu ? 'Проекты' : 'Projects'}
                      </p>
                      {matchingProjects.slice(0, 4).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-muted rounded-none"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickProject(p);
                          }}
                        >
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{isRu ? p.name_ru : p.name_en}</p>
                            {p.address && (
                              <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && addressResults.length > 0 && (
                    <div className="py-1">
                      <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase">
                        {isRu ? 'Адреса' : 'Addresses'}
                      </p>
                      {addressResults.map((r, i) => (
                        <button
                          key={i}
                          type="button"
                          className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-muted rounded-none"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            pickAddress(r);
                          }}
                        >
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <p className="text-sm truncate">{r.address}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && addressResults.length === 0 && matchingProjects.length === 0 && searchQuery.length >= 2 && (
                    <p className="px-3 py-3 text-sm text-muted-foreground">
                      {isRu ? 'Ничего не найдено' : 'No results'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick chips */}
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
              {popularLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => selectPopularLocation(loc)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-primary/20 transition-colors"
                >
                  {isRu ? loc.nameRu : loc.nameEn}
                </button>
              ))}
            </div>

            {/* Map — primary interaction (Airbnb-style); min-height so map always has space to render */}
            <div className="flex-1 relative min-h-[280px]">
              {!hasKey && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-4 text-center text-sm text-muted-foreground">
                  <p>{isRu ? 'Задайте VITE_GOOGLE_MAPS_API_KEY в .env' : 'Set VITE_GOOGLE_MAPS_API_KEY in .env'}</p>
                </div>
              )}
              {hasKey && loadError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted p-4 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-destructive">{isRu ? 'Карта не загрузилась' : 'Map failed to load'}</p>
                  <p className="text-xs">{loadError.message}</p>
                  <p className="text-xs mt-2">
                    {isRu ? 'Добавьте localhost в ограничения ключа в Google Cloud (HTTP referrers).' : 'Add localhost to key restrictions in Google Cloud (HTTP referrers).'}
                  </p>
                </div>
              )}
              {showMap && (selectedLocation || value) && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${(selectedLocation ?? value)!.lat},${(selectedLocation ?? value)!.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 z-10 text-xs bg-background/95 hover:bg-background border border-border rounded-lg px-2 py-1.5 shadow-sm text-primary hover:underline"
                >
                  {isRu ? 'Открыть в Google Картах' : 'Open in Google Maps'}
                </a>
              )}
              {hasKey && !loadError && !isLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">{isRu ? 'Загрузка карты…' : 'Loading map…'}</p>
                </div>
              )}
              {showMap && (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={markerPosition}
                  zoom={value || selectedLocation ? 15 : 12}
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
                  <Marker position={markerPosition} draggable onDragEnd={handleMarkerDragEnd} />
                </GoogleMap>
              )}
            </div>

            {/* Selected address + Confirm */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <p className={cn("text-sm truncate flex-1", !canConfirm && "text-muted-foreground")}>
                  {isGeocoding
                    ? (isRu ? 'Определяем адрес...' : 'Getting address...')
                    : selectedLocation?.address || (isRu ? 'Кликните на карту или перетащите маркер' : 'Click map or drag pin')}
                </p>
              </div>
              <Button onClick={handleConfirm} disabled={!canConfirm} className="w-full">
                {isRu ? 'Подтвердить локацию' : 'Confirm Location'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
