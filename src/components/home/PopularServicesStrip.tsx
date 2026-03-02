import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SectionTitle } from '@/components/uno/SectionCard';
import { Star, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ServiceItem {
  id: string;
  name_en: string;
  name_ru: string;
  description_en: string | null;
  description_ru: string | null;
  price: number | null;
  currency: string | null;
  images: string[] | null;
}

export function PopularServicesStrip() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['popular-services-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name_en, name_ru, description_en, description_ru, price, currency, images')
        .eq('is_active', true)
        .limit(6);

      if (error) throw error;
      return (data || []) as ServiceItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-44 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle className="mb-0">
          {isRu ? 'Популярное на UNO' : 'Popular on UNO'}
        </SectionTitle>
        <button
          onClick={() => navigate('/discover')}
          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          {isRu ? 'Все' : 'View all'}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {services.map(service => {
          const imageUrl = service.images?.[0];
          return (
            <button
              key={service.id}
              onClick={() => navigate(`/services/${service.id}`)}
              className="shrink-0 w-44 rounded-xl border border-border bg-card overflow-hidden text-left hover:border-primary/30 transition-colors group"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={isRu ? service.name_ru : service.name_en}
                  className="w-full h-24 object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-24 bg-muted flex items-center justify-center">
                  <Star className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}
              <div className="p-2.5">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {isRu ? service.name_ru : service.name_en}
                </p>
                {service.price && (
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {service.price.toLocaleString()} {service.currency || '฿'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
