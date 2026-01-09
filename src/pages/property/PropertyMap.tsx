import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sliders, MapPin, BedDouble, Bath } from 'lucide-react';
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

// Demo property markers
const demoProperties: SalonMarker[] = [
  {
    id: 'prop-1',
    name: 'Luxury Ocean View Villa',
    nameRu: 'Роскошная вилла с видом на океан',
    lat: 7.9519,
    lng: 98.2815,
    rating: 4.9,
    priceFrom: 85000,
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600',
  },
  {
    id: 'prop-2',
    name: 'Modern Condo in Patong',
    nameRu: 'Современное кондо в Патонге',
    lat: 7.8924,
    lng: 98.2970,
    rating: 4.7,
    priceFrom: 25000,
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
  },
  {
    id: 'prop-3',
    name: 'Cozy Studio near Beach',
    nameRu: 'Уютная студия у пляжа',
    lat: 7.8202,
    lng: 98.3052,
    rating: 4.5,
    priceFrom: 1500,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
  },
  {
    id: 'prop-4',
    name: 'Beachfront Apartment',
    nameRu: 'Апартаменты на берегу',
    lat: 7.7771,
    lng: 98.3341,
    rating: 4.8,
    priceFrom: 35000,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
  },
  {
    id: 'prop-5',
    name: 'Traditional Thai House',
    nameRu: 'Традиционный тайский дом',
    lat: 7.8501,
    lng: 98.3502,
    rating: 4.6,
    priceFrom: 4500000,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600',
  },
];

const distanceOptions = [
  { value: 2, labelEn: '2 km', labelRu: '2 км' },
  { value: 5, labelEn: '5 km', labelRu: '5 км' },
  { value: 10, labelEn: '10 km', labelRu: '10 км' },
  { value: 25, labelEn: '25 km', labelRu: '25 км' },
  { value: 50, labelEn: 'All', labelRu: 'Все' },
];

const propertyTypes = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
  { id: 'apartment', labelEn: 'Apartment', labelRu: 'Квартира' },
  { id: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
];

export default function PropertyMap() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(50);
  const [selectedType, setSelectedType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setUserLocation({ lat: 7.8804, lng: 98.3923 });
        }
      );
    }
  }, []);

  const handlePropertySelect = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <AppLayout showBottomNav={false}>
      <div className="h-[calc(100vh-60px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
          <button
            onClick={() => navigate('/property')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">
              {language === 'ru' ? 'Назад' : 'Back'}
            </span>
          </button>
          
          <h1 className="font-display font-semibold">
            {language === 'ru' ? 'Карта объектов' : 'Property Map'}
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
                {/* Property type filter */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    {language === 'ru' ? 'Тип недвижимости' : 'Property Type'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypes.map((type) => (
                      <FilterChip
                        key={type.id}
                        label={language === 'ru' ? type.labelRu : type.labelEn}
                        isActive={selectedType === type.id}
                        onToggle={() => setSelectedType(type.id)}
                      />
                    ))}
                  </div>
                </div>

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
          salons={demoProperties}
          onSalonSelect={handlePropertySelect}
          userLocation={userLocation}
          distanceFilter={distanceFilter}
          className="flex-1"
        />
      </div>
    </AppLayout>
  );
}
