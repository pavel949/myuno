import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Star, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecommendations } from '@/hooks/useRecommendations';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const reasonIcons = {
  history: Clock,
  popular: TrendingUp,
  similar: Sparkles,
  new: Star,
};

const reasonLabels = {
  history: { en: 'Based on history', ru: 'На основе истории' },
  popular: { en: 'Popular', ru: 'Популярное' },
  similar: { en: 'Similar to viewed', ru: 'Похоже на просмотренное' },
  new: { en: 'New', ru: 'Новое' },
};

const typeRoutes: Record<string, string> = {
  tour: '/tours',
  property: '/property',
  event: '/events',
  water_activity: '/water',
  clinic: '/medical',
  gym: '/fitness',
  course: '/education',
  service: '/services/provider',
  salon: '/beauty/salon',
  restaurant: '/food/restaurant',
  pharmacy: '/pharmacy',
  legal: '/legal/provider',
  flower_shop: '/flowers/shop',
};

export function ForYouSection() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { recommendations, isLoading } = useRecommendations();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-semibold">
            {language === 'ru' ? 'Для вас' : 'For You'}
          </span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-64 bg-card rounded-2xl overflow-hidden border">
              <Skeleton className="h-36 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  const handleItemClick = (item: typeof recommendations[0]) => {
    const baseRoute = typeRoutes[item.item_type] || '/discover';
    navigate(`${baseRoute}/${item.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">
            {language === 'ru' ? 'Для вас' : 'For You'}
          </h2>
        </div>
        <button 
          onClick={() => navigate('/discover')}
          className="text-sm text-primary flex items-center gap-1"
        >
          {language === 'ru' ? 'Ещё' : 'More'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {recommendations.map((item) => {
          const ReasonIcon = reasonIcons[item.reason];
          const reasonLabel = reasonLabels[item.reason][language];
          
          return (
            <div
              key={`${item.item_type}-${item.id}`}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex-shrink-0 w-64 bg-card rounded-2xl overflow-hidden border",
                "hover:shadow-lg transition-all cursor-pointer group"
              )}
            >
              <div className="relative h-36">
                <img
                  src={item.image && item.image.trim() !== '' ? item.image : 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400';
                  }}
                />
                <Badge 
                  className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-foreground text-[10px] gap-1"
                  variant="secondary"
                >
                  <ReasonIcon className="w-3 h-3" />
                  {reasonLabel}
                </Badge>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1">
                  {language === 'ru' ? item.title_ru : item.title_en}
                </h3>
                {item.location && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.location}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {item.rating.toFixed(1)}
                  </div>
                  <p className="text-primary font-bold text-sm">
                    ฿{item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
