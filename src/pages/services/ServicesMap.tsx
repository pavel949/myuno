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
  { id: 'all', icon: null, labelEn: 'All', labelRu: 'Все', labelTh: 'ทั้งหมด' },
  { id: 'plumbing', icon: Droplets, labelEn: 'Plumbing', labelRu: 'Сантехник', labelTh: 'ช่างประปา' },
  { id: 'electrical', icon: Zap, labelEn: 'Electrical', labelRu: 'Электрик', labelTh: 'ช่างไฟฟ้า' },
  { id: 'cleaning', icon: Sparkles, labelEn: 'Cleaning', labelRu: 'Уборка', labelTh: 'ทำความสะอาด' },
  { id: 'repair', icon: Hammer, labelEn: 'Repair', labelRu: 'Ремонт', labelTh: 'ซ่อมแซม' },
  { id: 'painting', icon: PaintBucket, labelEn: 'Painting', labelRu: 'Покраска', labelTh: 'ทาสี' },
  { id: 'hvac', icon: Wind, labelEn: 'HVAC', labelRu: 'Кондиционеры', labelTh: 'เครื่องปรับอากาศ' },
];

const distanceOptions = [
  { value: 0, labelEn: 'All', labelRu: 'Все', labelTh: 'ทั้งหมด' },
  { value: 2, labelEn: '2 km', labelRu: '2 км', labelTh: '2 กม.' },
  { value: 5, labelEn: '5 km', labelRu: '5 км', labelTh: '5 กม.' },
  { value: 10, labelEn: '10 km', labelRu: '10 км', labelTh: '10 กม.' },
  { value: 25, labelEn: '25 km', labelRu: '25 км', labelTh: '25 กม.' },
  { value: 50, labelEn: '50 km', labelRu: '50 км', labelTh: '50 กม.' },
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
        <div className="flex items-center justify-between p-4 bg-background/80 border-b border-border/50">
          <BackButton fallbackPath={APP_ROUTES.SERVICES} variant="ghost" size="sm" />
          <h1 className="font-display font-semibold">{language === 'ru' ? 'Карта мастеров' : language === 'th' ? 'แผนที่ผู้ให้บริการ' : 'Professionals Map'}</h1>
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={language === 'ru' ? 'Фильтры' : language === 'th' ? 'ตัวกรอง' : 'Filters'}><Sliders className="w-5 h-5" /></Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader><SheetTitle>{language === 'ru' ? 'Фильтры' : language === 'th' ? 'ตัวกรอง' : 'Filters'}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="text-sm font-medium mb-3 block">{language === 'ru' ? 'Категория' : language === 'th' ? 'หมวดหมู่' : 'Category'}</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <FilterChip key={cat.id} label={language === 'ru' ? cat.labelRu : language === 'th' ? cat.labelTh : cat.labelEn} isActive={categoryFilter === cat.id} onToggle={() => setCategoryFilter(cat.id)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-3 block">{language === 'ru' ? 'Расстояние' : language === 'th' ? 'ระยะทาง' : 'Distance'}</label>
                  <div className="flex flex-wrap gap-2">
                    {distanceOptions.map((opt) => (
                      <FilterChip key={opt.value} label={language === 'ru' ? opt.labelRu : language === 'th' ? opt.labelTh : opt.labelEn} isActive={distanceFilter === opt.value} onToggle={() => setDistanceFilter(opt.value)} />
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-none bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{language === 'ru' ? 'Ваша локация' : language === 'th' ? 'ตำแหน่งของคุณ' : 'Your Location'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : language === 'ru' ? 'Определение...' : language === 'th' ? 'กำลังค้นหา...' : 'Detecting...'}
                  </p>
                </div>
                <Button className="w-full" onClick={() => setIsFilterOpen(false)}>{language === 'ru' ? 'Применить' : language === 'th' ? 'นำไปใช้' : 'Apply'}</Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex gap-2 p-3 overflow-x-auto bg-background/50 border-b border-border/30">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button key={cat.id} onClick={() => setCategoryFilter(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${categoryFilter === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
                {Icon && <Icon className="w-4 h-4" />}
                {language === 'ru' ? cat.labelRu : language === 'th' ? cat.labelTh : cat.labelEn}
              </button>
            );
          })}
        </div>

        <SalonMap salons={salonMarkers} onSalonSelect={(id) => navigate(`/services/provider/${id}`)} userLocation={userLocation} distanceFilter={distanceFilter} className="flex-1 min-h-0 w-full" icon="🔧" />
      </div>
    </AppLayout>
  );
}
