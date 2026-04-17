/**
 * /newbuilds/projects/:slug — Individual Project Detail Page
 * Full editorial detail with tabs, sidebar lead form, gallery
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Building2, Calendar, Layers, Play, Share2, Heart } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { NbConstructionProgress } from '@/components/newbuilds/NbConstructionProgress';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { NbROICalculator } from '@/components/newbuilds/NbROICalculator';
import { NbServicesSection } from '@/components/newbuilds/NbServicesSection';
import { NbInventoryTab } from '@/components/newbuilds/tabs/NbInventoryTab';
import { NbPlansTab } from '@/components/newbuilds/tabs/NbPlansTab';
import { PublicFloorPlan } from '@/components/newbuilds/PublicFloorPlan';
import { NbTermsTab } from '@/components/newbuilds/tabs/NbTermsTab';
import { NbUpdatesTab } from '@/components/newbuilds/tabs/NbUpdatesTab';
import { NbReportsTab } from '@/components/newbuilds/tabs/NbReportsTab';
import { NbDeveloperTab } from '@/components/newbuilds/tabs/NbDeveloperTab';
import { ProjectUnitsGrid } from '@/components/newbuilds/ProjectUnitsGrid';
import { ProjectDealsTab } from '@/components/newbuilds/ProjectDealsTab';
import { ProjectMarketingTab } from '@/components/newbuilds/ProjectMarketingTab';
import { useNewbuildProject } from '@/hooks/useNewbuildProjects';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';

const TABS = [
  { key: 'overview', label: 'Обзор' },
  { key: 'availability', label: 'Доступность' },
  { key: 'units', label: 'Юниты' },
  { key: 'inventory', label: 'Инвентарь' },
  { key: 'plans', label: 'Планировки' },
  { key: 'terms', label: 'Условия' },
  { key: 'marketing', label: 'Маркетинг' },
  { key: 'deals', label: 'Сделки' },
  { key: 'updates', label: 'Обновления' },
  { key: 'reports', label: 'Отчёты' },
  { key: 'developer', label: 'О девелопере' },
];

export default function NewbuildDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useNewbuildProject(slug);
  const [activeTab, setActiveTab] = useState('overview');
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const onScroll = () => setShowStickyHeader(window.scrollY > 500);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const gallery = project?.gallery_urls || project?.images || [];
  const heroImage = gallery[selectedImage] || project?.cover_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80';

  if (isLoading) {
    return (
      <NewbuildsLayout>
        <div className="max-w-7xl mx-auto px-4 pt-20">
          <Skeleton className="w-full aspect-[16/9] rounded-2xl mb-6" style={{ background: 'hsl(var(--nb-surface))' }} />
          <Skeleton className="h-8 w-64 mb-4" style={{ background: 'hsl(var(--nb-surface))' }} />
          <Skeleton className="h-4 w-96" style={{ background: 'hsl(var(--nb-surface))' }} />
        </div>
      </NewbuildsLayout>
    );
  }

  if (!project) {
    return (
      <NewbuildsLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="nb-display text-2xl" style={{ color: 'hsl(var(--nb-muted))' }}>Проект не найден</p>
            <Link to={APP_ROUTES.NEWBUILDS_PROJECTS} className="text-sm mt-4 inline-block" style={{ color: 'hsl(var(--nb-gold))' }}>
              ← Вернуться к каталогу
            </Link>
          </div>
        </div>
      </NewbuildsLayout>
    );
  }

  return (
    <NewbuildsLayout>
      {/* Sticky header */}
      {showStickyHeader && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between" style={{ background: 'hsl(var(--nb-bg) / 0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid hsl(var(--nb-gold) / 0.15)' }}>
          <div className="flex items-center gap-3 max-w-7xl mx-auto w-full">
            <h3 className="nb-display text-lg truncate" style={{ color: 'hsl(var(--nb-text))' }}>
              {project.name_ru || project.name_en}
            </h3>
            <NbPriceDisplay price={project.price_from} size="sm" className="hidden md:flex" />
            <button className="nb-btn-gold text-sm ml-auto py-2 px-5" onClick={() => document.getElementById('lead-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Запросить информацию
            </button>
          </div>
        </div>
      )}

      {/* Back nav */}
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-4">
        <Link to={APP_ROUTES.NEWBUILDS_PROJECTS} className="inline-flex items-center gap-1 text-sm hover:opacity-80 transition" style={{ color: 'hsl(var(--nb-gold))' }}>
          <ChevronLeft className="w-4 h-4" /> Каталог проектов
        </Link>
      </div>

      {/* Hero gallery */}
      <section className="max-w-7xl mx-auto px-4 mb-6">
        <div className="relative rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9]">
          <img src={heroImage} alt={project.name_en} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 flex gap-2">
            <NbProjectStatusBadge status={project.project_status} />
            {project.is_featured && (
              <span className="nb-badge" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}>
                FEATURED
              </span>
            )}
          </div>
          {project.video_url && (
            <a href={project.video_url} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'hsl(var(--nb-bg) / 0.8)', color: 'hsl(var(--nb-text))' }}>
              <Play className="w-4 h-4" /> Видео
            </a>
          )}
        </div>
        {/* Thumbnails */}
        {gallery.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {gallery.slice(0, 8).map((url, i) => (
              <button key={i} onClick={() => setSelectedImage(i)} className="flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all" style={{ border: selectedImage === i ? '2px solid hsl(var(--nb-gold))' : '2px solid transparent', opacity: selectedImage === i ? 1 : 0.6 }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Core info bar */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="nb-glass p-5 flex flex-wrap gap-6 md:gap-10 items-center">
          {project.developer_name && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
              <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{project.developer_name}</span>
            </div>
          )}
          {(project.location_area || project.district) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
              <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{project.location_area || project.district}</span>
            </div>
          )}
          <NbPriceDisplay price={project.price_from} priceTo={project.price_to} size="md" />
          {project.total_units && (
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
              <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{project.total_units} юнитов</span>
            </div>
          )}
          {project.completion_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
              <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>
                {new Date(project.completion_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <button className="p-2 rounded-lg nb-glass"><Share2 className="w-4 h-4" style={{ color: 'hsl(var(--nb-muted))' }} /></button>
            <button className="p-2 rounded-lg nb-glass"><Heart className="w-4 h-4" style={{ color: 'hsl(var(--nb-muted))' }} /></button>
          </div>
        </div>
      </section>

      {/* Tabs + Content + Sidebar */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-8 pb-2" style={{ borderBottom: '1px solid hsl(var(--nb-gold) / 0.15)' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2.5 text-sm whitespace-nowrap transition-all rounded-t-lg"
              style={{
                color: activeTab === tab.key ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))',
                borderBottom: activeTab === tab.key ? '2px solid hsl(var(--nb-gold))' : '2px solid transparent',
                fontFamily: 'var(--font-body-nb)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {activeTab === 'availability' && (
              <PublicFloorPlan projectId={project.id} developerId={project.developer_id} />
            )}

            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Description */}
                <div className="prose prose-invert max-w-none">
                  <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                    {project.description_ru || project.description_en || 'Описание проекта пока не добавлено.'}
                  </p>
                </div>

                {/* Key specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Всего юнитов', value: project.total_units },
                    { label: 'Доступно', value: project.units_available },
                    { label: 'Продано', value: project.units_sold },
                    { label: 'Типы', value: project.unit_types?.join(', ') },
                  ].filter(s => s.value).map(spec => (
                    <div key={spec.label} className="nb-glass p-4">
                      <p className="nb-label text-[10px] mb-1">{spec.label}</p>
                      <p className="text-lg font-semibold" style={{ color: 'hsl(var(--nb-text))' }}>{spec.value}</p>
                    </div>
                  ))}
                </div>

                {/* Construction progress */}
                <div className="nb-glass p-5">
                  <p className="nb-label mb-4">Прогресс строительства</p>
                  <NbConstructionProgress progress={project.construction_progress} completionDate={project.completion_date} size="md" />
                </div>

                {/* Amenities */}
                {project.amenities && project.amenities.length > 0 && (
                  <div>
                    <p className="nb-label mb-3">Удобства</p>
                    <div className="flex flex-wrap gap-2">
                      {project.amenities.map(a => (
                        <span key={a} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: 'hsl(var(--nb-gold) / 0.08)', color: 'hsl(var(--nb-gold) / 0.8)', border: '1px solid hsl(var(--nb-gold) / 0.15)' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'units' && (
              <ProjectUnitsGrid projectId={project.id} />
            )}

            {activeTab === 'inventory' && (
              <NbInventoryTab projectId={project.id} developerId={project.developer_id || undefined} />
            )}

            {activeTab === 'marketing' && (
              <ProjectMarketingTab
                commissionPct={project.commission_pct}
                paymentPlan={project.payment_plan}
                marketingMaterials={project.marketing_materials}
                ownershipTypes={project.ownership_types}
                exclusive={project.exclusive}
              />
            )}

            {activeTab === 'deals' && (
              <ProjectDealsTab projectId={project.id} />
            )}

            {activeTab === 'plans' && (
              <NbPlansTab projectId={project.id} />
            )}

            {activeTab === 'terms' && (
              <NbTermsTab projectId={project.id} />
            )}

            {activeTab === 'updates' && (
              <NbUpdatesTab
                projectId={project.id}
                currentProgress={project.construction_progress}
                completionDate={project.completion_date}
              />
            )}

            {activeTab === 'reports' && (
              <NbReportsTab projectId={project.id} />
            )}

            {activeTab === 'developer' && project.developer_id && (
              <NbDeveloperTab developerId={project.developer_id} currentProjectId={project.id} />
            )}

            {activeTab === 'developer' && !project.developer_id && (
              <div className="text-center py-16">
                <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>
                  Информация о девелопере не указана
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-[340px] flex-shrink-0 space-y-6">
            <div id="lead-form">
              <NbLeadForm projectId={project.id} developerId={project.developer_id || undefined} source="project_page" />
            </div>

            {/* ROI Calculator */}
            <div className="nb-glass p-5">
              <NbROICalculator
                defaultPrice={project.price_from}
                defaultRoi={(project as any).roi_projected}
                defaultCamFee={(project as any).cam_fee_per_sqm}
                compact
              />
            </div>

            {/* Cross-module services */}
            <NbServicesSection />
          </div>
        </div>
      </div>
    </NewbuildsLayout>
  );
}
