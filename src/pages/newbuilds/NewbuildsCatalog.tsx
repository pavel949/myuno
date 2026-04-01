/**
 * /newbuilds/projects — Full Project Catalog with filters
 */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Grid3X3, List, ChevronLeft } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbProjectCard } from '@/components/newbuilds/NbProjectCard';
import { useNewbuildProjects, useNewbuildLocations, type NewbuildFilters } from '@/hooks/useNewbuildProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';

const STATUS_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'under_construction', label: 'Строится' },
  { value: 'completed', label: 'Сдан' },
  { value: 'upcoming', label: 'Скоро' },
  { value: 'offplan', label: 'Off-plan' },
];

const SORT_OPTIONS = [
  { value: 'featured', label: 'По рейтингу' },
  { value: 'newest', label: 'Новые' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
  { value: 'progress', label: 'Прогресс стройки' },
];

const PER_PAGE = 12;

export default function NewbuildsCatalog() {
  const [filters, setFilters] = useState<NewbuildFilters>({});
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { data: locations } = useNewbuildLocations();
  const { data: projects, isLoading } = useNewbuildProjects(filters);

  const paginated = useMemo(() => {
    if (!projects) return [];
    const start = (page - 1) * PER_PAGE;
    return projects.slice(start, start + PER_PAGE);
  }, [projects, page]);

  const totalPages = Math.ceil((projects?.length || 0) / PER_PAGE);

  const selectStyle = {
    background: 'hsl(var(--nb-surface))',
    color: 'hsl(var(--nb-text))',
    border: '1px solid hsl(var(--nb-gold) / 0.2)',
  };

  return (
    <NewbuildsLayout>
      {/* Mini hero */}
      <section className="relative px-4 pt-20 pb-12 nb-blueprint nb-grain overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <Link to={APP_ROUTES.NEWBUILDS} className="inline-flex items-center gap-1 text-sm mb-4 hover:opacity-80 transition" style={{ color: 'hsl(var(--nb-gold))' }}>
            <ChevronLeft className="w-4 h-4" /> Новостройки
          </Link>
          <h1 className="nb-display text-3xl md:text-5xl" style={{ color: 'hsl(var(--nb-gold))' }}>
            Каталог проектов
          </h1>
          <p className="mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>
            {isLoading ? '...' : `Найдено ${projects?.length || 0} проектов`}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm nb-glass">
            <Filter className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
            <span style={{ color: 'hsl(var(--nb-text))' }}>Фильтры</span>
          </button>

          <select
            value={filters.location_area || ''}
            onChange={e => { setFilters(f => ({ ...f, location_area: e.target.value || undefined })); setPage(1); }}
            className="px-3 py-2 rounded-lg text-sm"
            style={selectStyle}
          >
            <option value="">Все районы</option>
            {(locations || []).map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select
            value={filters.status || ''}
            onChange={e => { setFilters(f => ({ ...f, status: e.target.value || undefined })); setPage(1); }}
            className="px-3 py-2 rounded-lg text-sm"
            style={selectStyle}
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <select
            value={filters.sort || 'featured'}
            onChange={e => setFilters(f => ({ ...f, sort: e.target.value as any }))}
            className="px-3 py-2 rounded-lg text-sm"
            style={selectStyle}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <div className="ml-auto flex gap-1">
            <button onClick={() => setView('grid')} className={`p-2 rounded ${view === 'grid' ? 'nb-glass' : ''}`}>
              <Grid3X3 className="w-4 h-4" style={{ color: view === 'grid' ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))' }} />
            </button>
            <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'nb-glass' : ''}`}>
              <List className="w-4 h-4" style={{ color: view === 'list' ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))' }} />
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" style={{ background: 'hsl(var(--nb-surface))' }} />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-20">
            <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Проекты не найдены</p>
            <p className="text-sm mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <>
            <div className={view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
              {paginated.map(p => (
                <NbProjectCard key={p.id} project={p} variant={view === 'list' ? 'featured' : 'compact'} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => { setPage(n); window.scrollTo(0, 0); }}
                    className="w-10 h-10 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: page === n ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-gold) / 0.1)',
                      color: page === n ? 'hsl(var(--nb-bg))' : 'hsl(var(--nb-gold))',
                      border: `1px solid hsl(var(--nb-gold) / ${page === n ? '1' : '0.2'})`,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </NewbuildsLayout>
  );
}
