/**
 * FitnessIndex — MiniAppLayout + CatalogCard
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGyms } from '@/hooks/useGyms';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { mapGymToCatalogCard } from '@/lib/adapters/catalogCardAdapters';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'gym', labelEn: 'Gym', labelRu: 'Зал' },
  { id: 'yoga', labelEn: 'Yoga', labelRu: 'Йога' },
  { id: 'muay-thai', labelEn: 'Muay Thai', labelRu: 'Муай Тай' },
  { id: 'crossfit', labelEn: 'CrossFit', labelRu: 'Кроссфит' },
  { id: 'swimming', labelEn: 'Swimming', labelRu: 'Бассейн' },
];

export default function FitnessIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { gyms, isLoading } = useGyms();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const filteredGyms = useMemo(() => {
    if (selectedCategory === 'all') return gyms;
    return gyms.filter(gym => gym.gym_type === selectedCategory);
  }, [gyms, selectedCategory]);

  return (
    <MiniAppLayout
      title={isRu ? 'Фитнес и Спорт' : 'Fitness & Sports'}
      subtitle={`${filteredGyms.length} ${isRu ? 'залов' : 'gyms'}`}
      fallbackPath="/discover"
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      showHero={false}
      showSearch={false}
      showFilter={false}
    >
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredGyms.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title={isRu ? 'Залы не найдены' : 'No gyms found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredGyms.map(gym => (
            <CatalogCard key={gym.id} {...mapGymToCatalogCard(gym, language, navigate)} />
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
