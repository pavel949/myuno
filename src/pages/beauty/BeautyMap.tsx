import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sliders } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import SalonMap, { SalonMarker } from '@/components/map/SalonMap';
import { FilterChip } from '@/components/uno/FilterChip';
import { Button } from '@/components/ui/button';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { getDefaultCenter, DEFAULT_CITY } from '@/lib/config';
import { useSalons } from '@/hooks/useSalons';

const distanceOptions = [
  { value: 0, labelEn: 'All', labelRu: 'Все' },
  { value: 2, labelEn: '2 km', labelRu: '2 км' },
  { value: 5, labelEn: '5 km', labelRu: '5 км' },
  { value: 10, labelEn: '10 km', labelRu: '10 км' },
  { value: 25, labelEn: '25 km', labelRu: '25 км' },
  { value: 50, labelEn: '50 km', labelRu: '50 км' },
];

// Phuket bounding box used for approximate salon placement until the `salons`
// table gains real lat/lng columns. Derived deterministically from the salon id so
// markers stay put across re-renders (previously Math.random() jittered every render).
const PHUKET_BOUNDS = { latBase: 7.85, latSpan: 0.15, lngBase: 98.28, lngSpan: 0.1 };

/** Stable [0, 1) fraction hashed from a salon id — same id always maps to the same point. */
function stableFraction(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

export default function BeautyMap() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { salons, isLoading } = useSalons();

  // Map DB salons to SalonMarker format
  const salonMarkers: SalonMarker[] = (salons || [])
    .filter(s => s.address) // only salons with location data
    .map(s => ({
      id: s.id,
      name: s.name_en,
      nameRu: s.name_ru,
      // TODO: replace with real coordinates once `salons` table has lat/lng columns.
      // Until then, derive a stable approximate point from the id (no per-render jitter).
      lat: PHUKET_BOUNDS.latBase + stableFraction(`${s.id}lat`) * PHUKET_BOUNDS.latSpan,
      lng: PHUKET_BOUNDS.lngBase + stableFraction(`${s.id}lng`) * PHUKET_BOUNDS.lngSpan,
      rating: s.rating ?? 0,
      priceFrom: s.price_from ?? 0,
      image: s.cover_image || undefined,
    }));

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => setUserLocation(getDefaultCenter(DEFAULT_CITY))
      );
    }
  }, []);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col">
        <div className="flex items-center justify-between p-4 bg-background/80 border-b border-border/50">
          <BackButton fallbackPath={APP_ROUTES.BEAUTY} variant="ghost" size="sm" />
          <h1 className="font-display font-semibold">{language === 'ru' ? 'Карта салонов' : 'Salon Map'}</h1>
          <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(true)} aria-label={language === 'ru' ? 'Фильтры' : 'Filters'}>
            <Sliders className="w-5 h-5" />
          </Button>
        </div>

        <ResponsiveModal
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          title={language === 'ru' ? 'Фильтры' : 'Filters'}
          icon={<Sliders className="h-5 w-5 text-primary" />}
          size="sm"
          footer={
            <Button className="w-full" onClick={() => setIsFilterOpen(false)}>
              {language === 'ru' ? 'Применить' : 'Apply'}
            </Button>
          }
        >
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-3 block">{language === 'ru' ? 'Расстояние' : 'Distance'}</label>
              <div className="flex flex-wrap gap-2">
                {distanceOptions.map((opt) => (
                  <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} isActive={distanceFilter === opt.value} onToggle={() => setDistanceFilter(opt.value)} />
                ))}
              </div>
            </div>
            <div className="p-4 rounded-none bg-secondary/50">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{language === 'ru' ? 'Ваша локация' : 'Your Location'}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : language === 'ru' ? 'Определение...' : 'Detecting...'}
              </p>
            </div>
          </div>
        </ResponsiveModal>

        <div className="flex gap-2 p-3 overflow-x-auto bg-background/50 border-b border-border/30">
          {distanceOptions.map((opt) => (
            <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} isActive={distanceFilter === opt.value} onToggle={() => setDistanceFilter(opt.value)} />
          ))}
        </div>

        <SalonMap salons={salonMarkers} onSalonSelect={(id) => navigate(`/beauty/salon/${id}`)} userLocation={userLocation} distanceFilter={distanceFilter} className="flex-1 min-h-0 w-full" />
      </div>
    </AppLayout>
  );
}
