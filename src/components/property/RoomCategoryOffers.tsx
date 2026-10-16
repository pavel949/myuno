/**
 * Guest-facing list of room categories and rate plans for resorts/hotels.
 * Prices come from the same quote module as the payment server.
 * Renders nothing for single-unit properties (no categories).
 */
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { quoteHotelStay, type HotelCategoryRow, type HotelRatePlanRow, type HotelRestrictionRow, type HotelSeasonRow } from '@/lib/hotelQuote';
import { bangkokTodayISO } from '@/lib/hotelDates';

export function RoomCategoryOffers({ propertyId, dateRange, guests = 1 }: { propertyId: string; dateRange?: DateRange; guests?: number }) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const t = (r: string, e: string) => (ru ? r : e);
  const ci = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : null;
  const co = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['room-category-offers', propertyId, ci, co],
    queryFn: async () => {
      const { data: cats, error: e1 } = await supabase.from('property_room_categories')
        .select('*').eq('property_id', propertyId).eq('is_active', true).order('sort_order');
      if (e1) throw e1;
      if (!cats?.length) return [];
      const ids = cats.map((c) => c.id);
      const [plans, seasons, restr] = await Promise.all([
        supabase.from('property_rate_plans').select('*').in('category_id', ids).eq('is_active', true),
        supabase.from('property_rate_seasons').select('category_id, start_date, end_date, nightly_rate, min_stay_nights, is_active').in('category_id', ids).eq('is_active', true),
        ci && co ? supabase.from('property_stay_restrictions').select('*').in('category_id', ids).gte('date', ci).lte('date', co) : Promise.resolve({ data: [], error: null }),
      ]);
      if (plans.error) throw plans.error;
      if (seasons.error) throw seasons.error;
      if (restr.error) throw restr.error;
      const avail = ci && co
        ? await Promise.all(ids.map((id) => supabase.rpc('get_category_availability', { _category_id: id, _check_in: ci, _check_out: co })))
        : null;
      return cats.map((c, i) => ({
        category: c,
        free: avail ? (avail[i].data as number | null) ?? 0 : null,
        plans: (plans.data ?? []).filter((p) => p.category_id === c.id).map((p) => ({
          plan: p,
          quote: ci && co ? quoteHotelStay({
            category: c as HotelCategoryRow, plan: p as HotelRatePlanRow,
            seasons: (seasons.data ?? []).filter((s) => s.category_id === c.id) as HotelSeasonRow[],
            restrictions: ((restr.data ?? []) as (HotelRestrictionRow & { category_id: string })[]).filter((r) => r.category_id === c.id),
            check_in: ci, check_out: co, guests, today: bangkokTodayISO(),
          }) : null,
        })),
      }));
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (error) return <p className="text-sm text-destructive">{t('Не удалось загрузить категории номеров', 'Could not load room categories')}</p>;
  if (!data?.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl text-foreground">{t('Категории номеров', 'Room categories')}</h2>
      {!ci || !co ? <p className="text-sm text-muted-foreground">{t('Выберите даты, чтобы увидеть цену и наличие.', 'Choose dates to see price and availability.')}</p> : null}
      {data.map(({ category: c, free, plans }) => (
        <Card key={c.id}><CardContent className="space-y-2 p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-medium text-foreground">{(ru && c.name_ru) || c.name_en}</h3>
            <span className="text-sm text-muted-foreground">
              {t('от', 'from')} <span className="font-mono">{Number(c.base_price_per_night).toLocaleString()} ฿</span> {t('за ночь', 'per night')} · {t('гостей до', 'up to')} {c.max_guests}
            </span>
          </div>
          {free !== null && (
            <p className="text-sm text-muted-foreground">{free > 0 ? t(`Свободно номеров: ${free}`, `Rooms available: ${free}`) : t('На эти даты свободных номеров нет', 'No rooms available for these dates')}</p>
          )}
          {plans.map(({ plan: p, quote }) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-foreground">{(ru && p.name_ru) || p.name_en}</span>
                <Badge variant="outline">{p.is_refundable
                  ? t(`Бесплатная отмена за ${p.free_cancellation_days ?? 0} дн.`, `Free cancellation ${p.free_cancellation_days ?? 0} days before`)
                  : t('Без возврата', 'Non-refundable')}</Badge>
              </div>
              {quote && (quote.ok
                ? <span className="font-mono text-foreground">{quote.total.toLocaleString()} ฿ · {quote.nights} {t('ноч.', 'nights')}</span>
                : <span className="text-muted-foreground">{t('Недоступно на эти даты', 'Not available for these dates')}</span>)}
            </div>
          ))}
        </CardContent></Card>
      ))}
    </section>
  );
}
