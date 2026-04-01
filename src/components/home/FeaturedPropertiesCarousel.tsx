/**
 * FeaturedPropertiesCarousel — Horizontal scroll of featured rental properties
 * Shows real pricing from properties table (price_per_night || price)
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Star, Bed, Users, ChevronRight, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionTitle } from '@/components/uno/SectionCard';
import { getDistrictLabel } from '@/lib/taxonomies';
import { cn } from '@/lib/utils';
import { PLACEHOLDER_IMAGES } from '@/lib/config/placeholders';

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

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['featured-properties-home'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, cover_image, images, price, price_per_night, price_period, district, bedrooms, max_guests, rating, is_featured, instant_booking, property_type')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .eq('listing_type', 'rent')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })
        .limit(10);

      if (error) throw error;
      // Only show properties with a price and image
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
            <Skeleton key={i} className="h-64 w-56 rounded-2xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (properties.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle className="mb-0">
          {isRu ? 'Аренда на Пхукете' : 'Rent in Phuket'}
        </SectionTitle>
        <button
          onClick={() => navigate('/property?mode=rent')}
          className="flex items-center gap-1 text-xs text-primary font-semibold hover:text-primary/80 transition-colors"
        >
          {isRu ? 'Все объекты' : 'View all'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory">
        {properties.map(property => {
          const image = property.cover_image || property.images?.[0] || PLACEHOLDER_IMAGES.property;
          const unitPrice = property.price_per_night || property.price || 0;
          const district = property.district
            ? getDistrictLabel(property.district, isRu ? 'ru' : 'en')
            : 'Phuket';

          return (
            <button
              key={property.id}
              onClick={() => navigate(`/property/${property.id}`)}
              className="shrink-0 w-56 sm:w-64 rounded-2xl border border-border/50 bg-card overflow-hidden text-left shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 transition-all duration-200 group snap-start"
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={image}
                  alt={isRu ? property.title_ru : property.title_en}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {property.is_featured && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-background/90 text-foreground backdrop-blur-sm">
                      {isRu ? '⭐ Популярное' : '⭐ Popular'}
                    </span>
                  )}
                  {property.instant_booking && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent-amber text-white flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      Instant
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {district}
                  </p>
                  {property.rating != null && property.rating > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="w-3 h-3 fill-foreground text-foreground" />
                      <span className="text-xs">{property.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">
                  {isRu ? property.title_ru : property.title_en}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {property.bedrooms != null && property.bedrooms > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Bed className="w-3 h-3" />
                      {property.bedrooms}
                    </span>
                  )}
                  {property.max_guests != null && property.max_guests > 0 && (
                    <span className="flex items-center gap-0.5">
                      <Users className="w-3 h-3" />
                      {property.max_guests}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-foreground pt-0.5">
                  {formatPrice(unitPrice)}
                  <span className="font-normal text-muted-foreground text-xs">
                    {' '}/{isRu ? 'ночь' : 'night'}
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
