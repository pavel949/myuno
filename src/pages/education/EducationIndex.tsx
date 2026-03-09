/**
 * EducationIndex — Airbnb-style education catalog
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Star, User, Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEducationProviders } from '@/hooks/useEducation';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

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

  const categories = CATEGORIES.map(c => ({ id: c.id, label: isRu ? c.labelRu : c.labelEn }));

  return (
    <AppLayout showHeader={false} showBottomNav>
      <CatalogHeader
        title={isRu ? 'Образование' : 'Education'}
        subtitle={`${providers.length} ${isRu ? 'провайдеров' : 'providers'}`}
        fallbackPath="/discover"
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <div className="max-w-[1536px] mx-auto px-4 py-4 pb-24">
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
            {providers.map(provider => {
              const name = isRu ? provider.name_ru : provider.name_en;
              const isSchool = provider.provider_type === 'school';
              return (
                <div
                  key={provider.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/education/${provider.id}`)}
                >
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={provider.cover_image || PLACEHOLDER_IMAGES.education}
                      alt={name}
                      width={400}
                      height={300}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      quality={80}
                    />
                    <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px]">
                      {isSchool ? <Building2 className="w-3 h-3 mr-0.5" /> : <User className="w-3 h-3 mr-0.5" />}
                      {isSchool ? (isRu ? 'Школа' : 'School') : (isRu ? 'Репетитор' : 'Tutor')}
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
                    <p className="text-sm font-semibold">
                      {provider.price_per_hour ? `${formatPrice(provider.price_per_hour)}/${isRu ? 'ч' : 'hr'}` : ''}
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
