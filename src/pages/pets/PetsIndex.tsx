/**
 * PetsIndex — Unified catalog using MiniAppLayout + CatalogCard
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePetServices } from '@/hooks/usePetServices';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { mapPetServiceToCatalogCard } from '@/lib/adapters/catalogCardAdapters';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'transport', labelEn: 'Transport', labelRu: 'Перевозка' },
  { id: 'veterinary', labelEn: 'Veterinary', labelRu: 'Ветеринария' },
  { id: 'hotel', labelEn: 'Hotels', labelRu: 'Гостиницы' },
  { id: 'grooming', labelEn: 'Grooming', labelRu: 'Груминг' },
  { id: 'training', labelEn: 'Training', labelRu: 'Дрессировка' },
];

export default function PetsIndex() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { services: petServices, isLoading } = usePetServices();
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'all');
  const isRu = language === 'ru';

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== selectedCategory) setSelectedCategory(cat);
  }, [searchParams]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return petServices;
    return petServices.filter(s => s.service_type === selectedCategory);
  }, [petServices, selectedCategory]);

  return (
    <MiniAppLayout
      title={isRu ? 'Питомцы' : 'Pets'}
      subtitle={`${filteredServices.length} ${isRu ? 'услуг' : 'services'}`}
      fallbackPath="/discover"
      showSearch={false}
      showHero={false}
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
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
      ) : filteredServices.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={isRu ? 'Услуги не найдены' : 'No services found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredServices.map(service => (
            <CatalogCard key={service.id} {...mapPetServiceToCatalogCard(service, language, navigate, formatPrice)} />
          ))}
        </div>
      )}
    </MiniAppLayout>
  );
}
