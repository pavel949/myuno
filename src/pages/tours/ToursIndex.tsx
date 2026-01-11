import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Clock, Users, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTours } from "@/hooks/useTours";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { FilterChip } from "@/components/uno/FilterChip";
import { SkeletonCard } from "@/components/uno/SkeletonCard";
import { MiniAppHero, MiniAppSearch, ListCard } from "@/components/miniapp";
import { Button } from "@/components/ui/button";
import { UniversalFilter, ActiveFilters, tourFilterConfig, FilterValues } from "@/components/filters";

const TOUR_CATEGORIES = [
  { id: 'all', labelEn: 'All Tours', labelRu: 'Все туры' },
  { id: 'islands', labelEn: 'Islands', labelRu: 'Острова' },
  { id: 'culture', labelEn: 'Culture', labelRu: 'Культура' },
  { id: 'nature', labelEn: 'Nature', labelRu: 'Природа' },
  { id: 'water-sports', labelEn: 'Water Sports', labelRu: 'Водный спорт' },
];

export default function ToursIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { tours, isLoading } = useTours({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

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

  const filteredTours = tours.filter(tour => {
    if (searchQuery) {
      const title = language === 'ru' ? tour.title_ru : tour.title_en;
      if (!title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    
    // Duration filter
    if (filterValues.duration) {
      const duration = tour.duration_hours || 0;
      const durationMap: Record<string, boolean> = {
        'half-day': duration <= 5,
        'full-day': duration > 5 && duration <= 10,
        'multi-day': duration > 10,
      };
      if (!durationMap[filterValues.duration as string]) return false;
    }
    
    // Difficulty filter
    if (filterValues.difficulty && filterValues.difficulty !== tour.difficulty) {
      return false;
    }
    
    return true;
  });

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={t('tours.title')} 
          showBack 
          fallbackPath="/"
          subtitle={language === 'ru' ? `${filteredTours.length} туров` : `${filteredTours.length} tours`}
        />

        {/* Hero Section */}
        <MiniAppHero
          icon={Compass}
          title={language === 'ru' ? 'Откройте Пхукет' : 'Explore Phuket'}
          subtitle={language === 'ru' 
            ? 'Лучшие экскурсии и туры от местных гидов' 
            : 'Best tours and excursions from local guides'}
          backgroundImage="https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800"
          gradientFrom="from-blue-500/20"
          gradientVia="via-cyan-500/20"
          gradientTo="to-primary/20"
          className="mt-4 mb-4"
        />

        {/* Search & Filter */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <MiniAppSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={language === 'ru' ? 'Поиск туров...' : 'Search tours...'}
            />
          </div>
          <UniversalFilter
            config={tourFilterConfig}
            values={filterValues}
            onChange={setFilterValues}
            activeCount={activeFilterCount}
          >
            <Button variant="outline" size="icon" className="relative shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </UniversalFilter>
        </div>

        {/* Active Filters */}
        <ActiveFilters
          config={tourFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide -mx-4 px-4">
          {TOUR_CATEGORIES.map(cat => (
            <FilterChip
              key={cat.id}
              label={language === 'ru' ? cat.labelRu : cat.labelEn}
              isActive={selectedCategory === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>

        {/* Tours List */}
        {isLoading ? (
          <div className="grid gap-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
        ) : filteredTours.length === 0 ? (
          <div className="text-center py-12">
            <Compass className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p>{t('tours.noToursFound')}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTours.map(tour => (
              <ListCard
                key={tour.id}
                image={tour.cover_image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400'}
                title={language === 'ru' ? tour.title_ru : tour.title_en}
                rating={tour.rating ?? undefined}
                price={tour.price ?? undefined}
                meta={[
                  { icon: Clock, value: `${tour.duration_hours}h` },
                  { icon: Users, value: tour.max_participants ?? 0 },
                ]}
                onClick={() => navigate(`/tours/${tour.id}`)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
