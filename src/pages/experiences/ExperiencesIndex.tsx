import { EXPERIENCE_DURATIONS, matchesExperienceFilters, readExperienceFilters } from '@/lib/experiences/discoveryFilters';
import { EXPERIENCE_DISCOVERY_GROUPS, experienceGroup, isFixedVenue } from '@/lib/taxonomies/experienceDiscovery';
import { PUBLIC_CATALOG_GRID } from '@/design-system/ecosystemLayout';
import '@/styles/public-commerce.css';
import { useEffect, useMemo, useRef } from 'react';
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
import { MarketplaceFilterSheet } from '@/components/services/MarketplaceFilterSheet';
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
  const discovery = useMemo(() => readExperienceFilters(params), [params]);
  const selectedGroup = params.get('group') || 'all';
  const venueOnly = params.get('place') === 'fixed';
  const groupRecord = EXPERIENCE_DISCOVERY_GROUPS.find(group => group.id === selectedGroup);
  const cleanQuery = sanitizeSearchTerm(query);
  const invalidFilters = discovery.invalid || (selectedGroup !== 'all' && !groupRecord) || (!!params.get('place') && !venueOnly) || rawType !== viewType || rawSort !== sortKey || Boolean(query.trim() && !cleanQuery);
  const { experiences: loadedExperiences, isLoading, error, refetch } = useExperiences({
    publishedOnly: true,
    type: viewType === 'all' ? undefined : viewType,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    search: cleanQuery || undefined,
  });
  const experiences = useMemo(() => loadedExperiences.filter(item => (selectedGroup === 'all' || experienceGroup(item.category) === selectedGroup) && (!venueOnly || isFixedVenue(item))), [loadedExperiences, selectedGroup, venueOnly]);
  const categoriesQuery = useExperienceCategories();
  const categories = categoriesQuery.data ?? [];
  const availableCategories = categories.filter(category => (selectedGroup === 'all' || experienceGroup(category.slug) === selectedGroup)).filter(category => viewType === 'all' || category.experience_type === 'all' || category.experience_type === viewType);
  const categoryRecord = categories.find(category => category.slug === selectedCategory);
  const categoryName = categoryRecord ? (language === 'ru' ? categoryRecord.name_ru || categoryRecord.name_en : categoryRecord.name_en || categoryRecord.name_ru) : '';
  const filtered = discovery.min !== undefined || discovery.max !== undefined || Boolean(discovery.duration) || selectedGroup !== 'all' || venueOnly || viewType !== 'all' || selectedCategory !== 'all' || Boolean(query.trim()) || sortKey !== 'recommended' || invalidFilters;
  const overview = !filtered;
  const pricedCurrencies = experiences.filter(exp => matchesExperienceFilters(exp, discovery) && priceValue(exp.price) !== null).map(exp => exp.currency?.trim().toUpperCase());
  const comparablePrices = new Set(pricedCurrencies).size <= 1 && pricedCurrencies.every(code => Boolean(code) && Object.prototype.hasOwnProperty.call(CURRENCIES, code));
  const priceSortUnavailable = !comparablePrices && (sortKey === 'price_asc' || sortKey === 'price_desc');
  const sorted = useMemo(() => {
    const rows = experiences.filter(row => matchesExperienceFilters(row, discovery));
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
  }, [experiences, sortKey, priceSortUnavailable, discovery]);
  const update = (key: 'type' | 'category' | 'sort' | 'q' | 'group' | 'place' | 'minPrice' | 'maxPrice' | 'duration', value: string) => {
    const next = new URLSearchParams(pendingQuery.current.params);
    if (!value || value === 'all' || value === 'recommended') next.delete(key); else next.set(key, value);
    if (key === 'group') next.delete('category');
    const currentCategory = next.get('category');
    if (key === 'type' && currentCategory && currentCategory !== 'all') {
      const selected = categories.find(category => category.slug === currentCategory);
      if (selected && value !== 'all' && selected.experience_type !== 'all' && selected.experience_type !== value) next.delete('category');
    }
    pendingQuery.current.params = next;
    setParams(next, { replace: key === 'q' || key === 'minPrice' || key === 'maxPrice' });
  };
  const clear = () => {
    const next = new URLSearchParams(pendingQuery.current.params);
    for (const key of ['type', 'category', 'sort', 'q', 'group', 'place', 'minPrice', 'maxPrice', 'duration']) next.delete(key);
    pendingQuery.current.params = next;
    setParams(next);
  };
  const focusResults = useRef(false);
  useEffect(() => {
    if (focusResults.current) { document.getElementById('experience-results-title')?.focus({ preventScroll: true }); focusResults.current = false; }
  }, [selectedCategory, selectedGroup]);
  const categoryImages = Object.fromEntries(categories.flatMap(category => {
    const image = experiences.find(item => item.category === category.slug && item.cover_image)?.cover_image;
    return image ? [[category.slug, image]] : [];
  }));
  const durationLabel = (value: string) => value === 'short' ? t('До 2 часов', 'Up to 2 hours', 'ไม่เกิน 2 ชั่วโมง') : value === 'half-day' ? t('2–6 часов', '2–6 hours', '2–6 ชั่วโมง') : value === 'full-day' ? t('Больше 6 часов', 'Over 6 hours', 'มากกว่า 6 ชั่วโมง') : value;
  const selectedFilters = [
    ...(groupRecord ? [{ key: 'group' as const, label: pickLang(language, groupRecord) }] : []),
    ...(venueOnly ? [{ key: 'place' as const, label: t('Места, куда можно приехать', 'Places you can visit', 'สถานที่ที่สามารถไปเยี่ยมชมได้') }] : []),
    ...(query ? [{ key: 'q' as const, label: query }] : []),
    ...(selectedCategory !== 'all' ? [{ key: 'category' as const, label: categoryName || selectedCategory }] : []),
    ...(viewType !== 'all' ? [{ key: 'type' as const, label: viewType === 'tour' ? t('Экскурсии', 'Tours', 'ทัวร์') : t('Активный отдых', 'Activities', 'กิจกรรม') }] : []),
    ...(params.has('minPrice') ? [{ key: 'minPrice' as const, label: `${t('От', 'From', 'ตั้งแต่')} ${params.get('minPrice')} THB` }] : []),
    ...(params.has('maxPrice') ? [{ key: 'maxPrice' as const, label: `${t('До', 'Up to', 'ไม่เกิน')} ${params.get('maxPrice')} THB` }] : []),
    ...(discovery.duration ? [{ key: 'duration' as const, label: durationLabel(discovery.duration) }] : []),
    ...(sortKey !== 'recommended' ? [{ key: 'sort' as const, label: pickLang(language, SORT_OPTIONS.find(item => item.id === sortKey)!) }] : []),
  ];
  const title = t('Впечатления', 'Experiences', 'ประสบการณ์');
  return <MiniAppLayout pageWidth="catalogue" contentClassName="public-commerce public-commerce--experiences" title={title}
    subtitle={error ? t('Каталог временно недоступен', 'Catalogue temporarily unavailable', 'รายการไม่พร้อมใช้งานชั่วคราว')
      : isLoading ? t('Загружаем предложения…', 'Loading offers…', 'กำลังโหลดข้อเสนอ…')
      : invalidFilters ? t('Проверьте выбранные фильтры', 'Check the selected filters', 'ตรวจสอบตัวกรองที่เลือก')
      : t(`Найдено: ${sorted.length}`, `${sorted.length} results`, `${sorted.length} รายการ`)}
    fallbackPath="/" showHero={false} showFilter compactMapToggle showCategories={false}
    searchValue={query} onSearchChange={value => update('q', value)} searchPlaceholder={t('Найти впечатление…', 'Search experiences…', 'ค้นหาประสบการณ์…')}
    mapMarkers={invalidFilters || error ? [] : vertRowsToMarkers(sorted, { titleFields: ['title_en', 'name_en'], titleRuFields: ['title_ru', 'name_ru'] })}
    onMapMarkerSelect={id => openExperience(`/experiences/${id}`)} mapIconChar="🧭"
    filterButton={<MarketplaceFilterSheet title={t('Фильтры впечатлений', 'Experience filters', 'ตัวกรองประสบการณ์')} activeCount={[selectedGroup !== 'all', venueOnly, viewType !== 'all', selectedCategory !== 'all', sortKey !== 'recommended', params.has('minPrice'), params.has('maxPrice'), Boolean(discovery.duration)].filter(Boolean).length}><div className="space-y-4">
      <label className="flex flex-col gap-2 text-sm"><span className="font-medium">{t('Раздел', 'Section', 'หมวดหลัก')}</span>
        <select className="min-h-11 w-full border border-border bg-background px-3" value={selectedGroup} onChange={event => update('group', event.target.value)}>
          <option value="all">{t('Все впечатления', 'All experiences', 'ประสบการณ์ทั้งหมด')}</option>
          {EXPERIENCE_DISCOVERY_GROUPS.map(group => <option key={group.id} value={group.id}>{pickLang(language, group)}</option>)}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={venueOnly} onChange={event => update('place', event.target.checked ? 'fixed' : '')} />{t('Места, куда можно приехать', 'Places you can visit', 'สถานที่ที่สามารถไปเยี่ยมชมได้')}</label>
      <div className="flex flex-wrap gap-1" role="group" aria-label={t('Тип впечатления', 'Experience type', 'ประเภทประสบการณ์')}>
        {TYPES.map(type => <Button key={type} size="sm" variant={viewType === type && !invalidFilters ? 'secondary' : 'ghost'} aria-pressed={viewType === type && !invalidFilters} onClick={() => update('type', type)}>
          {type === 'tour' ? <Compass className="size-4" aria-hidden="true" /> : type === 'activity' ? <Waves className="size-4" aria-hidden="true" /> : null}
          {type === 'all' ? t('Все', 'All', 'ทั้งหมด') : type === 'tour' ? t('Экскурсии', 'Tours', 'ทัวร์') : t('Активный отдых', 'Activities', 'กิจกรรม')}
        </Button>)}
      </div>
      <fieldset className="space-y-2"><legend className="text-sm font-medium">{t('Цена из карточки, THB', 'Listed price, THB', 'ราคาที่ระบุ, THB')}</legend>
        <div className="grid grid-cols-2 gap-3">{(['minPrice', 'maxPrice'] as const).map(key => <label key={key} className="space-y-1 text-sm"><span>{key === 'minPrice' ? t('От', 'Minimum price', 'ราคาต่ำสุด') : t('До', 'Maximum price', 'ราคาสูงสุด')}</span><input aria-label={key === 'minPrice' ? t('От', 'Minimum price', 'ราคาต่ำสุด') : t('До', 'Maximum price', 'ราคาสูงสุด')} type="number" inputMode="decimal" min="0" step="0.01" value={params.get(key) || ''} onChange={event => update(key, event.target.value)} className="min-h-11 w-full min-w-0 border border-border bg-background px-3 text-foreground" /></label>)}</div>
        <p className="text-xs text-muted-foreground">{t('Цена за единицу, указанную в предложении. При выборе диапазона показываем только цены в THB; итог зависит от состава бронирования.', 'Per the unit listed in each offer. A price range shows only THB prices; the booking total depends on your selection.', 'ราคาต่อหน่วยตามข้อเสนอ ช่วงราคาจะแสดงเฉพาะ THB ยอดรวมขึ้นอยู่กับการจอง')}</p>
      </fieldset>
      <label className="block space-y-2 text-sm"><span className="font-medium">{t('Длительность', 'Duration', 'ระยะเวลา')}</span><select className="min-h-11 w-full border border-border bg-background px-3" value={discovery.duration} onChange={event => update('duration', event.target.value)}><option value="">{t('Любая', 'Any duration', 'ทุกระยะเวลา')}</option>{EXPERIENCE_DURATIONS.map(value => <option key={value} value={value}>{durationLabel(value)}</option>)}</select></label>
      <label className="flex min-w-0 flex-col items-start gap-2 text-sm"><span className="font-medium">{t('Сортировка', 'Sort experiences', 'เรียงลำดับประสบการณ์')}</span>
        <select className="min-h-11 min-w-0 w-full border border-border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={sortKey} onChange={event => update('sort', event.target.value)}>
          {SORT_OPTIONS.map(item => <option key={item.id} value={item.id} disabled={!comparablePrices && (item.id === 'price_asc' || item.id === 'price_desc')}>{pickLang(language, item)}</option>)}
        </select>
      </label>
    <label className="block space-y-2 text-sm"><span className="font-medium">{t('Категория', 'Category', 'หมวดหมู่')}</span>
        <select className="min-h-11 w-full border border-border bg-background px-3" value={selectedCategory} onChange={event => update('category', event.target.value)}>
          <option value="all">{t('Все категории', 'All categories', 'ทุกหมวดหมู่')}</option>
          {availableCategories.map(category => <option key={category.id} value={category.slug}>{language === 'ru' ? category.name_ru || category.name_en : category.name_en || category.name_ru}</option>)}
        </select>
      </label></div></MarketplaceFilterSheet>}>
    <SEOHead title={t('Впечатления на Пхукете', 'Experiences in Phuket', 'ประสบการณ์ในภูเก็ต')}
      description={t('Экскурсии, острова и активный отдых: выберите тему и изучите предложения.', 'Tours, islands and activities: choose a category and explore the offers.', 'ทัวร์ เกาะ และกิจกรรม: เลือกหมวดหมู่และสำรวจข้อเสนอ')} />
    {categoriesQuery.isError && <div role="alert" className="space-y-3 border border-border p-4"><p>{t('Не удалось загрузить темы. Каталог и поиск остаются доступны.', 'Categories could not be loaded. You can still browse and search the catalogue.', 'โหลดหมวดหมู่ไม่สำเร็จ คุณยังสามารถดูและค้นหาในรายการได้')}</p><Button variant="outline" onClick={() => categoriesQuery.refetch()}>{t('Повторить загрузку тем', 'Retry categories', 'ลองโหลดหมวดหมู่อีกครั้ง')}</Button></div>}
    {overview && !categoriesQuery.isError && <ExperienceCategoryMenu categories={availableCategories} offers={experiences} onGroupSelect={group => { focusResults.current = true; update('group', group); }} selected={selectedCategory} images={categoryImages} onSelect={slug => { focusResults.current = true; update('category', slug); }} />}
    {groupRecord && <nav className="flex flex-wrap gap-2" aria-label={t('Темы раздела', 'Section topics', 'หัวข้อในหมวด')}>
      {availableCategories.map(category => <Button key={category.id} variant={selectedCategory === category.slug ? 'secondary' : 'outline'} size="sm" aria-pressed={selectedCategory === category.slug} onClick={() => update('category', category.slug)}>{language === 'ru' ? category.name_ru || category.name_en : category.name_en || category.name_ru}</Button>)}
    </nav>}
    {filtered && <div className="flex flex-wrap items-center justify-between gap-2" role="group" aria-label={t('Выбранные фильтры', 'Selected filters', 'ตัวกรองที่เลือก')}>
      <div className="flex min-w-0 flex-wrap gap-2">{selectedFilters.map(filter => <Button key={filter.key} variant="secondary" className="min-h-11 max-w-full whitespace-normal text-left" aria-label={`${t('Убрать фильтр', 'Remove filter', 'ลบตัวกรอง')}: ${filter.label}`} onClick={() => update(filter.key, '')}><span className="break-words">{filter.label}</span><X className="size-4 shrink-0" aria-hidden="true" /></Button>)}</div>
      <Button variant="outline" onClick={clear}><X className="size-4" aria-hidden="true" />{t('Сбросить фильтры', 'Clear filters', 'ล้างตัวกรอง')}</Button>
    </div>}
    {discovery.invalid && <p role="alert" className="border border-border p-4 text-sm">{t('Проверьте цену и длительность: цена не может быть отрицательной, а минимум — больше максимума.', 'Check price and duration: prices must be non-negative and the minimum cannot exceed the maximum.', 'ตรวจสอบราคาและระยะเวลา ราคาต้องไม่ติดลบและราคาต่ำสุดต้องไม่เกินราคาสูงสุด')}</p>}
    {priceSortUnavailable && <p role="status" className="border border-border bg-muted/30 p-4 text-sm text-muted-foreground">{t('Цены указаны в разных или неуточнённых валютах. Выберите тему с одной валютой или используйте сортировку по рейтингу.', 'Prices use different or unspecified currencies. Choose a category with one currency or sort by rating.', 'ราคามีหลายสกุลเงินหรือยังไม่ระบุ เลือกหมวดหมู่ที่ใช้สกุลเงินเดียวหรือเรียงตามคะแนน')}</p>}
    <section aria-labelledby="experience-results-title" className="space-y-4">
      <h2 id="experience-results-title" tabIndex={-1} className="font-display text-h3">{categoryName ? categoryName : groupRecord ? pickLang(language, groupRecord) : viewType === 'tour' ? t('Экскурсии', 'Tours', 'ทัวร์') : viewType === 'activity' ? t('Активный отдых', 'Activities', 'กิจกรรม') : t('Предложения', 'Offers', 'ข้อเสนอ')}</h2>
      {error ? <div role="alert" className="space-y-3 border border-border p-6"><p>{t('Не удалось загрузить впечатления. Попробуйте ещё раз.', 'Experiences could not be loaded. Please try again.', 'โหลดประสบการณ์ไม่สำเร็จ โปรดลองอีกครั้ง')}</p><Button variant="outline" onClick={() => refetch()}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button></div>
        : invalidFilters ? <EmptyState icon={Compass} title={t('Неизвестный фильтр', 'Unknown filter', 'ไม่พบตัวกรอง')} description={t('Сбросьте фильтры и выберите условия заново.', 'Clear the filters and choose your preferences again.', 'ล้างตัวกรองและเลือกเงื่อนไขอีกครั้ง')} />
        : isLoading ? <div role="status" aria-label={t('Загружаем впечатления', 'Loading experiences', 'กำลังโหลดประสบการณ์')} className={PUBLIC_CATALOG_GRID}>{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-[4/3] rounded-none" />)}</div>
        : !sorted.length ? <EmptyState icon={Compass} title={t('По этим условиям пока нет предложений', 'No offers match these filters', 'ยังไม่มีข้อเสนอที่ตรงกับตัวกรอง')} description={t('Выберите другую тему или сбросьте фильтры.', 'Choose another category or clear the filters.', 'เลือกหมวดหมู่อื่นหรือล้างตัวกรอง')} />
        : <div className={PUBLIC_CATALOG_GRID}>{sorted.map(exp => {
          const card = mapExperienceToCatalogCard(exp, language, openExperience);
          const knownPrice = priceValue(exp.price);
          const sourceCurrency = exp.currency?.trim().toUpperCase();
          const priceLabel = sourceCurrency === 'THB' && knownPrice !== null ? undefined : formatRecordedPrice(knownPrice, sourceCurrency, { unknownLabel: t('Цена по запросу', 'Price on request', 'สอบถามราคา'), locale: language, allowZero: true });
          return <CatalogCard className="public-commerce-catalog-card" key={exp.id} {...card} onClick={undefined} href={`/experiences/${exp.id}`} navigationState={catalogueNavigationState} price={sourceCurrency === 'THB' && knownPrice !== null ? knownPrice : undefined} priceLabel={priceLabel && knownPrice !== null && card.priceSuffix ? `${priceLabel} ${card.priceSuffix}` : priceLabel} priceSuffix={knownPrice !== null ? card.priceSuffix : undefined} />;
        })}</div>}
    </section>
    {overview && <VerticalContextBanner verticalId="experience" />}
    <div className="mt-6"><PropertyTourPromo /></div><VerticalInsightPanel verticalId="experience" /><CrossSellSection currentVertical="experiences" className="mt-8" />
  </MiniAppLayout>;
}
