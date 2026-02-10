/**
 * ExperiencesIndex — Airbnb-style experiences catalog
 * Clean header, category ribbon, sort, responsive grid
 */
import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, SlidersHorizontal, Star, Clock, MapPin, Loader2, Waves } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CrossSellSection } from '@/components/crosssell';
import { useExperiences, formatDuration, ExperienceType, Experience } from '@/hooks/useExperiences';
import { useExperienceCategories } from '@/hooks/useExperienceCategories';
import { cn } from '@/lib/utils';

type ViewType = 'all' | 'tour' | 'activity';
type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { id: SortKey; labelEn: string; labelRu: string }[] = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'price_asc', labelEn: 'Price ↑', labelRu: 'Цена ↑' },
  { id: 'price_desc', labelEn: 'Price ↓', labelRu: 'Цена ↓' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'Рейтинг' },
];

function ExperienceCard({ experience, language }: { experience: Experience; language: string }) {
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const isTour = experience.experience_type === 'tour';

  return (
    <div
      className="cursor-pointer group"
      onClick={() => navigate(`/experiences/${experience.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
        <OptimizedImage
          src={experience.cover_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
          alt={isRu ? experience.title_ru : experience.title_en}
          width={400}
          height={300}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          quality={80}
        />
        <Badge className={cn(
          "absolute top-2 left-2 text-[10px]",
          isTour ? "bg-warning text-warning-foreground" : "bg-info text-info-foreground"
        )}>
          {isTour ? (isRu ? 'Тур' : 'Tour') : (isRu ? 'Активность' : 'Activity')}
        </Badge>
        {experience.is_featured && (
          <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px]">
            <Star className="w-3 h-3 mr-0.5 fill-current" />
            {isRu ? 'Топ' : 'Featured'}
          </Badge>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {experience.rating > 0 && (
              <>
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                <span className="font-medium text-foreground">{experience.rating.toFixed(1)}</span>
                <span>({experience.review_count})</span>
              </>
            )}
          </div>
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {formatDuration(experience.duration_minutes, language)}
          </span>
        </div>

        <h3 className="font-medium text-sm leading-tight line-clamp-2">
          {isRu ? experience.title_ru : experience.title_en}
        </h3>

        {experience.location_name && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{experience.location_name}</span>
          </p>
        )}

        <p className="text-sm font-semibold text-foreground">
          ฿{experience.price?.toLocaleString()}
          {experience.price_per && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              /{isRu ? 'чел' : 'person'}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function ExperiencesIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isRu = language === 'ru';

  const initialType = (searchParams.get('type') as ViewType) || 'all';
  const initialCategory = searchParams.get('category') || 'all';

  const [viewType, setViewType] = useState<ViewType>(initialType);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [showSort, setShowSort] = useState(false);

  const { experiences, isLoading } = useExperiences({
    type: viewType === 'all' ? undefined : viewType as ExperienceType,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });

  const experienceTypeForCategories = viewType === 'all' ? undefined : viewType as 'tour' | 'activity';
  const { data: dbCategories = [] } = useExperienceCategories(experienceTypeForCategories);

  const sorted = useMemo(() => {
    const list = [...experiences];
    switch (sortKey) {
      case 'price_asc': return list.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc': return list.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'rating': return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default: return list;
    }
  }, [experiences, sortKey]);

  const handleTypeChange = (type: ViewType) => {
    setViewType(type);
    const newParams = new URLSearchParams(searchParams);
    type === 'all' ? newParams.delete('type') : newParams.set('type', type);
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    cat === 'all' ? newParams.delete('category') : newParams.set('category', cat);
    setSearchParams(newParams);
  };

  return (
    <AppLayout showHeader={false} showBottomNav>
      <div className="min-h-screen bg-background">
        <CatalogHeader
          title={isRu ? 'Туры и активности' : 'Tours & Activities'}
          fallbackPath="/"
          actions={
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/map?vertical=experiences')}>
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">{isRu ? 'Карта' : 'Map'}</span>
            </Button>
          }
        >
          {/* Type toggle */}
          <div className="max-w-7xl mx-auto px-4 pb-2">
            <div className="flex gap-1 p-1 bg-muted/50 rounded-xl">
              {([
                { id: 'all', labelEn: 'All', labelRu: 'Все' },
                { id: 'tour', labelEn: 'Tours', labelRu: 'Туры', icon: Compass },
                { id: 'activity', labelEn: 'Activities', labelRu: 'Активности', icon: Waves },
              ] as const).map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                    viewType === type.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {'icon' in type && type.icon && <type.icon className="w-4 h-4" />}
                  {isRu ? type.labelRu : type.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Category ribbon */}
          {dbCategories.length > 0 && (
            <div className="max-w-7xl mx-auto px-4 pb-2.5">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    selectedCategory === 'all'
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary text-foreground border-border hover:border-foreground/30"
                  )}
                >
                  {isRu ? 'Все' : 'All'}
                </button>
                {dbCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                      selectedCategory === cat.slug
                        ? "bg-foreground text-background border-foreground"
                        : "bg-secondary text-foreground border-border hover:border-foreground/30"
                    )}
                  >
                    {isRu ? cat.name_ru : cat.name_en}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CatalogHeader>

        {/* Results count + sort */}
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sorted.length} {isRu ? 'впечатлений' : 'experiences'}
            </p>
            <div className="relative">
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => setShowSort(!showSort)}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isRu ? SORT_OPTIONS.find(s => s.id === sortKey)?.labelRu : SORT_OPTIONS.find(s => s.id === sortKey)?.labelEn}
              </Button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 z-20 bg-popover border rounded-xl shadow-lg py-1 min-w-[160px]">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      className={cn(
                        "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                        sortKey === opt.id && "text-primary font-medium"
                      )}
                      onClick={() => { setSortKey(opt.id); setShowSort(false); }}
                    >
                      {isRu ? opt.labelRu : opt.labelEn}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <main className="container max-w-7xl mx-auto px-4 pb-24">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[4/3] rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState
              icon={Compass}
              title={isRu ? 'Ничего не найдено' : 'No experiences found'}
              description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
              {sorted.map((exp) => (
                <ExperienceCard key={exp.id} experience={exp} language={language} />
              ))}
            </div>
          )}

          <CrossSellSection currentVertical="experiences" className="mt-8" />
        </main>
      </div>
    </AppLayout>
  );
}
