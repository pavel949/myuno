import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Sliders, Droplets, Zap, Sparkles, Hammer, PaintBucket, Wind, Key, Truck } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import SalonMap, { SalonMarker } from '@/components/map/SalonMap';
import { FilterChip } from '@/components/uno/FilterChip';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSupabaseQuery, QueryFilter } from '@/hooks/useSupabaseQuery';

interface ServiceProvider {
  id: string;
  name_en: string;
  name_ru: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  price_per_hour: number | null;
  category: string | null;
  is_active: boolean;
}

const categories = [
  { id: 'all', icon: null, labelEn: 'All', labelRu: 'Все' },
  { id: 'plumbing', icon: Droplets, labelEn: 'Plumbing', labelRu: 'Сантехник' },
  { id: 'electrical', icon: Zap, labelEn: 'Electrical', labelRu: 'Электрик' },
  { id: 'cleaning', icon: Sparkles, labelEn: 'Cleaning', labelRu: 'Уборка' },
  { id: 'repair', icon: Hammer, labelEn: 'Repair', labelRu: 'Ремонт' },
  { id: 'painting', icon: PaintBucket, labelEn: 'Painting', labelRu: 'Покраска' },
  { id: 'hvac', icon: Wind, labelEn: 'HVAC', labelRu: 'Кондиционеры' },
];

const distanceOptions = [
  { value: 0, labelEn: 'All', labelRu: 'Все' },
  { value: 2, labelEn: '2 km', labelRu: '2 км' },
  { value: 5, labelEn: '5 km', labelRu: '5 км' },
  { value: 10, labelEn: '10 km', labelRu: '10 км' },
  { value: 25, labelEn: '25 km', labelRu: '25 км' },
  { value: 50, labelEn: '50 km', labelRu: '50 км' },
];

export default function ServicesMap() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filters = useMemo((): QueryFilter[] => [{ column: 'is_active', value: true }], []);

  const { data: providers } = useSupabaseQuery<ServiceProvider>({
    table: 'home_service_providers' as any,
    filters,
    select: 'id, name_en, name_ru, lat, lng, rating, price_per_hour, category, is_active',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 7.8804, lng: 98.3923 })
      );
    }
  }, []);

  const salonMarkers: SalonMarker[] = useMemo(() => {
    return (providers || [])
      .filter(p => categoryFilter === 'all' || p.category === categoryFilter)
      .filter(p => p.lat && p.lng)
      .map(p => ({
        id: p.id,
        name: p.name_en,
        nameRu: p.name_ru,
        lat: Number(p.lat),
        lng: Number(p.lng),
        rating: p.rating ?? 0,
        priceFrom: p.price_per_hour ?? 0,
      }));
  }, [providers, categoryFilter]);

  return (
    <AppLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col">
        <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <BackButton fallbackPath={APP_ROUTES.SERVICES} variant="ghost" size="sm" />
          <h1 className="font-display font-semibold">{language === 'ru' ? 'Карта мастеров' : 'Professionals Map'}</h1>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Sliders className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>{language === 'ru' ? 'Фильтры' : 'Filters'}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">{language === 'ru' ? 'Категория' : 'Category'}</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <FilterChip key={cat.id} label={language === 'ru' ? cat.labelRu : cat.labelEn} isActive={categoryFilter === cat.id} onToggle={() => setCategoryFilter(cat.id)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-3 block">{language === 'ru' ? 'Расстояние' : 'Distance'}</label>
                  <div className="flex flex-wrap gap-2">
                    {distanceOptions.map((opt) => (
                      <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : opt.labelEn} isActive={distanceFilter === opt.value} onToggle={() => setDistanceFilter(opt.value)} />
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{language === 'ru' ? 'Ваша локация' : 'Your Location'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : language === 'ru' ? 'Определение...' : 'Detecting...'}
                  </p>
                </div>
                <Button className="w-full" onClick={() => setIsFilterOpen(false)}>{language === 'ru' ? 'Применить' : 'Apply'}</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-2 p-3 overflow-x-auto bg-background/50 backdrop-blur-sm border-b border-border/30">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {Icon && <Icon className="w-4 h-4" />}
                {language === 'ru' ? cat.labelRu : cat.labelEn}
              </button>
            );
          })}
        </div>

        <SalonMap salons={salonMarkers} onSalonSelect={(id) => navigate(`/services/provider/${id}`)} userLocation={userLocation} distanceFilter={distanceFilter} className="flex-1 min-h-0 w-full" icon="🔧" />
      </div>
    </AppLayout>
  );
}
