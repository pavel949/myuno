import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWaterActivities } from "@/hooks/useWaterActivities";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageContainer } from "@/components/uno/PageContainer";
import { PageHeader } from "@/components/uno/PageHeader";
import { FilterChip } from "@/components/uno/FilterChip";
import { SkeletonCard } from "@/components/uno/SkeletonCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Waves, Clock, Users, Star, Shield, MapPin, Filter } from "lucide-react";
import { UniversalFilter, ActiveFilters, FilterValues } from "@/components/filters/UniversalFilter";
import { waterFilterConfig } from "@/components/filters/WaterFilters";

const CATEGORIES = [
  { id: 'all', labelEn: 'All Activities', labelRu: 'Все активности' },
  { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг' },
  { id: 'snorkeling', labelEn: 'Snorkeling', labelRu: 'Снорклинг' },
  { id: 'jet-ski', labelEn: 'Jet Ski', labelRu: 'Гидроцикл' },
  { id: 'yacht', labelEn: 'Yacht', labelRu: 'Яхты' },
  { id: 'surfing', labelEn: 'Surfing', labelRu: 'Серфинг' },
  { id: 'kayaking', labelEn: 'Kayaking', labelRu: 'Каякинг' },
  { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка' },
  { id: 'parasailing', labelEn: 'Parasailing', labelRu: 'Парасейлинг' },
];

export default function WaterActivitiesIndex() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  
  const { activities, isLoading } = useWaterActivities({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filterValues).forEach(([key, value]) => {
      if (key === 'priceLevel' && value) count++;
      else if (Array.isArray(value)) count += value.length;
      else if (value) count++;
    });
    return count;
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

  // Apply filters
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Difficulty filter
      if (filterValues.difficulty && activity.difficulty !== filterValues.difficulty) {
        return false;
      }
      return true;
    });
  }, [activities, filterValues]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-600';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-600';
      case 'challenging': return 'bg-orange-500/20 text-orange-600';
      case 'expert': return 'bg-red-500/20 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={t('water.title')}
          showBack
          fallbackPath="/"
          subtitle={language === 'ru' ? `${filteredActivities.length} активностей` : `${filteredActivities.length} activities`}
        />

        {/* Filters Row */}
        <div className="flex items-center gap-2 mt-4">
          <UniversalFilter
            config={waterFilterConfig}
            values={filterValues}
            onChange={setFilterValues}
            language={language as 'en' | 'ru'}
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              {language === 'ru' ? 'Фильтры' : 'Filters'}
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </UniversalFilter>
          
          <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
            {CATEGORIES.map(cat => (
              <FilterChip
                key={cat.id}
                label={language === 'ru' ? cat.labelRu : cat.labelEn}
                isActive={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Active Filters */}
        <ActiveFilters
          config={waterFilterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          language={language as 'en' | 'ru'}
          className="mt-3"
        />

        {isLoading ? (
          <div className="grid gap-4 mt-4">{[1, 2, 3].map(i => <SkeletonCard key={i} />)}</div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12 mt-4">
            <Waves className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p>{t('water.noActivitiesFound')}</p>
          </div>
        ) : (
          <div className="grid gap-4 mt-4">
            {filteredActivities.map(activity => (
              <div 
                key={activity.id} 
                onClick={() => navigate(`/water/${activity.id}`)} 
                className="cursor-pointer bg-card rounded-2xl overflow-hidden shadow-sm border hover:shadow-md transition-all"
              >
                <div className="flex">
                  <div className="w-32 h-36 flex-shrink-0 relative">
                    <img 
                      src={activity.cover_image || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                    {activity.is_certified && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-[10px] px-1.5">
                          <Shield className="w-3 h-3 mr-0.5" />
                          {t('water.certified')}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold line-clamp-2 text-sm">
                          {language === 'ru' ? activity.title_ru : activity.title_en}
                        </h3>
                        <Badge className={`text-[10px] ${getDifficultyColor(activity.difficulty)}`}>
                          {activity.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{activity.location_name}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {activity.duration_minutes ? `${Math.round(activity.duration_minutes / 60)}h` : '-'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {activity.max_participants}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          {activity.rating}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-1 flex-wrap">
                        {activity.equipment_included && (
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {t('water.equipmentIncluded')}
                          </Badge>
                        )}
                      </div>
                      <span className="text-base font-bold text-primary">
                        ฿{activity.price?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
