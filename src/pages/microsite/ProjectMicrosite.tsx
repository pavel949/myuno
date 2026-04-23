/**
 * /p/:slug — Project microsite (standalone page, no app shell).
 *
 * Renders only when `landing_enabled = true` for the project.
 * Custom SEO from `meta_title`, `meta_description`, `og_image_url`.
 * Lead-form source is tagged as `microsite_<slug>` for analytics.
 */
import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, MapPin, Building2, Calendar, Layers, ExternalLink } from 'lucide-react';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { useProjectUnits } from '@/hooks/useProjectUnits';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { NbConstructionProgress } from '@/components/newbuilds/NbConstructionProgress';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { APP_ROUTES } from '@/lib/config/routes';
import { supabase } from '@/integrations/supabase/client';

export default function ProjectMicrosite() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useNewbuildProject(slug);
  const { data: units = [] } = useProjectUnits(project?.id);

  // Track view in analytics_events (microsite source)
  useEffect(() => {
    if (!project?.id) return;
    supabase.from('analytics_events').insert({
      event_name: 'microsite_view',
      page_path: `/p/${slug}`,
      event_data: { project_id: project.id, slug },
    });
  }, [project?.id, slug]);

  if (isLoading) return <LoadingState />;
  if (!project) return <Navigate to={APP_ROUTES.OFFPLAN} replace />;

  // Microsite must be explicitly enabled
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landingEnabled = (project as any).landing_enabled !== false; // default true if column missing
  if (!landingEnabled) {
    return <Navigate to={APP_ROUTES.OFFPLAN_DETAIL(project.id)} replace />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const proj = project as any;
  const title = proj.meta_title || `${project.name_en} — ${project.location_area || 'Phuket'}`;
  const description = proj.meta_description || project.description_en || project.tagline || '';
  const ogImage = proj.og_image_url || project.cover_image || '';
  const canonical = typeof window !== 'undefined' ? `${window.location.origin}/p/${slug}` : '';

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--nb-bg, 222 47% 4%))', color: 'hsl(var(--nb-text, 0 0% 96%))' }}>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
      </Helmet>

      {/* Minimal nav (no main app header) */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'hsl(var(--nb-bg, 222 47% 4%) / 0.85)', borderColor: 'hsl(var(--nb-gold, 38 50% 55%) / 0.2)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm hover:opacity-80">
            <ChevronLeft className="w-4 h-4" />
            <span style={{ color: 'hsl(var(--nb-gold, 38 50% 55%))' }}>myUNO</span>
          </Link>
          <a
            href="#lead-form"
            className="px-5 py-2 rounded-none text-sm font-medium"
            style={{ background: 'hsl(var(--nb-gold, 38 50% 55%))', color: 'hsl(222 47% 4%)' }}
          >
            Запросить информацию
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="aspect-[16/9] md:aspect-[21/9] w-full relative overflow-hidden">
          <img
            src={project.cover_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80'}
            alt={project.name_en}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, hsl(222 47% 4%) 100%)' }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-32 md:-mt-48 relative pb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <NbProjectStatusBadge status={project.project_status} />
            {project.is_featured && (
              <span className="px-3 py-1 rounded-none text-xs font-semibold" style={{ background: 'hsl(38 50% 55% / 0.15)', color: 'hsl(38 50% 55%)', border: '1px solid hsl(38 50% 55% / 0.3)' }}>
                FEATURED
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-3" style={{ fontFamily: 'var(--font-heading-nb, serif)' }}>
            {project.name_ru || project.name_en}
          </h1>
          {project.tagline && (
            <p className="text-lg md:text-xl opacity-80 mb-6 max-w-3xl">{project.tagline}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm opacity-80">
            {project.location_area && (
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{project.location_area}</span>
            )}
            {project.developer_name && (
              <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" />{project.developer_name}</span>
            )}
            {project.completion_date && (
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(project.completion_date).getFullYear()}</span>
            )}
            {project.total_units && (
              <span className="inline-flex items-center gap-1.5"><Layers className="w-4 h-4" />{project.total_units} units</span>
            )}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-10">
          {project.description_ru || project.description_en ? (
            <div>
              <h2 className="text-2xl font-semibold mb-4">О проекте</h2>
              <p className="opacity-80 leading-relaxed whitespace-pre-line">
                {project.description_ru || project.description_en}
              </p>
            </div>
          ) : null}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-none border" style={{ background: 'hsl(222 47% 8%)', borderColor: 'hsl(38 50% 55% / 0.15)' }}>
              <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Цена от</p>
              <NbPriceDisplay price={project.price_from} size="md" />
            </div>
            <div className="p-5 rounded-none border" style={{ background: 'hsl(222 47% 8%)', borderColor: 'hsl(38 50% 55% / 0.15)' }}>
              <p className="text-xs uppercase tracking-wider opacity-60 mb-2">Прогресс</p>
              <NbConstructionProgress progress={project.construction_progress} />
            </div>
          </div>

          {units.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Доступные юниты</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {units.slice(0, 6).map((u) => (
                  <div key={u.id} className="p-4 rounded-none border" style={{ background: 'hsl(222 47% 8%)', borderColor: 'hsl(38 50% 55% / 0.15)' }}>
                    <p className="font-semibold mb-1">{u.name}</p>
                    <p className="text-sm opacity-70 mb-2">{u.bedrooms ?? 0} BR · {u.area_sqm} m²</p>
                    <NbPriceDisplay price={u.price} size="sm" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.amenities && project.amenities.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Удобства</h2>
              <div className="flex flex-wrap gap-2">
                {project.amenities.slice(0, 20).map((a) => (
                  <span key={a} className="px-3 py-1.5 rounded-none text-sm border" style={{ background: 'hsl(222 47% 8%)', borderColor: 'hsl(38 50% 55% / 0.2)' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky lead form */}
        <aside className="lg:sticky lg:top-20 self-start" id="lead-form">
          <div className="p-6 rounded-none border" style={{ background: 'hsl(222 47% 8%)', borderColor: 'hsl(38 50% 55% / 0.25)' }}>
            <h3 className="text-xl font-semibold mb-2">Получить детали</h3>
            <p className="text-sm opacity-70 mb-4">Брошюра, цены, планировки — за 1 минуту</p>
            <NbLeadForm projectId={project.id} source={`microsite_${slug}`} />
          </div>
          <Link
            to={APP_ROUTES.NEWBUILDS_PROJECT(slug || project.id)}
            className="mt-3 inline-flex items-center gap-1 text-xs opacity-60 hover:opacity-100"
          >
            Полная страница на myUNO <ExternalLink className="w-3 h-3" />
          </Link>
        </aside>
      </section>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 text-center text-xs opacity-50" style={{ borderColor: 'hsl(38 50% 55% / 0.1)' }}>
        © {new Date().getFullYear()} {project.developer_name || 'myUNO Real Estate'}. Powered by myUNO.
      </footer>
    </div>
  );
}
