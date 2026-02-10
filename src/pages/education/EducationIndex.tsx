/**
 * EducationIndex — Airbnb-style education catalog
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Star, User, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEducationProviders } from '@/hooks/useEducation';
import { AppLayout } from '@/components/layout/AppLayout';
import { BackButton } from '@/components/uno/BackButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'tutor', labelEn: 'Tutors', labelRu: 'Репетиторы' },
  { id: 'school', labelEn: 'Schools', labelRu: 'Школы' },
];

export default function EducationIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const isRu = language === 'ru';

  const { providers, isLoading } = useEducationProviders(selectedCategory === 'all' ? undefined : selectedCategory);

  return (
    <AppLayout showHeader={false} showBottomNav>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <BackButton fallbackPath="/discover" variant="ghost" size="sm" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{isRu ? 'Образование' : 'Education'}</h1>
            <p className="text-xs text-muted-foreground">{providers.length} {isRu ? 'провайдеров' : 'providers'}</p>
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
        ) : providers.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={isRu ? 'Не найдено' : 'No providers found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {providers.map(provider => {
              const name = isRu ? provider.name_ru : provider.name_en;
              const desc = isRu ? provider.description_ru : provider.description_en;
              const price = provider.price_per_hour || provider.price_per_course || 0;
              const isTutor = provider.entity_type === 'individual' || provider.provider_type === 'tutor';
              return (
                <div
                  key={provider.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(isTutor ? `/education/tutor/${provider.id}` : `/education/course/${provider.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={provider.cover_image || 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400'}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
                      {isTutor
                        ? (isRu ? 'Репетитор' : 'Tutor')
                        : (isRu ? 'Школа' : 'School')
                      }
                    </Badge>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-semibold text-sm truncate">{name}</h3>
                      {(provider.rating ?? 0) > 0 && (
                        <span className="flex items-center gap-0.5 text-xs font-medium shrink-0">
                          <Star className="w-3 h-3 fill-foreground" />
                          {provider.rating?.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {(provider.subjects || []).length > 0 && (
                      <p className="text-xs text-muted-foreground truncate">
                        {provider.subjects!.slice(0, 3).join(' · ')}
                      </p>
                    )}
                    <p className="text-sm font-semibold">
                      {price > 0 ? `${formatPrice(price)}/${provider.price_per_hour ? (isRu ? 'час' : 'hr') : (isRu ? 'курс' : 'course')}` : ''}
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
