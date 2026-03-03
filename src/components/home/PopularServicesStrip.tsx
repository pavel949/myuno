import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SectionTitle } from '@/components/uno/SectionCard';
import { ChevronRight } from 'lucide-react';
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

const SERVICE_FALLBACK_IMAGES: Record<string, string> = {
  clean: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400',
  electr: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400',
  plumb: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  pipe: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  drain: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  garden: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
  pool: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=400',
  beauty: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  spa: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
  massage: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400',
  fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
  repair: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
  renovat: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400',
  inspect: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
  ac: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400',
  water: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
  leak: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400',
};
const FALLBACK_DEFAULT = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400';

function getServiceImage(service: ServiceItem): string {
  if (service.images?.[0]) return service.images[0];
  const name = service.name_en.toLowerCase();
  for (const [key, url] of Object.entries(SERVICE_FALLBACK_IMAGES)) {
    if (name.includes(key)) return url;
  }
  return FALLBACK_DEFAULT;
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
            <Skeleton key={i} className="h-36 w-44 rounded-2xl shrink-0" />
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
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
        >
          {isRu ? 'Все' : 'View all'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {services.map(service => {
          const imageUrl = getServiceImage(service);
          return (
            <button
              key={service.id}
              onClick={() => navigate(`/services/${service.id}`)}
              className="shrink-0 w-44 rounded-2xl border border-border/50 bg-card overflow-hidden text-left shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="relative overflow-hidden">
                <img
                  src={imageUrl}
                  alt={isRu ? service.name_ru : service.name_en}
                  className="w-full h-24 object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {isRu ? service.name_ru : service.name_en}
                </p>
                {service.price && (
                  <span className="text-xs text-muted-foreground mt-1 block font-medium">
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
