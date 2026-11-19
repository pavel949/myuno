import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { addDays, addMonths, endOfMonth, endOfWeek, eachDayOfInterval, startOfMonth, startOfWeek, format } from 'date-fns';
import { ru, enUS, th } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useCalendarPrices } from '@/hooks/useCalendarPrices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRoomCategories } from '@/hooks/useRoomCategories';
import { useStaysUnifiedCalendar } from '@/hooks/useStaysUnifiedCalendar';
import { useOwnerProperty } from '@/hooks/usePropertyCare';
import { usePropertyRateSeasons } from '@/hooks/usePropertyRateSeasons';
import type { UnifiedProperty } from '@/hooks/useMyProperties';
import { supabase } from '@/integrations/supabase/client';
import { bangkokTodayISO, civilDateKey, parseCivilDate, toBangkokDateKey } from '@/lib/hotelDates';
import { inclusivePriceRange, parseCalendarPrice, priceRangeSnapshot } from '@/lib/owner/calendarPricing';
import { matchingRateCurrencies } from '@/lib/owner/propertyRateDisplay';
import { getEffectiveNightlyRate, type SeasonalPricingRule } from '@/lib/pricingEngine';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function readRange(from: string, through: string) {
  try { return inclusivePriceRange(from, through); } catch { return null; }
}

function readPrice(value: string) {
  try { return parseCalendarPrice(value); } catch { return null; }
}

