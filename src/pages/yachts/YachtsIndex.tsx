/**
 * YachtsIndex — Unified catalog using MiniAppLayout + CatalogCard
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ship, SlidersHorizontal, Zap } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { useYachts } from '@/hooks/useYachts';
import { mapYachtToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { cn } from '@/lib/utils';

type YachtTypeFilter = 'all' | 'motor_yacht' | 'catamaran' | 'speedboat' | 'superyacht';
type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'capacity';

const YACHT_TYPES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'motor_yacht', labelEn: 'Motor Yachts', labelRu: 'Моторные' },
  { id: 'catamaran', labelEn: 'Catamarans', labelRu: 'Катамараны' },
  { id: 'speedboat', labelEn: 'Speedboats', labelRu: 'Спидботы' },
  { id: 'superyacht', labelEn: 'Superyachts', labelRu: 'Суперяхты' },
];

const SORT_OPTIONS: { id: SortKey; labelEn: string; labelRu: string }[] = [
  { id: 'featured', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'price_asc', labelEn: 'Price ↑', labelRu: 'Цена ↑' },
  { id: 'price_desc', labelEn: 'Price ↓', labelRu: 'Цена ↓' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'Рейтинг' },
  { id: 'capacity', labelEn: 'Capacity', labelRu: 'Вместимость' },
];

export default function YachtsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const [typeFilter, setTypeFilter] = useState<YachtTypeFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('featured');
  const [showSort, setShowSort] = useState(false);
  const [instantOnly, setInstantOnly] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSort) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSort]);

  const { yachts, isLoading } = useYachts(typeFilter === 'all' ? undefined : typeFilter);

  const sorted = useMemo(() => {
    if (!yachts) return [];
    const list = [...yachts];
    switch (sortKey) {
      case 'price_asc':
        return list.sort((a, b) => {
          const pa = Math.min(...[a.price_half_day, a.price_full_day, a.price_sunset].filter(Boolean) as number[]);
          const pb = Math.min(...[b.price_half_day, b.price_full_day, b.price_sunset].filter(Boolean) as number[]);
          return pa - pb;
        });
      case 'price_desc':
        return list.sort((a, b) => {
          const pa = Math.max(...[a.price_full_day, a.price_overnight, a.price_half_day].filter(Boolean) as number[]);
          const pb = Math.max(...[b.price_full_day, b.price_overnight, b.price_half_day].filter(Boolean) as number[]);
          return pb - pa;
        });
      case 'rating': return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'capacity': return list.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
      default: return list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
  }, [yachts, sortKey]);

  const filtered = useMemo(() => {
    if (!instantOnly) return sorted;
    return sorted.filter(y => y.booking_flow === 'instant');
  }, [sorted, instantOnly]);

  return (
    <MiniAppLayout
      title={isRu ? 'Чартер яхт' : 'Boat Charters'}
      subtitle={`${filtered.length} ${isRu ? 'судов' : 'vessels'}`}
      fallbackPath="/"
      showSearch={false}
      showHero={false}
      categories={YACHT_TYPES}
      selectedCategory={typeFilter}
      onCategoryChange={(id) => setTypeFilter(id as YachtTypeFilter)}
      showFilter={false}
      stickySubHeader={
        <div className="px-4 py-2 flex items-center gap-2">
          <button
            onClick={() => setInstantOnly(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              instantOnly
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-foreground border-border hover:border-foreground/30"
            )}
          >
            <Zap className="w-3 h-3" />
            {isRu ? 'Мгновенное' : 'Instant'}
          </button>

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
        title={isRu ? 'Чартер яхт на Пхукете' : 'Yacht Charters in Phuket'}
        description={isRu
          ? 'Аренда яхт, катамаранов и спидботов на Пхукете. Лучшие цены и мгновенное бронирование.'
          : 'Rent yachts, catamarans, and speedboats in Phuket. Best prices and instant booking.'}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Ship}
          title={isRu ? 'Ничего не найдено' : 'No boats found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
          {filtered.map(yacht => (
            <CatalogCard key={yacht.id} {...mapYachtToCatalogCard(yacht, language, navigate)} />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="yachts" className="mt-8" />
    </MiniAppLayout>
  );
}
