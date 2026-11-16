import '@/styles/public-commerce.css';
import { useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, Waves, X } from 'lucide-react';
import { SEOHead } from '@/components/seo';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { PropertyTourPromo } from '@/components/experiences/PropertyTourPromo';
import { ExperienceCategoryMenu } from '@/components/experiences/ExperienceCategoryMenu';
import { MarketplaceDiscoveryHero } from '@/components/services/MarketplaceDiscoveryHero';
import { useExperiences } from '@/hooks/useExperiences';
import { useExperienceCategories } from '@/hooks/useExperienceCategories';
import { mapExperienceToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { vertRowsToMarkers } from '@/lib/adapters/vertRowToMarker';
import { pickLang } from '@/lib/i18n/pickLang';
import { sanitizeSearchTerm } from '@/lib/sanitizeSearch';
import { publicJourneyState } from '@/lib/real-estate/publicJourney';
import { formatRecordedPrice } from '@/lib/format/price';
import { CURRENCIES } from '@/lib/config/currencies';
import { VerticalContextBanner } from '@/components/vertical/VerticalContextBanner';
import { VerticalInsightPanel } from '@/components/vertical/VerticalInsightPanel';

type ViewType = 'all' | 'tour' | 'activity';
type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating';
const TYPES = ['all', 'tour', 'activity'] as const;
const SORT_OPTIONS = [
  { id: 'recommended', en: 'Recommended', ru: 'Рекомендуемые', th: 'แนะนำ' },
  { id: 'price_asc', en: 'Price: low to high', ru: 'Цена по возрастанию', th: 'ราคา: ต่ำไปสูง' },
  { id: 'price_desc', en: 'Price: high to low', ru: 'Цена по убыванию', th: 'ราคา: สูงไปต่ำ' },
  { id: 'rating', en: 'Top rated', ru: 'По рейтингу', th: 'คะแนนสูงสุด' },
] as const;
const priceValue = (value: number | null) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

export default function ExperiencesIndex() {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const navigate = useNavigate();
  const location = useLocation();
  const catalogueNavigationState = useMemo(() => publicJourneyState(location), [location]);
  const openExperience = (path: string) => navigate(path, { state: catalogueNavigationState });
  const [params, setParams] = useSearchParams();
  const pendingQuery = useRef({ key: location.key, params });
  if (pendingQuery.current.key !== location.key) pendingQuery.current = { key: location.key, params };
  // The URL owns filters: links, refresh and browser Back all render the same selection.
  const rawType = params.get('type') || 'all';
  const viewType = TYPES.includes(rawType as ViewType) ? rawType as ViewType : 'all';
  const selectedCategory = params.get('category') || 'all';
  const query = params.get('q') || '';
  const rawSort = params.get('sort') || 'recommended';
  const sortKey = SORT_OPTIONS.some(item => item.id === rawSort) ? rawSort as SortKey : 'recommended';
  const cleanQuery = sanitizeSearchTerm(query);
  const invalidFilters = rawType !== viewType || rawSort !== sortKey || Boolean(query.trim() && !cleanQuery);
  const { experiences, isLoading, error, refetch } = useExperiences({
    type: viewType === 'all' ? undefined : viewType,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: cleanQuery || undefined,
  });
  const categoriesQuery = useExperienceCategories();
  const categories = categoriesQuery.data ?? [];
  const availableCategories = categories.filter(category => viewType === 'all' || category.experience_type === 'all' || category.experience_type === viewType);
  const filtered = viewType !== 'all' || selectedCategory !== 'all' || Boolean(query.trim()) || sortKey !== 'recommended' || invalidFilters;
  const overview = !filtered;
  const pricedCurrencies = experiences.filter(exp => priceValue(exp.price) !== null).map(exp => exp.currency?.trim().toUpperCase());
  const comparablePrices = new Set(pricedCurrencies).size <= 1 && pricedCurrencies.every(code => Boolean(code) && Object.prototype.hasOwnProperty.call(CURRENCIES, code));
  const priceSortUnavailable = !comparablePrices && (sortKey === 'price_asc' || sortKey === 'price_desc');
  const sorted = useMemo(() => {
    const rows = [...experiences];
    if (priceSortUnavailable) return rows;
    if (sortKey === 'rating') return rows.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortKey === 'price_asc' || sortKey === 'price_desc') return rows.sort((a, b) => {
      const first = priceValue(a.price), second = priceValue(b.price);
      // Unrecorded prices remain unknown, never the cheapest (or a free offer).
      if (first === null) return second === null ? 0 : 1;
      if (second === null) return -1;
      return sortKey === 'price_asc' ? first - second : second - first;
    });
    return rows;
  }, [experiences, sortKey, priceSortUnavailable]);
  const update = (key: 'type' | 'category' | 'sort' | 'q', value: string) => {
    const next = new URLSearchParams(pendingQuery.current.params);
    if (!value || value === 'all' || value === 'recommended') next.delete(key); else next.set(key, value);
    const currentCategory = next.get('category');
    if (key === 'type' && currentCategory && currentCategory !== 'all') {
      const selected = categories.find(category => category.slug === currentCategory);
      if (selected && value !== 'all' && selected.experience_type !== 'all' && selected.experience_type !== value) next.delete('category');
    }
    pendingQuery.current.params = next;
    setParams(next, { replace: key === 'q' });
  };
  const clear = () => {
    const next = new URLSearchParams(pendingQuery.current.params);
    for (const key of ['type', 'category', 'sort', 'q']) next.delete(key);
    pendingQuery.current.params = next;
    setParams(next);
  };
  const title = t('Впечатления', 'Experiences', 'ประสบการณ์');
  return <MiniAppLayout contentClassName="public-commerce public-commerce--experiences" title={title}
    subtitle={error ? t('Каталог временно недоступен', 'Catalogue temporarily unavailable', 'รายการไม่พร้อมใช้งานชั่วคราว')
      : isLoading ? t('Загружаем предложения…', 'Loading offers…', 'กำลังโหลดข้อเสนอ…')
      : invalidFilters ? t('Проверьте выбранные фильтры', 'Check the selected filters', 'ตรวจสอบตัวกรองที่เลือก')
      : t(`Найдено: ${sorted.length}`, `${sorted.length} results`, `${sorted.length} รายการ`)}
    fallbackPath="/" showHero={false} showFilter={false} showCategories={false}
    searchValue={query} onSearchChange={value => update('q', value)} searchPlaceholder={t('Найти впечатление…', 'Search experiences…', 'ค้นหาประสบการณ์…')}
    mapMarkers={invalidFilters || error ? [] : vertRowsToMarkers(sorted, { titleFields: ['title_en', 'name_en'], titleRuFields: ['title_ru', 'name_ru'] })}
    onMapMarkerSelect={id => openExperience(`/experiences/${id}`)} mapIconChar="🧭"
    stickySubHeader={<div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <div className="flex flex-wrap gap-1" role="group" aria-label={t('Тип впечатления', 'Experience type', 'ประเภทประสบการณ์')}>
        {TYPES.map(type => <Button key={type} size="sm" variant={viewType === type && !invalidFilters ? 'secondary' : 'ghost'} aria-pressed={viewType === type && !invalidFilters} onClick={() => update('type', type)}>
          {type === 'tour' ? <Compass className="size-4" aria-hidden="true" /> : type === 'activity' ? <Waves className="size-4" aria-hidden="true" /> : null}
          {type === 'all' ? t('Все', 'All', 'ทั้งหมด') : type === 'tour' ? t('Экскурсии', 'Tours', 'ทัวร์') : t('Активный отдых', 'Activities', 'กิจกรรม')}
        </Button>)}
      </div>
      <label className="ml-auto flex min-w-0 max-w-full items-center gap-2 text-sm"><span className="sr-only">{t('Сортировка', 'Sort experiences', 'เรียงลำดับประสบการณ์')}</span>
        <select className="min-h-11 min-w-0 w-full border border-border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={sortKey} onChange={event => update('sort', event.target.value)}>
          {SORT_OPTIONS.map(item => <option key={item.id} value={item.id} disabled={!comparablePrices && (item.id === 'price_asc' || item.id === 'price_desc')}>{pickLang(language, item)}</option>)}
        </select>
      </label>
    </div>}>
    <SEOHead title={t('Впечатления на Пхукете', 'Experiences in Phuket', 'ประสบการณ์ในภูเก็ต')}
      description={t('Экскурсии, острова и активный отдых: выберите тему и изучите предложения.', 'Tours, islands and activities: choose a category and explore the offers.', 'ทัวร์ เกาะ และกิจกรรม: เลือกหมวดหมู่และสำรวจข้อเสนอ')} />
    {overview && <MarketplaceDiscoveryHero kind="experiences" />}
    {categoriesQuery.isError && <div role="alert" className="space-y-3 border border-border p-4"><p>{t('Не удалось загрузить темы. Каталог и поиск остаются доступны.', 'Categories could not be loaded. You can still browse and search the catalogue.', 'โหลดหมวดหมู่ไม่สำเร็จ คุณยังสามารถดูและค้นหาในรายการได้')}</p><Button variant="outline" onClick={() => categoriesQuery.refetch()}>{t('Повторить загрузку тем', 'Retry categories', 'ลองโหลดหมวดหมู่อีกครั้ง')}</Button></div>}
    {selectedCategory === 'all' && !query.trim() && !categoriesQuery.isError && <ExperienceCategoryMenu categories={availableCategories} selected={selectedCategory} onSelect={slug => update('category', slug)} />}
    {filtered && <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4" role="group" aria-label={t('Выбранные фильтры', 'Selected filters', 'ตัวกรองที่เลือก')}>
      <p className="min-w-0 text-sm">{selectedCategory !== 'all' ? (language === 'ru' ? categories.find(c => c.slug === selectedCategory)?.name_ru : categories.find(c => c.slug === selectedCategory)?.name_en) || selectedCategory : t('Выбраны условия поиска', 'Search filters selected', 'เลือกตัวกรองการค้นหาแล้ว')}</p>
      <Button variant="outline" onClick={clear}><X className="size-4" aria-hidden="true" />{t('Сбросить фильтры', 'Clear filters', 'ล้างตัวกรอง')}</Button>
    </div>}
    {overview && <VerticalContextBanner verticalId="experience" />}
    {priceSortUnavailable && <p role="status" className="border border-border bg-muted/30 p-4 text-sm text-muted-foreground">{t('Цены указаны в разных или неуточнённых валютах. Выберите тему с одной валютой или используйте сортировку по рейтингу.', 'Prices use different or unspecified currencies. Choose a category with one currency or sort by rating.', 'ราคามีหลายสกุลเงินหรือยังไม่ระบุ เลือกหมวดหมู่ที่ใช้สกุลเงินเดียวหรือเรียงตามคะแนน')}</p>}
    <section aria-labelledby="experience-results-title" className="space-y-4">
      <h2 id="experience-results-title" className="font-display text-h3">{viewType === 'tour' ? t('Экскурсии', 'Tours', 'ทัวร์') : viewType === 'activity' ? t('Активный отдых', 'Activities', 'กิจกรรม') : t('Предложения', 'Offers', 'ข้อเสนอ')}</h2>
      {error ? <div role="alert" className="space-y-3 border border-border p-6"><p>{t('Не удалось загрузить впечатления. Попробуйте ещё раз.', 'Experiences could not be loaded. Please try again.', 'โหลดประสบการณ์ไม่สำเร็จ โปรดลองอีกครั้ง')}</p><Button variant="outline" onClick={() => refetch()}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button></div>
        : invalidFilters ? <EmptyState icon={Compass} title={t('Неизвестный фильтр', 'Unknown filter', 'ไม่พบตัวกรอง')} description={t('Сбросьте фильтры и выберите условия заново.', 'Clear the filters and choose your preferences again.', 'ล้างตัวกรองและเลือกเงื่อนไขอีกครั้ง')} />
        : isLoading ? <div role="status" aria-label={t('Загружаем впечатления', 'Loading experiences', 'กำลังโหลดประสบการณ์')} className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-[4/3] rounded-none" />)}</div>
        : !sorted.length ? <EmptyState icon={Compass} title={t('По этим условиям пока нет предложений', 'No offers match these filters', 'ยังไม่มีข้อเสนอที่ตรงกับตัวกรอง')} description={t('Выберите другую тему или сбросьте фильтры.', 'Choose another category or clear the filters.', 'เลือกหมวดหมู่อื่นหรือล้างตัวกรอง')} />
        : <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:gap-6 lg:grid-cols-3">{sorted.map(exp => {
          const card = mapExperienceToCatalogCard(exp, language, openExperience);
          const knownPrice = priceValue(exp.price);
          const sourceCurrency = exp.currency?.trim().toUpperCase();
          const priceLabel = sourceCurrency === 'THB' && knownPrice !== null ? undefined : formatRecordedPrice(knownPrice, sourceCurrency, { unknownLabel: t('Цена по запросу', 'Price on request', 'สอบถามราคา'), locale: language, allowZero: true });
          return <CatalogCard className="public-commerce-catalog-card" key={exp.id} {...card} onClick={undefined} href={`/experiences/${exp.id}`} navigationState={catalogueNavigationState} price={sourceCurrency === 'THB' && knownPrice !== null ? knownPrice : undefined} priceLabel={priceLabel && knownPrice !== null && card.priceSuffix ? `${priceLabel} ${card.priceSuffix}` : priceLabel} priceSuffix={knownPrice !== null ? card.priceSuffix : undefined} />;
        })}</div>}
    </section>
    <div className="mt-6"><PropertyTourPromo /></div><VerticalInsightPanel verticalId="experience" /><CrossSellSection currentVertical="experiences" className="mt-8" />
  </MiniAppLayout>;
}
