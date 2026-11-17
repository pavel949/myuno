import '@/styles/public-commerce.css';
import { useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Ship } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { MarketplaceRequestSteps } from '@/components/services/MarketplaceRequestSteps';
import { useYachts } from '@/hooks/useYachts';
import { mapYachtToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { VerticalContextBanner } from '@/components/vertical/VerticalContextBanner';
import { VerticalInsightPanel } from '@/components/vertical/VerticalInsightPanel';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';
import { vertRowsToMarkers } from '@/lib/adapters/vertRowToMarker';
import { pickLang } from '@/lib/i18n/pickLang';
import { comparableYachtPrices, readYachtFilters, selectYachts } from '@/lib/discovery/yachtCatalogue';

const TYPES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', labelTh: 'ทั้งหมด' },
  { id: 'motor_yacht', labelEn: 'Motor yachts', labelRu: 'Моторные', labelTh: 'เรือยอชต์ยนต์' },
  { id: 'catamaran', labelEn: 'Catamarans', labelRu: 'Катамараны', labelTh: 'เรือคาตามารัน' },
  { id: 'speedboat', labelEn: 'Speedboats', labelRu: 'Спидботы', labelTh: 'เรือสปีดโบ๊ท' },
  { id: 'superyacht', labelEn: 'Superyachts', labelRu: 'Суперяхты', labelTh: 'ซูเปอร์ยอชต์' },
];
const SORTS = [
  { id: 'featured', en: 'Recommended', ru: 'Рекомендуемые', th: 'แนะนำ' },
  { id: 'price_asc', en: 'Full day: price ↑', ru: 'Полный день: цена ↑', th: 'เต็มวัน: ราคา ↑' },
  { id: 'price_desc', en: 'Full day: price ↓', ru: 'Полный день: цена ↓', th: 'เต็มวัน: ราคา ↓' },
  { id: 'rating', en: 'Top rated', ru: 'По рейтингу', th: 'คะแนนสูงสุด' },
  { id: 'capacity', en: 'Capacity', ru: 'Вместимость', th: 'จำนวนผู้โดยสาร' },
];

