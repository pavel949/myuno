import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PLACEHOLDER_IMAGES, getServiceFallbackImage } from '@/lib/config/placeholders';
import { useSectionReveal } from '@/hooks/useScrollBehavior';

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

function getServiceImage(service: ServiceItem): string {
  if (service.images?.[0]) return service.images[0];
  return getServiceFallbackImage(service.name_en);
}

export function PopularServicesStrip() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const sectionRef = useSectionReveal<HTMLDivElement>();

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
            <Skeleton key={i} className="h-[190px] w-[150px] md:h-[220px] md:w-[180px] rounded-none shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (services.length === 0) return null;

  return (
    <div ref={sectionRef} className="section-reveal">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-bold text-foreground">
          {isRu ? 'Популярное' : 'Popular'}
        </h2>
        <button
          onClick={() => navigate('/discover')}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors min-h-[44px]"
        >
          {isRu ? 'Все' : 'View all'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="carousel-scroll gap-3 -mx-4 px-4">
        {services.map(service => {
          const imageUrl = getServiceImage(service);
          return (
            <button
              key={service.id}
              onClick={() => navigate(`/services/${service.id}`)}
              className="w-[150px] h-[190px] md:w-[180px] md:h-[220px] rounded-none overflow-hidden text-left group transition-all duration-200 hover:-translate-y-1 active:scale-[0.97]"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(0 0% 100% / 0.07)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="relative overflow-hidden">
                <img
                  src={imageUrl}
                  alt={isRu ? service.name_ru : service.name_en}
                  className="w-full h-24 md:h-28 object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-[13px] font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {isRu ? service.name_ru : service.name_en}
                </p>
                {service.price && (
                  <span className="text-xs text-primary mt-1 block font-semibold">
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
