/**
 * MedicalIndex — Canonical consumer app: MiniAppLayout + CatalogCard
 * Search, filters, sort, results count all wired. Emergency banner preserved.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Phone, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useClinics } from '@/hooks/useClinics';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { mapClinicToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { medicalFilterConfig } from '@/lib/filterRegistry';
import type { FilterValues } from '@/components/filters/UniversalFilter';
import { VerticalContextBanner } from '@/components/vertical/VerticalContextBanner';
import { VerticalInsightPanel } from '@/components/vertical/VerticalInsightPanel';

const SPECIALTIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'general', labelEn: 'General', labelRu: 'Терапевт' },
  { id: 'dental', labelEn: 'Dental', labelRu: 'Стоматолог' },
  { id: 'cardio', labelEn: 'Cardio', labelRu: 'Кардиолог' },
  { id: 'pediatric', labelEn: 'Pediatric', labelRu: 'Педиатр' },
  { id: 'eye', labelEn: 'Eye', labelRu: 'Офтальмолог' },
];

const SORT_OPTIONS = [
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  { id: 'open_first', labelEn: 'Open Now', labelRu: 'Открыто сейчас' },
];

function isClinicOpen(workingHours: Record<string, string>, is24h: boolean): boolean {
  if (is24h) return true;
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const hours = workingHours[today];
  if (!hours) return false;
  const [open, close] = hours.split('-');
  if (!open || !close) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);
  return currentMinutes >= openH * 60 + openM && currentMinutes <= closeH * 60 + closeM;
}

export default function MedicalIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState('recommended');
  const isRu = language === 'ru';

  const { clinics, isLoading } = useClinics({
    specialty: selectedSpecialty === 'all' ? undefined : selectedSpecialty,
    searchQuery: searchQuery || undefined,
  });

  const filterActiveCount = useMemo(() => {
    return Object.values(filterValues).filter(v =>
      Array.isArray(v) ? v.length > 0 : v != null
    ).length;
  }, [filterValues]);

  const filteredAndSorted = useMemo(() => {
    let result = [...clinics];

    const specialtyFilter = filterValues.specialty as string[] | undefined;
    if (specialtyFilter?.length) {
      result = result.filter(c => {
        const specs = (c as unknown as Record<string, unknown>).specialties as string[] | null;
        return specs?.some(s => specialtyFilter.includes(s));
      });
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'open_first':
        result.sort((a, b) => {
          const aOpen = isClinicOpen((a.working_hours as Record<string, string>) || {}, a.is_24h ?? false);
          const bOpen = isClinicOpen((b.working_hours as Record<string, string>) || {}, b.is_24h ?? false);
          return (bOpen ? 1 : 0) - (aOpen ? 1 : 0);
        });
        break;
    }

    return result;
  }, [clinics, filterValues, sortBy]);

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
  }, []);

  const emergencyBanner = (
    <div className="p-3 rounded-none bg-destructive/10 border border-destructive/30">
      <div className="flex items-center gap-2 mb-1">
        <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
        <span className="text-sm font-semibold text-destructive">{isRu ? 'Скорая помощь' : 'Emergency'}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {isRu ? 'Для экстренной медицинской помощи звоните 1669' : 'For medical emergencies call 1669'}
      </p>
      <Button
        variant="destructive"
        size="sm"
        className="text-xs"
        onClick={() => window.location.href = 'tel:1669'}
      >
        <Phone className="w-3 h-3 mr-1" />
        1669
      </Button>
    </div>
  );

  return (
    <MiniAppLayout
      title={isRu ? 'Медицина' : 'Healthcare'}
      subtitle={isRu ? `Найдено: ${filteredAndSorted.length}` : `${filteredAndSorted.length} results`}
      fallbackPath="/discover"
      showSearch
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск клиник...' : 'Search clinics...'}
      showHero={false}
      categories={SPECIALTIES}
      selectedCategory={selectedSpecialty}
      onCategoryChange={setSelectedSpecialty}
      filterConfig={medicalFilterConfig}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      filterActiveCount={filterActiveCount}
      resultsCount={filteredAndSorted.length}
      resultsLabel={isRu ? 'Клиники' : 'Clinics'}
      quickActions={emergencyBanner}
      stickySubHeader={
        <div className="px-4 py-2 flex items-center justify-end">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-[11px] font-medium bg-secondary border border-border rounded-full px-2.5 py-1.5 outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>
                {isRu ? opt.labelRu : opt.labelEn}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <VerticalContextBanner verticalId="medical" />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title={isRu ? 'Клиники не найдены' : 'No clinics found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSorted.map(clinic => {
            const openNow = isClinicOpen(
              (clinic.working_hours as Record<string, string>) || {},
              clinic.is_24h ?? false
            );
            return (
              <CatalogCard key={clinic.id} {...mapClinicToCatalogCard(clinic, language, navigate, openNow)} />
            );
          })}
        </div>
      )}

      <VerticalInsightPanel verticalId="medical" />
      <CrossSellSection currentVertical="medical" className="mt-8" />
    </MiniAppLayout>
  );
}
