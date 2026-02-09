import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Star, Users, Clock, Ruler, MapPin, Ship, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconBadge } from '@/components/ui/IconBadge';
import { EmptyState } from '@/components/uno/EmptyState';
import { useYachts, Yacht } from '@/hooks/useYachts';
import { mapYachtToCardProps } from '@/lib/adapters/yachtAdapters';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CrossSellSection } from '@/components/crosssell';
import { cn } from '@/lib/utils';

type YachtTypeFilter = 'all' | 'motor_yacht' | 'catamaran' | 'speedboat' | 'superyacht';
type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'capacity';

const YACHT_TYPES: { id: YachtTypeFilter; labelEn: string; labelRu: string; icon?: string }[] = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'motor_yacht', labelEn: 'Motor Yachts', labelRu: 'Моторные', icon: '🚤' },
  { id: 'catamaran', labelEn: 'Catamarans', labelRu: 'Катамараны', icon: '⛵' },
  { id: 'speedboat', labelEn: 'Speedboats', labelRu: 'Спидботы', icon: '🏎️' },
  { id: 'superyacht', labelEn: 'Superyachts', labelRu: 'Суперяхты', icon: '💎' },
];

const SORT_OPTIONS: { id: SortOption; labelEn: string; labelRu: string }[] = [
  { id: 'featured', labelEn: 'Featured', labelRu: 'Рекомендуемые' },
  { id: 'price_asc', labelEn: 'Price ↑', labelRu: 'Цена ↑' },
  { id: 'price_desc', labelEn: 'Price ↓', labelRu: 'Цена ↓' },
  { id: 'rating', labelEn: 'Rating', labelRu: 'Рейтинг' },
  { id: 'capacity', labelEn: 'Capacity', labelRu: 'Вместимость' },
];

const YachtCard = React.memo(({ yacht, language }: { yacht: Yacht; language: string }) => {
  const navigate = useNavigate();
  const card = mapYachtToCardProps(yacht, language);
  const isRu = language === 'ru';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card rounded-2xl overflow-hidden border hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
      onClick={() => navigate(`/yachts/${yacht.id}`)}
    >
      <div className="relative h-48 overflow-hidden">
        <OptimizedImage
          src={card.image}
          alt={card.title}
          width={400}
          height={192}
          className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
          quality={80}
        />

        {card.badge && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-warning to-primary text-primary-foreground text-xs">
            <Star className="w-3 h-3 mr-1 fill-current" />
            {card.badge.text}
          </Badge>
        )}

        {card.isVerified && (
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs">
            ✓ {isRu ? 'Проверено' : 'Verified'}
          </Badge>
        )}

        {card.experienceLabel && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
            <span className="text-white text-sm font-medium">{card.experienceLabel}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-base line-clamp-1 mb-1">{card.title}</h3>
        {card.subtitle && (
          <p className="text-xs text-muted-foreground mb-2">{card.subtitle}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
          {card.rating && card.rating > 0 && (
            <>
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                {card.rating.toFixed(1)}
                {card.reviewCount ? <span className="text-xs">({card.reviewCount})</span> : null}
              </span>
              <span>•</span>
            </>
          )}
          {card.meta.slice(0, 3).map((m, i) => (
            <span key={i} className="flex items-center gap-1">
              <m.icon className="w-3.5 h-3.5" />
              {m.label}
              {i < Math.min(card.meta.length, 3) - 1 && <span className="ml-1">•</span>}
            </span>
          ))}
        </div>

        {card.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{card.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <p className="text-primary font-bold text-lg">
            {card.currency}{card.price?.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground ml-1">
              {card.priceLabel}
            </span>
          </p>
          <Button size="sm" variant="outline" className="text-xs">
            {isRu ? 'Подробнее' : 'Details'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

YachtCard.displayName = 'YachtCard';

export default function YachtsIndex() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [typeFilter, setTypeFilter] = useState<YachtTypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [showSort, setShowSort] = useState(false);

  const { yachts, isLoading } = useYachts(typeFilter === 'all' ? undefined : typeFilter);

  const sorted = useMemo(() => {
    if (!yachts) return [];
    const list = [...yachts];
    switch (sortBy) {
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
      case 'featured':
      default:
        return list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }
  }, [yachts, sortBy]);

  const typeCounts = useMemo(() => {
    if (!yachts) return {};
    const counts: Record<string, number> = { all: yachts.length };
    yachts.forEach(y => {
      counts[y.yacht_type] = (counts[y.yacht_type] || 0) + 1;
    });
    return counts;
  }, [yachts]);

  return (
    <MiniAppLayout
      title={isRu ? 'Чартер' : 'Boat Charters'}
      fallbackPath="/"
      showHero={false}
      showFilter={false}
      showCategories={false}
    >
      <div className="space-y-4 pb-24">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-info/10 to-accent/10 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <IconBadge icon={Anchor} size="lg" variant="gradient" className="w-12 h-12" />
            <div>
              <h1 className="font-bold text-xl">
                {isRu ? 'Чартер на Пхукете' : 'Phuket Boat Charters'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu
                  ? `${sorted.length} судов доступно`
                  : `${sorted.length} vessels available`}
              </p>
            </div>
          </div>

          {/* Type filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {YACHT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setTypeFilter(type.id)}
                className={cn(
                  "flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap",
                  typeFilter === type.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-background/50 text-muted-foreground hover:bg-background"
                )}
              >
                {type.icon && <span>{type.icon}</span>}
                {isRu ? type.labelRu : type.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Sort bar */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sorted.length} {isRu ? 'результатов' : 'results'}
          </p>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => setShowSort(!showSort)}
            >
              <Filter className="w-3.5 h-3.5" />
              {isRu
                ? SORT_OPTIONS.find(s => s.id === sortBy)?.labelRu
                : SORT_OPTIONS.find(s => s.id === sortBy)?.labelEn}
            </Button>
            {showSort && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-popover border rounded-xl shadow-lg py-1 min-w-[160px]">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                      sortBy === opt.id && "text-primary font-medium"
                    )}
                    onClick={() => { setSortBy(opt.id); setShowSort(false); }}
                  >
                    {isRu ? opt.labelRu : opt.labelEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-muted rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Ship}
            title={isRu ? 'Ничего не найдено' : 'No boats found'}
            description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {sorted.map(yacht => (
                <YachtCard key={yacht.id} yacht={yacht} language={language} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Cross-sell */}
        <CrossSellSection currentVertical="yachts" />
      </div>
    </MiniAppLayout>
  );
}
