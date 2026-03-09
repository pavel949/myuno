/**
 * PetsIndex — Airbnb-style pet services catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Star, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePetServices } from '@/hooks/usePetServices';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';

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
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { services: petServices, isLoading } = usePetServices();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'all') return petServices;
    return petServices.filter(s => s.service_type === selectedCategory);
  }, [petServices, selectedCategory]);

  const categories = CATEGORIES.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }));

  return (
    <AppLayout showHeader={false} showBottomNav>
      <CatalogHeader
        title={isRu ? 'Питомцы' : 'Pets'}
        subtitle={`${filteredServices.length} ${isRu ? 'услуг' : 'services'}`}
        fallbackPath="/discover"
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Content */}
      <div className="max-w-[1536px] mx-auto px-4 py-4 pb-24">
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
            {filteredServices.map(service => {
              const name = isRu ? service.name_ru : service.name_en;
              return (
                <div
                  key={service.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/pets/${service.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={service.cover_image || PLACEHOLDER_IMAGES.pet}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {service.is_verified && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                        {isRu ? 'Проверено' : 'Verified'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {(service.rating ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {service.rating?.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {service.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {service.address}
                      </p>
                    )}
                    <p className="text-sm font-semibold">
                      {service.price_from ? `${isRu ? 'от' : 'from'} ${formatPrice(service.price_from)}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
