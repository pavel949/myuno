/**
 * EducationIndex — MiniAppLayout + CatalogCard
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEducationProviders } from '@/hooks/useEducation';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { mapEducationToCatalogCard } from '@/lib/adapters/catalogCardAdapters';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'tutor', labelEn: 'Tutors', labelRu: 'Репетиторы' },
  { id: 'school', labelEn: 'Schools', labelRu: 'Школы' },
];

export default function EducationIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { providers, isLoading } = useEducationProviders(selectedCategory === 'all' ? undefined : selectedCategory);

  return (
    <MiniAppLayout
      title={isRu ? 'Образование' : 'Education'}
      subtitle={isRu ? `Найдено: ${providers.length}` : `${providers.length} results`}
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
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : providers.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={isRu ? 'Провайдеры не найдены' : 'No providers found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {providers.map(provider => (
            <CatalogCard key={provider.id} {...mapEducationToCatalogCard(provider, language, navigate)} />
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
