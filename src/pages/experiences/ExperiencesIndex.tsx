/**
 * ExperiencesIndex — Unified catalog using MiniAppLayout + CatalogCard
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, SlidersHorizontal, Waves, MapPin } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { PropertyTourPromo } from '@/components/experiences/PropertyTourPromo';
import { useExperiences, ExperienceType } from '@/hooks/useExperiences';
import { useExperienceCategories } from '@/hooks/useExperienceCategories';
import { mapExperienceToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { cn } from '@/lib/utils';

type ViewType = 'all' | 'tour' | 'activity';
type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating';

const SORT_OPTIONS: { id: SortKey; labelEn: string; labelRu: string }[] = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'price_asc', labelEn: 'Price ↑', labelRu: 'Цена ↑' },
  { id: 'price_desc', labelEn: 'Price ↓', labelRu: 'Цена ↓' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'Рейтинг' },
];

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
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSort]);

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
    if (type === 'all') { newParams.delete('type'); } else { newParams.set('type', type); }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'all') { newParams.delete('category'); } else { newParams.set('category', cat); }
    setSearchParams(newParams);
  };

  // Build categories from DB
  const categoryItems = [
    { id: 'all', labelEn: 'All', labelRu: 'Все' },
    ...dbCategories.map(c => ({ id: c.slug, labelEn: c.name_en, labelRu: c.name_ru })),
  ];

  return (
    <MiniAppLayout
      title={isRu ? 'Туры и активности' : 'Tours & Activities'}
      subtitle={`${sorted.length} ${isRu ? 'впечатлений' : 'experiences'}`}
      fallbackPath="/"
      showSearch={false}
      showHero={false}
      categories={categoryItems}
      selectedCategory={selectedCategory}
      onCategoryChange={handleCategoryChange}
      showFilter={false}
      headerActions={
        <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={() => navigate('/map?vertical=experiences')}>
          <MapPin className="w-4 h-4" />
        </Button>
      }
      stickySubHeader={
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-y">
          {/* Type toggle */}
          <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg shrink-0">
            {([
              { id: 'all', labelEn: 'All', labelRu: 'Все' },
              { id: 'tour', labelEn: 'Tours', labelRu: 'Туры', icon: Compass },
              { id: 'activity', labelEn: 'Activities', labelRu: 'Активности', icon: Waves },
            ] as const).map((type) => (
              <button
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={cn(
                  "py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                  viewType === type.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {'icon' in type && type.icon && <type.icon className="w-3.5 h-3.5" />}
                {isRu ? type.labelRu : type.labelEn}
              </button>
            ))}
          </div>

          <div className="ml-auto relative" ref={sortRef}>
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
      }
    >
      <SEOHead
        title={isRu ? 'Туры и экскурсии на Пхукете' : 'Tours & Experiences in Phuket'}
        description={isRu
          ? 'Лучшие туры, экскурсии и активности на Пхукете.'
          : 'Best tours, excursions, and activities in Phuket.'}
      />

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
          {sorted.map(exp => (
            <CatalogCard key={exp.id} {...mapExperienceToCatalogCard(exp, language, navigate)} />
          ))}
        </div>
      )}

      <div className="mt-6"><PropertyTourPromo /></div>
      <CrossSellSection currentVertical="experiences" className="mt-8" />
    </MiniAppLayout>
  );
}
