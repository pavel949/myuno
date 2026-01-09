import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Sliders } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import SalonMap, { SalonMarker } from '@/components/map/SalonMap';
import { FilterChip } from '@/components/uno/FilterChip';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Demo service providers data with coordinates
const demoProviders: SalonMarker[] = [
  {
    id: 'srv-1',
    name: 'Alex Masters - Plumber',
    nameRu: 'Алексей Мастеров - Сантехник',
    lat: 7.8302,
    lng: 98.3152,
    rating: 4.9,
    priceFrom: 1500,
  },
  {
    id: 'srv-2',
    name: 'Igor Electrician',
    nameRu: 'Игорь Электриков',
    lat: 7.8824,
    lng: 98.2870,
    rating: 4.8,
    priceFrom: 2000,
  },
  {
    id: 'srv-3',
    name: 'Clean House Team',
    nameRu: 'Чистый Дом',
    lat: 7.9419,
    lng: 98.2915,
    rating: 4.7,
    priceFrom: 3000,
  },
  {
    id: 'srv-4',
    name: 'Repair Master',
    nameRu: 'Мастер Ремонта',
    lat: 7.7871,
    lng: 98.3241,
    rating: 4.6,
    priceFrom: 1800,
  },
  {
    id: 'srv-5',
    name: 'Paint & Walls',
    nameRu: 'Краски и Стены',
    lat: 7.8601,
    lng: 98.3602,
    rating: 4.9,
    priceFrom: 500,
  },
  {
    id: 'srv-6',
    name: 'Climate Service - HVAC',
    nameRu: 'Климат Сервис',
    lat: 7.9001,
    lng: 98.3402,
    rating: 4.8,
    priceFrom: 3500,
  },
];

const distanceOptions = [
  { value: 2, labelEn: '2 km', labelRu: '2 км' },
  { value: 5, labelEn: '5 km', labelRu: '5 км' },
  { value: 10, labelEn: '10 km', labelRu: '10 км' },
  { value: 25, labelEn: '25 km', labelRu: '25 км' },
  { value: 50, labelEn: 'All', labelRu: 'Все' },
];

export default function ServicesMap() {
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
          // Default to Phuket center if geolocation fails
          setUserLocation({ lat: 7.8804, lng: 98.3923 });
        }
      );
    }
  }, []);

  const handleProviderSelect = (providerId: string) => {
    navigate(`/services/provider/${providerId}`);
  };

  return (
    <AppLayout showBottomNav={false}>
      <div className="h-[calc(100vh-60px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <button
            onClick={() => navigate('/services')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {language === 'ru' ? 'Назад' : 'Back'}
            </span>
          </button>
          
          <h1 className="font-display font-semibold">
            {language === 'ru' ? 'Карта мастеров' : 'Professionals Map'}
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
          salons={demoProviders}
          onSalonSelect={handleProviderSelect}
          userLocation={userLocation}
          distanceFilter={distanceFilter}
          className="flex-1"
        />
      </div>
    </AppLayout>
  );
}
