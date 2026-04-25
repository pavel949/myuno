/**
 * EventsIndex — Canonical consumer app: MiniAppLayout + CatalogCard
 * Search, filters, sort, results count, cross-sell all wired.
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEvents } from '@/hooks/useEvents';
import { MiniAppLayout } from '@/components/miniapp/MiniAppLayout';
import { CatalogCard } from '@/components/miniapp/CatalogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { CrossSellSection } from '@/components/crosssell';
import { mapEventToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { eventsFilterConfig } from '@/lib/filterRegistry';
import type { FilterValues } from '@/components/filters/UniversalFilter';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';

const CATEGORIES = [
  { id: 'all', labelEn: 'All', labelRu: 'Все' },
  { id: 'beach_club', labelEn: 'Beach Clubs', labelRu: 'Пляжные клубы' },
  { id: 'dj_party', labelEn: 'DJ Parties', labelRu: 'DJ вечеринки' },
  { id: 'cultural', labelEn: 'Shows', labelRu: 'Шоу' },
  { id: 'sports_fitness', labelEn: 'Sports', labelRu: 'Спорт' },
  { id: 'music_live', labelEn: 'Live Music', labelRu: 'Живая музыка' },
  { id: 'nightlife', labelEn: 'Nightlife', labelRu: 'Ночная жизнь' },
];

const SORT_OPTIONS = [
  { id: 'date_asc', labelEn: 'Soonest', labelRu: 'Ближайшие' },
  { id: 'recommended', labelEn: 'Recommended', labelRu: 'Рекомендуемые' },
  { id: 'price_low', labelEn: 'Price: Low', labelRu: 'Цена ↑' },
  { id: 'price_high', labelEn: 'Price: High', labelRu: 'Цена ↓' },
];

export default function EventsIndex() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [sortBy, setSortBy] = useState('date_asc');
  const isRu = language === 'ru';
  const { applyFilter: applyPersonaFilter } = usePersonaFilter();

  const { events, isLoading } = useEvents({ category: selectedCategory !== 'all' ? selectedCategory : undefined });

  const formatDate = useCallback((dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRu ? 'ru-RU' : 'en-US', {
      day: 'numeric', month: 'short', weekday: 'short',
    });
  }, [isRu]);

  const filterActiveCount = useMemo(() => {
    return Object.values(filterValues).filter(v =>
      Array.isArray(v) ? v.length > 0 : v != null
    ).length;
  }, [filterValues]);

  const filteredAndSorted = useMemo(() => {
    let result = [...events];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        (e.title_en?.toLowerCase().includes(q)) ||
        (e.title_ru?.toLowerCase().includes(q))
      );
    }

    const dateFilter = filterValues.date as string | undefined;
    if (dateFilter) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

      result = result.filter(e => {
        if (!e.event_date) return false;
        const d = new Date(e.event_date);
        switch (dateFilter) {
          case 'today': return d >= today && d < tomorrow;
          case 'tomorrow': { const dayAfter = new Date(tomorrow); dayAfter.setDate(dayAfter.getDate() + 1); return d >= tomorrow && d < dayAfter; }
          case 'this-week': return d >= today && d <= endOfWeek;
          case 'this-weekend': { const sat = new Date(today); sat.setDate(sat.getDate() + (6 - sat.getDay())); const mon = new Date(sat); mon.setDate(mon.getDate() + 2); return d >= sat && d < mon; }
          case 'this-month': { const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); return d >= today && d <= endOfMonth; }
          default: return true;
        }
      });
    }

    switch (sortBy) {
      case 'date_asc':
        result.sort((a, b) => {
          const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
          const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
          return da - db;
        });
        break;
      case 'price_low':
        result.sort((a, b) => (a.price ?? 999999) - (b.price ?? 999999));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        break;
    }

    return result;
  }, [events, searchQuery, filterValues, sortBy]);

  const handleFilterChange = useCallback((values: FilterValues) => {
    setFilterValues(values);
  }, []);

  return (
    <MiniAppLayout
      title={isRu ? 'Афиша' : 'Events'}
      subtitle={isRu ? `Найдено: ${filteredAndSorted.length}` : `${filteredAndSorted.length} results`}
      fallbackPath="/discover"
      showSearch
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder={isRu ? 'Поиск событий...' : 'Search events...'}
      showHero={false}
      categories={CATEGORIES}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      filterConfig={eventsFilterConfig}
      filterValues={filterValues}
      onFilterChange={handleFilterChange}
      filterActiveCount={filterActiveCount}
      resultsCount={filteredAndSorted.length}
      resultsLabel={isRu ? 'События' : 'Events'}
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
          icon={Ticket}
          title={isRu ? 'События не найдены' : 'No events found'}
          description={isRu ? 'Попробуйте изменить фильтры' : 'Try adjusting your filters'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSorted.map(event => (
            <CatalogCard key={event.id} {...mapEventToCatalogCard(event, language, navigate, formatDate)} />
          ))}
        </div>
      )}

      <CrossSellSection currentVertical="events" className="mt-8" />
    </MiniAppLayout>
  );
}
