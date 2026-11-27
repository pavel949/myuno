import { PublicAssetFilterNotice } from '@/components/property/commercial/PublicAssetFilterNotice';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';
import { publicNewbuildPresentation } from '@/lib/real-estate/publicNewbuildPresentation';
import '@/styles/public-commerce.css';
/**
 * OffplanIndex - Catalog of off-plan property projects in Phuket
 * Server filters + OFFPLAN-style client filters (offplan_catalog JSON when present)
 */

import React, { lazy, Suspense, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  List,
  Map,
  X,
  Search,
} from 'lucide-react';
import { SEOHead, createBreadcrumbSchema } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MarketplaceFilterSheet } from '@/components/services/MarketplaceFilterSheet';
import { useCataloguePanelDraft } from '@/hooks/useCataloguePanelDraft';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffplanProjects, useProjectDistricts } from '@/hooks/useOffplanProjects';
import { useDevelopers } from '@/hooks/useDevelopers';
import { OffplanProjectCard } from '@/components/property/OffplanProjectCard';
import { CopyPublicSearchLink } from '@/components/property/CopyPublicSearchLink';
import {
  applyOffplanUiFilters,
} from '@/lib/offplan/filters';
import {
  defaultOffplanUiFilterState,
  type OffplanUiFilterState,
  type OffplanSortKey,
} from '@/lib/offplan/types';
import { BUDGET_OPTIONS, SORT_OPTIONS, filterByBudget } from '@/lib/offplan/catalogFacets';
import { parseOffplanMapViewport, serializeOffplanMapViewport } from '@/lib/offplan/mapState';

const OffplanProjectMap = lazy(() => import('@/components/property/OffplanProjectMap'));
const SORTS: OffplanSortKey[] = ['score', 'price_asc', 'price_desc'];

