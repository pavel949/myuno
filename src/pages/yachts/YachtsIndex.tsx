import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Star, Users, Clock, MapPin, Waves, Shield, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { FilterChip } from '@/components/uno/FilterChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UniversalFilter, ActiveFilters, yachtFilterConfig, FilterValues } from '@/components/filters';

const YACHT_TYPES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'yacht', labelEn: 'Yachts', labelRu: 'Яхты' },
  { id: 'catamaran', labelEn: 'Catamarans', labelRu: 'Катамараны' },
  { id: 'speedboat', labelEn: 'Speedboats', labelRu: 'Катера' },
  { id: 'sailing', labelEn: 'Sailing', labelRu: 'Парусные' },
];

const demoYachts = [
  {
    id: 'yacht-1',
    nameEn: 'Luxury Ocean Dream',
    nameRu: 'Люкс Океан Дрим',
    type: 'yacht',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600',
    price: 45000,
    priceUnit: 'day',
    capacity: 12,
    length: '24m',
    rating: 4.9,
    reviewCount: 45,
    location: 'Chalong Bay',
    locationRu: 'Бухта Чалонг',
    isFeatured: true,
    hasCrewn: true,
    features: ['Captain included', 'Catering available', 'Snorkeling gear'],
    featuresRu: ['Капитан включён', 'Кейтеринг доступен', 'Снаряжение для снорклинга'],
  },
  {
    id: 'yacht-2',
    nameEn: 'Sunset Catamaran',
    nameRu: 'Катамаран Сансет',
    type: 'catamaran',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600',
    price: 35000,
    priceUnit: 'day',
    capacity: 20,
    length: '18m',
    rating: 4.8,
    reviewCount: 78,
    location: 'Patong',
    locationRu: 'Патонг',
    hasCrewn: true,
    features: ['Sunset tours', 'BBQ on board', 'Fishing gear'],
    featuresRu: ['Закатные туры', 'BBQ на борту', 'Рыболовные снасти'],
  },
  {
    id: 'yacht-3',
    nameEn: 'Speed Runner',
    nameRu: 'Спид Раннер',
    type: 'speedboat',
    image: 'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?w=600',
    price: 18000,
    priceUnit: 'day',
    capacity: 8,
    length: '12m',
    rating: 4.7,
    reviewCount: 123,
    location: 'Rawai',
    locationRu: 'Равай',
    features: ['Island hopping', 'Phi Phi tours', 'Fast transfer'],
    featuresRu: ['По островам', 'Туры на Пхи-Пхи', 'Быстрый трансфер'],
  },
  {
    id: 'yacht-4',
    nameEn: 'Wind Dancer',
    nameRu: 'Винд Дансер',
    type: 'sailing',
    image: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=600',
    price: 28000,
    priceUnit: 'day',
    capacity: 6,
    length: '15m',
    rating: 4.9,
    reviewCount: 34,
    location: 'Nai Harn',
    locationRu: 'Най Харн',
    isNew: true,
    hasCrewn: true,
    features: ['Sailing lessons', 'Private tours', 'Romantic getaway'],
    featuresRu: ['Уроки парусного спорта', 'Приватные туры', 'Романтический отдых'],
  },
  {
    id: 'yacht-5',
    nameEn: 'Party Boat XL',
    nameRu: 'Пати Бот XL',
    type: 'catamaran',
    image: 'https://images.unsplash.com/photo-1559494007-9f5847c49d94?w=600',
    price: 55000,
    priceUnit: 'day',
    capacity: 30,
    length: '22m',
    rating: 4.6,
    reviewCount: 89,
    location: 'Patong',
    locationRu: 'Патонг',
    features: ['DJ equipment', 'Full bar', 'Swimming platform'],
    featuresRu: ['DJ оборудование', 'Полный бар', 'Платформа для плавания'],
  },
];

const popularRoutes = [
  {
    id: 'route-1',
    nameEn: 'Phi Phi Islands',
    nameRu: 'Острова Пхи-Пхи',
    duration: '8 hours',
    durationRu: '8 часов',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400',
  },
  {
    id: 'route-2',
    nameEn: 'James Bond Island',
    nameRu: 'Остров Джеймса Бонда',
    duration: '6 hours',
    durationRu: '6 часов',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  },
  {
    id: 'route-3',
    nameEn: 'Similan Islands',
    nameRu: 'Симиланские острова',
    duration: '12 hours',
    durationRu: '12 часов',
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400',
  },
];

