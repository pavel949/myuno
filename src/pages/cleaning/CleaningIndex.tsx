/**
 * CleaningIndex — MiniAppLayout + CatalogCard
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCleaningServices } from '@/hooks/useCleaningServices';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { mapCleaningToCatalogCard } from '@/lib/adapters/catalogCardAdapters';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'home', labelEn: 'Home', labelRu: 'Дом' },
  { id: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная' },
  { id: 'office', labelEn: 'Office', labelRu: 'Офис' },
  { id: 'deep', labelEn: 'Deep Clean', labelRu: 'Генеральная' },
];

export default function CleaningIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('all');
  const isRu = language === 'ru';

  const { services, isLoading } = useCleaningServices(selectedType === 'all' ? undefined : selectedType);

  return (
    <MiniAppLayout
      title={isRu ? 'Уборка и прачечная' : 'Cleaning & Laundry'}
      subtitle={`${services.length} ${isRu ? 'услуг' : 'services'}`}
      fallbackPath="/discover"
      categories={CATEGORIES}
      selectedCategory={selectedType}
      onCategoryChange={setSelectedType}
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
      ) : services.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title={isRu ? 'Услуги не найдены' : 'No services found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {services.map(service => (
            <CatalogCard key={service.id} {...mapCleaningToCatalogCard(service, language, navigate)} />
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