export default function OffplanIndex() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [params, setParams] = useSearchParams();
  const selectedDistrict = params.get('district') || '';
  const selectedDeveloper = params.get('developer') || '';
  const sortParam = params.get('sort') as OffplanSortKey | null;
  const mapView = params.get('view') === 'map';
  const viewport = parseOffplanMapViewport(params.get('mapViewport'));
  const ui: OffplanUiFilterState = useMemo(() => ({
    ...defaultOffplanUiFilterState(),
    q: params.get('q') || '',
    fDev: params.get('developerName') || '',
    fYear: params.get('year') || '',
    fOwn: params.get('own') || '',
    fBeach: params.get('beach') || '',
    fSort: sortParam && SORTS.includes(sortParam) ? sortParam : 'score',
  }), [params, sortParam]);
  const budget = params.get('budget') || '';
  const unavailableFacets = ['year', 'own', 'beach', 'rec', 'seg', 'risk', 'mgmt', 'focus'].some(key => !!params.get(key)) || !!sortParam && ['completion', 'yield', 'beach', 'risk', 'rating'].includes(sortParam);
  const queryIssue = unavailableFacets ? 'unsupported' as const : (budget && !BUDGET_OPTIONS.some(option => option.value === budget) || sortParam && !SORTS.includes(sortParam)) ? 'invalid' as const : undefined;
  const updateFilters = (changes: Record<string, string>, replace = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    if (next.toString() === params.toString()) return;
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { replace, state: location.state, preventScrollReset: true });
  };
  const panelKeys = ['district', 'developer', 'developerName', 'budget'] as const;
  const panel = useCataloguePanelDraft(panelKeys, params, next => {
    navigate({ pathname: location.pathname, search: next.toString(), hash: location.hash }, { state: location.state, preventScrollReset: true });
  });
  const editPanel = (key: typeof panelKeys[number], value: string) => panel.setValues(next => {
    if (value) next.set(key, value); else next.delete(key);
    return next;
  });
  const resetPanel = () => panel.setValues(next => { panelKeys.forEach(key => next.delete(key)); return next; });

  // Apply saved search filters when navigated from /account/saved-searches
  useEffect(() => {
    const raw = sessionStorage.getItem('nb_apply_saved_search');
    if (!raw) return;
    sessionStorage.removeItem('nb_apply_saved_search');
    try {
      const f = JSON.parse(raw) as Partial<OffplanUiFilterState>;
      setParams(previous => {
        const next = new URLSearchParams(previous);
        for (const key of ['district', 'developer', 'developerName', 'q', 'year', 'own', 'beach', 'budget', 'sort', 'rec', 'seg', 'risk', 'mgmt', 'focus']) next.delete(key);
        const developerKey = typeof f.fDev === 'string' && /^[a-f0-9-]{36}$/i.test(f.fDev) ? 'developer' : 'developerName';
        for (const [field, key] of [['q', 'q'], ['fDev', developerKey], ['fZone', 'district'], ['fYear', 'year'], ['fOwn', 'own'], ['fBeach', 'beach'], ['fSort', 'sort'], ['fRec', 'rec'], ['fSeg', 'seg'], ['fRisk', 'risk'], ['fMgmt', 'mgmt'], ['fFocus', 'focus']] as const) {
          const value = f[field]; if (typeof value === 'string' && value) next.set(key, value);
        }
        return next;
      }, { replace: true });
    } catch { /* ignore */ }
  }, [setParams]);

  const { data: sourceProjects, isLoading, isError, refetch } = useOffplanProjects({
    district: selectedDistrict || undefined,
    developerId: selectedDeveloper || undefined,
  });
  const projects = useMemo(() => sourceProjects?.map(publicNewbuildPresentation), [sourceProjects]);
  const { data: districts } = useProjectDistricts();
  const { data: developers } = useDevelopers();


  const displayedProjects = useMemo(() => {
    const filtered = applyOffplanUiFilters(projects ?? [], ui);
    return filterByBudget(filtered, budget);
  }, [projects, ui, budget]);

  const serverFilterCount =
    (selectedDistrict ? 1 : 0) +
    (selectedDeveloper ? 1 : 0);
  const catalogFilterCount = [ui.fDev, ui.fYear, ui.fOwn, ui.fBeach, budget].filter(Boolean).length;
  const totalFilterBadge = serverFilterCount + catalogFilterCount;

  const hasAnyFilters = totalFilterBadge > 0 || Boolean(ui.q);

  const clearAll = () => {
    updateFilters({ district: '', developer: '', developerName: '', q: '', year: '', own: '', beach: '', budget: '', sort: '', rec: '', seg: '', risk: '', mgmt: '', focus: '' });
  };

  const seoTitle = isRu
    ? 'Новостройки Пхукета — каталог проектов'
    : 'Phuket New Developments — Project Catalog';
  const seoDescription = isRu
    ? 'Опубликованные проекты Пхукета. Начальные цены требуют уточнения; поиск по району и застройщику.'
    : 'Published Phuket projects. Starting prices require confirmation; search by district and developer.';
  const canonicalUrl = 'https://www.myuno.app/property/offplan/search';
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Property', url: 'https://www.myuno.app/property' },
    { name: pickLang(language, {"ru": "Новостройки", "en": "Off-Plan", "th": "โครงการใหม่"}), url: canonicalUrl },
  ]);

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        url={canonicalUrl}
        type="website"
        jsonLd={breadcrumbSchema}
      />
      <div className="public-commerce public-commerce--projects px-4 py-6 pb-24 space-y-6">
        <header className="public-commerce-intro">
          <h1 className="public-commerce-title">{pickLang(language, { ru: 'Новостройки Пхукета', en: 'Phuket New Developments', th: 'โครงการใหม่ในภูเก็ต' })}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{pickLang(language, { ru: 'Начальные цены требуют уточнения', en: 'Starting prices require confirmation', th: 'ราคาเริ่มต้นต้องยืนยันอีกครั้ง' })}</p>
        </header>

        {/* Search */}
        <div className="relative" role="search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            aria-label={pickLang(language, {"ru": "Название или район", "en": "Project name or district", "th": "ชื่อโครงการหรือย่าน"})}
            className="pl-9 h-11 rounded-none"
            placeholder={pickLang(language, {"ru": "Поиск по названию и району…", "en": "Search name and area…", "th": "ค้นหาชื่อและย่าน…"})}
            value={ui.q}
            onChange={(e) => updateFilters({ q: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <MarketplaceFilterSheet showLabel title={pickLang(language, { ru: 'Фильтры', en: 'Filters', th: 'ตัวกรอง' })} activeCount={totalFilterBadge}
            applyLabel={pickLang(language, { ru: 'Показать проекты', en: 'Show projects', th: 'ดูโครงการ' })}
            onOpenChange={panel.openChange} onApply={() => panel.apply()} onReset={resetPanel}>
            <div className="space-y-2">
              <label htmlFor="offplan-filter-district" className="block text-sm font-medium">{pickLang(language, { ru: 'Район', en: 'District', th: 'ย่าน' })}</label>
              <Select value={panel.values.get('district') || '_all'} onValueChange={value => editPanel('district', value === '_all' ? '' : value)}>
                <SelectTrigger id="offplan-filter-district" className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{pickLang(language, { ru: 'Все районы', en: 'All districts', th: 'ทุกย่าน' })}</SelectItem>
                  {panel.values.get('district') && !districts?.includes(panel.values.get('district')!) && <SelectItem value={panel.values.get('district')!}>{panel.values.get('district')}</SelectItem>}
                  {districts?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="offplan-filter-developer" className="block text-sm font-medium">{pickLang(language, { ru: 'Застройщик', en: 'Developer', th: 'ผู้พัฒนา' })}</label>
              <Input id="offplan-filter-developer" list="offplan-filter-developers" className="min-h-11"
                value={panel.values.get('developerName') ?? (panel.values.get('developer') ? (developers?.find(d => d.id === panel.values.get('developer'))?.[isRu ? 'nameRu' : 'nameEn'] || (isRu ? 'Застройщик из ссылки' : language === 'th' ? 'ผู้พัฒนาจากลิงก์' : 'Developer from link')) : '')}
                onChange={event => {
                  const value = event.target.value;
                  const matches = developers?.filter(d => (isRu ? d.nameRu : d.nameEn) === value) ?? [];
                  panel.setValues(next => {
                    next.delete('developer');
                    next.delete('developerName');
                    if (matches.length === 1) next.set('developer', matches[0].id);
                    else if (value) next.set('developerName', value);
                    return next;
                  });
                }}
                placeholder={pickLang(language, { ru: 'Введите или выберите название', en: 'Enter or choose a name', th: 'พิมพ์หรือเลือกชื่อ' })}
              />
              <datalist id="offplan-filter-developers">{developers?.map(d => <option key={d.id} value={isRu ? d.nameRu : d.nameEn}>{isRu ? d.nameRu : d.nameEn}</option>)}</datalist>
            </div>
            <div className="space-y-2">
              <label htmlFor="offplan-filter-budget" className="block text-sm font-medium">{pickLang(language, { ru: 'Бюджет', en: 'Budget', th: 'งบประมาณ' })}</label>
              <Select value={panel.values.get('budget') || '_all'} onValueChange={value => editPanel('budget', value === '_all' ? '' : value)}>
                <SelectTrigger id="offplan-filter-budget" className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">{pickLang(language, { ru: 'Любой', en: 'Any', th: 'ทั้งหมด' })}</SelectItem>
                  {panel.values.get('budget') && !BUDGET_OPTIONS.some(option => option.value === panel.values.get('budget')) && <SelectItem value={panel.values.get('budget')!}>{pickLang(language, { ru: 'Проверьте бюджет', en: 'Check budget', th: 'ตรวจสอบงบประมาณ' })}</SelectItem>}
                  {BUDGET_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>{pickLang(language, option.label)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </MarketplaceFilterSheet>

          {BUDGET_OPTIONS.map((o) => (
            <Button key={o.value} variant={budget === o.value ? 'default' : 'outline'} size="sm" className="shrink-0 rounded-full"
              aria-pressed={budget === o.value} onClick={() => updateFilters({ budget: budget === o.value ? '' : o.value })}>
              {pickLang(language, o.label)}
            </Button>
          ))}


          {hasAnyFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} aria-label={pickLang(language, {"ru": "Сбросить фильтры", "en": "Clear filters", "th": "ล้างตัวกรอง"})} className="shrink-0 text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          )}

          {!queryIssue && <CopyPublicSearchLink />}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span role="status" className="text-sm text-muted-foreground">
            {queryIssue ? pickLang(language, { ru: 'Проверьте параметры', en: 'Check filters', th: 'ตรวจสอบตัวกรอง' }) : isLoading ? pickLang(language, { ru: 'Загрузка…', en: 'Loading…', th: 'กำลังโหลด…' }) : isError ? pickLang(language, { ru: 'Каталог недоступен', en: 'Catalogue unavailable', th: 'ไม่สามารถโหลดแคตตาล็อก' }) : <>{displayedProjects.length} {pickLang(language, { ru: 'результатов', en: 'results', th: 'ผลลัพธ์' })}</>}
          </span>
          <div role="group" aria-label={pickLang(language, { ru: 'Вид каталога', en: 'Catalogue view', th: 'มุมมองแคตตาล็อก' })} className="flex gap-1">
            <Button type="button" variant={mapView ? 'outline' : 'default'} aria-pressed={!mapView} onClick={() => updateFilters({ view: '' }, false)} className="min-h-11 gap-2">
              <List aria-hidden="true" className="size-4" />{pickLang(language, { ru: 'Список', en: 'List', th: 'รายการ' })}
            </Button>
            <Button type="button" variant={mapView ? 'default' : 'outline'} aria-pressed={mapView} onClick={() => updateFilters({ view: 'map' }, false)} className="min-h-11 gap-2">
              <Map aria-hidden="true" className="size-4" />{pickLang(language, { ru: 'Карта', en: 'Map', th: 'แผนที่' })}
            </Button>
          </div>
          <Select value={ui.fSort} onValueChange={(v) => updateFilters({ sort: v === 'score' ? '' : v })}>
            <SelectTrigger className="h-9 w-auto min-w-[11rem]" aria-label={pickLang(language, { ru: 'Сортировка', en: 'Sort', th: 'เรียงลำดับ' })}><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.filter(option => SORTS.includes(option.value)).map((o) => <SelectItem key={o.value} value={o.value}>{pickLang(language, o.label)}</SelectItem>)}
            </SelectContent>
          </Select>

        </div>

        {queryIssue ? <PublicAssetFilterNotice issue={queryIssue} onReset={clearAll} /> : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-[4/3] rounded-none" />
                <div className="p-4 space-y-3 bg-card rounded-none border border-t-0">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? <div role="alert" className="py-8"><p>{pickLang(language, {"ru": "Не удалось загрузить проекты.", "en": "Unable to load projects.", "th": "ไม่สามารถโหลดโครงการได้"})}</p><Button onClick={() => void refetch()}>{pickLang(language, {"ru": "Попробовать ещё раз", "en": "Try again", "th": "ลองอีกครั้ง"})}</Button></div> : displayedProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{pickLang(language, {"ru": "Проекты не найдены", "en": "No projects found", "th": "ไม่พบโครงการ"})}</p>
            {hasAnyFilters && (
              <Button variant="link" onClick={clearAll} className="mt-2">
                {pickLang(language, {"ru": "Сбросить фильтры", "en": "Clear filters", "th": "ล้างตัวกรอง"})}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {mapView && (
              <Suspense fallback={<p role="status">{pickLang(language, { ru: 'Загружаем карту…', en: 'Loading map…', th: 'กำลังโหลดแผนที่…' })}</p>}>
                <OffplanProjectMap projects={displayedProjects} viewport={viewport} selectedId={params.get('mapProject')}
                  onSelect={id => updateFilters({ mapProject: id })}
                  onViewport={next => {
                    const serialized = serializeOffplanMapViewport(next);
                    if (serialized) updateFilters({ mapViewport: serialized });
                  }} />
              </Suspense>
            )}
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {displayedProjects.map((project) => (
                <OffplanProjectCard key={project.id} project={project} variant="grid" />
              ))}
            </div>
          </div>
        )}

        <nav aria-label={pickLang(language, { ru: 'Помощь покупателю', en: 'Buyer resources', th: 'ข้อมูลสำหรับผู้ซื้อ' })} className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link className="text-primary underline" to={APP_ROUTES.KNOWLEDGE}>{pickLang(language, { ru: 'Знания о покупке недвижимости', en: 'Property buyer knowledge hub', th: 'การซื้ออสังหาริมทรัพย์ในไทย' })}</Link>
          <Link className="text-primary underline" to={APP_ROUTES.OFFPLAN}>{pickLang(language, { ru: 'Обзор новостроек Пхукета', en: 'Phuket new developments guide', th: 'คู่มือโครงการใหม่ในภูเก็ต' })}</Link>
        </nav>

        <div className="rounded-none bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 mt-6">
          <h3 className="font-semibold mb-2">{pickLang(language, {"ru": "Разместить проект на myUNO?", "en": "List your project with myUNO?", "th": "ต้องการนำเสนอโครงการบน myUNO?"})}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {pickLang(language, {"ru": "Разместите свой проект на платформе myUNO", "en": "List your project on the myUNO platform", "th": "นำเสนอโครงการของคุณบน myUNO"})}
          </p>
          <Button variant="outline" onClick={() => navigate('/developer-portal/apply')}>
            {pickLang(language, {"ru": "Подать заявку", "en": "Submit Application", "th": "ส่งคำขอ"})}
          </Button>
        </div>
      </div>
    </>
  );
}
