import '@/styles/premium-services.css';
import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useMarketplaceServices, type MarketplaceService } from '@/hooks/useServiceMarketplace';
import { useMarketplaceAvailability } from '@/hooks/useMarketplaceAvailability';
import { filterMarketplaceServices } from '@/lib/services/serviceDiscoveryProjection';
import { filterProviderOffers, popularProviderOffers, readMarketplaceFilters, serviceDistricts, MARKETPLACE_FILTER_KEYS, type MarketplaceFilterKey } from '@/lib/services/marketplaceDiscovery';
import { ServiceBookingSheet, type BookableService } from './ServiceBookingSheet';
import { MarketplaceServiceCard } from './MarketplaceServiceCard';
import { MarketplaceFilters } from './MarketplaceFilters';

/** Existing public catalogue and booking workflow, with URL-backed discovery. */
export function MarketplaceServiceGrid({ search = '', returnTo = '/discover/services', onConcierge }: {
  search?: string; returnTo?: string; onConcierge?: () => void;
}) {
  const { language } = useLanguage();
  const L = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const query = useMarketplaceServices();
  const { data, isLoading, isError, refetch } = query;
  const location = useLocation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<BookableService | null>(null);
  const [expanded, setExpanded] = useState(false);
  const params = new URLSearchParams(returnTo.split('?')[1]?.split('#')[0] ?? '');
  const pending = useRef({ key: returnTo, params });
  if (pending.current.key !== returnTo) pending.current = { key: returnTo, params };
  const filters = readMarketplaceFilters(params);
  const candidates = filterProviderOffers(filterMarketplaceServices(data ?? [], search), filters);
  const availability = useMarketplaceAvailability(candidates, filters.invalid ? '' : filters.date);
  const checking = Boolean(filters.date && availability.isFetching);
  const list = filters.date ? candidates.filter(service => availability.data?.[service.id]?.status === 'available') : candidates;
  const failedCount = filters.date ? candidates.filter(service => availability.data?.[service.id]?.error).length : 0;
  const unknownCount = filters.date ? candidates.filter(service => !availability.data?.[service.id] || (availability.data[service.id].status === 'unknown' && !availability.data[service.id].error)).length : 0;
  const popular = !search.trim() && !filters.active ? popularProviderOffers(list) : [];
  const popularIds = new Set(popular.map(service => service.id));
  const rest = list.filter(service => !popularIds.has(service.id));
  const update = (key: MarketplaceFilterKey, value: string) => {
    const next = new URLSearchParams(pending.current.params);
    if (value) next.set(key, value); else next.delete(key);
    if (key === 'date') next.delete('today');
    if (key === 'today') next.delete('date');
    pending.current.params = next;
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { state: location.state, replace: key === 'minPrice' || key === 'maxPrice' });
  };
  const clear = () => {
    const next = new URLSearchParams(pending.current.params);
    MARKETPLACE_FILTER_KEYS.forEach(key => next.delete(key));
    pending.current.params = next;
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { state: location.state });
  };
  const filtersUI = <MarketplaceFilters filters={filters} params={params}
    districts={[...new Set((data ?? []).flatMap(serviceDistricts))].sort()}
    currencies={[...new Set((data ?? []).flatMap(service => service.currency && /^[A-Z]{3}$/.test(service.currency.trim().toUpperCase()) ? [service.currency.trim().toUpperCase()] : []))].sort()}
    onChange={update} onClear={clear} />;
  const fallback = onConcierge && <Button variant="outline" onClick={onConcierge}>{L('Подобрать услугу с консьержем', 'Find a service with concierge', 'ให้คอนเซียร์จช่วยหาบริการ')}</Button>;
  const renderCards = (services: MarketplaceService[]) => <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {services.map(service => <MarketplaceServiceCard key={service.id} service={service} returnTo={returnTo}
      availability={filters.date ? availability.data?.[service.id] : undefined}
      onRequest={() => setSelected({
        id: service.id, providerId: service.provider_id,
        name: (language === 'ru' ? service.name_ru : service.name_en) || service.name_en,
        price: service.price, currency: service.currency, durationMinutes: service.duration_minutes, leadTimeHours: service.lead_time_hours,
      })} />)}
  </div>;

  if (!isLoading && !isError && data?.length === 0) return <div className="space-y-4">
    {filters.active && filtersUI}<p role="status" className="text-sm text-muted-foreground">{L(
      'Пока нет опубликованных предложений специалистов. Выберите раздел каталога или опишите задачу.',
      'No published provider offers yet. Choose a catalogue section or describe your task.',
      'ยังไม่มีข้อเสนอที่เผยแพร่ เลือกหมวดหมู่บริการหรืออธิบายสิ่งที่ต้องการ')}
    </p>{fallback}
  </div>;

  return <section aria-labelledby="bookable-services" className="space-y-4">
    <div className="flex items-center gap-2"><CalendarCheck className="size-4 text-primary" aria-hidden="true" />
      <h2 id="bookable-services" className="font-display text-h3">{L('Предложения специалистов', 'Provider offers', 'ข้อเสนอจากผู้ให้บริการ')}</h2>
    </div>
    <p className="text-sm text-muted-foreground">{L('Укажите удобное время. Запись нужно подтвердить с исполнителем.', 'Request a suitable time. The provider must confirm the booking.', 'ระบุเวลาที่สะดวก ผู้ให้บริการต้องยืนยันการจอง')}</p>
    {filtersUI}
    {Boolean(data && data.length >= 60) && <p role="status" className="text-sm text-muted-foreground">{L('Фильтры применяются к подборке из 60 последних опубликованных предложений. За дополнительным подбором обратитесь к консьержу.', 'Filters apply to the latest 60 published offers. Ask concierge for a wider selection.', 'ตัวกรองใช้กับ 60 ข้อเสนอที่เผยแพร่ล่าสุด ติดต่อคอนเซียร์จเพื่อค้นหาเพิ่มเติม')}</p>}
    {isLoading ? <div role="status" aria-label={L('Загружаем услуги', 'Loading services', 'กำลังโหลดบริการ')} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-64" />)}</div>
      : isError ? <div role="alert" className="border border-border p-4 space-y-3"><p>{L('Не удалось загрузить услуги.', 'Could not load services.', 'โหลดบริการไม่สำเร็จ')}</p><Button variant="outline" onClick={() => refetch()}>{L('Повторить', 'Retry', 'ลองใหม่')}</Button>{fallback}</div>
      : checking ? <p role="status">{L('Проверяем свободное время…', 'Checking request slots…', 'กำลังตรวจสอบเวลาว่าง…')}</p>
      : <>
        {(failedCount > 0 || availability.isError) && <div role="alert" className="border border-border p-4 space-y-2"><p>{L('Не удалось проверить часть графиков. Такие предложения исключены из результатов на дату; это не означает, что они заняты.', 'Some schedules could not be checked. These offers are excluded from date results; this does not mean they are booked.', 'ตรวจสอบตารางเวลาบางส่วนไม่สำเร็จ ข้อเสนอเหล่านี้ไม่รวมในผลลัพธ์ ไม่ได้หมายความว่าถูกจองแล้ว')}</p><Button variant="outline" onClick={() => availability.refetch()}>{L('Повторить проверку графика', 'Retry schedule check', 'ลองตรวจสอบตารางเวลาอีกครั้ง')}</Button></div>}
        {unknownCount > 0 && <div className="space-y-2" role="status"><p>{L(
          `Для ${unknownCount} предложений график не подтверждён. Они не включены в результаты на выбранную дату.`,
          `The schedule is unknown for ${unknownCount} offers. They are excluded from the selected date results.`,
          `ยังไม่ทราบตารางเวลาของ ${unknownCount} ข้อเสนอ จึงไม่รวมในผลลัพธ์ของวันที่เลือก`)}</p><Button variant="ghost" onClick={() => availability.refetch()}>{L('Проверить снова', 'Check again', 'ตรวจสอบอีกครั้ง')}</Button></div>}
        {list.length === 0 ? <div className="border border-border p-4 space-y-3">
          <p>{search.trim() && !filters.active ? L('По вашему запросу ничего не найдено. Измените поиск.', 'No services match your search. Try another search.', 'ไม่พบบริการที่ตรงกับการค้นหา') : L('Нет подтверждённых предложений под эти фильтры. Измените условия или попросите консьержа помочь.', 'No confirmed offers match these filters. Adjust them or ask concierge for help.', 'ไม่มีข้อเสนอที่ยืนยันตรงกับตัวกรอง เปลี่ยนเงื่อนไขหรือขอความช่วยเหลือ')}</p>{fallback}
        </div> : <>
          <p role="status" className="text-sm text-muted-foreground">{L(`Предложений: ${list.length}`, `Offers: ${list.length}`, `ข้อเสนอ: ${list.length}`)}</p>
          {popular.length > 0 && <section aria-labelledby="popular-provider-services" className="space-y-3">
            <h3 id="popular-provider-services" className="font-display text-h3">{L('Популярно сейчас', 'Popular now', 'ยอดนิยมตอนนี้')}</h3>
            <p className="text-sm text-muted-foreground">{L('Подборка по числу отзывов и рейтингу провайдеров, а не по статистике заказов.', 'Selected by provider review count and rating, not live booking demand.', 'คัดเลือกจากจำนวนรีวิวและคะแนนผู้ให้บริการ ไม่ใช่จำนวนการจองปัจจุบัน')}</p>
            {renderCards(popular)}
          </section>}
          {rest.length > 0 && <div className="space-y-3">{popular.length > 0 && <h3 className="font-display text-h3">{L('Другие предложения', 'More offers', 'ข้อเสนอเพิ่มเติม')}</h3>}{renderCards(expanded ? rest : rest.slice(0, 8))}{rest.length > 8 && <Button variant="outline" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>{expanded ? L('Свернуть предложения', 'Show fewer offers', 'แสดงข้อเสนอน้อยลง') : L('Показать остальные предложения', 'Show remaining offers', 'แสดงข้อเสนอที่เหลือ')}</Button>}</div>}
          {fallback && <div className="border border-border p-4 space-y-3"><p className="text-sm text-muted-foreground">{L('Нужна другая услуга или график не указан? Консьерж поможет уточнить запрос.', 'Need something else or a schedule is missing? Concierge can help clarify your request.', 'ต้องการบริการอื่นหรือยังไม่มีตารางเวลา? คอนเซียร์จช่วยได้')}</p>{fallback}</div>}
        </>}
      </>}
    <ServiceBookingSheet key={`${selected?.id ?? 'none'}:${filters.date}`} service={selected} initialDate={filters.date || undefined} open={!!selected} onOpenChange={open => !open && setSelected(null)} onConcierge={onConcierge ? () => { setSelected(null); onConcierge(); } : undefined} />
  </section>;
}
