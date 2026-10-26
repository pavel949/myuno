import { lazy, Suspense, useEffect, useRef, useState } from 'react';
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
import { isHomeServiceCategoryId } from '@/lib/services/publicServiceCategories';
import { readServiceDiscoveryQuery, updateServiceDiscoveryQuery, clearServiceDiscoveryQuery } from '@/lib/services/serviceDiscoveryQuery';
import { filterMarketplaceServices, matchesServiceQuery, projectServiceDiscovery, resolveHomeServiceCategory, serviceDiscoveryCategories, serviceDiscoveryMenu, serviceDiscoverySituations } from '@/lib/services/serviceDiscoveryProjection';
import { PUBLIC_CATALOG_COMPACT_GRID, PUBLIC_CATALOG_GRID, PUBLIC_DISCOVERY_MENU_GRID } from '@/design-system/ecosystemLayout';
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
  const pendingFilterUrl = useRef<string | null>(null);
  useEffect(() => { pendingFilterUrl.current = null; }, [location.key]);
  const [params] = useSearchParams();
  const filters = readServiceDiscoveryQuery(params);
  const catalog = useCatalogFromDB();
  const { functions } = useServiceFunctions();
  const offers = useMarketplaceServices();
  const [helpOpen, setHelpOpen] = useState(false);
  const [limit, setLimit] = useState(12);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const returnedCategories = catalog.isFromDB ? catalog.categories : [];
  const categories = serviceDiscoveryCategories(returnedCategories);
  const situations = serviceDiscoverySituations(categories, catalog.lifeSituations ?? []);
  const menu = serviceDiscoveryMenu(categories);
  const overview = !filters.query.trim() && !filters.category && !filters.situation;
  const child = SERVICE_CATEGORIES.find(category => category.id === filters.category);
  const homeResolution = resolveHomeServiceCategory(returnedCategories,
    child ? filters.homeCategory : isHomeServiceCategoryId(filters.category) ? filters.category : '', !child);
  const home = homeResolution.status === 'resolved' ? homeResolution.category : undefined;
  const explicitHomeIntent = Boolean(child || isHomeServiceCategoryId(filters.category));
  const category = home && explicitHomeIntent ? home.id : filters.category;
  const rows = child ? [] : projectServiceDiscovery(categories, { ...filters, category });
  const returnTo = location.pathname + location.search;
  const Layout = embedded ? EmbeddedServicesLayout : MiniAppLayout;
  const commit = (next: URLSearchParams, replace = false) => {
    const search = next.toString();
    const target = location.pathname + (search ? '?' + search : '') + location.hash;
    // A controlled tab can report the same choice on pointer and focus before
    // the router commits. One filter action must create only one history entry.
    if (target === location.pathname + location.search + location.hash || pendingFilterUrl.current === target) return;
    pendingFilterUrl.current = target;
    setLimit(12);
    setShowAllRequests(false);
    setShowAllMenu(false);
    navigate({ pathname: location.pathname, search, hash: location.hash }, { replace, state: location.state });
  };
  const update = (key: 'q' | 'category' | 'situation' | 'browse', value: string, homeCategory?: string) => commit(updateServiceDiscoveryQuery(params, key, value, homeCategory), key === 'q');
  const clear = () => commit(clearServiceDiscoveryQuery(params));
  const selectedCategory = categories.find(item => item.id === category);
  const categoryLabel = child ? homeServiceCategoryLabel(child.id, language) : selectedCategory ? label(selectedCategory) : t('Неизвестная категория', 'Unknown category', 'ไม่พบหมวดหมู่');
  const knownSituation = !filters.situation || situations.some(item => item.code === filters.situation);
  const knownCategory = !category || (child ? Boolean(home) : categories.some(item => item.id === category));
  // Home functions remain request templates with indicative prices, not live supply.
  // A catalogue sibling tag is not a per-function LifeOS association. Templates remain browsable without the situation filter.
  const showRequests = Boolean((category === home?.id || filters.query.trim()) && (!category || category === home?.id) && home && !filters.situation && knownSituation);
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
  const hasOverviewMenu = overview && (menu.primary.length > 0 || menu.more.length > 0 || Boolean(menu.yacht));
  const noResults = ready && (!knownSituation || !knownCategory || (!hasOverviewMenu && !rows.length && !requests.length && (!showOffers || (!offers.isLoading && !offers.isError && !matchingOffers.length))));

  return <Layout pageWidth="catalogue" contentClassName="public-commerce public-commerce--services"
    title={t('Услуги на Пхукете', 'Services in Phuket', 'บริการในภูเก็ต')}
    subtitle={t('Найдите нужное — по ситуации или категории.', 'Find what you need by situation or category.', 'ค้นหาบริการตามสถานการณ์หรือหมวดหมู่')}
    fallbackPath="/" searchValue={filters.query} onSearchChange={value => update('q', value)}
    searchPlaceholder={t('Поиск услуг…', 'Search services…', 'ค้นหาบริการ…')} showHero={false} showFilter={false} showEcosystemHint={false}>
    {!embedded && <SEOHead title={t('Услуги на Пхукете', 'Services in Phuket', 'บริการในภูเก็ต')} description={t('Услуги для дома, поездок и повседневных дел.', 'Services for home, travel and everyday life.', 'บริการสำหรับบ้าน การเดินทาง และชีวิตประจำวัน')} />}
    <section aria-label={t('Подбор услуг', 'Find services', 'ค้นหาบริการ')} className="space-y-4">
      <Tabs value={filters.view} onValueChange={value => update('browse', value)} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList className="h-auto min-h-11" aria-label={t('Способ выбора', 'Browse services', 'วิธีค้นหาบริการ')}>
            <TabsTrigger className="min-h-11 whitespace-normal overflow-visible text-clip" value="situations">{t('По ситуации', 'By situation', 'ตามสถานการณ์')}</TabsTrigger>
            <TabsTrigger className="min-h-11 whitespace-normal overflow-visible text-clip" value="categories">{t('По категориям', 'By category', 'ตามหมวดหมู่')}</TabsTrigger>
          </TabsList>
        <Button asChild variant="ghost" className="w-11 px-0 sm:w-auto sm:px-3"><Link to="/bookings" aria-label={t('Мои заявки', 'My requests', 'คำขอของฉัน')} title={t('Мои заявки', 'My requests', 'คำขอของฉัน')}><ClipboardList className="size-4 shrink-0 sm:mr-2" aria-hidden="true" /><span className="hidden sm:inline">{t('Мои заявки', 'My requests', 'คำขอของฉัน')}</span></Link></Button>
      </div>
      <TabsContent value={filters.view}>
      {!overview && <>
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
      </div>
      </>}
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
    {ready && explicitHomeIntent && homeResolution.status === 'unavailable' && <p role="status" className="text-sm text-muted-foreground">{homeResolution.reason === 'ambiguous'
      ? t('Доступно несколько разделов домашних услуг. Выберите нужный раздел в списке категорий.', 'Several home categories are available. Choose one in the category list.', 'มีหมวดหมู่บริการสำหรับบ้านหลายรายการ โปรดเลือกจากรายการหมวดหมู่')
      : t('Выбранный раздел домашних услуг недоступен. Выберите другой раздел или сбросьте фильтры.', 'The selected home category is unavailable. Choose another category or reset the filters.', 'หมวดหมู่บริการสำหรับบ้านที่เลือกไม่พร้อมใช้งาน โปรดเลือกหมวดหมู่อื่นหรือรีเซ็ตตัวกรอง')}</p>}
    {ready && !noResults && overview && <section aria-labelledby="service-menu-title" className="space-y-3">
      <h2 id="service-menu-title" className="font-display text-h3">{filters.view === 'categories' ? t('Выберите категорию', 'Choose a category', 'เลือกหมวดหมู่') : t('Что вам нужно сейчас?', 'What do you need today?', 'วันนี้คุณต้องการอะไร?')}</h2>
      {filters.view === 'categories' ? <>
        <div className={PUBLIC_DISCOVERY_MENU_GRID} data-testid="service-discovery-menu">
          {[...menu.primary, ...(showAllMenu ? menu.more : [])].map(item => <Button key={item.id} data-category-id={item.id} aria-label={label(item)} aria-describedby={`service-menu-${item.id}`} variant="outline" className="h-auto min-h-20 items-start justify-start whitespace-normal p-3 text-left" onClick={() => update('category', item.id)}>
            <item.icon className="mr-2 mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><span className="min-w-0"><span className="block font-medium">{label(item)}</span><span id={`service-menu-${item.id}`} className="mt-1 block text-xs font-normal text-muted-foreground">{item.services.slice(0, 2).map(label).join(' · ')}</span></span>
          </Button>)}
          {menu.yacht && <Button asChild variant="outline" className="h-auto min-h-20 items-start justify-start whitespace-normal p-3 text-left"><Link to={menu.yacht.path} state={{ returnTo }} aria-label={label(menu.yacht)}><menu.yacht.icon className="mr-2 mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="block font-medium">{label(menu.yacht)}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{t('Открыть раздел', 'Open service', 'เปิดบริการ')}</span></span><ArrowRight className="ml-auto size-4 shrink-0" aria-hidden="true" /></Link></Button>}
        </div>
        {menu.more.length > 0 && <Button variant="ghost" aria-expanded={showAllMenu} onClick={() => setShowAllMenu(value => !value)}>{showAllMenu ? t('Свернуть', 'Show fewer', 'แสดงน้อยลง') : t('Все категории', 'All categories', 'ทุกหมวดหมู่')}</Button>}
      </> : <>
        <div className={PUBLIC_DISCOVERY_MENU_GRID} data-testid="service-situation-menu">{situations.slice(0, showAllMenu ? situations.length : 8).map(item => <Button key={item.code} data-situation-code={item.code} variant="outline" className="h-auto min-h-11 justify-start whitespace-normal p-3 text-left" onClick={() => update('situation', item.code)}>{pickLang(language, { ru: item.titleRu, en: item.titleEn })}</Button>)}</div>
        {situations.length > 8 && <Button variant="ghost" aria-expanded={showAllMenu} onClick={() => setShowAllMenu(value => !value)}>{showAllMenu ? t('Свернуть', 'Show fewer', 'แสดงน้อยลง') : t('Все ситуации', 'All situations', 'ทุกสถานการณ์')}</Button>}
      </>}
    </section>}
    {ready && home && category === home?.id && <section aria-labelledby="home-categories-title" className="space-y-3">
      <h2 id="home-categories-title" className="font-display text-h3">{t('Услуги для дома', 'Home services', 'บริการสำหรับบ้าน')}</h2>
      <div className={PUBLIC_DISCOVERY_MENU_GRID} role="group" aria-labelledby="home-categories-title" data-testid="home-category-menu">
        <Button variant={child ? 'outline' : 'secondary'} aria-pressed={!child} className="h-auto min-h-11 justify-start whitespace-normal text-left" onClick={() => update('category', home.id)}>{t('Все услуги для дома', 'All home services', 'บริการสำหรับบ้านทั้งหมด')}</Button>
        {SERVICE_CATEGORIES.map(item => <Button key={item.id} data-home-category-id={item.id} variant={child?.id === item.id ? 'secondary' : 'outline'} aria-pressed={child?.id === item.id} className="h-auto min-h-11 justify-start whitespace-normal text-left" onClick={() => update('category', item.id, home.id)}>{homeServiceCategoryLabel(item.id, language)}</Button>)}
      </div>
    </section>}
    {ready && !noResults && !overview && rows.length > 0 && <section aria-labelledby="service-results-title" className="space-y-4">
      <div data-testid="service-results-heading-row" className="flex flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:justify-between"><h2 id="service-results-title" className="font-display text-h3">{t('Направления услуг', 'Service catalogue', 'รายการบริการ')}</h2><p role="status" className="text-sm text-muted-foreground">{t('Направлений', 'Service types', 'ประเภทบริการ')}: {rows.length}</p></div>
      <p className="text-sm text-muted-foreground">{t('Условия, цена и способ заказа — на странице услуги.', 'See conditions, prices and how to order on the service page.', 'ดูเงื่อนไข ราคา และวิธีสั่งบริการในหน้าบริการ')}</p>
      <div className={PUBLIC_CATALOG_COMPACT_GRID} data-testid="service-catalogue-results">
        {rows.slice(0, limit).map(({ service, category: parent }) => <Link key={service.id} to={service.path} state={{ returnTo }} className="group flex min-w-0 items-center gap-3 border border-border bg-card p-4 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <service.icon className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm text-muted-foreground">{label(parent)}</p><h3 className="font-medium">{label(service)}</h3></div><ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>)}
      </div>
      {rows.length > limit && <Button variant="outline" onClick={() => setLimit(value => value + 12)}>{t('Показать ещё', 'Show more', 'แสดงเพิ่มเติม')}</Button>}
    </section>}
    {noResults && <div className="space-y-3"><EmptyState icon={Search} title={t('Услуги не найдены', 'No services found', 'ไม่พบบริการ')} /><Button variant="outline" onClick={clear}>{t('Сбросить поиск и фильтры', 'Clear search and filters', 'ล้างการค้นหาและตัวกรอง')}</Button></div>}
    {ready && home && knownSituation && filters.situation && (category === home?.id || Boolean(filters.query.trim())) && <section className="space-y-2 border-t border-border pt-4" aria-labelledby="home-situation-note">
      <h2 id="home-situation-note" className="font-display text-h3">{t('Бытовые заявки', 'Home requests', 'คำขอบริการสำหรับบ้าน')}</h2>
      <p className="text-sm text-muted-foreground">{t('Для конкретных бытовых заявок связь с ситуациями не задана. Уберите ситуацию, чтобы выбрать работу; текст поиска сохранится.', 'Specific home requests are not classified by situation yet. Clear the situation to choose a task; your search text will stay.', 'คำขอบริการสำหรับบ้านยังไม่ได้จัดตามสถานการณ์ ล้างสถานการณ์เพื่อเลือกงาน ข้อความค้นหาจะยังคงอยู่')}</p>
      <Button variant="outline" onClick={() => update('situation', '')}>{t('Выбрать бытовую заявку', 'Browse home requests', 'เลือกคำขอบริการสำหรับบ้าน')}</Button>
    </section>}
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
