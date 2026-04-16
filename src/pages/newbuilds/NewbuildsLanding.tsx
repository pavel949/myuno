/**
 * /newbuilds — Unified Lead-Generation Catalog (reference-style)
 * Replaces old hero-heavy landing with sidebar+grid catalog
 */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Filter } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { CatalogProjectCard } from '@/components/newbuilds/CatalogProjectCard';
import { CatalogSidebar } from '@/components/newbuilds/CatalogSidebar';
import { CatalogInquirySheet } from '@/components/newbuilds/CatalogInquirySheet';
import { useOffplanProjects, type OffplanProject } from '@/hooks/useOffplanProjects';
import {
  applyOffplanUiFilters,
  countByRec,
  collectFacetOptions,
  activeOffplanFilterCount,
} from '@/lib/offplan/filters';
import { defaultOffplanUiFilterState, type OffplanUiFilterState } from '@/lib/offplan/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

export default function NewbuildsLanding() {
  const { data: allProjects, isLoading } = useOffplanProjects();
  const [filters, setFilters] = useState<OffplanUiFilterState>(defaultOffplanUiFilterState());
  const [inquiryProject, setInquiryProject] = useState<OffplanProject | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const projects = allProjects || [];

  const filtered = useMemo(
    () => applyOffplanUiFilters(projects, filters),
    [projects, filters],
  );

  const recCounts = useMemo(() => countByRec(projects), [projects]);
  const facets = useMemo(() => collectFacetOptions(projects), [projects]);

  const developers = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      if (p.developerName) set.add(p.developerName);
    }
    return Array.from(set).sort();
  }, [projects]);

  const activeCount = activeOffplanFilterCount(filters);

  const handleFilterChange = (patch: Partial<OffplanUiFilterState>) =>
    setFilters(prev => ({ ...prev, ...patch }));

  const handleReset = () => setFilters(defaultOffplanUiFilterState());

  // Avg yield
  const avgYield = useMemo(() => {
    const withRoi = projects.filter(p => p.roiProjected && p.roiProjected > 0);
    if (withRoi.length === 0) return 0;
    return withRoi.reduce((s, p) => s + (p.roiProjected || 0), 0) / withRoi.length;
  }, [projects]);

  // Total value
  const totalValue = useMemo(() => {
    return projects.reduce((s, p) => s + (p.priceFrom || 0), 0);
  }, [projects]);

  return (
    <NewbuildsLayout hideNav>
      <div className="min-h-screen" style={{ background: 'hsl(var(--nb-bg))' }}>
        {/* Stats Header */}
        <header
          className="border-b px-4 py-3"
          style={{ borderColor: 'hsl(var(--nb-gold) / 0.12)', background: 'hsl(var(--nb-surface))' }}
        >
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5" style={{ color: 'hsl(var(--nb-gold))' }} />
              <h1 className="text-sm font-bold" style={{ color: 'hsl(var(--nb-text))', fontFamily: 'var(--font-heading-nb)' }}>
                Phuket Property Catalogue
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-4 text-[11px]" style={{ color: 'hsl(var(--nb-muted))' }}>
              <span>
                <strong style={{ color: 'hsl(var(--nb-text))' }}>{projects.length}</strong> PROJECTS
              </span>
              {totalValue > 0 && (
                <span>
                  ฿<strong style={{ color: 'hsl(var(--nb-text))' }}>{(totalValue / 1e9).toFixed(1)}B</strong> TOTAL
                </span>
              )}
              {avgYield > 0 && (
                <span>
                  ~<strong style={{ color: '#22c55e' }}>{avgYield.toFixed(2)}%</strong> AVG YIELD
                </span>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: 'hsl(var(--nb-gold) / 0.1)',
                color: 'hsl(var(--nb-gold))',
                border: '1px solid hsl(var(--nb-gold) / 0.2)',
              }}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {activeCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'hsl(var(--nb-gold))', color: 'hsl(var(--nb-bg))' }}>
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Sub-navigation */}
        <nav
          className="border-b px-4 overflow-x-auto"
          style={{ borderColor: 'hsl(var(--nb-gold) / 0.08)', background: 'hsl(var(--nb-bg))' }}
        >
          <div className="max-w-[1400px] mx-auto flex items-center gap-1 py-1.5">
            {[
              { label: 'All Projects', path: '/newbuilds', active: true },
              { label: 'Calculator', path: '/newbuilds/calculator' },
              { label: 'Developers', path: '/newbuilds/developers' },
              { label: 'Map', path: '/newbuilds/map' },
              { label: 'Areas', path: '/newbuilds/areas' },
              { label: 'Due Diligence', path: '/newbuilds/due-diligence' },
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: item.active ? 'hsl(var(--nb-gold) / 0.12)' : 'transparent',
                  color: item.active ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))',
                  fontWeight: item.active ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <div className="max-w-[1400px] mx-auto flex">
          {/* Desktop sidebar */}
          <div
            className="hidden md:block w-56 flex-shrink-0 p-4 border-r sticky top-0 h-screen overflow-y-auto"
            style={{ borderColor: 'hsl(var(--nb-gold) / 0.08)' }}
          >
            <CatalogSidebar
              filters={filters}
              onChange={handleFilterChange}
              facets={facets}
              developers={developers}
              activeCount={activeCount}
              onReset={handleReset}
            />
          </div>

          {/* Grid */}
          <div className="flex-1 p-4">
            {/* Stats row */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                <strong style={{ color: 'hsl(var(--nb-text))' }}>{filtered.length}</strong> verified projects
                {recCounts.BUY > 0 && (
                  <span className="ml-2">
                    · <span style={{ color: '#22c55e' }}>{recCounts.BUY} BUY</span>
                  </span>
                )}
                {recCounts.AVOID > 0 && (
                  <span className="ml-2">
                    · <span style={{ color: '#ef4444' }}>{recCounts.AVOID} AVOID</span>
                  </span>
                )}
              </p>
            </div>

            {/* Disclaimer */}
            <div
              className="rounded-lg px-3 py-2 mb-4 text-[10px] leading-relaxed"
              style={{
                background: 'hsl(var(--nb-gold) / 0.06)',
                color: 'hsl(var(--nb-muted))',
                border: '1px solid hsl(var(--nb-gold) / 0.1)',
              }}
            >
              ⚠ Ratings and recommendations are for informational purposes only and do not constitute financial advice.
              Always conduct your own due diligence before making investment decisions.
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-[380px] rounded-xl" style={{ background: 'hsl(var(--nb-surface))' }} />
                ))}
              </div>
            )}

            {/* Cards */}
            {!isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((project, idx) => (
                  <CatalogProjectCard
                    key={project.id}
                    project={project}
                    rank={idx + 1}
                    onInquiry={setInquiryProject}
                  />
                ))}
              </div>
            )}

            {/* Empty */}
            {!isLoading && filtered.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'hsl(var(--nb-muted))' }} />
                <p className="text-sm" style={{ color: 'hsl(var(--nb-muted))' }}>
                  No projects match your filters.
                </p>
                <button
                  onClick={handleReset}
                  className="mt-3 text-xs font-medium"
                  style={{ color: 'hsl(var(--nb-gold))' }}
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent
          side="left"
          className="w-[280px] overflow-y-auto"
          style={{ background: 'hsl(var(--nb-surface))', borderColor: 'hsl(var(--nb-gold) / 0.15)' }}
        >
          <SheetHeader>
            <SheetTitle style={{ color: 'hsl(var(--nb-text))' }}>Filters</SheetTitle>
            <SheetDescription className="sr-only">Filter catalog projects</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <CatalogSidebar
              filters={filters}
              onChange={handleFilterChange}
              facets={facets}
              developers={developers}
              activeCount={activeCount}
              onReset={handleReset}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Inquiry Sheet */}
      <CatalogInquirySheet
        project={inquiryProject}
        open={!!inquiryProject}
        onOpenChange={open => { if (!open) setInquiryProject(null); }}
      />
    </NewbuildsLayout>
  );
}
