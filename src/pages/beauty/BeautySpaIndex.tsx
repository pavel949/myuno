/**
 * BeautySpaIndex — MiniAppLayout + CatalogCard
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSalons } from '@/hooks/useSalons';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { mapSalonToCatalogCard } from '@/lib/adapters/catalogCardAdapters';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'spa', labelEn: 'Spa', labelRu: 'Спа' },
  { id: 'massage', labelEn: 'Massage', labelRu: 'Массаж' },
  { id: 'beauty_salon', labelEn: 'Beauty', labelRu: 'Красота' },
  { id: 'hair_salon', labelEn: 'Hair', labelRu: 'Волосы' },
  { id: 'nail_salon', labelEn: 'Nails', labelRu: 'Ногти' },
  { id: 'barber', labelEn: 'Barber', labelRu: 'Барбер' },
];

export default function BeautySpaIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { salons, isLoading } = useSalons(selectedCategory === 'all' ? undefined : selectedCategory);

  return (
    <MiniAppLayout
      title={isRu ? 'Красота и СПА' : 'Beauty & Spa'}
      subtitle={`${salons.length} ${isRu ? 'салонов' : 'salons'}`}
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
      ) : salons.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title={isRu ? 'Салоны не найдены' : 'No salons found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {salons.map(salon => (
            <CatalogCard key={salon.id} {...mapSalonToCatalogCard(salon, language, navigate)} />
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