export default function YachtsIndex() {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const pending = useRef({ key: location.key, params });
  if (pending.current.key !== location.key) pending.current = { key: location.key, params };
  const filters = useMemo(() => readYachtFilters(params), [params]);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(pending.current.params);
    if (!value || value === 'all' || value === 'featured') next.delete(key); else next.set(key, value);
    pending.current.params = next;
    setParams(next, { replace: key === 'q' || key === 'guests' });
  };
  const clear = () => {
    const next = new URLSearchParams(pending.current.params);
    ['type', 'sort', 'q', 'guests'].forEach(key => next.delete(key));
    pending.current.params = next;
    setParams(next);
  };
  const active = filters.type !== 'all' || filters.sort !== 'featured' || Boolean(filters.query || filters.guests);
  const { yachts, isLoading, error, refetch } = useYachts(filters.invalid || filters.type === 'all' ? undefined : filters.type);
  const { applyFilter } = usePersonaFilter();
  const filtered = useMemo(() => selectYachts(applyFilter(yachts, y => [...(y.features_en || []), ...(y.features_ru || []), y.yacht_type]), filters), [yachts, applyFilter, filters]);
  const comparable = comparableYachtPrices(filtered);
  const priceSort = filters.sort === 'price_asc' || filters.sort === 'price_desc';
  const grid = 'grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:gap-6 lg:grid-cols-3';

  return <MiniAppLayout title={t('Яхты и морские прогулки', 'Yachts & sea trips', 'เรือยอชต์และทริปทะเล')}
    contentClassName="public-commerce" fallbackPath="/experiences" showHero={false} showFilter={false}
    subtitle={error ? t('Каталог временно недоступен', 'Catalogue temporarily unavailable', 'รายการไม่พร้อมใช้งานชั่วคราว') : isLoading ? t('Загружаем предложения…', 'Loading offers…', 'กำลังโหลดข้อเสนอ…') : filters.invalid ? t('Проверьте фильтры', 'Check filters', 'ตรวจสอบตัวกรอง') : t(`Найдено: ${filtered.length}`, `${filtered.length} results`, `${filtered.length} รายการ`)}
    showSearch searchValue={filters.query} onSearchChange={value => update('q', value)} searchPlaceholder={t('Название яхты или место отправления…', 'Yacht name or departure location…', 'ชื่อเรือหรือจุดออกเดินทาง…')}
    categories={TYPES} selectedCategory={filters.type} onCategoryChange={value => update('type', value)}
    mapMarkers={error || filters.invalid ? undefined : vertRowsToMarkers(filtered)} onMapMarkerSelect={id => navigate(`/yachts/${id}`)} mapIconChar="⚓"
    stickySubHeader={<div className="flex flex-wrap items-end gap-3 px-4 py-3">
      <label className="min-w-0 flex-1 text-xs">{t('Гостей, не менее', 'Guests, at least', 'จำนวนผู้โดยสารขั้นต่ำ')}<Input className="mt-1 min-h-11" type="number" min="1" max="1000" inputMode="numeric" value={filters.guests} onChange={event => update('guests', event.target.value)} placeholder={t('Любое число', 'Any number', 'ไม่ระบุ')} /></label>
      <label className="min-w-0 flex-1 text-xs sm:ml-auto">{t('Сортировка', 'Sort by', 'เรียงลำดับ')}<select className="mt-1 min-h-11 w-full border border-border bg-background px-3 text-sm text-foreground focus-visible:ring-2 focus-visible:ring-ring" value={filters.sort} onChange={event => update('sort', event.target.value)}>{SORTS.map(item => <option key={item.id} value={item.id} disabled={!comparable && item.id.startsWith('price_')}>{pickLang(language, item)}</option>)}</select></label>
      {active && <Button variant="outline" onClick={clear}>{t('Сбросить', 'Reset', 'ล้าง')}</Button>}
    </div>}>
    <SEOHead title={t('Чартер яхт на Пхукете', 'Yacht charters in Phuket', 'เช่าเรือยอชต์ในภูเก็ต')} description={t('Выберите яхту, катамаран или спидбот. Изучите вместимость, тарифы и условия, затем согласуйте поездку с myUNO.', 'Find a yacht, catamaran or speedboat. Review capacity, rates and terms, then plan your trip with myUNO.', 'เลือกเรือยอชต์ คาตามารัน หรือสปีดโบ๊ท ตรวจสอบจำนวนผู้โดยสาร ราคาและเงื่อนไข แล้ววางแผนกับ myUNO')} />
    <section className="py-4" aria-label={t('О морских прогулках', 'About sea trips', 'เกี่ยวกับทริปทะเล')}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">myUNO · {t('Пхукет', 'Phuket', 'ภูเก็ต')}</p>
      <h2 className="mt-2 font-display text-2xl sm:text-3xl">{t('Ваш день на море', 'Your day at sea', 'วันพักผ่อนบนทะเลของคุณ')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('Выберите судно по вместимости и изучите маршруты. Дата, программа, итоговая стоимость и доступность согласуются при оформлении с myUNO.', 'Choose a boat for your group and explore its routes. Date, itinerary, final price and availability are confirmed with myUNO when arranging your trip.', 'เลือกเรือให้เหมาะกับกลุ่มและดูเส้นทาง วันที่ โปรแกรม ราคาสุดท้ายและความพร้อมต้องยืนยันกับ myUNO')}</p>
    </section>
    {!active && <VerticalContextBanner verticalId="yacht" />}
    {priceSort && <p role="status" className="text-sm text-muted-foreground">{!comparable ? t('Цены в разных или неизвестных валютах нельзя сравнить. Используйте другую сортировку.', 'Prices in different or unknown currencies cannot be compared. Please choose another sort.', 'ไม่สามารถเปรียบเทียบราคาต่างสกุลเงินหรือไม่ทราบสกุลเงินได้ โปรดเลือกวิธีเรียงอื่น') : t('Сортируем по тарифу за полный день. На карточке указан минимальный тариф с его длительностью.', 'Sorted by the full-day rate. Cards show the lowest recorded rate and its duration.', 'เรียงตามราคาเต็มวัน การ์ดแสดงราคาต่ำสุดที่บันทึกไว้และระยะเวลา')}</p>}
    <section aria-label={t('Предложения яхт', 'Yacht offers', 'ข้อเสนอเรือยอชต์')}>
      {error ? <div role="alert" className="space-y-3 border border-border p-6"><p>{t('Не удалось загрузить яхты. Попробуйте ещё раз.', 'Yachts could not be loaded. Please try again.', 'โหลดรายการเรือไม่สำเร็จ โปรดลองอีกครั้ง')}</p><Button variant="outline" onClick={() => refetch()}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button></div>
        : filters.invalid ? <EmptyState icon={Ship} title={t('Неизвестный фильтр', 'Unknown filter', 'ไม่พบตัวกรอง')} action={<Button variant="outline" onClick={clear}>{t('Сбросить фильтры', 'Clear filters', 'ล้างตัวกรอง')}</Button>} />
        : isLoading ? <div role="status" aria-label={t('Загрузка яхт', 'Loading yachts', 'กำลังโหลดเรือ')} className={grid}>{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-[4/3] rounded-none" />)}</div>
        : !filtered.length ? <EmptyState icon={Ship} title={t('По этим условиям яхт пока нет', 'No boats match these filters', 'ไม่พบเรือที่ตรงกับตัวกรอง')} action={active ? <Button variant="outline" onClick={clear}>{t('Сбросить фильтры', 'Clear filters', 'ล้างตัวกรอง')}</Button> : undefined} />
        : <div className={grid}>{filtered.map(yacht => <CatalogCard className="public-commerce-catalog-card" key={yacht.id} {...mapYachtToCatalogCard(yacht, language, navigate)} onClick={undefined} href={`/yachts/${yacht.id}`} />)}</div>}
    </section>
    <MarketplaceRequestSteps />
    <VerticalInsightPanel verticalId="yacht" /><CrossSellSection currentVertical="yachts" className="mt-8" />
  </MiniAppLayout>;
}
