import { pickLang } from '@/lib/i18n/pickLang';
import { publicNewbuildPresentation } from '@/lib/real-estate/publicNewbuildPresentation';
import '@/styles/public-commerce.css';
/**
 * OffplanIndex - Catalog of off-plan property projects in Phuket
 * Server filters + OFFPLAN-style client filters (offplan_catalog JSON when present)
 */

import React, { useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  SlidersHorizontal,
  X,
  Search,
} from 'lucide-react';
import { SEOHead, createBreadcrumbSchema } from '@/components/seo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOffplanProjects, useProjectDistricts, type ProjectStatus } from '@/hooks/useOffplanProjects';
import { useDevelopers } from '@/hooks/useDevelopers';
import { OffplanProjectCard } from '@/components/property/OffplanProjectCard';
import { SaveOffplanSearchDialog } from '@/components/property/SaveOffplanSearchDialog';
import {
  applyOffplanUiFilters,
  activeOffplanFilterCount,
  collectFacetOptions,
  countByRec,
} from '@/lib/offplan/filters';
import {
  defaultOffplanUiFilterState,
  type OffplanUiFilterState,
  type RecLabel,
  type OffplanSortKey,
} from '@/lib/offplan/types';

export default function OffplanIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [params, setParams] = useSearchParams();
  const selectedDistrict = params.get('district') || '';
  const selectedDeveloper = params.get('developer') || '';
  const ui: OffplanUiFilterState = { ...defaultOffplanUiFilterState(), q: params.get('q') || '', fDev: params.get('developerName') || '' };
  const updateFilters = (changes: Record<string, string>) => setParams(previous => {
    const next = new URLSearchParams(previous);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    return next;
  }, { replace: true });
  const setSelectedDistrict = (value: string) => updateFilters({ district: value });
  const setSelectedDeveloper = (value: string) => updateFilters({ developer: value });

  // Apply saved search filters when navigated from /account/saved-searches
  useEffect(() => {
    const raw = sessionStorage.getItem('nb_apply_saved_search');
    if (!raw) return;
    sessionStorage.removeItem('nb_apply_saved_search');
    try {
      const f = JSON.parse(raw) as Partial<OffplanUiFilterState>;
      setParams(previous => { const next = new URLSearchParams(previous); if (f.q) next.set('q', f.q); else next.delete('q'); if (f.fDev) next.set('developerName', f.fDev); else next.delete('developerName'); return next; }, { replace: true });
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
    return applyOffplanUiFilters(projects ?? [], { ...defaultOffplanUiFilterState(), q: ui.q, fDev: ui.fDev, fSort: 'beach' });
  }, [projects, ui]);

  const serverFilterCount =
    (selectedDistrict ? 1 : 0) +
    (selectedDeveloper ? 1 : 0);
  const catalogFilterCount = (ui.fDev ? 1 : 0);
  const totalFilterBadge = serverFilterCount + catalogFilterCount;

  const hasAnyFilters = totalFilterBadge > 0 || Boolean(ui.q);

  const clearAll = () => {
    updateFilters({ district: '', developer: '', developerName: '', q: '' });
  };

  const seoTitle = isRu
    ? 'Новостройки Пхукета — каталог проектов'
    : 'Phuket New Developments — Project Catalog';
  const seoDescription = isRu
    ? 'Опубликованные проекты Пхукета. Начальные цены требуют уточнения; поиск по району и застройщику.'
    : 'Published Phuket projects. Starting prices require confirmation; search by district and developer.';
  const canonicalUrl = 'https://www.myuno.app/property/offplan';
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 rounded-full gap-1.5">
                <SlidersHorizontal className="w-4 h-4" />
                {pickLang(language, {"ru": "Фильтры", "en": "Filters", "th": "ตัวกรอง"})}
                {totalFilterBadge > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1 justify-center">
                    {totalFilterBadge}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{pickLang(language, {"ru": "Фильтры", "en": "Filters", "th": "ตัวกรอง"})}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 mt-6 pb-8">
                <div>
                  <label className="text-sm font-medium mb-2 block">{pickLang(language, {"ru": "Район", "en": "District", "th": "ย่าน"})}</label>
                  <Select
                    value={selectedDistrict || '_all'}
                    onValueChange={(v) => setSelectedDistrict(v === '_all' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={pickLang(language, {"ru": "Все районы", "en": "All districts", "th": "ทุกย่าน"})} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{pickLang(language, {"ru": "Все районы", "en": "All districts", "th": "ทุกย่าน"})}</SelectItem>
                      {districts?.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>











                <div>
                  <label className="text-sm font-medium mb-2 block">{pickLang(language, {"ru": "Застройщик", "en": "Developer", "th": "ผู้พัฒนา"})}</label>
                  <Select
                    value={selectedDeveloper || '_all'}
                    onValueChange={(v) => setSelectedDeveloper(v === '_all' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={pickLang(language, {"ru": "Все", "en": "All", "th": "ทั้งหมด"})} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{pickLang(language, {"ru": "Все застройщики", "en": "All developers", "th": "ผู้พัฒนาทั้งหมด"})}</SelectItem>
                      {developers?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {isRu ? d.nameRu : d.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{pickLang(language, {"ru": "Поиск застройщика (текст)", "en": "Developer contains", "th": "ค้นหาชื่อผู้พัฒนา"})}</label>
                  <Input
                    value={ui.fDev}
                    onChange={(e) => updateFilters({ developerName: e.target.value })}
                    placeholder="Sansiri, Laguna…"
                  />
                </div>



                <SheetClose asChild><Button className="w-full">{pickLang(language, {"ru": "Показать проекты", "en": "Show projects", "th": "ดูโครงการ"})}</Button></SheetClose>
                <Button variant="outline" className="w-full" onClick={clearAll}>
                  {pickLang(language, {"ru": "Сбросить всё", "en": "Clear all", "th": "ล้างทั้งหมด"})}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {hasAnyFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} aria-label={pickLang(language, {"ru": "Сбросить фильтры", "en": "Clear filters", "th": "ล้างตัวกรอง"})} className="shrink-0 text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          )}

          <SaveOffplanSearchDialog filters={ui} resultCount={displayedProjects.length} />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {displayedProjects.length} {pickLang(language, {"ru": "результатов", "en": "results", "th": "ผลลัพธ์"})}
          </span>

        </div>

        {isLoading ? (
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
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {displayedProjects.map((project) => (
              <OffplanProjectCard key={project.id} project={project} variant="grid" />
            ))}
          </div>
        )}

        <div className="rounded-none bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 mt-6">
          <h3 className="font-semibold mb-2">{pickLang(language, {"ru": "Разместить проект на myUNO?", "en": "List your project with myUNO?", "th": "ต้องการนำเสนอโครงการบน myUNO?"})}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {pickLang(language, {"ru": "Разместите свой проект на платформе myUNO", "en": "List your project on the myUNO platform", "th": "นำเสนอโครงการของคุณบน myUNO"})}
          </p>
          <Button variant="outline" onClick={() => navigate('/property/invest/raise')}>
            {pickLang(language, {"ru": "Подать заявку", "en": "Submit Application", "th": "ส่งคำขอ"})}
          </Button>
        </div>
      </div>
    </>
  );
}
