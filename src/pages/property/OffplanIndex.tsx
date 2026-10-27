import { publicNewbuildPresentation } from '@/lib/real-estate/publicNewbuildPresentation';
import '@/styles/public-commerce.css';
/**
 * OffplanIndex - Catalog of off-plan property projects in Phuket
 * Server filters + OFFPLAN-style client filters (offplan_catalog JSON when present)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [ui, setUi] = useState<OffplanUiFilterState>(() => defaultOffplanUiFilterState());

  // Apply saved search filters when navigated from /account/saved-searches
  useEffect(() => {
    const raw = sessionStorage.getItem('nb_apply_saved_search');
    if (!raw) return;
    sessionStorage.removeItem('nb_apply_saved_search');
    try {
      const f = JSON.parse(raw) as Partial<OffplanUiFilterState>;
      setUi((prev) => ({ ...prev, q: f.q || '', fDev: f.fDev || '' }));
    } catch { /* ignore */ }
  }, []);

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

  const hasAnyFilters = totalFilterBadge > 0;

  const clearAll = () => {
    setSelectedDistrict('');
    setSelectedDeveloper('');
    setUi(defaultOffplanUiFilterState());
  };

  const seoTitle = isRu
    ? 'Новостройки Пхукета — каталог проектов'
    : 'Phuket New Developments — Project Catalog';
  const seoDescription = isRu
    ? 'Опубликованные проекты Пхукета. Цена и условия по запросу; поиск по району и застройщику.'
    : 'Published Phuket projects. Prices and terms on request; search by district and developer.';
  const canonicalUrl = 'https://www.myuno.app/property/offplan';
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Property', url: 'https://www.myuno.app/property' },
    { name: isRu ? 'Новостройки' : 'Off-Plan', url: canonicalUrl },
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
        <div className="public-commerce-intro border-b border-border py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-none bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="public-commerce-title">
                {isRu ? 'Новостройки Пхукета' : 'Phuket New Developments'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Цена и условия — по запросу' : 'Prices and terms on request'}
              </p>
            </div>
          </div>

          {projects && (
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>
                  {projects.length} {isRu ? 'в базе' : 'in catalog'}
                </span>
              </div>

            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 rounded-none"
            placeholder={isRu ? 'Поиск по названию и району…' : 'Search name and area…'}
            value={ui.q}
            onChange={(e) => setUi((prev) => ({ ...prev, q: e.target.value }))}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 rounded-full gap-1.5">
                <SlidersHorizontal className="w-4 h-4" />
                {isRu ? 'Фильтры' : 'Filters'}
                {totalFilterBadge > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[1.25rem] px-1 justify-center">
                    {totalFilterBadge}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{isRu ? 'Фильтры' : 'Filters'}</SheetTitle>
              </SheetHeader>
              <div className="space-y-5 mt-6 pb-8">
                <div>
                  <label className="text-sm font-medium mb-2 block">{isRu ? 'Район (БД)' : 'District (DB)'}</label>
                  <Select
                    value={selectedDistrict || '_all'}
                    onValueChange={(v) => setSelectedDistrict(v === '_all' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Все районы' : 'All districts'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{isRu ? 'Все районы' : 'All districts'}</SelectItem>
                      {districts?.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>











                <div>
                  <label className="text-sm font-medium mb-2 block">{isRu ? 'Застройщик' : 'Developer'}</label>
                  <Select
                    value={selectedDeveloper || '_all'}
                    onValueChange={(v) => setSelectedDeveloper(v === '_all' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Все' : 'All'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{isRu ? 'Все застройщики' : 'All developers'}</SelectItem>
                      {developers?.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {isRu ? d.nameRu : d.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{isRu ? 'Поиск застройщика (текст)' : 'Developer contains'}</label>
                  <Input
                    value={ui.fDev}
                    onChange={(e) => setUi((prev) => ({ ...prev, fDev: e.target.value }))}
                    placeholder="Sansiri, Laguna…"
                  />
                </div>



                <Button variant="outline" className="w-full" onClick={clearAll}>
                  {isRu ? 'Сбросить всё' : 'Clear all'}
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {hasAnyFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="shrink-0 text-muted-foreground">
              <X className="w-4 h-4" />
            </Button>
          )}

          <SaveOffplanSearchDialog filters={ui} resultCount={displayedProjects.length} />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {displayedProjects.length} {isRu ? 'результатов' : 'results'}
          </span>

        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-[16/10] rounded-none" />
                <div className="p-4 space-y-3 bg-card rounded-none border border-t-0">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? <div role="alert" className="py-8"><p>{isRu ? 'Не удалось загрузить проекты.' : 'Unable to load projects.'}</p><Button onClick={() => void refetch()}>{isRu ? 'Попробовать ещё раз' : 'Try again'}</Button></div> : displayedProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">{isRu ? 'Проекты не найдены' : 'No projects found'}</p>
            {hasAnyFilters && (
              <Button variant="link" onClick={clearAll} className="mt-2">
                {isRu ? 'Сбросить фильтры' : 'Clear filters'}
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
          <h3 className="font-semibold mb-2">{isRu ? 'Разместить проект на myUNO?' : 'List your project with myUNO?'}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? 'Разместите свой проект на платформе myUNO' : 'List your project on the myUNO platform'}
          </p>
          <Button onClick={() => navigate('/property/invest/raise')} className="w-full">
            {isRu ? 'Подать заявку' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </>
  );
}