export default function YachtsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const activeFilterCount = useMemo(() => {
    return Object.values(filterValues).filter(v => 
      Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null
    ).length;
  }, [filterValues]);

  const handleRemoveFilter = (sectionId: string, optionId?: string) => {
    setFilterValues(prev => {
      const newValues = { ...prev };
      if (optionId && Array.isArray(newValues[sectionId])) {
        newValues[sectionId] = (newValues[sectionId] as string[]).filter(id => id !== optionId);
        if ((newValues[sectionId] as string[]).length === 0) delete newValues[sectionId];
      } else {
        delete newValues[sectionId];
      }
      return newValues;
    });
  };

  const handleClearAllFilters = () => setFilterValues({});

  const filteredYachts = demoYachts.filter(y => {
    if (selectedType !== 'all' && y.type !== selectedType) return false;
    
    // Capacity filter
    if (filterValues.capacity) {
      const cap = y.capacity;
      const capMap: Record<string, boolean> = {
        '2-6': cap >= 2 && cap <= 6,
        '7-12': cap >= 7 && cap <= 12,
        '13-20': cap >= 13 && cap <= 20,
        '20+': cap > 20,
      };
      if (!capMap[filterValues.capacity as string]) return false;
    }
    
    return true;
  });

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader
          title={language === 'ru' ? 'Яхты и лодки' : 'Yachts & Boats'}
          showBack
          fallbackPath="/"
          subtitle={language === 'ru' ? `${filteredYachts.length} вариантов` : `${filteredYachts.length} options`}
        />

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/20 via-blue-500/20 to-indigo-500/20 p-6 mb-6 mt-4">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800')] bg-cover bg-center opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Anchor className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">
                {language === 'ru' ? 'Лучшие яхты Пхукета' : 'Best yachts in Phuket'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'ru'
                ? 'Для незабываемых приключений на воде'
                : 'For unforgettable adventures on the water'}
            </p>
          </div>
        </div>

        {/* Popular Routes */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            {language === 'ru' ? 'Популярные маршруты' : 'Popular Routes'}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {popularRoutes.map((route) => (
              <div
                key={route.id}
                className="flex-shrink-0 w-40 rounded-xl overflow-hidden bg-card border cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="relative h-24">
                  <img
                    src={route.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-2">
                  <h3 className="text-sm font-medium truncate">
                    {language === 'ru' ? route.nameRu : route.nameEn}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{language === 'ru' ? route.durationRu : route.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            {language === 'ru' ? 'Тип яхты' : 'Yacht Type'}
          </span>
          <UniversalFilter
            config={yachtFilterConfig}
            values={filterValues}
            onChange={setFilterValues}
            activeCount={activeFilterCount}
          >
            <Button variant="outline" size="sm" className="relative gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              {language === 'ru' ? 'Ещё' : 'More'}
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </UniversalFilter>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          {YACHT_TYPES.map((type) => (
            <FilterChip
              key={type.id}
              label={language === 'ru' ? type.labelRu : type.labelEn}
              isActive={selectedType === type.id}
              onToggle={() => setSelectedType(type.id)}
            />
          ))}
        </div>

        {/* Active Filters */}
        <ActiveFilters
          config={yachtFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {language === 'ru' ? 'Доступные яхты' : 'Available Yachts'}
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredYachts.length} {language === 'ru' ? 'найдено' : 'found'}
          </span>
        </div>
        <div className="grid gap-4">
          {filteredYachts.map((yacht) => (
            <div
              key={yacht.id}
              onClick={() => navigate(`/yachts/${yacht.id}`)}
              className="bg-card rounded-2xl overflow-hidden border hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex">
                <div className="w-32 h-36 flex-shrink-0 relative">
                  <img
                    src={yacht.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {yacht.isFeatured && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">
                      <Star className="w-3 h-3 mr-0.5" />
                      Featured
                    </Badge>
                  )}
                  {yacht.isNew && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                      NEW
                    </Badge>
                  )}
                </div>
                <div className="flex-1 p-3 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {language === 'ru' ? yacht.nameRu : yacht.nameEn}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      <span>{language === 'ru' ? yacht.locationRu : yacht.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {yacht.capacity}
                      </span>
                      <span className="flex items-center gap-1">
                        <Anchor className="w-3.5 h-3.5" />
                        {yacht.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        {yacht.rating}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1 flex-wrap">
                      {yacht.hasCrewn && (
                        <Badge variant="outline" className="text-[10px] px-1.5">
                          <Shield className="w-3 h-3 mr-0.5" />
                          {language === 'ru' ? 'С экипажем' : 'With crew'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-base font-bold text-primary">
                        ฿{yacht.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        /{language === 'ru' ? 'день' : 'day'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    </AppLayout>
  );
}