/** Edits the existing dated price rows. Occupancy is read-only. */
export function CalendarPriceEditor({ property }: { property: UnifiedProperty }) {
  const { language } = useLanguage();
  const t = (en: string, russian: string, thai: string) => language === 'ru' ? russian : language === 'th' ? thai : en;
  const locale = language === 'ru' ? ru : language === 'th' ? th : enUS;
  const numberFormat = new Intl.NumberFormat(language, { maximumFractionDigits: 2 });
  const [params] = useSearchParams();
  const today = bangkokTodayISO();
  const initial = toBangkokDateKey(params.get('date')) || today;
  const [month, setMonth] = useState(() => startOfMonth(parseCivilDate(initial)));
  const [from, setFrom] = useState(initial);
  const [through, setThrough] = useState(initial);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const categories = useRoomCategories(property.property_id);
  const stays = useStaysUnifiedCalendar(property.property_id);
  const terms = useOwnerProperty(property.property_id);
  const seasons = usePropertyRateSeasons(property.property_id);
  const qc = useQueryClient();
  const currency = property.record_currency;
  const monthStart = startOfMonth(month);
  const firstDay = startOfWeek(monthStart, { weekStartsOn: 1 });
  const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const start = civilDateKey(firstDay);
  const end = civilDateKey(addDays(lastDay, 1));
  const range = readRange(from, through);
  const amount = readPrice(price);
  const visibleRows = useCalendarPrices(property.property_id, category || null, start, end);
  const rows = useCalendarPrices(range ? property.property_id : undefined, category || null, range?.from ?? start, range?.end ?? end);
  const visibleByDate = new Map(visibleRows.data?.map(row => [row.date, row]));
  const room = categories.data?.categories.find(item => item.id === category);
  const activeSeasons = (seasons.data ?? []).filter(season => !category || season.category_id === category)
    .filter(season => season.nightly_rate > 0)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
  const hasFixedPrice = terms.data?.price && ['night', 'nightly', 'day', 'daily'].includes((terms.data.price_period ?? 'night').toLowerCase());
  const base = category ? Number(room?.base_price_per_night) || 0
    : property.price_per_night && property.price_per_night > 0 ? property.price_per_night : hasFixedPrice ? Number(terms.data?.price) : 0;
  const legacySeasons = !category && Array.isArray(terms.data?.seasonal_pricing) ? terms.data.seasonal_pricing as unknown as SeasonalPricingRule[] : undefined;
  const inheritedReady = !seasons.isError && !seasons.isLoading && (category ? !!room : !!terms.data);

  function selectDay(date: string, extend: boolean) {
    const first = extend ? from : anchor;
    if (first && first !== date) {
      setFrom(date < first ? date : first);
      setThrough(date > first ? date : first);
      setAnchor(null);
    } else {
      setFrom(date);
      setThrough(date);
      setAnchor(date);
    }
    setPrice('');
  }

  const canSave = !!(range && amount && currency?.trim() && rows.data && !rows.isFetching && !rows.isError
    && !saving && !categories.isError && !categories.isLoading && (!category || room));

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || !range || !amount || !currency || !rows.data) return;
    setSaving(true);
    setAnchor(null);
    try {
      const { data, error } = await supabase.rpc('set_property_calendar_price', {
        p_property_id: property.property_id, p_category_id: category || null,
        p_from: range.from, p_to: range.end, p_price: amount, p_currency: currency,
        p_expected: priceRangeSnapshot(rows.data, range.from, range.end, !!category),
      });
      if (error) throw error;
      if (!data || typeof data !== 'object' || Array.isArray(data) || data.property_id !== property.property_id || data.category_id !== (category || null) || data.nights !== range.count || data.nightly_rate !== amount || data.currency !== currency) throw new Error('Unconfirmed calendar price write');
      await qc.invalidateQueries({ predicate: query => /pricing|availability|calendar|rate|property|properties|room-category/.test(String(query.queryKey[0])) });
      setPrice('');
      toast.success(t('Prices saved', 'Цены сохранены', 'บันทึกราคาแล้ว'));
    } catch {
      toast.error(t('Could not save. Review the refreshed prices and try again.', 'Не удалось сохранить. Проверьте обновлённые цены и повторите.', 'บันทึกไม่สำเร็จ โปรดตรวจสอบราคาที่อัปเดตและลองอีกครั้ง'));
      await rows.refetch();
    } finally {
      setSaving(false);
    }
  }

  const selectionLabel = from && through ? from === through
    ? format(parseCivilDate(from), 'd MMM yyyy', { locale })
    : [from, through].map(date => format(parseCivilDate(date), 'd MMM yyyy', { locale })).join(' – ') : null;

  return <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]" aria-label={t('Calendar prices', 'Цены в календаре', 'ราคาในปฏิทิน')}>
    <div className="min-w-0 border bg-card p-2.5 sm:p-4 lg:p-5">
      {!!categories.data?.categories.length && <label htmlFor="calendar-price-target" className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span>{t('Apply to', 'Применить к', 'ใช้กับ')}</span>
        <select id="calendar-price-target" className="min-h-11 w-full min-w-0 border bg-background ps-2 pe-6 sm:w-auto sm:max-w-full" value={category} disabled={saving || categories.isError} onChange={event => { setCategory(event.target.value); setPrice(''); setAnchor(null); }}>
          <option value="">{t('Individual unit', 'Отдельный объект', 'ยูนิต')}</option>
          {categories.data.categories.map(item => <option key={item.id} value={item.id}>{language === 'ru' ? item.name_ru || item.name_en : item.name_en}</option>)}
        </select>
      </label>}
      {categories.isError && <p role="alert" className="mb-2 text-sm text-destructive">{t('Room categories could not be loaded.', 'Не удалось загрузить категории номеров.', 'โหลดประเภทห้องไม่สำเร็จ')} <Button variant="ghost" onClick={() => categories.refetch()}>{t('Retry', 'Повторить', 'ลองใหม่')}</Button></p>}
      <div className="mb-2 flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" className="size-11 shrink-0" disabled={saving} aria-label={t('Previous month', 'Предыдущий месяц', 'เดือนก่อนหน้า')} onClick={() => setMonth(addMonths(month, -1))}><ChevronLeft className="size-5" /></Button>
        <div className="text-center">
          <h2 className="font-sans text-lg font-semibold capitalize" aria-live="polite">{format(month, 'LLLL yyyy', { locale })}</h2>
          {currency && <p className="text-xs text-muted-foreground">{currency} · {t('per night', 'за ночь', 'ต่อคืน')}</p>}
        </div>
        <Button variant="ghost" size="icon" className="size-11 shrink-0" disabled={saving} aria-label={t('Next month', 'Следующий месяц', 'เดือนถัดไป')} onClick={() => setMonth(addMonths(month, 1))}><ChevronRight className="size-5" /></Button>
      </div>
      {visibleRows.isError ? <p role="alert" className="text-sm">{t('Prices could not be loaded.', 'Не удалось загрузить цены.', 'โหลดราคาไม่สำเร็จ')} <Button variant="ghost" onClick={() => visibleRows.refetch()}>{t('Retry', 'Повторить', 'ลองใหม่')}</Button></p> : <>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1" aria-busy={visibleRows.isLoading}>
          {Array.from({length: 7}, (_, index) => <div key={index} className="py-1 text-center text-xs font-medium text-muted-foreground">{format(addDays(firstDay, index), 'EEEEEE', { locale })}</div>)}
          {eachDayOfInterval({ start: firstDay, end: lastDay }).map(day => {
            const date = civilDateKey(day);
            if (day.getMonth() !== month.getMonth()) return <span key={date} aria-hidden="true" />;
            const row = visibleByDate.get(date);
            const selected = date >= from && date <= through;
            const occupied = !category && (stays.data?.unifiedDayMeta.has(date) || row?.status === 'booked' || row?.status === 'blocked');
            const unavailable = occupied || row?.stop_sell;
            const override = row?.price_override != null && row.price_override > 0 ? row.price_override : null;
            const season = activeSeasons.find(item => item.start_date <= date && item.end_date >= date);
            const inherited = season?.currency && !matchingRateCurrencies(season.currency, currency)
              ? null : season?.nightly_rate ?? getEffectiveNightlyRate(day, base, legacySeasons);
            const nightly = override ?? (inheritedReady && inherited != null && inherited > 0 ? inherited : null);
            const label = nightly != null ? String(nightly) : t('Inherited rate', 'Цена по тарифу', 'ราคาตามค่าเริ่มต้น');
            return <button key={date} type="button" disabled={saving || visibleRows.isLoading} aria-pressed={selected} aria-current={date === today ? 'date' : undefined}
              aria-label={`${date} ${label}${unavailable ? ' · ' + t('Unavailable', 'Недоступно', 'ไม่ว่าง') : ''}`}
              title={nightly == null ? undefined : `${numberFormat.format(nightly)} ${currency ?? ''}`.trim()}
              onClick={event => selectDay(date, event.shiftKey)}
              className={cn('relative flex min-h-11 min-w-0 flex-col items-center justify-center gap-0.5 border px-px py-1 text-center focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-16 lg:min-h-20',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background hover:border-primary hover:bg-muted',
                date === today && 'font-semibold')}>
              <span className={cn('text-xs tabular-nums sm:text-sm', occupied && 'line-through')}>{day.getDate()}</span>
              <span className={cn('max-w-full truncate text-xs leading-tight tabular-nums lg:text-sm', override && 'font-semibold', !selected && !override && 'text-muted-foreground')}>
                {visibleRows.isLoading ? '…' : nightly == null ? '—' : numberFormat.format(nightly)}
              </span>
              {unavailable && <span aria-hidden="true" className={cn('absolute right-0.5 top-0.5 size-1.5 rounded-full sm:right-1.5 sm:top-1.5', selected ? 'bg-primary-foreground' : 'bg-destructive')} />}
            </button>;
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{t('Bold', 'Жирным', 'ตัวหนา')}</strong> · {t('custom price', 'цена на дату', 'ราคาที่กำหนดเอง')}</span>
          <span><span aria-hidden="true" className="mr-1 inline-block size-1.5 rounded-full bg-destructive" />{t('Unavailable', 'Недоступно', 'ไม่ว่าง')}</span>
          <span>{t('Before discounts and fees', 'До скидок и сборов', 'ก่อนส่วนลดและค่าธรรมเนียม')}</span>
        </div>
        {(seasons.isError || terms.isError) && <p role="status" className="mt-2 text-xs text-muted-foreground">{t('Some inherited prices could not be loaded.', 'Часть базовых и сезонных цен недоступна.', 'โหลดราคาเริ่มต้นบางรายการไม่สำเร็จ')}</p>}
      </>}
    </div>

    <form onSubmit={save} className="min-w-0 self-start space-y-3 border bg-card p-3 sm:p-4 lg:p-5">
      <div>
        <h2 className="font-sans text-base font-semibold">{t('Price for selected dates', 'Цена на выбранные даты', 'ราคาสำหรับวันที่เลือก')}</h2>
        <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">{selectionLabel}{range && ` · ${range.count} ${t('night(s)', 'ноч.', 'คืน')}`}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('Tap one date, then another for a range.', 'Нажмите на дату, затем на вторую, чтобы выбрать период.', 'แตะวันที่หนึ่งและอีกวันที่เพื่อเลือกช่วง')}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label htmlFor="calendar-price-from" className="min-w-0 space-y-1 text-xs"><span>{t('From', 'С даты', 'จาก')}</span>
          <Input id="calendar-price-from" className="h-11 min-w-0 px-2" type="date" value={from} disabled={saving} onChange={event => {
            const day = toBangkokDateKey(event.target.value);
            setFrom(day ?? '');
            if (day && (!through || day > through)) setThrough(day);
            if (day) setMonth(startOfMonth(parseCivilDate(day)));
            setAnchor(null);
            setPrice('');
          }} />
        </label>
        <label htmlFor="calendar-price-through" className="min-w-0 space-y-1 text-xs"><span>{t('Through (inclusive)', 'По дату включительно', 'ถึง (รวมวันที่)')}</span>
          <Input id="calendar-price-through" className="h-11 min-w-0 px-2" type="date" min={from} value={through} disabled={saving} onChange={event => { setThrough(toBangkokDateKey(event.target.value) ?? ''); setAnchor(null); setPrice(''); }} />
        </label>
      </div>
      <label htmlFor="calendar-price-amount" className="block space-y-1 text-sm">
        <span>{t('Per night', 'За ночь', 'ต่อคืน')} · {currency || '—'}</span>
        <Input id="calendar-price-amount" className="h-11" inputMode="decimal" value={price} placeholder="0.00" disabled={saving} onChange={event => setPrice(event.target.value)} />
      </label>
      {!range && <p role="status" className="text-xs text-destructive">{t('Choose a period of 1–366 nights.', 'Выберите период от 1 до 366 ночей.', 'เลือกช่วง 1–366 คืน')}</p>}
      {price && !amount && <p role="status" className="text-xs text-destructive">{t('Enter a positive price with up to two decimals.', 'Введите цену больше нуля, до двух знаков после запятой.', 'กรอกราคามากกว่าศูนย์และทศนิยมไม่เกินสองตำแหน่ง')}</p>}
      {rows.isError && <p role="alert" className="text-sm">{t('Selected prices could not be loaded.', 'Не удалось загрузить цены выбранных дат.', 'โหลดราคาวันที่เลือกไม่สำเร็จ')} <Button type="button" variant="ghost" onClick={() => rows.refetch()}>{t('Retry', 'Повторить', 'ลองใหม่')}</Button></p>}
      {!currency && <p role="alert" className="text-sm">{t('Set the property currency before editing prices.', 'Сначала задайте валюту объекта.', 'ตั้งค่าสกุลเงินก่อนแก้ไขราคา')}</p>}
      <Button type="submit" className="min-h-11 w-full" disabled={!canSave}>{saving ? t('Saving…', 'Сохранение…', 'กำลังบันทึก…') : t('Apply nightly price', 'Сохранить цену за ночь', 'บันทึกราคาต่อคืน')}</Button>
      <Link className="inline-flex min-h-10 items-center text-sm font-medium underline underline-offset-4"
        to={`/mc/calendar?property=${encodeURIComponent(property.property_id)}${from ? `&date=${from}` : ''}`}>
        {t('Open booking calendar', 'Календарь бронирований', 'ปฏิทินการจอง')}
      </Link>
    </form>
  </section>;
}
