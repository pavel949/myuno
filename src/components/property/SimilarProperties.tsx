import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { Button } from '@/components/ui/button';
import { MapPin, BedDouble } from 'lucide-react';
import { allowedRecommendationIds, rankRelatedProperties } from '@/lib/real-estate/relatedProperties';
import { propertyDetailHref, propertyRentalDisplayPrice, propertySaleAskingPrice, PUBLIC_RENT_ELIGIBILITY, PUBLIC_SALE_ELIGIBILITY } from '@/lib/real-estate/propertyDetailIntent';

interface SimilarPropertiesProps {
  propertyId: string; district?: string | null; propertyType?: string | null; bedrooms?: number | null;
  nights?: number; pricePerNight?: number | null; mode?: 'rent' | 'buy'; guestSearch?: string;
}
export function SimilarProperties({ propertyId, district, propertyType, pricePerNight, mode = 'rent', guestSearch }: SimilarPropertiesProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const aiEnabled = useFeatureFlag('property_related_ai');
  const catalogue = useQuery({
    queryKey: ['similar-properties', propertyId, district, propertyType, pricePerNight, mode],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_property_catalog')
        .select('id,title_en,title_ru,district,cover_image,bedrooms,price_per_night,price_per_month,price_per_year,price,price_period,currency,sale_price,sale_currency,property_type,listing_type,listing_modes,is_for_sale')
        .eq('is_active', true).eq('approval_status', 'approved').or(mode === 'rent' ? PUBLIC_RENT_ELIGIBILITY : PUBLIC_SALE_ELIGIBILITY)
        .neq('id', propertyId).order('id').limit(100);
      if (error) throw error;
      return rankRelatedProperties(data ?? [], { id: propertyId, district, property_type: propertyType, price_per_night: pricePerNight }, mode);
    }, enabled: !!propertyId, staleTime: 300_000,
  });
  const ranking = useQuery({
    queryKey: ['property-related-ai', propertyId, mode, language],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('property-related-recommendations', { body: { propertyId, mode, language: isRu ? 'ru' : 'en' } });
      if (error) {
        const context = 'context' in error ? error.context : null;
        if (context instanceof Response) {
          const body = await context.json().catch(() => null);
          throw new Error(body?.error ?? error.message);
        }
        throw error;
      }
      return allowedRecommendationIds(data?.ids, catalogue.data ?? [], propertyId);
    }, enabled: aiEnabled && !!catalogue.data?.length, staleTime: 300_000, retry: false,
  });
  const items = catalogue.data ?? [];
  const ids = ranking.data ?? [];
  const similar = (ids.length ? [...ids.map(id => items.find(item => item.id === id)).filter(item => item !== undefined), ...items.filter(item => !ids.includes(item.id))] : items).slice(0, 6);
  return <section aria-label={isRu ? 'Вам также может понравиться' : 'You may also like'}>
    <h2 className="text-h3 mb-4">{isRu ? 'Вам также может понравиться' : 'You may also like'}</h2>
    {aiEnabled && ranking.isError && <p role="status" className="text-xs text-muted-foreground mb-3">{ranking.error.message}</p>}
    {catalogue.isLoading ? <div role="status" className="h-40 bg-muted animate-pulse" aria-label={isRu ? 'Подбираем объекты' : 'Loading related homes'} /> : catalogue.isError ? <div role="alert"><p>{isRu ? 'Не удалось загрузить варианты' : 'Could not load related homes'}</p><Button variant="outline" onClick={() => catalogue.refetch()}>{isRu ? 'Повторить' : 'Try again'}</Button></div> : !similar.length ? <p className="text-sm text-muted-foreground">{isRu ? 'Других предложений пока нет' : 'No other offers yet'}</p> : <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {similar.map(p => {
        const rate = mode === 'rent' ? propertyRentalDisplayPrice(p) : null;
        const amount = mode === 'buy' ? (p.sale_currency ?? p.currency)?.toUpperCase() === 'THB' ? propertySaleAskingPrice(p) : null : p.currency?.toUpperCase() === 'THB' ? rate?.amount : null;
        const period = rate ? ({ night: isRu ? 'ночь' : 'night', week: isRu ? 'нед.' : 'week', month: isRu ? 'мес.' : 'month', year: isRu ? 'год' : 'year', total: '' })[rate.period] : '';
        return <Link key={p.id} to={propertyDetailHref(p.id, mode, guestSearch)} className="min-w-0 border border-border bg-card overflow-hidden focus-visible:ring-2 focus-visible:ring-ring">
          <div className="aspect-[4/3] bg-muted">{p.cover_image ? <img src={p.cover_image} alt={(isRu ? p.title_ru || p.title_en : p.title_en || p.title_ru) ?? ''} loading="lazy" className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{isRu ? 'Нет фото' : 'No photo'}</div>}</div>
          <div className="p-3 space-y-2"><h3 className="text-sm font-semibold break-words">{isRu ? p.title_ru || p.title_en : p.title_en || p.title_ru}</h3>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{p.district && <span className="flex gap-1 items-center"><MapPin className="h-3 w-3" />{p.district}</span>}{p.bedrooms != null && <span className="flex gap-1 items-center"><BedDouble className="h-3 w-3" />{p.bedrooms}</span>}</div>
          <p className="text-sm font-mono">{amount ? `${formatPrice(amount)}${period ? ` / ${period}` : ''}` : isRu ? 'Цена по запросу' : 'Price on request'}</p></div>
        </Link>;
      })}
    </div>}
  </section>;
}