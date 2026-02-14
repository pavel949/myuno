/**
 * OffplanIndex - Catalog of off-plan property projects in Phuket
 * Features filters, muUNO scores, developer info
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Filter, 
  MapPin, 
  TrendingUp, 
  ChevronDown,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { cn } from '@/lib/utils';

type SortOption = 'score' | 'price_asc' | 'price_desc' | 'completion';

const STATUS_OPTIONS: { value: ProjectStatus; labelEn: string; labelRu: string }[] = [
  { value: 'offplan', labelEn: 'Off-Plan', labelRu: 'Новостройка' },
  { value: 'under_construction', labelEn: 'Under Construction', labelRu: 'Строится' },
  { value: 'completed', labelEn: 'Completed', labelRu: 'Готово' },
];

export default function OffplanIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Filters state
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('score');

  // Data
  const { data: projects, isLoading } = useOffplanProjects({
    status: selectedStatus.length > 0 ? selectedStatus : undefined,
    district: selectedDistrict || undefined,
    developerId: selectedDeveloper || undefined,
    minScore: minScore > 0 ? minScore : undefined,
  });
  const { data: districts } = useProjectDistricts();
  const { data: developers } = useDevelopers();

  // Sort projects
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    
    return [...projects].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.priceFrom || 0) - (b.priceFrom || 0);
        case 'price_desc':
          return (b.priceFrom || 0) - (a.priceFrom || 0);
        case 'completion':
          if (!a.completionDate) return 1;
          if (!b.completionDate) return -1;
          return new Date(a.completionDate).getTime() - new Date(b.completionDate).getTime();
        case 'score':
        default:
          return (b.muunoScore || 0) - (a.muunoScore || 0);
      }
    });
  }, [projects, sortBy]);

  const hasFilters = selectedStatus.length > 0 || selectedDistrict || selectedDeveloper || minScore > 0;

  const clearFilters = () => {
    setSelectedStatus([]);
    setSelectedDistrict('');
    setSelectedDeveloper('');
    setMinScore(0);
  };

  const toggleStatus = (status: ProjectStatus) => {
    setSelectedStatus(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <AppLayout 
      title={isRu ? 'Новостройки Пхукета' : 'Phuket New Developments'}
    >
      <div className="px-4 py-4 pb-24 space-y-4">
        {/* Hero */}
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
                {isRu ? 'Инвестируйте с экспертизой muUNO' : 'Invest with muUNO expertise'}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          {projects && (
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span>{projects.length} {isRu ? 'проектов' : 'projects'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>
                  {isRu ? 'до' : 'up to'} {Math.max(...projects.map(p => p.roiProjected || 0))}% ROI
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 touch-pan-y">
          {/* Status chips */}
          {STATUS_OPTIONS.map(status => (
            <Button
              key={status.value}
              variant={selectedStatus.includes(status.value) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleStatus(status.value)}
              className="shrink-0 rounded-full"
            >
              {isRu ? status.labelRu : status.labelEn}
            </Button>
          ))}

          {/* More filters */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 rounded-full gap-1.5">
                <SlidersHorizontal className="w-4 h-4" />
                {isRu ? 'Фильтры' : 'Filters'}
                {hasFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                    {[selectedDistrict, selectedDeveloper, minScore > 0].filter(Boolean).length + selectedStatus.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>{isRu ? 'Фильтры' : 'Filters'}</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* District */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRu ? 'Район' : 'District'}
                  </label>
                  <Select value={selectedDistrict || '_all'} onValueChange={(v) => setSelectedDistrict(v === '_all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Все районы' : 'All districts'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{isRu ? 'Все районы' : 'All districts'}</SelectItem>
                      {districts?.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Developer */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRu ? 'Застройщик' : 'Developer'}
                  </label>
                  <Select value={selectedDeveloper || '_all'} onValueChange={(v) => setSelectedDeveloper(v === '_all' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder={isRu ? 'Все застройщики' : 'All developers'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">{isRu ? 'Все застройщики' : 'All developers'}</SelectItem>
                      {developers?.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {isRu ? d.nameRu : d.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Score */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {isRu ? 'Минимальный muUNO Score' : 'Minimum muUNO Score'}
                  </label>
                  <Select value={String(minScore)} onValueChange={v => setMinScore(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{isRu ? 'Любой' : 'Any'}</SelectItem>
                      <SelectItem value="60">60+</SelectItem>
                      <SelectItem value="70">70+</SelectItem>
                      <SelectItem value="80">80+</SelectItem>
                      <SelectItem value="85">85+ ({isRu ? 'Низкий риск' : 'Low Risk'})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={clearFilters}>
                    {isRu ? 'Сбросить' : 'Clear'}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Clear filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="shrink-0 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {sortedProjects.length} {isRu ? 'результатов' : 'results'}
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">{isRu ? 'По рейтингу' : 'By Score'}</SelectItem>
              <SelectItem value="price_asc">{isRu ? 'Цена ↑' : 'Price ↑'}</SelectItem>
              <SelectItem value="price_desc">{isRu ? 'Цена ↓' : 'Price ↓'}</SelectItem>
              <SelectItem value="completion">{isRu ? 'По сдаче' : 'By Completion'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
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
        ) : sortedProjects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">
              {isRu ? 'Проекты не найдены' : 'No projects found'}
            </p>
            {hasFilters && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                {isRu ? 'Сбросить фильтры' : 'Clear filters'}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sortedProjects.map(project => (
              <OffplanProjectCard
                key={project.id}
                project={project}
                variant="grid"
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20 mt-6">
          <h3 className="font-semibold mb-2">
            {isRu ? 'Хотите привлечь инвестиции?' : 'Want to raise investment?'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isRu 
              ? 'Разместите свой проект на платформе muUNO' 
              : 'List your project on the muUNO platform'}
          </p>
          <Button onClick={() => navigate('/invest/raise')} className="w-full">
            {isRu ? 'Подать заявку' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
