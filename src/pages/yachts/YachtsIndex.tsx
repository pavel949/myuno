import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Users, Clock, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, yachtFilterConfig, FilterValues } from '@/components/filters';
import { ExperienceFilterChips, YACHT_EXPERIENCES } from '@/components/yachts/YachtExperienceSelect';

const YACHT_CATEGORIES: MiniAppCategory[] = [
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
    hasCrew: true,
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
    hasCrew: true,
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
    hasCrew: true,
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
  },
];

const popularRoutes = [
  { icon: '🏝️', label: 'Phi Phi', path: '/yachts?route=phi-phi' },
  { icon: '🎬', label: 'James Bond', path: '/yachts?route=james-bond' },
  { icon: '🐠', label: 'Similan', path: '/yachts?route=similan' },
  { icon: '🌅', label: 'Sunset', path: '/yachts?route=sunset' },
];

export default function YachtsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);

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

  const filteredYachts = useMemo(() => {
    return demoYachts.filter(y => {
      if (selectedCategory !== 'all' && y.type !== selectedCategory) return false;
      
      if (searchQuery) {
        const name = language === 'ru' ? y.nameRu : y.nameEn;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
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
  }, [demoYachts, selectedCategory, searchQuery, filterValues, language]);

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Яхты и лодки' : 'Yachts & Boats'}
      subtitle={language === 'ru' ? `${filteredYachts.length} вариантов` : `${filteredYachts.length} options`}
      fallbackPath="/"
      
      heroIcon={Anchor}
      heroTitle={language === 'ru' ? 'Лучшие яхты Пхукета' : 'Best Yachts in Phuket'}
      heroSubtitle={language === 'ru' ? 'Для незабываемых приключений на воде' : 'For unforgettable adventures on the water'}
      heroBackgroundImage="https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800"
      heroGradientFrom="from-sky-500/20"
      heroGradientVia="via-blue-500/20"
      heroGradientTo="to-indigo-500/20"
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск яхт...' : 'Search yachts...'}
      
      categories={YACHT_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
      filterButton={
        <UniversalFilter
          config={yachtFilterConfig}
          values={filterValues}
          onChange={setFilterValues}
          activeCount={activeFilterCount}
        >
          <Button variant="outline" size="icon" className="relative shrink-0 h-10 w-10">
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </UniversalFilter>
      }
      
      quickActions={
        <>
          {/* Experience Filters */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-medium">
                {language === 'ru' ? 'Впечатления' : 'Experiences'}
              </h3>
            </div>
            <ExperienceFilterChips 
              selected={selectedExperiences}
              onChange={setSelectedExperiences}
            />
          </div>

          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            {language === 'ru' ? 'Популярные маршруты' : 'Popular Routes'}
          </h3>
          <MiniAppQuickGrid items={popularRoutes.map(r => ({
            ...r,
            label: language === 'ru' && r.label === 'Sunset' ? 'Закат' : r.label
          }))} columns={4} />
        </>
      }
      
      resultsCount={filteredYachts.length}
      resultsLabel={language === 'ru' ? 'Доступные яхты' : 'Available Yachts'}
    >
      {/* Active Filters */}
      <ActiveFilters
        config={yachtFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      {/* Results Grid */}
      <div className="grid gap-4">
        {filteredYachts.map((yacht) => (
          <ItemCard
            key={yacht.id}
            title={language === 'ru' ? yacht.nameRu : yacht.nameEn}
            image={yacht.image}
            price={yacht.price}
            priceLabel={`/${language === 'ru' ? 'день' : 'day'}`}
            rating={yacht.rating}
            reviewCount={yacht.reviewCount}
            location={language === 'ru' ? yacht.locationRu : yacht.location}
            meta={[
              { icon: Users, value: yacht.capacity },
              { icon: Anchor, value: yacht.length },
            ]}
            tags={yacht.hasCrew ? [language === 'ru' ? 'С экипажем' : 'With crew'] : []}
            isNew={yacht.isNew}
            isFeatured={yacht.isFeatured}
            onClick={() => navigate(`/yachts/${yacht.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
