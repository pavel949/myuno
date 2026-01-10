import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Compass, Clock, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTours } from "@/hooks/useTours";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { FilterChip } from "@/components/uno/FilterChip";
import { SkeletonCard } from "@/components/uno/SkeletonCard";
import { MiniAppHero, MiniAppSearch, ListCard } from "@/components/miniapp";

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
  
  const { tours, isLoading } = useTours({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const filteredTours = tours.filter(tour => {
    if (!searchQuery) return true;
    const title = language === 'ru' ? tour.title_ru : tour.title_en;
    return title.toLowerCase().includes(searchQuery.toLowerCase());
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

        {/* Search */}
        <MiniAppSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={language === 'ru' ? 'Поиск туров...' : 'Search tours...'}
          className="mb-4"
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
