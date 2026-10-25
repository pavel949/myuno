import { ServiceCatalogGroups } from '@/components/services/ServiceCatalogGroups';
import { SEOHead } from '@/components/seo/SEOHead';
import { pickLang } from '@/lib/i18n/pickLang';
import '@/styles/public-commerce.css';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { Wrench, Car, Users, LayoutGrid, Snowflake, Brush, Droplets, ClipboardList, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MiniAppLayout, type MiniAppLayoutProps } from '@/components/miniapp/MiniAppLayout';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/uno/EmptyState';
import { useServiceFunctions } from '@/hooks/useServiceFunctions';
import { ServiceFunctionCard } from '@/components/services';
import { SERVICE_CATEGORIES } from '@/lib/config/homeServiceFunctions';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';
import { MarketplaceServiceGrid } from '@/components/services/MarketplaceServiceGrid';
import { cn } from '@/lib/utils';
import { homeServiceCategoryLabel } from '@/lib/services/servicePresentation';
import { PUBLIC_CATALOG_GRID } from '@/design-system/ecosystemLayout';

const ConciergeHelpSheet = lazy(() => import('@/components/concierge/ConciergeHelpSheet').then(module => ({ default: module.ConciergeHelpSheet })));

// Only equivalent names are aliases. Unavailable trades must not silently
// become a different service (e.g. photography → handyman).

const CATEGORY_ALIAS: Record<string, string> = {
  'pest-control': 'pest_control', 'ac-repair': 'ac', gardening: 'garden',
};

function EmbeddedServicesLayout({ title, subtitle, searchValue, onSearchChange, searchPlaceholder, children }: MiniAppLayoutProps) {
  return <div className="public-commerce public-commerce--services space-y-6">
    <header className="space-y-2"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-muted-foreground">{subtitle}</p></header>
    <Input type="search" aria-label={searchPlaceholder} placeholder={searchPlaceholder} value={searchValue} onChange={event => onSearchChange?.(event.target.value)} />
    {children}
  </div>;
}

