import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, BedDouble } from 'lucide-react';

interface SimilarPropertiesProps {
  propertyId: string;
  district?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
}

export function SimilarProperties({ propertyId, district, propertyType, bedrooms }: SimilarPropertiesProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const { data: similar = [] } = useQuery({
    queryKey: ['similar-properties', propertyId, district],
    queryFn: async () => {
      let q = supabase
        .from('properties')
        .select('id, title_en, title_ru, district, cover_image, bedrooms, price_per_night, property_type')
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
        {similar.map(p => (
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
              {p.price_per_night ? (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {formatPrice(p.price_per_night)}/{isRu ? 'ночь' : 'night'}
                </Badge>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
