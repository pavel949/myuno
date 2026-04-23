import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation as useLocationContext } from '@/contexts/LocationContext';
import { useGoogleMaps } from '@/contexts/GoogleMapsContext';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { Loader2, Navigation, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getMapCenter, PHUKET_LANDMARKS, DEFAULT_CITY } from '@/lib/config';
import { cn } from '@/lib/utils';

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
    { id: 'central', nameEn: 'Central', nameRu: 'Централ', lat: 22.2800, lng: 114.1588 },
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
  const { hasKey, isLoaded, loadError } = useGoogleMaps();
  const googleGeocode = useGoogleGeocode(language);

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const cityConfig = getCityConfig();
  const mapCenter = useMemo(() => {
    if (cityConfig) return { lat: cityConfig.lat, lng: cityConfig.lng };
    const c = getMapCenter(DEFAULT_CITY);
    return { lat: c[1], lng: c[0] };
  }, [cityConfig]);

  const initialCenter = useMemo(() => {
    if (initialLocation) return { lat: initialLocation.lat, lng: initialLocation.lng };
    return mapCenter;
  }, [initialLocation, mapCenter]);

  const [markerPosition, setMarkerPosition] = useState(initialCenter);

  const popularLocations = useMemo(() => {
    const citySlug = currentCity?.slug || 'phuket';
    return cityPopularLocations[citySlug] || defaultPopularLocations;
  }, [currentCity]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    const result = await googleGeocode.reverseGeocode(lat, lng);
    return result?.address ?? null;
  }, [googleGeocode]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat == null || lng == null) return;
    setMarkerPosition({ lat, lng });
    reverseGeocode(lat, lng).then((address) => {
      if (address) setSelectedLocation({ address, lat, lng });
    });
  }, [reverseGeocode]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    const lat = e.latLng?.lat();
    const lng = e.latLng?.lng();
    if (lat == null || lng == null) return;
    setMarkerPosition({ lat, lng });
    reverseGeocode(lat, lng).then((address) => {
      if (address) setSelectedLocation({ address, lat, lng });
    });
  }, [reverseGeocode]);

  useEffect(() => {
    if (!isOpen) return;
    setMarkerPosition(initialCenter);
    reverseGeocode(initialCenter.lat, initialCenter.lng).then((address) => {
      if (address) setSelectedLocation({ address, ...initialCenter });
      else setSelectedLocation(null);
    });
  }, [isOpen, initialCenter.lat, initialCenter.lng]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPosition({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(16);
        const address = await reverseGeocode(lat, lng);
        if (address) setSelectedLocation({ address, lat, lng });
        setIsGettingLocation(false);
      },
      () => setIsGettingLocation(false),
      { enableHighAccuracy: true }
    );
  }, [reverseGeocode]);

  const selectPopularLocation = useCallback((location: typeof popularLocations[0]) => {
    const pos = { lat: location.lat, lng: location.lng };
    setMarkerPosition(pos);
    mapRef.current?.panTo(pos);
    mapRef.current?.setZoom(16);
    setSelectedLocation({
      address: language === 'ru' ? location.nameRu : location.nameEn,
      lat: location.lat,
      lng: location.lng,
    });
  }, [language]);

  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;
    const countryCode = cityConfig?.countryCode || 'TH';
    const results = await googleGeocode.searchAddress(searchQuery, { country: countryCode });
    if (results.length > 0) {
      const r = results[0];
      setMarkerPosition({ lat: r.lat, lng: r.lng });
      setSelectedLocation({ address: r.address, lat: r.lat, lng: r.lng });
      mapRef.current?.panTo({ lat: r.lat, lng: r.lng });
      mapRef.current?.setZoom(16);
    }
  }, [searchQuery, cityConfig, googleGeocode]);

  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  }, [selectedLocation, onLocationSelect, onClose]);

  if (!isOpen) return null;

  const noKey = !hasKey || loadError;
  const isLoading = hasKey && !isLoaded;

  return (
    <div ref={ref} className="fixed inset-0 z-50 bg-background">
      <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 border-b border-border">
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

      <div className="absolute inset-0 pt-28">
        {noKey ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground">
              {loadError?.message?.includes('auth')
                ? (language === 'ru' ? 'Ошибка авторизации Google Maps' : 'Google Maps auth error')
                : (language === 'ru' ? 'Карта недоступна' : 'Map unavailable')}
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=7.8804,98.3923"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              {language === 'ru' ? 'Открыть карту в Google Maps' : 'Open in Google Maps'}
            </a>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={markerPosition}
            zoom={14}
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
            <Marker
              position={markerPosition}
              draggable
              onDragEnd={handleMarkerDragEnd}
            />
          </GoogleMap>
        )}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-1 h-1 bg-primary rounded-full shadow-lg" />
        </div>
      </div>

      <button
        onClick={getCurrentLocation}
        disabled={isGettingLocation || !!noKey || isLoading}
        className="absolute right-4 bottom-52 z-10 w-12 h-12 rounded-full bg-card shadow-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        {isGettingLocation ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <Navigation className="w-5 h-5 text-primary" />
        )}
      </button>

      <div className="absolute bottom-0 left-0 right-0 z-10 bg-background/95 border-t border-border rounded-none">
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
          <div className="p-3 rounded-none bg-muted/50 border border-border/50 mb-3 flex items-start gap-3">
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
