import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Users, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, yachtFilterConfig, FilterValues } from '@/components/filters';
import { ExperienceFilterChips } from '@/components/yachts/YachtExperienceSelect';
import { useYachts } from '@/hooks/useYachts';

const YACHT_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'yacht', labelEn: 'Yachts', labelRu: 'Яхты' },
  { id: 'catamaran', labelEn: 'Catamarans', labelRu: 'Катамараны' },
  { id: 'speedboat', labelEn: 'Speedboats', labelRu: 'Катера' },
  { id: 'sailing', labelEn: 'Sailing', labelRu: 'Парусные' },
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
  const { yachts, isLoading } = useYachts();
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
    return yachts.filter(y => {
      if (selectedCategory !== 'all' && y.yacht_type !== selectedCategory) return false;
      
      if (searchQuery) {
        const name = language === 'ru' ? y.name_ru : y.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      if (filterValues.capacity) {
        const cap = y.capacity || 0;
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
  }, [yachts, selectedCategory, searchQuery, filterValues, language]);

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
      
      isLoading={isLoading}
      isEmpty={filteredYachts.length === 0}
      emptyIcon={Anchor}
      emptyText={language === 'ru' ? 'Яхты не найдены' : 'No yachts found'}
      
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
      <ActiveFilters
        config={yachtFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      <div className="grid gap-4">
        {filteredYachts.map((yacht) => (
          <ItemCard
            key={yacht.id}
            title={language === 'ru' ? yacht.name_ru : yacht.name_en}
            image={yacht.cover_image || 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600'}
            price={yacht.price_full_day || yacht.price_half_day || 0}
            priceLabel={`/${language === 'ru' ? 'день' : 'day'}`}
            rating={yacht.rating}
            reviewCount={yacht.review_count}
            location={language === 'ru' ? yacht.location_ru : yacht.location_name}
            meta={[
              { icon: Users, value: yacht.capacity || 0 },
              { icon: Anchor, value: `${yacht.capacity}p` },
            ]}
            tags={yacht.features_en?.slice(0, 2) || []}
            isFeatured={yacht.is_featured}
            isVerified={yacht.is_verified}
            onClick={() => navigate(`/yachts/${yacht.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}
