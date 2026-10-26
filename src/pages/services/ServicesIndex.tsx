import { lazy, Suspense, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ClipboardList, Search, Wrench, X } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { MiniAppLayout, type MiniAppLayoutProps } from '@/components/miniapp/MiniAppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/uno/EmptyState';
import { MarketplaceServiceGrid } from '@/components/services/MarketplaceServiceGrid';
import { ServiceFunctionCard } from '@/components/services';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { useMarketplaceServices } from '@/hooks/useServiceMarketplace';
import { useServiceFunctions } from '@/hooks/useServiceFunctions';
import { SERVICE_CATEGORIES } from '@/lib/config/homeServiceFunctions';
import { homeServiceCategoryLabel } from '@/lib/services/servicePresentation';
import { readServiceDiscoveryQuery, updateServiceDiscoveryQuery, clearServiceDiscoveryQuery } from '@/lib/services/serviceDiscoveryQuery';
import { filterMarketplaceServices, matchesServiceQuery, projectServiceDiscovery, serviceDiscoveryCategories, serviceDiscoverySituations, serviceMatchesSituation } from '@/lib/services/serviceDiscoveryProjection';
import { PUBLIC_CATALOG_GRID } from '@/design-system/ecosystemLayout';
import '@/styles/public-commerce.css';

