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
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

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

  return (
    <AppLayout showHeader={false} showBottomNav>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Питомцы' : 'Pets'}</h1>
            <p className="text-xs text-muted-foreground">{filteredServices.length} {isRu ? 'услуг' : 'services'}</p>
          </div>
        </div>

        {/* Category ribbon */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedCategory === cat.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-secondary text-foreground border-border hover:border-foreground/30"
              )}
            >
              {isRu ? cat.labelRu : cat.labelEn}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24">
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
                      src={service.cover_image || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'}
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
