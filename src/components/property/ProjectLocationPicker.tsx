import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { Loader2, Navigation, MapPin, Search } from 'lucide-react';
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
  const { hasKey, isLoaded } = useGoogleMaps();
  const { reverseGeocode, searchAddress } = useGoogleGeocode(language);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng, address: value.address || '' } : null
  );
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const defaultCenter = value ? { lat: value.lat, lng: value.lng } : { lat: 7.8804, lng: 98.3923 };

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });

    const result = await reverseGeocode(lat, lng);
    if (result) {
      setSelectedLocation({ address: result.address, lat, lng });
    }
  }, [reverseGeocode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchAddress(searchQuery, { country: 'TH' });
    if (results.length > 0) {
      const r = results[0];
      setMarkerPosition({ lat: r.lat, lng: r.lng });
      setSelectedLocation({ address: r.address, lat: r.lat, lng: r.lng });
      mapRef.current?.panTo({ lat: r.lat, lng: r.lng });
      mapRef.current?.setZoom(16);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });
        mapRef.current?.panTo({ lat: latitude, lng: longitude });
        mapRef.current?.setZoom(16);

        const result = await reverseGeocode(latitude, longitude);
        if (result) {
          setSelectedLocation({ address: result.address, lat: latitude, lng: longitude });
        }
        setIsGettingLocation(false);
      },
      () => setIsGettingLocation(false),
      { enableHighAccuracy: true }
    );
  };

  const selectPopularLocation = (location: typeof popularLocations[0]) => {
    const pos = { lat: location.lat, lng: location.lng };
    setMarkerPosition(pos);
    setSelectedLocation({
      address: isRu ? location.nameRu : location.nameEn,
      lat: location.lat,
      lng: location.lng,
    });
    mapRef.current?.panTo(pos);
    mapRef.current?.setZoom(15);
  };

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
              <p className="text-xs text-muted-foreground">{isRu ? 'Нажмите, чтобы изменить' : 'Click to change'}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{isRu ? 'Нажмите, чтобы выбрать локацию' : 'Click to select location'}</p>
          )}
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl h-[80vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{isRu ? 'Выберите локацию проекта' : 'Select Project Location'}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0">
            <div className="px-4 py-2 flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={isRu ? 'Поиск адреса...' : 'Search address...'}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} size="icon" variant="outline"><Search className="w-4 h-4" /></Button>
              <Button onClick={getCurrentLocation} size="icon" variant="outline" disabled={isGettingLocation}>
                {isGettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              </Button>
            </div>

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

            <div className="flex-1 relative min-h-0">
              {!hasKey || !isLoaded ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={defaultCenter}
                  zoom={value ? 15 : 12}
                  onClick={handleMapClick}
                  onLoad={(map) => { mapRef.current = map; }}
                  options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                >
                  {markerPosition && <Marker position={markerPosition} draggable onDragEnd={async (e) => {
                    if (!e.latLng) return;
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    setMarkerPosition({ lat, lng });
                    const result = await reverseGeocode(lat, lng);
                    if (result) setSelectedLocation({ address: result.address, lat, lng });
                  }} />}
                </GoogleMap>
              )}
            </div>

            <div className="p-4 border-t border-border bg-background">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm truncate flex-1">
                  {selectedLocation?.address || (isRu ? 'Кликните на карту' : 'Click on the map')}
                </p>
              </div>
              <Button onClick={handleConfirm} disabled={!selectedLocation} className="w-full">
                {isRu ? 'Подтвердить локацию' : 'Confirm Location'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
