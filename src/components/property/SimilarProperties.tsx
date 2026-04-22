import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, BedDouble, Award } from 'lucide-react';
import { isGuestFavorite } from './GuestFavoriteBadge';

interface SimilarPropertiesProps {
  propertyId: string;
  district?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  /** When the user has selected dates on the parent detail page, we show
   *  a "total for N nights" pill instead of the nightly rate, mirroring
   *  Airbnb's similar-properties strip after dates are chosen. */
  nights?: number;
}

export function SimilarProperties({
  propertyId,
  district,
  propertyType,
  bedrooms: _bedrooms,
  nights,
}: SimilarPropertiesProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const { data: similar = [] } = useQuery({
    queryKey: ['similar-properties', propertyId, district],
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select('id, title_en, title_ru, district, cover_image, bedrooms, price_per_night, property_type, rating, review_count')
        .eq('is_active', true)
        .eq('approval_status', 'approved')
        .neq('id', propertyId)
        .limit(6);

      if (district) {
        q = q.ilike('district', `%${district}%`);
      }
      if (propertyType) {
        q = q.eq('property_type', propertyType);
      }

      const { data } = await q;
      return data ?? [];
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000,
  });

  if (similar.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">
        {isRu ? 'Похожие объекты' : 'Similar Properties'}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide">
        {similar.map(p => {
          const nightly = p.price_per_night ?? 0;
          const showTotal = nights && nights > 0 && nightly > 0;
          const total = showTotal ? nightly * nights : null;
          const favourite = isGuestFavorite(p.rating, p.review_count);
          return (
            <Card
              key={p.id}
              className="min-w-[220px] max-w-[260px] snap-start cursor-pointer hover:shadow-md transition-shadow flex-shrink-0 overflow-hidden"
              onClick={() => navigate(`/property/${p.id}`)}
            >
              <div className="aspect-[4/3] bg-muted relative">
                {p.cover_image ? (
                  <img src={p.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    {isRu ? 'Нет фото' : 'No photo'}
                  </div>
                )}
                {/* Price pill — Airbnb pattern: prominent on the image to scan
                    quickly. Switches to "total for N nights" once dates are set. */}
                {nightly > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute bottom-2 left-2 bg-background/95 text-foreground border border-border/40 backdrop-blur-sm font-semibold shadow-sm"
                  >
                    {showTotal
                      ? `${formatPrice(total!)} ${isRu ? 'за ' + nights + (nights === 1 ? ' ночь' : nights < 5 ? ' ночи' : ' ночей') : 'for ' + nights + (nights === 1 ? ' night' : ' nights')}`
                      : `${formatPrice(nightly)}/${isRu ? 'ночь' : 'night'}`}
                  </Badge>
                )}
                {favourite && (
                  <span
                    className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border/40 backdrop-blur-sm shadow-sm"
                    title={isRu ? 'Любимец гостей' : 'Guest favorite'}
                  >
                    <Award className="w-3 h-3 text-primary" />
                    {isRu ? 'Любимец' : 'Favorite'}
                  </span>
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">
                  {isRu ? (p.title_ru || p.title_en) : (p.title_en || p.title_ru)}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  {p.district && (
                    <>
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{p.district}</span>
                    </>
                  )}
                  {p.bedrooms && (
                    <span className="flex items-center gap-0.5 ml-auto">
                      <BedDouble className="w-3 h-3" /> {p.bedrooms}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
