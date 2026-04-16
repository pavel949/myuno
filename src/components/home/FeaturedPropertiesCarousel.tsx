/**
 * FeaturedPropertiesCarousel — mobile-optimized with carousel-scroll
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Bed, Users, ChevronRight, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getDistrictLabel } from '@/lib/taxonomies';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';
import { APP_ROUTES } from '@/lib/config/routes';

interface FeaturedProperty {
  id: string;
  title_en: string;
  title_ru: string;
  cover_image: string | null;
  images: string[] | null;
  price: number | null;
  price_per_night: number | null;
  price_period: string | null;
  district: string | null;
  bedrooms: number | null;
  max_guests: number | null;
  rating: number | null;
  is_featured: boolean | null;
  instant_booking: boolean | null;
  property_type: string | null;
}

export function FeaturedPropertiesCarousel() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const { data: properties = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['featured-properties-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image, images, price, price_per_night, price_period, district, bedrooms, max_guests, rating, is_featured, instant_booking, property_type')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(10);

      if (error) throw error;
      return ((data || []) as unknown as FeaturedProperty[]).filter(
        p => (p.price_per_night || p.price) && (p.cover_image || p.images?.[0])
      );
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[280px] w-[220px] md:h-72 md:w-60 rounded-[var(--radius-lg)] shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-display font-bold text-foreground">
            {isRu ? 'Аренда на Пхукете' : 'Rent in Phuket'}
          </h2>
          <button
            onClick={() => navigate('/property?mode=rent')}
            className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors min-h-[44px]"
          >
            {isRu ? 'Все объекты' : 'View all'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-3 -mx-4 px-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-[220px] h-[280px] md:w-[260px] md:h-[320px] rounded-[var(--radius-lg)] shrink-0 flex flex-col items-center justify-center gap-2"
              style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
            >
              <span className="text-3xl">🏠</span>
              <span className="text-xs text-muted-foreground text-center px-4">
                {isRu ? 'Скоро здесь появятся объекты' : 'Listings coming soon'}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-bold text-foreground">
          {isRu ? 'Аренда на Пхукете' : 'Rent in Phuket'}
        </h2>
        <button
          onClick={() => navigate('/property?mode=rent')}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors min-h-[44px]"
        >
          {isRu ? 'Все объекты' : 'View all'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="carousel-scroll gap-3 -mx-4 px-4">
        {properties.map((property, i) => {
          const image = property.cover_image || property.images?.[0] || PLACEHOLDER_IMAGES.property;
          const unitPrice = property.price_per_night || property.price || 0;
          const district = property.district
            ? getDistrictLabel(property.district, isRu ? 'ru' : 'en')
            : 'Phuket';

          return (
            <button
              key={property.id}
              onClick={() => navigate(APP_ROUTES.PROPERTY_DETAIL(property.id))}
              className="w-[220px] h-[280px] md:w-[260px] md:h-[320px] rounded-[var(--radius-lg)] overflow-hidden text-left group transition-all duration-200 hover:-translate-y-1 active:scale-[0.97]"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                boxShadow: 'var(--shadow-card)',
                animationDelay: `${0.25 + i * 0.05}s`,
              }}
            >
              {/* Image */}
              <div className="relative h-[60%] overflow-hidden">
                <img
                  src={image}
                  alt={isRu ? property.title_ru : property.title_en}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {property.is_featured && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-[var(--radius-full)] backdrop-blur-sm"
                      style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                    >
                      {isRu ? '⭐ Популярное' : '⭐ Popular'}
                    </span>
                  )}
                  {property.instant_booking && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-[var(--radius-full)] flex items-center gap-0.5 bg-warning text-primary-foreground">
                      <Zap className="w-2.5 h-2.5" />
                      Instant
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="h-[40%] p-3 md:p-4 flex flex-col justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold rounded-[var(--radius-full)] mb-1.5"
                    style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}
                  >
                    {district}
                  </span>
                  <p className="text-sm font-medium text-foreground line-clamp-1">
                    {isRu ? property.title_ru : property.title_en}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                    {property.bedrooms != null && property.bedrooms > 0 && (
                      <span className="flex items-center gap-0.5"><Bed className="w-3 h-3" /> {property.bedrooms}</span>
                    )}
                    {property.max_guests != null && property.max_guests > 0 && (
                      <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {property.max_guests}</span>
                    )}
                    {property.rating != null && property.rating > 0 && (
                      <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-warning text-warning" /> {property.rating.toFixed(1)}</span>
                    )}
                  </div>
                </div>

                <p className="text-base md:text-lg font-bold font-display text-primary">
                  {formatPrice(unitPrice)}
                  <span className="font-normal text-muted-foreground text-xs ml-1">
                    /{isRu ? 'ночь' : 'night'}
                  </span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
