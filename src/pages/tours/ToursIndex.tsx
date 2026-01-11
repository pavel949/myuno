import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Clock, Users, MapPin, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTours } from "@/hooks/useTours";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { tourFilterConfig, FilterValues } from "@/components/filters";

const TOUR_CATEGORIES: MiniAppCategory[] = [
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

  const filteredTours = tours.filter(tour => {
    if (searchQuery) {
      const title = language === 'ru' ? tour.title_ru : tour.title_en;
      if (!title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }
    if (filterValues.duration) {
      const duration = tour.duration_hours || 0;
      const durationMap: Record<string, boolean> = {
        'half-day': duration <= 5,
        'full-day': duration > 5 && duration <= 10,
        'multi-day': duration > 10,
      };
      if (!durationMap[filterValues.duration as string]) return false;
    }
    if (filterValues.difficulty && filterValues.difficulty !== tour.difficulty) return false;
    return true;
  });

  const quickItems: QuickGridItem[] = [
    { icon: '🏝️', label: language === 'ru' ? 'Острова' : 'Islands', onClick: () => setSelectedCategory('islands') },
    { icon: '🎭', label: language === 'ru' ? 'Культура' : 'Culture', onClick: () => setSelectedCategory('culture') },
    { icon: '🌿', label: language === 'ru' ? 'Природа' : 'Nature', onClick: () => setSelectedCategory('nature') },
    { icon: '🏄', label: language === 'ru' ? 'Спорт' : 'Sports', onClick: () => setSelectedCategory('water-sports') },
  ];

  return (
    <MiniAppLayout
      title={t('tours.title')}
      subtitle={language === 'ru' ? `${filteredTours.length} туров` : `${filteredTours.length} tours`}
      heroIcon={Compass}
      heroTitle={language === 'ru' ? 'Откройте Пхукет' : 'Explore Phuket'}
      heroSubtitle={language === 'ru' ? 'Лучшие экскурсии от местных гидов' : 'Best tours from local guides'}
      heroImage="https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800"
      heroGradient={{ from: 'from-blue-500/20', via: 'via-cyan-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск туров...' : 'Search tours...'}
      categories={TOUR_CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={tourFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      isLoading={isLoading}
      isEmpty={filteredTours.length === 0}
      emptyIcon={Compass}
      emptyText={t('tours.noToursFound')}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />
      
      <div className="grid gap-4">
        {filteredTours.map(tour => (
          <ItemCard
            key={tour.id}
            image={tour.cover_image || 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=400'}
            title={language === 'ru' ? tour.title_ru : tour.title_en}
            rating={tour.rating ?? undefined}
            price={tour.price ?? undefined}
            currency="฿"
            location={tour.meeting_point ?? undefined}
            meta={[
              { icon: Clock, label: `${tour.duration_hours}h` },
              { icon: Users, label: `${tour.max_participants ?? 0}` },
            ]}
            tags={tour.includes ? (tour.includes as any[]).slice(0, 2).map(i => typeof i === 'string' ? i : i.text_en || '') : []}
            onClick={() => navigate(`/tours/${tour.id}`)}
          />
        ))}
      </div>
    </MiniAppLayout>
  );
}