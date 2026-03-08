import React, { useRef, useState, useCallback, useMemo, forwardRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
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
    { id: 'hk-central', nameEn: 'Central', nameRu: 'Централ', lat: 22.2800, lng: 114.1588 },
    { id: 'tst', nameEn: 'Tsim Sha Tsui', nameRu: 'Цим Ша Цуй', lat: 22.2988, lng: 114.1722 },
    { id: 'wan-chai', nameEn: 'Wan Chai', nameRu: 'Ван Чай', lat: 22.2780, lng: 114.1733 },
    { id: 'hk-airport', nameEn: 'Hong Kong Airport', nameRu: 'Аэропорт Гонконга', lat: 22.3080, lng: 113.9185 },
  ],
};

const mapContainerStyle: React.CSSProperties = { width: '100%', height: '100%' };

const LocationPickerMap = forwardRef<HTMLDivElement, LocationPickerMapProps>(({
  isOpen,
  onClose,
  onLocationSelect,
  type,
  initialLocation,
}, ref) => {
  const { language } = useLanguage();
  const { getCityConfig, currentCity } = useLocationContext();
  const { hasKey, isLoaded } = useGoogleMaps();
  const { reverseGeocode, searchAddress } = useGoogleGeocode(language);

  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(
    initialLocation || null
  );

  const mapRef = useRef<google.maps.Map | null>(null);

  const cityConfig = getCityConfig();
  const mapCenter = useMemo(() => {
    if (initialLocation) return initialLocation;
    if (cityConfig) return { lat: cityConfig.lat, lng: cityConfig.lng };
    const c = getMapCenter(DEFAULT_CITY);
    return { lat: c[1], lng: c[0] };
  }, [cityConfig, initialLocation]);

  const popularLocations = useMemo(() => {
    const citySlug = currentCity?.slug || 'phuket';
    return cityPopularLocations[citySlug] || defaultPopularLocations;
  }, [currentCity]);

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

  const getCurrentLocation = useCallback(() => {
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
  }, [reverseGeocode]);

  const selectPopularLocation = useCallback((location: typeof popularLocations[0]) => {
    const pos = { lat: location.lat, lng: location.lng };
    setMarkerPosition(pos);
    setSelectedLocation({
      address: language === 'ru' ? location.nameRu : location.nameEn,
      lat: location.lat,
      lng: location.lng,
    });
    mapRef.current?.panTo(pos);
    mapRef.current?.setZoom(16);
  }, [language]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    const countryCode = cityConfig?.countryCode || 'TH';
    const results = await searchAddress(searchQuery, { country: countryCode });
    if (results.length > 0) {
      const r = results[0];
      setMarkerPosition({ lat: r.lat, lng: r.lng });
      setSelectedLocation({ address: r.address, lat: r.lat, lng: r.lng });
      mapRef.current?.panTo({ lat: r.lat, lng: r.lng });
      mapRef.current?.setZoom(16);
    }
  }, [searchQuery, searchAddress, cityConfig]);

  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  }, [selectedLocation, onLocationSelect, onClose]);

  if (!isOpen) return null;

  const isMapLoading = !hasKey || !isLoaded;

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

        <div className="px-4 pb-3 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={language === 'ru' ? 'Поиск адреса...' : 'Search address...'}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} size="icon" variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map */}
      <div className="absolute inset-0 pt-28">
        {isMapLoading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={14}
            onClick={handleMapClick}
            onLoad={(map) => { mapRef.current = map; }}
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
          >
            {markerPosition && (
              <Marker
                position={markerPosition}
                draggable
                onDragEnd={async (e) => {
                  if (!e.latLng) return;
                  const lat = e.latLng.lat();
                  const lng = e.latLng.lng();
                  setMarkerPosition({ lat, lng });
                  const result = await reverseGeocode(lat, lng);
                  if (result) setSelectedLocation({ address: result.address, lat, lng });
                }}
              />
            )}
          </GoogleMap>
        )}
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

          <Button onClick={handleConfirm} disabled={!selectedLocation} className="w-full" size="lg">
            {language === 'ru' ? 'Подтвердить' : 'Confirm location'}
          </Button>
        </div>
      </div>
    </div>
  );
});

LocationPickerMap.displayName = 'LocationPickerMap';

export default LocationPickerMap;
