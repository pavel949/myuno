/**
 * ContextualRecommendations — shows LifeOS-aware picks when a life situation is active.
 * Falls back to popular picks for anonymous / no-context users.
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLifeSituationContext } from '@/contexts/LifeSituationContext';
import { useRecommendations } from '@/hooks/useRecommendations';
import { SectionHeader } from '@/components/ds';
import { Surface } from '@/components/ui/surface';
import { ChevronRight, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { DEFAULT_IMAGES } from '@/lib/config/defaults';
/** Map entity_type → route prefix */
const ENTITY_ROUTES: Record<string, string> = {
  experience: '/experiences',
  yacht: '/yachts',
  restaurant: '/restaurants',
  property: '/properties',
  event: '/events',
  water_activity: '/water-activities',
  clinic: '/medical',
  salon: '/beauty',
  gym: '/fitness',
  legal_service: '/legal',
  education: '/education',
  cleaning: '/services',
  babysitter: '/babysitters',
  pet_service: '/pets',
  flower_shop: '/flowers',
  insurance: '/insurance',
  airport_service: '/airport',
  vehicle: '/transport',
  bouquet: '/flowers',
  bank: '/services',
};

export const ContextualRecommendations = memo(function ContextualRecommendations() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { activeCode, activeTitle } = useLifeSituationContext();
  const { recommendations, isLoading, isContextual } = useRecommendations();

  if (isLoading || recommendations.length === 0) return null;

  const title = isContextual && activeTitle
    ? (isRu ? `Для вас: ${activeTitle}` : `For you: ${activeTitle}`)
    : (isRu ? 'Популярное' : 'Popular');

  const subtitle = isContextual
    ? (isRu ? 'Подобрано по вашей ситуации' : 'Based on your situation')
    : (isRu ? 'Топ сервисы Пхукета' : 'Top Phuket services');

  const Icon = isContextual ? Sparkles : TrendingUp;

  const handleTap = (item: typeof recommendations[0]) => {
    triggerHaptic('light');
    const route = ENTITY_ROUTES[item.item_type];
    if (route) {
      navigate(`${route}/${item.id}`);
    }
  };

  // Show max 6 items in a horizontal scroll
  const visible = recommendations.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <SectionHeader title={title} subtitle={subtitle} size="sm" />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {visible.map((item) => {
          const displayTitle = isRu ? item.title_ru : item.title_en;
          return (
            <button
              key={`${item.item_type}-${item.id}`}
              onClick={() => handleTap(item)}
              className={cn(
                'flex-shrink-0 w-[160px] snap-start',
                'rounded-2xl bg-card border border-border/50',
                'hover:border-primary/30 active:scale-[0.98]',
                'transition-all touch-manipulation text-left overflow-hidden',
              )}
            >
              {/* Image */}
              <div className="h-24 bg-muted overflow-hidden">
                <img
                  src={item.image || DEFAULT_IMAGES.service}
                  alt={displayTitle}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_IMAGES.service;
                  }}
                />
              </div>
              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                  {displayTitle}
                </p>
                {item.price > 0 && (
                  <p className="text-xs text-primary font-semibold">
                    ฿{item.price.toLocaleString()}
                  </p>
                )}
                {item.location && (
                  <p className="text-xs text-muted-foreground truncate">{item.location}</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Link to LifeFlow page when contextual */}
      {isContextual && activeCode && (
        <button
          onClick={() => { triggerHaptic('light'); navigate(`/life/${activeCode}`); }}
          className="flex items-center gap-1.5 text-xs text-primary font-medium active:opacity-70 transition-opacity"
        >
          {isRu ? 'Все рекомендации' : 'All recommendations'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});
