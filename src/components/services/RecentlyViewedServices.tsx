import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { UnifiedSectionHeader, UnifiedScrollSection } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecentService {
  id: string;
  name_en: string;
  name_ru: string;
  price: number | null;
  image: string | null;
  provider_id: string;
  provider_name: string;
}

export function RecentlyViewedServices() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { items: recentServices, clearAll, hasHistory } = useRecentlyViewed<RecentService>('myuno_recently_viewed_services');
  const isRu = language === 'ru';

  if (!hasHistory) return null;

  return (
    <section className="py-3">
      <div className="px-4 max-w-[1536px] mx-auto flex items-center justify-between mb-2">
        <UnifiedSectionHeader
          icon={Eye}
          iconColor="text-muted-foreground"
          title={isRu ? 'Недавно смотрели' : 'Recently Viewed'}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          <X className="w-3 h-3 mr-1" />
          {isRu ? 'Очистить' : 'Clear'}
        </Button>
      </div>

      <UnifiedScrollSection>
        {recentServices.map((service) => (
          <button
            key={service.id}
            onClick={() => navigate(`/services/provider/${service.provider_id}?service=${service.id}`)}
            className={cn(
              "w-[120px] shrink-0 text-left",
              "bg-card rounded-none border border-border overflow-hidden",
              "shadow-sm hover:shadow-md hover:-translate-y-0.5",
              "transition-all duration-200 group touch-manipulation"
            )}
          >
            <div className="aspect-square relative overflow-hidden">
              <img
                src={service.image || '/placeholder.svg'}
                alt=""
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              />
            </div>
            <div className="p-2">
              <h4 className="text-xs font-medium line-clamp-2 text-foreground leading-tight min-h-[2rem]">
                {isRu ? service.name_ru : service.name_en}
              </h4>
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {service.provider_name}
              </p>
              {service.price && (
                <p className="text-sm font-bold text-primary mt-1">
                  {formatPrice(service.price)}
                </p>
              )}
            </div>
          </button>
        ))}
      </UnifiedScrollSection>
    </section>
  );
}
