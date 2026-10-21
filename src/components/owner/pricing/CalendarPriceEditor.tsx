import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { addDays, addMonths, startOfMonth, startOfWeek, format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomCategories } from '@/hooks/useRoomCategories';
import { useStaysUnifiedCalendar } from '@/hooks/useStaysUnifiedCalendar';
import { supabase } from '@/integrations/supabase/client';
import { bangkokTodayISO, civilDateKey, parseCivilDate, toBangkokDateKey } from '@/lib/hotelDates';
import { inclusivePriceRange, parseCalendarPrice, priceRangeSnapshot, type CalendarPriceRow } from '@/lib/owner/calendarPricing';
import type { UnifiedProperty } from '@/hooks/useMyProperties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/** Edits the same dated price sources consumed by checkout. Occupancy is read-only. */
export function CalendarPriceEditor({ property }: { property: UnifiedProperty }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (en: string, russian: string) => language === 'ru' ? russian : en;
  const [params] = useSearchParams();
  const requested = params.get('date');
  const initial = toBangkokDateKey(requested) || bangkokTodayISO();
  const [month, setMonth] = useState(() => startOfMonth(parseCivilDate(initial)));
  const [from, setFrom] = useState(initial);
  const [through, setThrough] = useState(initial);
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const categories = useRoomCategories(property.property_id);
  const stays = useStaysUnifiedCalendar(property.property_id);
  const qc = useQueryClient();
  const currency = property.record_currency;
  const start = civilDateKey(startOfWeek(month, { weekStartsOn: 1 }));
  const end = civilDateKey(addDays(parseCivilDate(start), 42));
  const safeFrom = toBangkokDateKey(from) || start;
  const safeThrough = toBangkokDateKey(through) || end;
  const rangeFrom = safeFrom < start ? safeFrom : start;
  const rangeEnd = civilDateKey(addDays(parseCivilDate(safeThrough > end ? safeThrough : end), 1));
  const rows = useQuery({
    queryKey: ['calendar-pricing', user?.id, property.property_id, category, rangeFrom, rangeEnd],
    enabled: !!user && !!property.property_id,
    staleTime: 0, gcTime: 0,
    queryFn: async (): Promise<CalendarPriceRow[]> => {
      if (category) {
        const result = await supabase.from('property_stay_restrictions').select('date,price_override,min_stay_nights,closed_to_arrival,closed_to_departure,stop_sell').eq('property_id', property.property_id).eq('category_id', category).gte('date', rangeFrom).lt('date', rangeEnd);
        if (result.error) throw result.error;
        return result.data;
      }
      const result = await supabase.from('property_availability').select('date,price_override,min_nights_override,status,booking_id').eq('property_id', property.property_id).gte('date', rangeFrom).lt('date', rangeEnd);
      if (result.error) throw result.error;
      return result.data;
    },
  });
  async function save() {
    setSaving(true);
    try {
      if (!currency || !rows.data || rows.isFetching) throw new Error(t('Reload prices before saving', 'Обновите цены перед сохранением'));
      const range = inclusivePriceRange(from, through);
      const amount = parseCalendarPrice(price);
      const { data, error } = await supabase.rpc('set_property_calendar_price', {
        p_property_id: property.property_id, p_category_id: category || null,
        p_from: range.from, p_to: range.end, p_price: amount, p_currency: currency,
        p_expected: priceRangeSnapshot(rows.data, range.from, range.end, !!category),
      });
      if (error) throw error;
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.property_id !== property.property_id || data.category_id !== (category || null) || data.nights !== range.count || data.nightly_rate !== amount || data.currency !== currency) throw new Error(t('Save was not confirmed', 'Сохранение не подтверждено'));
      await qc.invalidateQueries({ predicate: query => /pricing|availability|calendar|rate|property|properties|room-category/.test(String(query.queryKey[0])) });
      toast.success(t('Prices saved', 'Цены сохранены'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Could not save. Reload and try again.', 'Не удалось сохранить. Обновите данные и повторите.'));
      await rows.refetch();
    } finally { setSaving(false); }
  }
  return <section className="border bg-card p-4 md:p-6 space-y-5" aria-label={t('Calendar prices', 'Цены в календаре')}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold text-lg">{t('Calendar prices', 'Цены в календаре')}</h2><p className="text-sm text-muted-foreground">{t('Select a date or date range. Existing bookings stay unchanged.', 'Выберите дату или период. Существующие бронирования сохраняются.')}</p></div>
      <Link className="text-sm underline" to={`/mc/calendar?property=${property.property_id}&date=${from}`}>{t('Open booking calendar', 'Календарь бронирований')}</Link>
    </div>
    <label htmlFor="calendar-price-target" className="block text-sm space-y-2"><span>{t('Apply to', 'Применить к')}</span><select id="calendar-price-target" className="w-full border bg-background p-3" value={category} disabled={saving || categories.isLoading || categories.isError} onChange={e => { setCategory(e.target.value); setPrice(''); }}>
      <option value="">{property.title} · {t('Individual unit', 'Отдельный объект')}</option>
      {categories.data?.categories.map(c => <option key={c.id} value={c.id}>{t('Category', 'Категория')}: {language === 'ru' ? c.name_ru || c.name_en : c.name_en}</option>)}
    </select></label>
    {categories.isError && <p role="alert">{t('Categories could not be loaded. Reload the page.', 'Не удалось загрузить категории. Обновите страницу.')}</p>}
    <div className="flex items-center justify-between"><Button variant="outline" aria-label={t('Previous month', 'Предыдущий месяц')} onClick={() => setMonth(addMonths(month, -1))}>←</Button><h3 className="font-medium">{format(month, 'LLLL yyyy', {locale: language === 'ru' ? ru : enUS})}</h3><Button variant="outline" aria-label={t('Next month', 'Следующий месяц')} onClick={() => setMonth(addMonths(month, 1))}>→</Button></div>
    {rows.isError ? <p role="alert">{t('Prices unavailable. Try reloading.', 'Не удалось загрузить цены. Повторите загрузку.')} <Button variant="outline" onClick={() => rows.refetch()}>{t('Reload', 'Обновить')}</Button></p> : <>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({length: 7}, (_, i) => <div key={i} className="text-center text-xs text-muted-foreground">{format(addDays(parseCivilDate(start), i), 'EEEEEE', {locale: language === 'ru' ? ru : enUS})}</div>)}
        {Array.from({length: 42}, (_, i) => {
          const date = civilDateKey(addDays(parseCivilDate(start), i));
          const row = rows.data?.find(r => r.date === date);
          const selected = date >= from && date <= through;
          const occupied = !category && (stays.data?.unifiedDayMeta.has(date) || row?.status === 'booked' || row?.status === 'blocked');
          return <button key={date} type="button" disabled={saving || rows.isLoading} aria-pressed={selected} aria-label={`${date} ${row?.price_override ?? t('Inherited rate', 'По тарифу')}`} onClick={event => {
            if (event.shiftKey && date >= from) setThrough(date); else { setFrom(date); setThrough(date); }
          }} className={`min-h-20 border p-1 text-left transition-colors ${selected ? 'border-primary bg-primary/10' : 'hover:bg-muted'} ${date.slice(0,7) !== civilDateKey(month).slice(0,7) ? 'opacity-50' : ''}`}>
            <span className="block text-sm">{Number(date.slice(-2))}</span><span className="block text-[10px] sm:text-xs break-all">{row?.price_override != null ? new Intl.NumberFormat(language).format(row.price_override) : t('Rate', 'Тариф')}</span>{occupied && <span className="block text-[9px] whitespace-nowrap text-muted-foreground">{t('Occupied', 'Занято')}</span>}
          </button>;
        })}
      </div>
      <p className="text-xs text-muted-foreground">{t('“Rate” inherits base and seasonal pricing. Numbers are explicit nightly overrides, before discounts. Shift-click extends selection.', '«Тариф» — базовая или сезонная цена. Числа — индивидуальная цена за ночь до скидок. Shift + клик расширяет выделение.')}</p>
    </>}
    <div className="grid gap-3 sm:grid-cols-3">
      <label htmlFor="calendar-price-from" className="text-sm space-y-2"><span>{t('From', 'С даты')}</span><Input id="calendar-price-from" type="date" value={from} disabled={saving} onChange={e => { setFrom(e.target.value); if(e.target.value > through) setThrough(e.target.value); }}/></label>
      <label htmlFor="calendar-price-through" className="text-sm space-y-2"><span>{t('Through (inclusive)', 'По дату включительно')}</span><Input id="calendar-price-through" type="date" min={from} value={through} disabled={saving} onChange={e => setThrough(e.target.value)}/></label>
      <label htmlFor="calendar-price-amount" className="text-sm space-y-2"><span>{t('Per night', 'За ночь')} · {currency || '—'}</span><Input id="calendar-price-amount" inputMode="decimal" value={price} placeholder="0.00" disabled={saving} onChange={e => setPrice(e.target.value)}/></label>
    </div>
    {!currency && <p role="alert">{t('Set the property currency before editing prices.', 'Сначала задайте валюту объекта.')}</p>}
    <Button onClick={save} disabled={saving || !currency || !price || !from || !through || from > through || !rows.data || rows.isFetching || rows.isError}>{saving ? t('Saving…', 'Сохранение…') : t('Apply nightly price', 'Применить цену за ночь')}</Button>
  </section>;
}
