/**
 * FitnessIndex — Airbnb-style fitness & gyms catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Star, MapPin, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useGyms } from '@/hooks/useGyms';
import { cn } from '@/lib/utils';

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
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const { gyms, isLoading } = useGyms();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isRu = language === 'ru';

  const filteredGyms = useMemo(() => {
    return gyms.filter(gym => {
      if (selectedCategory !== 'all' && gym.gym_type !== selectedCategory) return false;
      if (searchQuery) {
        const name = isRu ? gym.name_ru : gym.name_en;
        if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    });
  }, [gyms, selectedCategory, searchQuery, isRu]);

  const getPriceLabel = (gym: typeof gyms[0]) => {
    if (gym.price_day_pass) return `${formatPrice(gym.price_day_pass)}/${isRu ? 'день' : 'day'}`;
    if (gym.price_month_pass) return `${formatPrice(gym.price_month_pass)}/${isRu ? 'мес' : 'mo'}`;
    return '';
  };

  return (
    <AppLayout showHeader={false} showBottomNav>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Фитнес и Спорт' : 'Fitness & Sports'}</h1>
            <p className="text-xs text-muted-foreground">{filteredGyms.length} {isRu ? 'залов' : 'gyms'}</p>
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
        ) : filteredGyms.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title={isRu ? 'Залы не найдены' : 'No gyms found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGyms.map(gym => {
              const name = isRu ? gym.name_ru : gym.name_en;
              const price = getPriceLabel(gym);
              return (
                <div
                  key={gym.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/fitness/gym/${gym.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={gym.cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    {gym.is_verified && (
                      <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                        {isRu ? 'Проверено' : 'Verified'}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {gym.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {gym.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {gym.amenities?.length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {gym.amenities.slice(0, 3).join(' · ')}
                      </p>
                    )}
                    {gym.district && (
                      <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {gym.district}
                      </p>
                    )}
                    {price && <p className="text-sm font-semibold">{price}</p>}
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
