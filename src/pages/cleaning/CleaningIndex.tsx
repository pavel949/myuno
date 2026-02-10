/**
 * CleaningIndex — Airbnb-style cleaning & laundry catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCleaningServices } from '@/hooks/useCleaningServices';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

const SERVICE_TYPES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'home', labelEn: 'Home', labelRu: 'Дом' },
  { id: 'laundry', labelEn: 'Laundry', labelRu: 'Прачечная' },
  { id: 'office', labelEn: 'Office', labelRu: 'Офис' },
  { id: 'deep', labelEn: 'Deep Clean', labelRu: 'Генеральная' },
];

export default function CleaningIndex() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('all');
  const isRu = language === 'ru';

  const { services, isLoading } = useCleaningServices(selectedType === 'all' ? undefined : selectedType);

  return (
    <AppLayout showHeader={false} showBottomNav>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Уборка и прачечная' : 'Cleaning & Laundry'}</h1>
            <p className="text-xs text-muted-foreground">{services.length} {isRu ? 'услуг' : 'services'}</p>
          </div>
        </div>

        {/* Category ribbon */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5 flex gap-2 overflow-x-auto scrollbar-hide">
          {SERVICE_TYPES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border",
                selectedType === cat.id
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
        ) : services.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={isRu ? 'Услуги не найдены' : 'No services found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map(service => {
              const name = isRu ? service.name_ru : service.name_en;
              const price = service.price_fixed || service.price_per_hour || 0;
              return (
                <div
                  key={service.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/cleaning/${service.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={service.cover_image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'}
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
                    {service.duration_hours && (
                      <p className="text-xs text-muted-foreground">
                        {service.duration_hours}h · {service.service_type}
                      </p>
                    )}
                    <p className="text-sm font-semibold">
                      {formatPrice(price)}{service.price_per_hour ? '/hr' : ''}
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
