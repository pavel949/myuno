/**
 * YachtsIndex — Airbnb-style yacht catalog
 * Clean header, type pills, sort, responsive grid
 */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, SlidersHorizontal, Star, Users, MapPin, Ship, Zap, Clock } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { CatalogHeader } from '@/components/shared/CatalogHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CrossSellSection } from '@/components/crosssell';
import { useYachts, Yacht } from '@/hooks/useYachts';
import { mapYachtToCardProps } from '@/lib/adapters/yachtAdapters';
import { cn } from '@/lib/utils';

type YachtTypeFilter = 'all' | 'motor_yacht' | 'catamaran' | 'speedboat' | 'superyacht';
type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'capacity';

const YACHT_TYPES: { id: YachtTypeFilter; labelEn: string; labelRu: string }[] = [
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

function YachtCard({ yacht, language }: { yacht: Yacht; language: string }) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const card = mapYachtToCardProps(yacht, language);
  const isRu = language === 'ru';

  return (
    <div
      className="cursor-pointer group"
      onClick={() => navigate(`/yachts/${yacht.id}`)}
    >
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-2">
        <OptimizedImage
          src={card.image}
          alt={card.title}
          width={400}
          height={300}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
          quality={80}
        />
        {card.badge && (
          <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px]">
            <Star className="w-3 h-3 mr-0.5 fill-current" />
            {card.badge.text}
          </Badge>
        )}
        {/* Booking flow badge */}
        <span className={cn(
          "absolute top-2 right-2 flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full",
          yacht.booking_flow === 'instant'
            ? "bg-success/90 text-white"
            : "bg-muted/90 text-foreground"
        )}>
          {yacht.booking_flow === 'instant'
            ? <><Zap className="w-2.5 h-2.5" />{isRu ? 'Сразу' : 'Instant'}</>
            : <><Clock className="w-2.5 h-2.5" />{isRu ? 'По запросу' : 'On request'}</>
          }
        </span>
        {card.experienceLabel && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
            <span className="text-white text-xs font-medium">{card.experienceLabel}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {card.rating && card.rating > 0 && (
            <>
              <span className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                <span className="font-medium text-foreground">{card.rating.toFixed(1)}</span>
                {card.reviewCount ? <span>({card.reviewCount})</span> : null}
              </span>
              <span>·</span>
            </>
          )}
          {card.meta.slice(0, 2).map((m, i) => (
            <span key={i} className="flex items-center gap-0.5">
              <m.icon className="w-3 h-3" />
              {m.label}
              {i < 1 && card.meta.length > 1 && <span className="ml-1">·</span>}
            </span>
          ))}
        </div>

        <h3 className="font-medium text-sm leading-tight line-clamp-2">{card.title}</h3>

        {card.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{card.location}</span>
          </p>
        )}

        <p className="text-sm font-semibold text-foreground">
          {card.price ? formatPrice(card.price) : ''}
          <span className="text-xs font-normal text-muted-foreground ml-1">{card.priceLabel}</span>
        </p>
      </div>
    </div>
  );
}

export default function YachtsIndex() {
  const { language } = useLanguage();
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
      case 'rating':
        return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'capacity':
        return list.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
      default:
        return list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
  }, [yachts, sortKey]);

  const filtered = useMemo(() => {
    if (!instantOnly) return sorted;
    return sorted.filter(y => y.booking_flow === 'instant');
  }, [sorted, instantOnly]);

  return (
    <AppLayout showHeader={false} showBottomNav>
      <SEOHead
        title={isRu ? 'Чартер яхт на Пхукете' : 'Yacht Charters in Phuket'}
        description={isRu
          ? 'Аренда яхт, катамаранов и спидботов на Пхукете. Лучшие цены и мгновенное бронирование.'
          : 'Rent yachts, catamarans, and speedboats in Phuket. Best prices and instant booking.'}
      />
      <div className="min-h-screen bg-background">
        <CatalogHeader
          title={isRu ? 'Чартер яхт' : 'Boat Charters'}
          fallbackPath="/"
          categories={YACHT_TYPES.map(t => ({ id: t.id, label: isRu ? t.labelRu : t.labelEn }))}
          selectedCategory={typeFilter}
          onCategoryChange={(id) => setTypeFilter(id as YachtTypeFilter)}
        >
          <div className="max-w-[1536px] mx-auto px-4 pb-2.5 flex items-center gap-2">
            <button
              onClick={() => setInstantOnly(v => !v)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                instantOnly
                  ? "bg-white text-[hsl(var(--icon-dark))] border-white"
                  : "bg-white/15 text-white border-white/20 hover:bg-white/25"
              )}
            >
              <Zap className="w-3 h-3" />
              {isRu ? 'Мгновенное бронирование' : 'Instant Booking'}
            </button>
          </div>
        </CatalogHeader>

        {/* Count + sort */}
        <div className="container max-w-[1536px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} {isRu ? 'судов' : 'vessels'}
            </p>
            <div className="relative" ref={sortRef}>
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
        <main className="container max-w-[1536px] mx-auto px-4 pb-24">
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
                <YachtCard key={yacht.id} yacht={yacht} language={language} />
              ))}
            </div>
          )}

          <CrossSellSection currentVertical="yachts" className="mt-8" />
        </main>
      </div>
    </AppLayout>
  );
}
