import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Waves, Clock, Users, MapPin, Shield } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWaterActivities } from "@/hooks/useWaterActivities";
import { MiniAppLayout, ItemCard, MiniAppQuickGrid, type MiniAppCategory, type QuickGridItem } from "@/components/miniapp";
import { waterFilterConfig, FilterValues } from "@/components/filters";
import { CrossSellSection } from "@/components/crosssell";

const CATEGORIES: MiniAppCategory[] = [
  { id: 'all', labelEn: 'All Activities', labelRu: 'Все активности' },
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг' },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл' },
  { id: 'surfing', labelEn: 'Surfing', labelRu: 'Серфинг' },
  { id: 'kayaking', labelEn: 'Kayaking', labelRu: 'Каякинг' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка' },
];

export default function WaterActivitiesIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { activities, isLoading } = useWaterActivities({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      if (searchQuery) {
        const title = language === 'ru' ? activity.title_ru : activity.title_en;
        if (!title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      if (filterValues.difficulty && activity.difficulty !== filterValues.difficulty) return false;
      return true;
    });
  }, [activities, searchQuery, filterValues, language]);

  const quickItems: QuickGridItem[] = [
    { icon: '🤿', label: language === 'ru' ? 'Дайвинг' : 'Diving', onClick: () => setSelectedCategory('diving') },
    { icon: '🏄', label: language === 'ru' ? 'Серфинг' : 'Surfing', onClick: () => setSelectedCategory('surfing') },
    { icon: '🚤', label: language === 'ru' ? 'Гидроцикл' : 'Jet Ski', onClick: () => setSelectedCategory('jet-ski') },
    { icon: '🎣', label: language === 'ru' ? 'Рыбалка' : 'Fishing', onClick: () => setSelectedCategory('fishing') },
  ];

  const getDifficultyBadge = (difficulty: string) => {
    const colors: Record<string, string> = {
      'easy': 'bg-green-500/20 text-green-600',
      'moderate': 'bg-yellow-500/20 text-yellow-600',
      'challenging': 'bg-orange-500/20 text-orange-600',
      'expert': 'bg-red-500/20 text-red-600',
    };
    return colors[difficulty] || 'bg-muted text-muted-foreground';
  };

  return (
    <MiniAppLayout
      title={t('water.title')}
      subtitle={language === 'ru' ? `${filteredActivities.length} активностей` : `${filteredActivities.length} activities`}
      heroIcon={Waves}
      heroTitle={language === 'ru' ? 'Водный спорт' : 'Water Sports'}
      heroSubtitle={language === 'ru' ? 'Дайвинг, серфинг, снорклинг и многое другое' : 'Diving, surfing, snorkeling and more'}
      heroImage="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"
      heroGradient={{ from: 'from-cyan-500/20', via: 'via-blue-500/20', to: 'to-primary/20' }}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={language === 'ru' ? 'Поиск активностей...' : 'Search activities...'}
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={waterFilterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      isLoading={isLoading}
      isEmpty={filteredActivities.length === 0}
      emptyIcon={Waves}
      emptyText={t('water.noActivitiesFound')}
    >
      <MiniAppQuickGrid items={quickItems} columns={4} className="mb-6" />
      
      <div className="grid gap-4">
        {filteredActivities.map(activity => (
          <ItemCard
            key={activity.id}
            image={activity.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'}
            title={language === 'ru' ? activity.title_ru : activity.title_en}
            rating={activity.rating ?? undefined}
            price={activity.price ?? undefined}
            currency="฿"
            location={activity.location_name ?? undefined}
            badge={activity.difficulty ? { text: activity.difficulty, className: getDifficultyBadge(activity.difficulty) } : undefined}
            meta={[
              { icon: Clock, label: activity.duration_minutes ? `${Math.round(activity.duration_minutes / 60)}h` : '-' },
              { icon: Users, label: `${activity.max_participants}` },
            ]}
            tags={[
              ...(activity.is_certified ? [t('water.certified')] : []),
              ...(activity.equipment_included ? [t('water.equipmentIncluded')] : []),
            ]}
            onClick={() => navigate(`/water/${activity.id}`)}
          />
        ))}
      </div>

      <CrossSellSection 
        currentVertical="water" 
        title={{ en: "Complete Your Adventure", ru: "Дополните приключение" }}
      />
    </MiniAppLayout>
  );
}