const ConciergeHelpSheet = lazy(() => import('@/components/concierge/ConciergeHelpSheet').then(module => ({ default: module.ConciergeHelpSheet })));
function EmbeddedServicesLayout({ title, subtitle, searchValue, onSearchChange, searchPlaceholder, children }: MiniAppLayoutProps) {
  return <div className="public-commerce public-commerce--services space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-muted-foreground">{subtitle}</p></header>
    <Input type="search" aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={searchValue} onChange={event => onSearchChange?.(event.target.value)} />{children}
  </div>;
}
export default function ServicesIndex({ embedded = false }: { embedded?: boolean } = {}) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const label = (item: { labelRu: string; labelEn: string; labelTh?: string }) => pickLang(language, { ru: item.labelRu, en: item.labelEn, th: item.labelTh });
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const filters = readServiceDiscoveryQuery(params);
  const catalog = useCatalogFromDB();
  const { functions } = useServiceFunctions();
  const offers = useMarketplaceServices();
  const [helpOpen, setHelpOpen] = useState(false);
  const [limit, setLimit] = useState(12);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const categories = serviceDiscoveryCategories(catalog.isFromDB ? catalog.categories : []);
  const situations = serviceDiscoverySituations(categories, catalog.lifeSituations ?? []);
  const child = SERVICE_CATEGORIES.find(category => category.id === filters.category);
  const category = child ? 'cat-home-services' : filters.category;
  const home = categories.find(item => item.id === 'cat-home-services');
  const rows = child ? [] : projectServiceDiscovery(categories, { ...filters, category });
  const returnTo = location.pathname + location.search;
  const Layout = embedded ? EmbeddedServicesLayout : MiniAppLayout;
  const commit = (next: URLSearchParams, replace = false) => {
    setLimit(12);
    setShowAllRequests(false);
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace, state: location.state });
  };
  const update = (key: 'q' | 'category' | 'situation' | 'browse', value: string) => commit(updateServiceDiscoveryQuery(params, key, value), key === 'q');
  const clear = () => commit(clearServiceDiscoveryQuery(params));
  const selectedCategory = categories.find(item => item.id === category);
  const categoryLabel = child ? homeServiceCategoryLabel(child.id, language) : selectedCategory ? label(selectedCategory) : t('Неизвестная категория', 'Unknown category', 'ไม่พบหมวดหมู่');
  const knownSituation = !filters.situation || situations.some(item => item.code === filters.situation);
  const knownCategory = !category || categories.some(item => item.id === category);
  const homeMatches = Boolean(home && home.services.some(service => serviceMatchesSituation(service, filters.situation)));
  // Home functions remain request templates with indicative prices, not live supply.
  // Their parent is the existing home category; no per-function LifeOS mapping is invented.
  const showRequests = Boolean((category === 'cat-home-services' || filters.query.trim()) && (!category || category === 'cat-home-services') && homeMatches && knownSituation);
  const requests = showRequests ? functions.filter(fn => (!child || fn.category === child.id) && matchesServiceQuery(filters.query, [fn.raw.nameRu, fn.raw.nameEn, fn.raw.descriptionRu, fn.raw.descriptionEn, homeServiceCategoryLabel(fn.category, language)])) : [];
  const requestPreviews = SERVICE_CATEGORIES.flatMap(item => {
    const matches = requests.filter(fn => fn.category === item.id);
    const first = matches.find(fn => fn.isPopular) ?? matches[0];
    return first ? [first] : [];
  });
  const visibleRequests = child || filters.query.trim() || showAllRequests ? requests : requestPreviews.slice(0, 8);
  const filtered = Boolean(filters.query || filters.category || filters.situation || params.has('sort'));
  const ready = !catalog.isLoading && !catalog.error && catalog.isFromDB;
  const showOffers = !filters.category && !filters.situation;
  const matchingOffers = showOffers ? filterMarketplaceServices(offers.data ?? [], filters.query) : [];
  const renderOffers = showOffers && (offers.isLoading || offers.isError || !filters.query.trim() || matchingOffers.length > 0);
  const noResults = ready && (!knownSituation || !knownCategory || (!rows.length && !requests.length && (!showOffers || (!offers.isLoading && !offers.isError && !matchingOffers.length))));

  return <Layout pageWidth="catalogue" contentClassName="public-commerce public-commerce--services"
    title={t('Услуги на Пхукете', 'Services in Phuket', 'บริการในภูเก็ต')}
    subtitle={t('Найдите нужное — по ситуации или категории.', 'Find what you need by situation or category.', 'ค้นหาบริการตามสถานการณ์หรือหมวดหมู่')}
    fallbackPath="/" searchValue={filters.query} onSearchChange={value => update('q', value)}
    searchPlaceholder={t('Поиск услуг…', 'Search services…', 'ค้นหาบริการ…')} showHero={false} showFilter={false} showEcosystemHint={false}>
    {!embedded && <SEOHead title={t('Услуги на Пхукете', 'Services in Phuket', 'บริการในภูเก็ต')} description={t('Услуги для дома, поездок и повседневных дел.', 'Services for home, travel and everyday life.', 'บริการสำหรับบ้าน การเดินทาง และชีวิตประจำวัน')} />}
    <section aria-label={t('Подбор услуг', 'Find services', 'ค้นหาบริการ')} className="space-y-4">
      <Tabs value={filters.view} onValueChange={value => update('browse', value)} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList aria-label={t('Способ выбора', 'Browse services', 'วิธีค้นหาบริการ')}>
            <TabsTrigger value="situations">{t('По ситуации', 'By situation', 'ตามสถานการณ์')}</TabsTrigger>
            <TabsTrigger value="categories">{t('По категориям', 'By category', 'ตามหมวดหมู่')}</TabsTrigger>
          </TabsList>
        <Button asChild variant="ghost" className="w-11 px-0 sm:w-auto sm:px-3"><Link to="/bookings" aria-label={t('Мои заявки', 'My requests', 'คำขอของฉัน')} title={t('Мои заявки', 'My requests', 'คำขอของฉัน')}><ClipboardList className="size-4 shrink-0 sm:mr-2" aria-hidden="true" /><span className="hidden sm:inline">{t('Мои заявки', 'My requests', 'คำขอของฉัน')}</span></Link></Button>
      </div>
      <TabsContent value={filters.view}>
      <div className="grid items-end gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p id="service-view-filter" className="text-sm font-medium">{filters.view === 'categories' ? t('Категория', 'Category', 'หมวดหมู่') : t('Ситуация', 'Situation', 'สถานการณ์')}</p>
          <Select value={(filters.view === 'categories' ? category : filters.situation) || 'all'} onValueChange={value => update(filters.view === 'categories' ? 'category' : 'situation', value)}>
            <SelectTrigger id="service-view-trigger" aria-labelledby="service-view-filter" className="min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent collisionPadding={12} className="max-w-[var(--radix-select-content-available-width)]">
              <SelectItem className="min-h-11" value="all">{t('Все', 'All', 'ทั้งหมด')}</SelectItem>
              {filters.view === 'categories' ? <>
                {!knownCategory && <SelectItem className="min-h-11" value={category}>{t('Неизвестная категория', 'Unknown category', 'ไม่พบหมวดหมู่')}</SelectItem>}
                {categories.map(item => <SelectItem className="min-h-11" key={item.id} value={item.id}>{label(item)}</SelectItem>)}
              </> : <>
                {!knownSituation && <SelectItem className="min-h-11" value={filters.situation}>{t('Неизвестная ситуация', 'Unknown situation', 'ไม่พบสถานการณ์')}</SelectItem>}
                {situations.map(item => <SelectItem className="min-h-11" key={item.code} value={item.code}>{pickLang(language, { ru: item.titleRu, en: item.titleEn })}</SelectItem>)}
              </>}
            </SelectContent>
          </Select>
        </div>
        {category === 'cat-home-services' && <div className="space-y-2">
          <p id="home-request-category" className="text-sm font-medium">{t('Услуги для дома', 'Home services', 'บริการสำหรับบ้าน')}</p>
          <Select value={child?.id ?? 'all'} onValueChange={value => update('category', value === 'all' ? 'cat-home-services' : value)}>
            <SelectTrigger id="home-request-trigger" aria-labelledby="home-request-category" className="min-h-11"><SelectValue /></SelectTrigger>
            <SelectContent collisionPadding={12} className="max-w-[var(--radix-select-content-available-width)]"><SelectItem className="min-h-11" value="all">{t('Все услуги для дома', 'All home services', 'บริการสำหรับบ้านทั้งหมด')}</SelectItem>
              {SERVICE_CATEGORIES.map(item => <SelectItem className="min-h-11" key={item.id} value={item.id}>{homeServiceCategoryLabel(item.id, language)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>}
      </div>
      </TabsContent>
      </Tabs>
      {filtered && <div className="flex flex-wrap items-center gap-2" aria-label={t('Применённые фильтры', 'Applied filters', 'ตัวกรองที่ใช้')}>
        {filters.situation && <Button aria-label={t('Убрать фильтр ситуации', 'Remove situation filter', 'ลบตัวกรองสถานการณ์')} variant="outline" size="sm" className="min-h-11" onClick={() => update('situation', '')}>{situations.find(item => item.code === filters.situation)?.[language === 'ru' ? 'titleRu' : 'titleEn'] ?? t('Неизвестная ситуация', 'Unknown situation', 'ไม่พบสถานการณ์')}<X className="ml-2 size-4" aria-hidden="true" /></Button>}
        {filters.category && <Button aria-label={t('Убрать фильтр категории', 'Remove category filter', 'ลบตัวกรองหมวดหมู่')} variant="outline" size="sm" className="min-h-11" onClick={() => update('category', '')}>{categoryLabel}<X className="ml-2 size-4" aria-hidden="true" /></Button>}
        <Button variant="ghost" size="sm" className="min-h-11" onClick={clear}>{t('Сбросить всё', 'Reset all', 'รีเซ็ตทั้งหมด')}</Button>
      </div>}
    </section>
    {params.has('sort') && <p role="status" className="text-sm text-muted-foreground">{t('Сортировка из старой ссылки не применяется. Сбросьте фильтры, чтобы убрать её.', 'Sorting from this older link is not applied. Reset filters to remove it.', 'ไม่ได้ใช้การเรียงลำดับจากลิงก์เดิม รีเซ็ตตัวกรองเพื่อลบออก')}</p>}
    {catalog.isLoading && <p role="status">{t('Загружаем каталог…', 'Loading catalogue…', 'กำลังโหลดรายการบริการ…')}</p>}
    {(catalog.error || (!catalog.isLoading && !catalog.isFromDB)) && <div role="alert" className="space-y-2"><p>{t('Каталог временно недоступен. Попробуйте ещё раз.', 'The catalogue is temporarily unavailable. Try again.', 'รายการบริการไม่พร้อมใช้งานชั่วคราว โปรดลองอีกครั้ง')}</p><Button variant="outline" onClick={() => catalog.refetch()}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button></div>}
    {ready && !noResults && rows.length > 0 && <section aria-labelledby="service-results-title" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="service-results-title" className="font-display text-h3">{t('Направления услуг', 'Service catalogue', 'รายการบริการ')}</h2><p role="status" className="text-sm text-muted-foreground">{t('Направлений', 'Service types', 'ประเภทบริการ')}: {rows.length}</p></div>
      <p className="text-sm text-muted-foreground">{t('Условия, цена и способ заказа — на странице услуги.', 'See conditions, prices and how to order on the service page.', 'ดูเงื่อนไข ราคา และวิธีสั่งบริการในหน้าบริการ')}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="service-catalogue-results">
        {rows.slice(0, limit).map(({ service, category: parent }) => <Link key={service.id} to={service.path} state={{ returnTo }} className="group flex min-w-0 items-center gap-3 border border-border bg-card p-4 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <service.icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm text-muted-foreground">{label(parent)}</p><h3 className="font-medium">{label(service)}</h3></div><ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>)}
      </div>
      {rows.length > limit && <Button variant="outline" onClick={() => setLimit(value => value + 12)}>{t('Показать ещё', 'Show more', 'แสดงเพิ่มเติม')}</Button>}
    </section>}
    {noResults && <div className="space-y-3"><EmptyState icon={Search} title={t('Услуги не найдены', 'No services found', 'ไม่พบบริการ')} /><Button variant="outline" onClick={clear}>{t('Сбросить поиск и фильтры', 'Clear search and filters', 'ล้างการค้นหาและตัวกรอง')}</Button></div>}
    {ready && requests.length > 0 && <section aria-labelledby="service-requests" className="space-y-4">
      <header className="space-y-2"><h2 id="service-requests" className="font-display text-h3">{t('Услуги для дома по запросу', 'Home service requests', 'คำขอบริการสำหรับบ้าน')}</h2><p className="text-sm text-muted-foreground">{t('Цены ориентировочные. Исполнитель, время и итоговая стоимость подтверждаются после заявки.', 'Prices are estimates. The provider, time and final price are confirmed after your request.', 'ราคาเป็นเพียงประมาณการ ผู้ให้บริการ เวลา และราคาสุดท้ายจะได้รับการยืนยันหลังจากส่งคำขอ')}</p></header>
      <div className={PUBLIC_CATALOG_GRID} data-testid="service-request-grid">{visibleRequests.map(fn => <div key={fn.id} data-service-category={fn.category} className="min-w-0"><ServiceFunctionCard fn={fn} catalogue onClick={() => navigate(`/services/order/${fn.id}?returnTo=${encodeURIComponent(returnTo)}`, { state: { returnTo, catalogueState: location.state, catalogueHash: location.hash } })} /></div>)}</div>
      {visibleRequests.length < requests.length && <Button variant="outline" onClick={() => setShowAllRequests(true)}>{t(`Все услуги для дома (${requests.length})`, `All home services (${requests.length})`, `บริการสำหรับบ้านทั้งหมด (${requests.length})`)}</Button>}
    </section>}
    {ready && renderOffers && <MarketplaceServiceGrid search={filters.query} returnTo={returnTo} />}
    {ready && !showOffers && !offers.isLoading && !offers.isError && Boolean(offers.data?.length) && <section className="space-y-2 border-t border-border pt-4" aria-labelledby="provider-filter-note">
      <h2 id="provider-filter-note" className="font-display text-h3">{t('Предложения специалистов', 'Provider offers', 'ข้อเสนอจากผู้ให้บริการ')}</h2>
      <p className="text-sm text-muted-foreground">{t('Чтобы посмотреть опубликованные предложения специалистов, уберите категорию и ситуацию. Поисковая строка сохранится.', 'Clear the category and situation to browse published provider offers. Your search text will stay.', 'ล้างหมวดหมู่และสถานการณ์เพื่อดูข้อเสนอที่เผยแพร่ ข้อความค้นหาจะยังคงอยู่')}</p>
      <Button variant="outline" onClick={() => { const next = new URLSearchParams(params); ['category', 'type', 'situation'].forEach(key => next.delete(key)); commit(next); }}>{t('Посмотреть предложения', 'Browse provider offers', 'ดูข้อเสนอ')}</Button>
    </section>}
    {filters.situation === 'arrival' && <Button asChild variant="outline"><Link to="/trip-planner">{t('Спланировать поездку', 'Plan a trip', 'วางแผนการเดินทาง')}</Link></Button>}
    <section className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4" aria-labelledby="service-help-title"><div><h2 id="service-help-title" className="font-display text-h3">{t('Не нашли нужную услугу?', 'Can’t find the right service?', 'ไม่พบบริการที่ต้องการ?')}</h2><p className="mt-2 text-sm text-muted-foreground">{t('Опишите задачу — поможем уточнить варианты.', 'Describe your task and we can help you explore options.', 'อธิบายสิ่งที่ต้องการ เราจะช่วยค้นหาตัวเลือกให้คุณ')}</p></div><Button onClick={() => setHelpOpen(true)}><Wrench className="mr-2 size-4" aria-hidden="true" />{t('Описать задачу', 'Describe your task', 'อธิบายสิ่งที่ต้องการ')}</Button></section>
    {helpOpen && <Suspense fallback={<p role="status">{t('Открываем форму…', 'Opening request form…', 'กำลังเปิดแบบฟอร์มคำขอ…')}</p>}><ConciergeHelpSheet open={helpOpen} onOpenChange={setHelpOpen} topic="general" initialSubject={filters.query} subjectPlaceholder={t('Например: помощь с сантехникой', 'For example: help with plumbing', 'เช่น ต้องการช่างประปา')} messagePlaceholder={t('Какая услуга нужна, где и когда?', 'What service do you need, where and when?', 'ต้องการบริการอะไร ที่ไหน และเมื่อไหร่?')} sourceData={{ source: 'services_catalogue', returnTo }} /></Suspense>}
  </Layout>;
}
