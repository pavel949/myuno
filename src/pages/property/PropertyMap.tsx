import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sliders, MapPin, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { APP_ROUTES } from '@/lib/config/routes';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import SalonMap from '@/components/map/SalonMap';
import { FilterChip } from '@/components/uno/FilterChip';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CITY_GEOGRAPHY } from '@/lib/config/geography';
import { usePropertiesForMap, transformPropertiesToMarkers } from '@/hooks/useProperties';

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
  { id: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
  { id: 'house', labelEn: 'House', labelRu: 'Дом' },
];

export default function PropertyMap() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(50);
  const [selectedType, setSelectedType] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Fetch real properties from database
  const { data: properties, isLoading } = usePropertiesForMap({
    propertyType: selectedType !== 'all' ? selectedType : undefined,
  });

  // Transform to map markers
  const propertyMarkers = transformPropertiesToMarkers(properties || []);

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
          // Fallback to Phuket center from centralized config
          const phuket = CITY_GEOGRAPHY.phuket;
          setUserLocation({ lat: phuket.center.lat, lng: phuket.center.lng });
        }
      );
    }
  }, []);

  const handlePropertySelect = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  return (
    <AppLayout>
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
            {properties && properties.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                ({properties.length})
              </span>
            )}
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

        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center bg-card">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Загрузка объектов...' : 'Loading properties...'}
              </span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && propertyMarkers.length === 0 && (
          <div className="flex-1 flex items-center justify-center bg-card">
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-medium text-lg mb-2">
                {language === 'ru' ? 'Объекты не найдены' : 'No properties found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' 
                  ? 'Попробуйте изменить фильтры'
                  : 'Try adjusting your filters'}
              </p>
            </div>
          </div>
        )}

        {/* Map with real data */}
        {!isLoading && propertyMarkers.length > 0 && (
          <SalonMap
            salons={propertyMarkers}
            onSalonSelect={handlePropertySelect}
            userLocation={userLocation}
            distanceFilter={distanceFilter}
            className="flex-1"
            icon="🏠"
            iconBgColor="bg-emerald-600"
          />
        )}
      </div>
    </AppLayout>
  );
}