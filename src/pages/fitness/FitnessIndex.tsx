import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory } from '@/components/miniapp';
import { UniversalFilter, ActiveFilters, fitnessFilterConfig, FilterValues } from '@/components/filters';
import { useGyms } from '@/hooks/useGyms';
import { matchesFilter, matchesPriceLevel, matchesMembership, isOpenNow } from '@/lib/filterUtils';

const GYM_CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'gym', labelEn: 'Gym', labelRu: 'Зал' },
  { id: 'yoga', labelEn: 'Yoga', labelRu: 'Йога' },
  { id: 'muay-thai', labelEn: 'Muay Thai', labelRu: 'Муай Тай' },
  { id: 'crossfit', labelEn: 'CrossFit', labelRu: 'Кроссфит' },
  { id: 'swimming', labelEn: 'Swimming', labelRu: 'Бассейн' },
];

const quickItems = [
  { icon: '🏋️', label: 'Gym', labelRu: 'Зал' },
  { icon: '🧘', label: 'Yoga', labelRu: 'Йога' },
  { icon: '🥊', label: 'Muay Thai', labelRu: 'Муай Тай' },
  { icon: '🏊', label: 'Pool', labelRu: 'Бассейн' },
];

export default function FitnessIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { gyms, isLoading } = useGyms();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredGyms = useMemo(() => {
    return gyms.filter(gym => {
      // Category filter
      if (selectedCategory !== 'all' && gym.gym_type !== selectedCategory) return false;
      
      // Search filter
      if (searchQuery) {
        const name = language === 'ru' ? gym.name_ru : gym.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      // Price level filter
      const lowestPrice = gym.price_day_pass || gym.price_week_pass || gym.price_month_pass;
      if (!matchesPriceLevel(lowestPrice, filterValues.priceLevel as string)) return false;
      
      // Amenities filter (multi-select)
      const amenitiesFilter = Array.isArray(filterValues.amenities) ? filterValues.amenities : [];
      if (!matchesFilter(gym.amenities, amenitiesFilter)) return false;
      
      // Membership type filter
      if (!matchesMembership(gym, filterValues.membership as string)) return false;
      
      // Schedule/availability filter
      const scheduleFilter = Array.isArray(filterValues.schedule) ? filterValues.schedule : [];
      if (scheduleFilter.includes('open-now') && !isOpenNow(gym.working_hours as Record<string, string>)) {
        return false;
      }
      
      return true;
    });
  }, [gyms, selectedCategory, searchQuery, language, filterValues]);

  const getPriceLabel = (gym: typeof gyms[0]) => {
    if (gym.price_day_pass) return { price: gym.price_day_pass, label: language === 'ru' ? '/день' : '/day' };
    if (gym.price_month_pass) return { price: gym.price_month_pass, label: language === 'ru' ? '/мес' : '/month' };
    if (gym.price_week_pass) return { price: gym.price_week_pass, label: language === 'ru' ? '/нед' : '/week' };
    return { price: 0, label: '' };
  };

  return (
    <MiniAppLayout
      title={language === 'ru' ? 'Фитнес и Спорт' : 'Fitness & Sports'}
      subtitle={language === 'ru' ? `${filteredGyms.length} залов` : `${filteredGyms.length} gyms`}
      fallbackPath="/"
      
      heroIcon={Dumbbell}
      heroTitle={language === 'ru' ? 'Фитнес и спорт' : 'Fitness & Sports'}
      heroSubtitle={language === 'ru' ? 'Залы, тренеры, занятия' : 'Gyms, trainers, classes'}
      heroImage="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"
      heroGradient={{ from: 'from-orange-500/20', via: 'via-red-500/20', to: 'to-primary/20' }}
      
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск залов...' : 'Search gyms...'}
      
      categories={GYM_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      
      isLoading={isLoading}
      isEmpty={filteredGyms.length === 0}
      emptyIcon={Dumbbell}
      emptyText={language === 'ru' ? 'Залы не найдены' : 'No gyms found'}
      
      filterButton={
        <UniversalFilter
          config={fitnessFilterConfig}
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
        <MiniAppQuickGrid 
          items={quickItems.map(item => ({
            ...item,
            label: language === 'ru' ? item.labelRu : item.label,
            onClick: () => setSelectedCategory(item.label.toLowerCase().replace(' ', '-'))
          }))} 
          columns={4} 
        />
      }
      
      resultsCount={filteredGyms.length}
      resultsLabel={language === 'ru' ? 'Залов' : 'Gyms'}
    >
      <ActiveFilters
        config={fitnessFilterConfig}
        values={filterValues}
        onRemove={handleRemoveFilter}
        onClearAll={() => setFilterValues({})}
        className="mb-4"
      />

      <div className="grid gap-4">
        {filteredGyms.map((gym) => {
          const priceInfo = getPriceLabel(gym);
          return (
            <ItemCard
              key={gym.id}
              title={language === 'ru' ? gym.name_ru : gym.name_en}
              image={gym.cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600'}
              price={priceInfo.price}
              priceLabel={priceInfo.label}
              rating={gym.rating}
              reviewCount={gym.review_count}
              location={gym.district ?? undefined}
              tags={gym.amenities?.slice(0, 3) || []}
              isVerified={gym.is_verified}
              onClick={() => navigate(`/fitness/gym/${gym.id}`)}
            />
          );
        })}
      </div>
    </MiniAppLayout>
  );
}
