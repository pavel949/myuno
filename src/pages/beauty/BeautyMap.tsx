import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Filter, Sliders } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import SalonMap, { SalonMarker } from '@/components/map/SalonMap';
import { FilterChip } from '@/components/uno/FilterChip';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getDefaultCenter, DEFAULT_CITY } from '@/lib/config';

// Demo salon data with coordinates
const demoSalons: SalonMarker[] = [
  {
    id: 'salon-1',
    name: 'Orchid Spa & Wellness',
    nameRu: 'Орхидея СПА и Велнес',
    lat: 7.8202,
    lng: 98.3052,
    rating: 4.9,
    priceFrom: 1500,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6c?w=600',
  },
  {
    id: 'salon-2',
    name: 'Zen Beauty Studio',
    nameRu: 'Зен Бьюти Студио',
    lat: 7.8924,
    lng: 98.2970,
    rating: 4.8,
    priceFrom: 800,
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
  },
  {
    id: 'salon-3',
    name: 'Thai Serenity Massage',
    nameRu: 'Тайский Массаж Серенити',
    lat: 7.9519,
    lng: 98.2815,
    rating: 4.7,
    priceFrom: 600,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
  },
  {
    id: 'salon-4',
    name: 'Luxe Nail Bar',
    nameRu: 'Люкс Нейл Бар',
    lat: 7.7771,
    lng: 98.3341,
    rating: 4.6,
    priceFrom: 500,
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600',
  },
  {
    id: 'salon-5',
    name: 'Paradise Wellness Center',
    nameRu: 'Райский Велнес Центр',
    lat: 7.8501,
    lng: 98.3502,
    rating: 4.8,
    priceFrom: 1200,
    image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600',
  },
];

const distanceOptions = [
  { value: 2, labelEn: '2 km', labelRu: '2 км' },
  { value: 5, labelEn: '5 km', labelRu: '5 км' },
  { value: 10, labelEn: '10 km', labelRu: '10 км' },
  { value: 25, labelEn: '25 km', labelRu: '25 км' },
  { value: 50, labelEn: 'All', labelRu: 'Все' },
];

export default function BeautyMap() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(50);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to centralized city center if geolocation fails
          const defaultLocation = getDefaultCenter(DEFAULT_CITY);
          setUserLocation(defaultLocation);
        }
      );
    }
  }, []);

  const handleSalonSelect = (salonId: string) => {
    navigate(`/beauty/salon/${salonId}`);
  };

  return (
    <AppLayout>
      <div className="h-[calc(100vh-60px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <button
            onClick={() => navigate('/beauty')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {language === 'ru' ? 'Назад' : 'Back'}
            </span>
          </button>
          
          <h1 className="font-display font-semibold">
            {language === 'ru' ? 'Карта салонов' : 'Salon Map'}
          </h1>
          
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sliders className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {language === 'ru' ? 'Фильтры' : 'Filters'}
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Distance filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    {language === 'ru' ? 'Расстояние' : 'Distance'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {distanceOptions.map((opt) => (
                      <FilterChip
                        key={opt.value}
                        label={language === 'ru' ? opt.labelRu : opt.labelEn}
                        isActive={distanceFilter === opt.value}
                        onToggle={() => setDistanceFilter(opt.value)}
                      />
                    ))}
                  </div>
                </div>

                {/* Location info */}
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {language === 'ru' ? 'Ваша локация' : 'Your Location'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {userLocation 
                      ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                      : language === 'ru' 
                        ? 'Определение...' 
                        : 'Detecting...'}
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setIsFilterOpen(false)}
                >
                  {language === 'ru' ? 'Применить' : 'Apply'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Distance pills */}
        <div className="flex gap-2 p-3 overflow-x-auto bg-background/50 backdrop-blur-sm border-b border-border/30">
          {distanceOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              label={language === 'ru' ? opt.labelRu : opt.labelEn}
              isActive={distanceFilter === opt.value}
              onToggle={() => setDistanceFilter(opt.value)}
            />
          ))}
        </div>

        {/* Map */}
        <SalonMap
          salons={demoSalons}
          onSalonSelect={handleSalonSelect}
          userLocation={userLocation}
          distanceFilter={distanceFilter}
          className="flex-1"
        />
      </div>
    </AppLayout>
  );
}