export default function ServicesIndex({ embedded = false }: { embedded?: boolean } = {}) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { functions, categories, search } = useServiceFunctions();
  const { applyFilter } = usePersonaFilter();
  const [helpOpen, setHelpOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const query = params.get('q') ?? '';
  const rawCategory = params.get('category') ?? params.get('type') ?? 'all';
  const category = CATEGORY_ALIAS[rawCategory] ?? rawCategory;
  const unknownCategory = category !== 'all' && !SERVICE_CATEGORIES.some(c => c.id === category);
  const returnTo = location.pathname + location.search;
  const Layout = embedded ? EmbeddedServicesLayout : MiniAppLayout;

  let requests = query.trim() ? search(query) : functions;
  if (category !== 'all') requests = requests.filter(fn => fn.category === category);
  requests = applyFilter(requests, fn => [fn.category, fn.id]);
  if (params.get('sort') === 'popular' || params.get('sort') === 'rating') {
    requests = [...requests].sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)));
  }

  const update = (key: 'q' | 'category', value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    if (key === 'category') next.delete('type');
    setParams(next, { replace: key === 'q' });
  };
  const clear = () => {
    const next = new URLSearchParams(params);
    ['q', 'category', 'type', 'sort'].forEach(key => next.delete(key));
    setParams(next);
  };
  const filtered = Boolean(query.trim()) || category !== 'all';
  // Show a cross-section of the existing catalogue, never fabricated providers
  // or a claim about live popularity/availability. Filtering always searches all.
  const previews = categories.flatMap(item => {
    const matches = requests.filter(fn => fn.category === item.id);
    const first = matches.find(fn => fn.isPopular) ?? matches[0];
    return first ? [first] : [];
  });
  const visibleRequests = filtered || showAll ? requests : previews.slice(0, 8);
  const quickCategories = [
    { id: 'all', name: t('Все услуги для дома', 'All home services', "บริการสำหรับบ้านทั้งหมด"), icon: LayoutGrid },
    { id: 'cleaning', name: t('Уборка', 'Cleaning', "ทำความสะอาด"), icon: Brush },
    { id: 'ac', name: t('Кондиционеры', 'Air conditioning', "เครื่องปรับอากาศ"), icon: Snowflake },
    { id: 'plumbing', name: t('Сантехника', 'Plumbing', "ประปา"), icon: Droplets },
  ];

  return (
    <Layout
      pageWidth="catalogue"
      contentClassName="public-commerce public-commerce--services"
      title={t('Услуги на Пхукете', 'Services in Phuket', "บริการในภูเก็ต")}
      subtitle={t('Для дома, поездок и повседневных дел.', 'For your home, travel and everyday life.', "สำหรับบ้าน การเดินทาง และชีวิตประจำวันของคุณ")}
      fallbackPath="/"
      searchValue={query}
      onSearchChange={value => update('q', value)}
      searchPlaceholder={t('Поиск услуг…', 'Search services…', "ค้นหาบริการ…")}
      showHero={false}
      showFilter={false}
      showEcosystemHint={false}
    >
      {!embedded && <SEOHead title={t('Услуги на Пхукете', 'Services in Phuket', 'บริการในภูเก็ต')} description={t('Найдите услуги для дома, поездок и повседневных дел на Пхукете.', 'Explore services for your home, travel and everyday life in Phuket.', 'ค้นหาบริการสำหรับบ้าน การเดินทาง และชีวิตประจำวันในภูเก็ต')} />}
      <ServiceCatalogGroups search={query} />
      <nav aria-label={t('Категории услуг', 'Service categories', "หมวดหมู่บริการ")} className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {quickCategories.map(({ id, name, icon: Icon }) => <button key={id} type="button"
          onClick={() => update('category', id)} aria-pressed={category === id}
          className={cn('flex min-h-16 min-w-0 items-center gap-2 border bg-card px-2 py-3 text-left text-[13px] font-medium transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:text-sm', category === id ? 'border-primary bg-primary/5 text-primary' : 'border-border text-foreground')}>
          <Icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{name}</span>
        </button>)}
        <Link className="flex min-h-16 items-center gap-3 border border-border bg-card px-3 py-3 text-sm font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/transport"><Car className="h-5 w-5 shrink-0" aria-hidden="true" />{t('Транспорт', 'Transport', "การเดินทาง")}</Link>
        <Link className="flex min-h-16 items-center gap-3 border border-border bg-card px-3 py-3 text-sm font-medium hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" to="/thai-services"><Users className="h-5 w-5 shrink-0" aria-hidden="true" />{t('Местные компании', 'Local businesses', "ธุรกิจท้องถิ่น")}</Link>
      </nav>
      <div className="flex flex-wrap justify-between gap-2"><Link to="/trip-planner" className="inline-flex min-h-11 items-center text-sm underline underline-offset-4">{t('Спланировать поездку', 'Plan a trip', 'วางแผนการเดินทาง')}</Link><Link to="/bookings" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4"><ClipboardList className="h-4 w-4" aria-hidden="true" />{t('Мои услуги и заявки', 'My services and requests', "บริการและคำขอของฉัน")}</Link></div>

      <section aria-labelledby="service-requests" className="space-y-4">
        <header className="space-y-2">
          <h2 id="service-requests" className="font-display text-lg">{t('Услуги для дома по запросу', 'Home service requests', "คำขอบริการสำหรับบ้าน")}</h2>
          <p className="text-sm text-muted-foreground">{t('Цены ориентировочные. Исполнитель, время и итоговая стоимость подтверждаются после заявки.', 'Prices are estimates. The provider, time and final price are confirmed after your request.', "ราคาเป็นเพียงประมาณการ ผู้ให้บริการ เวลา และราคาสุดท้ายจะได้รับการยืนยันหลังจากส่งคำขอ")}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span id="request-category-label">{t('Категория заявки', 'Request category', "หมวดหมู่คำขอ")}</span>
            <Select value={category} onValueChange={value => update('category', value)}>
              <SelectTrigger aria-labelledby="request-category-label" className="min-h-11 w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent collisionPadding={12} className="max-w-[calc(100vw-24px)]">
                <SelectItem className="min-h-11" value="all">{t('Все категории', 'All categories', "ทุกหมวดหมู่")}</SelectItem>
                {unknownCategory && <SelectItem className="min-h-11" value={category}>{rawCategory}</SelectItem>}
                {categories.map(item => <SelectItem className="min-h-11" key={item.id} value={item.id}>{homeServiceCategoryLabel(item.id, language)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>
        {requests.length === 0 ? (
          <div className="space-y-2">
            <EmptyState icon={Wrench} title={t('Услуги не найдены', 'No services found', "ไม่พบบริการ")} />
            <Button variant="outline" onClick={clear}>{t('Сбросить поиск и категорию', 'Clear search and category', "ล้างการค้นหาและหมวดหมู่")}</Button>
          </div>
        ) : (
          <div className={PUBLIC_CATALOG_GRID} data-testid="service-request-grid">
            {visibleRequests.map(fn => <div key={fn.id} data-service-category={fn.category} className="flex min-w-0 flex-col gap-2 [&>article]:flex-1">
              <p className="text-sm font-medium text-muted-foreground">{homeServiceCategoryLabel(fn.category, language)}</p>
              <ServiceFunctionCard fn={fn} catalogue onClick={() => navigate(`/services/order/${fn.id}?returnTo=${encodeURIComponent(returnTo)}`)} />
            </div>)}
          </div>
        )}
        {!filtered && !showAll && requests.length > visibleRequests.length && <Button variant="outline" className="min-h-11 w-full sm:w-auto" onClick={() => setShowAll(true)}>
          {t(`Все услуги для дома (${requests.length})`, `All home services (${requests.length})`, `บริการสำหรับบ้านทั้งหมด (${requests.length})`)}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>}
      </section>

      <section className="flex flex-col gap-4 border border-primary/15 bg-primary/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-labelledby="service-help-title">
        <div className="min-w-0"><h2 id="service-help-title" className="font-display text-h3">{t('Не нашли нужную услугу?', 'Can’t find the right service?', "ไม่พบบริการที่ต้องการ?")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t('Опишите задачу — команда myUNO поможет с подбором.', 'Describe your task and the myUNO team can help you find an option.', "อธิบายสิ่งที่ต้องการ แล้วทีม myUNO จะช่วยค้นหาตัวเลือกให้คุณ")}</p></div>
        <Button className="min-h-11 shrink-0" onClick={() => setHelpOpen(true)}>{t('Описать задачу', 'Describe your task', "อธิบายสิ่งที่ต้องการ")}</Button>
      </section>
      {helpOpen && <Suspense fallback={<p role="status">{t('Открываем форму…', 'Opening request form…', "กำลังเปิดแบบฟอร์มคำขอ…")}</p>}><ConciergeHelpSheet open={helpOpen} onOpenChange={setHelpOpen} topic="general" initialSubject={query}
        subjectPlaceholder={t('Например: помощь с сантехникой', 'For example: help with plumbing', 'เช่น ต้องการช่างประปา')}
        messagePlaceholder={t('Какая услуга нужна, где и когда? Опишите задачу и удобный способ связи.', 'What service do you need, where and when? Describe the task and how to contact you.', 'ต้องการบริการอะไร ที่ไหน และเมื่อไหร่? อธิบายงานและช่องทางติดต่อ')}
 sourceData={{ source: 'services_catalogue', returnTo }} /></Suspense>}

      <MarketplaceServiceGrid search={query} returnTo={returnTo} />

      <ol aria-label={t('Как оставить заявку', 'How requests work', "ขั้นตอนการส่งคำขอ")} className="grid gap-5 border-t border-border pt-6 md:grid-cols-3">
        {[
          [t('Выберите услугу', 'Choose a service', "เลือกบริการ"), t('Найдите подходящую услугу или опишите задачу.', 'Find a service or describe what you need.', "ค้นหาบริการหรืออธิบายสิ่งที่คุณต้องการ")],
          [t('Уточните адрес и время', 'Share the place and time', "ระบุสถานที่และเวลา"), t('Укажите адрес, удобное время и детали.', 'Add your address, preferred time and details.', "เพิ่มที่อยู่ เวลาที่สะดวก และรายละเอียด")],
          [t('Дождитесь подтверждения', 'Wait for confirmation', "รอการยืนยัน"), t('Заявка не означает подтверждённую запись. Время и стоимость требуют согласования.', 'A request is not a confirmed booking. Time and price need confirmation.', "การส่งคำขอไม่ใช่การยืนยันการจอง เวลาและราคาต้องได้รับการยืนยัน")],
        ].map(([title, description], index) => <li key={title} className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">{index + 1}</span><div><h3 className="text-sm font-medium">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div></li>)}
      </ol>
    </Layout>
  );
}
