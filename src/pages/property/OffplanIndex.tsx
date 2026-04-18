/**
 * OffplanIndex - Catalog of off-plan property projects in Phuket
 * Server filters + OFFPLAN-style client filters (offplan_catalog JSON when present)
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  TrendingUp,
  SlidersHorizontal,
  X,
  Search,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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

const STATUS_OPTIONS: { value: ProjectStatus; labelEn: string; labelRu: string }[] = [
  { value: 'offplan', labelEn: 'Off-Plan', labelRu: 'Новостройка' },
  { value: 'under_construction', labelEn: 'Under Construction', labelRu: 'Строится' },
  { value: 'completed', labelEn: 'Completed', labelRu: 'Готово' },
];

const REC_OPTIONS: { value: RecLabel; labelEn: string; labelRu: string }[] = [
  { value: 'BUY', labelEn: 'BUY', labelRu: 'BUY' },
  { value: 'WATCH', labelEn: 'WATCH', labelRu: 'WATCH' },
  { value: 'AVOID', labelEn: 'AVOID', labelRu: 'AVOID' },
];

const YEAR_OPTIONS: { value: string; labelEn: string; labelRu: string }[] = [
  { value: '_any', labelEn: 'Any year', labelRu: 'Любой год' },
  { value: 'done24', labelEn: 'Completed 2024', labelRu: 'Сдано 2024' },
  { value: 'done25', labelEn: 'Completed 2025', labelRu: 'Сдано 2025' },
  { value: '2026', labelEn: '2026', labelRu: '2026' },
  { value: '2027', labelEn: '2027', labelRu: '2027' },
  { value: '2028', labelEn: '2028+', labelRu: '2028+' },
];

const RISK_OPTIONS: { value: string; labelEn: string; labelRu: string }[] = [
  { value: '_any', labelEn: 'Any risk', labelRu: 'Любой риск' },
  { value: '1', labelEn: 'Risk 1', labelRu: 'Риск 1' },
  { value: '2', labelEn: 'Risk 2', labelRu: 'Риск 2' },
  { value: '3', labelEn: 'Risk 3', labelRu: 'Риск 3' },
  { value: '4', labelEn: 'Risk 4', labelRu: 'Риск 4' },
  { value: '5', labelEn: 'Risk 5', labelRu: 'Риск 5' },
];

export default function OffplanIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);
  const [ui, setUi] = useState<OffplanUiFilterState>(() => defaultOffplanUiFilterState());

  const { data: projects, isLoading } = useOffplanProjects({
    status: selectedStatus.length > 0 ? selectedStatus : undefined,
    district: selectedDistrict || undefined,
    developerId: selectedDeveloper || undefined,
    minScore: minScore > 0 ? minScore : undefined,
  });
  const { data: districts } = useProjectDistricts();
  const { data: developers } = useDevelopers();

  const facetOptions = useMemo(() => collectFacetOptions(projects ?? []), [projects]);
  const recCounts = useMemo(() => countByRec(projects ?? []), [projects]);

  const displayedProjects = useMemo(() => {
    return applyOffplanUiFilters(projects ?? [], ui);
  }, [projects, ui]);

  const serverFilterCount =
    selectedStatus.length +
    (selectedDistrict ? 1 : 0) +
    (selectedDeveloper ? 1 : 0) +
    (minScore > 0 ? 1 : 0);
  const catalogFilterCount = activeOffplanFilterCount(ui);
  const totalFilterBadge = serverFilterCount + catalogFilterCount;

  const hasAnyFilters = totalFilterBadge > 0;

  const clearAll = () => {
    setSelectedStatus([]);
    setSelectedDistrict('');
    setSelectedDeveloper('');
    setMinScore(0);
    setUi(defaultOffplanUiFilterState());
  };

  const toggleStatus = (status: ProjectStatus) => {
    setSelectedStatus((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  const toggleRec = (rec: RecLabel) => {
    setUi((prev) => ({ ...prev, fRec: prev.fRec === rec ? '' : rec }));
  };

  const seoTitle = isRu
    ? 'Новостройки Пхукета — каталог off-plan проектов с ClearView рейтингом'
    : 'Phuket New Developments — off-plan catalog with ClearView ratings';
  const seoDescription = isRu
    ? 'Каталог новостроек Пхукета: BUY/WATCH/AVOID рейтинг ClearView V3, due diligence, ROI, фильтры по району и застройщику. Независимая аналитика myUNO.'
    : 'Phuket off-plan property catalog with ClearView V3 BUY/WATCH/AVOID ratings, due diligence, ROI, filters by district and developer. Independent myUNO analytics.';
  const canonicalUrl = 'https://myuno.app/property/offplan';
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Property', url: 'https://myuno.app/property' },
    { name: isRu ? 'Новостройки' : 'Off-Plan', url: canonicalUrl },
  ]);

  return (
    <AppLayout title={isRu ? 'Новостройки Пхукета' : 'Phuket New Developments'}>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        url={canonicalUrl}
        type="website"
        jsonLd={breadcrumbSchema}
      />
      <div className="px-4 py-4 pb-24 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-accent/5 p-4 border border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-xl">
                {isRu ? 'Новостройки Пхукета' : 'Phuket New Developments'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Фильтры как в OFFPLAN-каталоге + muUNO' : 'OFFPLAN-style filters + muUNO'}
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
              {(() => {
                const maxRoi = Math.max(...projects.map((p) => p.roiProjected || 0));
                return maxRoi > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-success" />
                    <span>
                      {isRu ? 'до' : 'up to'} {maxRoi}% ROI
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9 h-11 rounded-xl"
            placeholder={isRu ? 'Поиск по названию, району, тегам…' : 'Search name, area, tags…'}
            value={ui.q}
            onChange={(e) => setUi((prev) => ({ ...prev, q: e.target.value }))}
          />
        </div>

        {/* Construction status + REC (catalog) */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {isRu ? 'Статус стройки' : 'Build status'}
          </p>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status.value}
                variant={selectedStatus.includes(status.value) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleStatus(status.value)}
                className="shrink-0 rounded-full"
              >
                {isRu ? status.labelRu : status.labelEn}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide pt-1">
            {isRu ? 'Рекомендация (каталог OFFPLAN)' : 'Recommendation (OFFPLAN catalog)'}
          </p>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
            {REC_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={ui.fRec === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleRec(opt.value)}
                className="shrink-0 rounded-full gap-1"
              >
                {opt.labelEn}
                <span className="text-[10px] opacity-80">({recCounts[opt.value]})</span>
              </Button>
            ))}
          </div>
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
                  <label className="text-sm font-medium mb-2 block">{isRu ? 'Зона (OFFPLAN)' : 'Zone (OFFPLAN)'}</label>
                  <Select
                    value={ui.fZone || '_all'}
                    onValueChange={(v) => setUi((prev) => ({ ...prev, fZone: v === '_all' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Все' : 'All'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{isRu ? 'Все' : 'All'}</SelectItem>
                      {facetOptions.zones.map((z) => (
                        <SelectItem key={z} value={z}>
                          {z}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Segment</label>
                  <Select
                    value={ui.fSeg || '_all'}
                    onValueChange={(v) => setUi((prev) => ({ ...prev, fSeg: v === '_all' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{isRu ? 'Все' : 'All'}</SelectItem>
                      {facetOptions.segs.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{isRu ? 'Пляж (доступ)' : 'Beach access'}</label>
                  <Select
                    value={ui.fBeach || '_all'}
                    onValueChange={(v) => setUi((prev) => ({ ...prev, fBeach: v === '_all' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{isRu ? 'Все' : 'All'}</SelectItem>
                      {facetOptions.beaches.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{isRu ? 'Год сдачи' : 'Handover year'}</label>
                  <Select
                    value={ui.fYear ? ui.fYear : '_any'}
                    onValueChange={(v) => setUi((prev) => ({ ...prev, fYear: v === '_any' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {isRu ? o.labelRu : o.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">{isRu ? 'Риск (1–5)' : 'Risk (1–5)'}</label>
                  <Select
                    value={ui.fRisk ? ui.fRisk : '_any'}
                    onValueChange={(v) => setUi((prev) => ({ ...prev, fRisk: v === '_any' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_OPTIONS.map((o) => (
                        <SelectItem key={o.value || 'any'} value={o.value || '_any'}>
                          {isRu ? o.labelRu : o.labelEn}
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

                <div>
                  <label className="text-sm font-medium mb-2 block">muUNO {isRu ? 'мин.' : 'min.'}</label>
                  <Select value={String(minScore)} onValueChange={(v) => setMinScore(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{isRu ? 'Любой' : 'Any'}</SelectItem>
                      <SelectItem value="60">60+</SelectItem>
                      <SelectItem value="70">70+</SelectItem>
                      <SelectItem value="80">80+</SelectItem>
                      <SelectItem value="85">85+</SelectItem>
                    </SelectContent>
                  </Select>
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
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {displayedProjects.length} {isRu ? 'результатов' : 'results'}
          </span>
          <Select
            value={ui.fSort}
            onValueChange={(v) => setUi((prev) => ({ ...prev, fSort: v as OffplanSortKey }))}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">{isRu ? 'muUNO score' : 'muUNO score'}</SelectItem>
              <SelectItem value="rating">{isRu ? 'Рейтинг каталога' : 'Catalog rating'}</SelectItem>
              <SelectItem value="price_asc">{isRu ? 'Цена ↑' : 'Price ↑'}</SelectItem>
              <SelectItem value="price_desc">{isRu ? 'Цена ↓' : 'Price ↓'}</SelectItem>
              <SelectItem value="yield">{isRu ? 'Доходность' : 'Yield'}</SelectItem>
              <SelectItem value="risk">{isRu ? 'Риск ↑' : 'Risk ↑'}</SelectItem>
              <SelectItem value="beach">{isRu ? 'Пляж' : 'Beach'}</SelectItem>
              <SelectItem value="completion">{isRu ? 'Сдача' : 'Completion'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-[16/10] rounded-t-2xl" />
                <div className="p-4 space-y-3 bg-card rounded-b-2xl border border-t-0">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedProjects.length === 0 ? (
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
          <div className="grid gap-4 sm:grid-cols-2">
            {displayedProjects.map((project) => (
              <OffplanProjectCard key={project.id} project={project} variant="grid" />
            ))}
          </div>
        )}

        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 mt-6">
          <h3 className="font-semibold mb-2">{isRu ? 'Хотите привлечь инвестиции?' : 'Want to raise investment?'}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? 'Разместите свой проект на платформе muUNO' : 'List your project on the muUNO platform'}
          </p>
          <Button onClick={() => navigate('/property/invest/raise')} className="w-full">
            {isRu ? 'Подать заявку' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
