import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, MiniAppQuickGrid, ItemCard } from '@/components/miniapp';
import { YachtFiltersKlook, type DatePreset, type SortOption } from '@/components/yachts/YachtFiltersKlook';
import { useYachts } from '@/hooks/useYachts';
import { matchesFilter } from '@/lib/filterUtils';
import { CrossSellSection } from '@/components/crosssell';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { mapYachtToCardProps } from '@/lib/adapters/yachtAdapters';

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
  
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('any');
  const [selectedDuration, setSelectedDuration] = useState<string[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [selectedCapacity, setSelectedCapacity] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedQuickFilters, setSelectedQuickFilters] = useState<string[]>([]);

  const filteredYachts = useMemo(() => {
    let results = yachts.filter(y => {
      // Category filter
      if (selectedCategory !== 'all' && y.yacht_type !== selectedCategory) return false;
      
      // Search filter
      if (searchQuery) {
        const name = language === 'ru' ? y.name_ru : y.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      
      // Price filter - use "from" price (lowest available)
      const price = y.price_half_day || y.price_full_day || y.price_sunset || y.price_overnight || 0;
      if (price < priceRange[0] || price > priceRange[1]) return false;
      
      // Capacity filter
      if (selectedCapacity.length > 0) {
        const cap = y.capacity || 0;
        const matchesCapacity = selectedCapacity.some(range => {
          switch (range) {
            case '2-6': return cap >= 2 && cap <= 6;
            case '7-12': return cap >= 7 && cap <= 12;
            case '13-20': return cap >= 13 && cap <= 20;
            case '20+': return cap > 20;
            default: return true;
          }
        });
        if (!matchesCapacity) return false;
      }
      
      // Amenities filter
      if (!matchesFilter(y.features_en, selectedAmenities)) return false;
      
      // Experience filter
      if (selectedExperiences.length > 0) {
        const yachtFeatures = [...(y.features_en || []), y.name_en || ''].join(' ').toLowerCase();
        const hasExperience = selectedExperiences.some(exp => 
          yachtFeatures.includes(exp.toLowerCase())
        );
        if (!hasExperience) return false;
      }
      
      // Duration filter
      if (selectedDuration.length > 0) {
        const hasDuration = selectedDuration.some(dur => {
          switch (dur) {
            case 'half-day': return y.price_half_day && y.price_half_day > 0;
            case 'full-day': return y.price_full_day && y.price_full_day > 0;
            case 'overnight': return y.price_overnight && y.price_overnight > 0;
            default: return true;
          }
        });
        if (!hasDuration) return false;
      }
      
      // Quick filters
      if (selectedQuickFilters.includes('crew') && !y.has_crew) return false;
      if (selectedQuickFilters.includes('catering') && !y.has_catering) return false;
      
      return true;
    });
    
    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.price_half_day || a.price_full_day || 0) - (b.price_half_day || b.price_full_day || 0);
        case 'price_desc':
          return (b.price_half_day || b.price_full_day || 0) - (a.price_half_day || a.price_full_day || 0);
        case 'capacity':
          return (b.capacity || 0) - (a.capacity || 0);
        case 'length':
          return (b.length_meters || 0) - (a.length_meters || 0);
        case 'newest':
          return (b.year_built || 0) - (a.year_built || 0);
        case 'rating':
        default:
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          return (b.rating || 0) - (a.rating || 0);
      }
    });
    
    return results;
  }, [yachts, selectedCategory, searchQuery, sortBy, priceRange, selectedCapacity, selectedAmenities, selectedExperiences, selectedDuration, selectedQuickFilters, language]);

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
      isLoading={isLoading}
      isEmpty={filteredYachts.length === 0}
      emptyIcon={Anchor}
      emptyText={language === 'ru' ? 'Яхты не найдены' : 'No yachts found'}
      resultsCount={filteredYachts.length}
      resultsLabel={language === 'ru' ? 'Доступные яхты' : 'Available Yachts'}
    >
      <YachtFiltersKlook
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        sortBy={sortBy}
        onSortChange={setSortBy}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        selectedDuration={selectedDuration}
        onDurationChange={setSelectedDuration}
        selectedExperiences={selectedExperiences}
        onExperiencesChange={setSelectedExperiences}
        selectedCapacity={selectedCapacity}
        onCapacityChange={setSelectedCapacity}
        selectedAmenities={selectedAmenities}
        onAmenitiesChange={setSelectedAmenities}
        selectedQuickFilters={selectedQuickFilters}
        onQuickFiltersChange={setSelectedQuickFilters}
        resultsCount={filteredYachts.length}
        language={language}
      />

      {/* Quick Routes */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          {language === 'ru' ? 'Популярные маршруты' : 'Popular Routes'}
        </h3>
        <MiniAppQuickGrid items={popularRoutes.map(r => ({
          ...r,
          label: language === 'ru' && r.label === 'Sunset' ? 'Закат' : r.label
        }))} columns={4} />
      </div>

      {/* Results Grid - using adapter */}
      <div className="grid gap-4 mt-6">
        {filteredYachts.map((yacht) => {
          const card = mapYachtToCardProps(yacht, language);
          return (
            <ItemCard
              key={yacht.id}
              title={card.title}
              image={card.image}
              price={card.price || 0}
              priceLabel={card.priceLabel}
              rating={card.rating}
              reviewCount={card.reviewCount}
              location={card.location}
              meta={card.meta.map(m => ({ icon: m.icon, value: m.label }))}
              tags={card.tags}
              isFeatured={card.isFeatured}
              isVerified={card.isVerified}
              onClick={() => navigate(`/yachts/${yacht.id}`)}
            />
          );
        })}
      </div>
      
      <VerticalCTA vertical="yachts" className="my-6" />
      <CrossSellSection currentVertical="yachts" />
    </MiniAppLayout>
  );
}
