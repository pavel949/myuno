/**
 * BeautySpaIndex — Airbnb-style beauty & spa catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scissors, Star, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useSalons } from '@/hooks/useSalons';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

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
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { salons, isLoading } = useSalons(selectedCategory === 'all' ? undefined : selectedCategory);

  const categories = CATEGORIES.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }));

  return (
    <AppLayout showHeader={false} showBottomNav>
      <CatalogHeader
        title={isRu ? 'Красота и СПА' : 'Beauty & Spa'}
        subtitle={`${salons.length} ${isRu ? 'салонов' : 'salons'}`}
        fallbackPath="/discover"
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

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
        ) : salons.length === 0 ? (
          <EmptyState
            icon={Scissors}
            title={isRu ? 'Салоны не найдены' : 'No salons found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {salons.map(salon => {
              const name = isRu ? salon.name_ru : salon.name_en;
              return (
                <div
                  key={salon.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/beauty/${salon.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={salon.cover_image || PLACEHOLDER_IMAGES.salon}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {salon.is_verified && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                        {isRu ? 'Проверено' : 'Verified'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {(salon.rating ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {salon.rating?.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {salon.address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {salon.address}
                      </p>
                    )}
                    <p className="text-sm font-semibold">
                      {salon.price_from ? `${isRu ? 'от' : 'from'} ${formatPrice(salon.price_from)}` : ''}
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
