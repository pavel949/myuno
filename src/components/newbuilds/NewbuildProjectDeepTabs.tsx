/**
 * Rich off-plan project tabs (inventory, plans, marketing, etc.) — shared by
 * embedded Property Hub detail and legacy newbuilds-themed views.
 */
import React, { useState } from 'react';
import { projectFeatureLabel } from '@/lib/offplan/presentation';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { NbConstructionProgress } from '@/components/newbuilds/NbConstructionProgress';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbROICalculator } from '@/components/newbuilds/NbROICalculator';
import { NbServicesSection } from '@/components/newbuilds/NbServicesSection';
import { BuyerProjectTerms } from './BuyerProjectTerms';
import { NbUpdatesTab } from '@/components/newbuilds/tabs/NbUpdatesTab';
import { NbDeveloperTab } from '@/components/newbuilds/tabs/NbDeveloperTab';
import { BuyerProjectUnits } from './BuyerProjectUnits';
import { BuyerRequestForm } from './BuyerRequestForm';
import type { NewbuildProject } from '@/hooks/useNewbuildProjects';
import '@/styles/newbuilds-theme.css';

const TABS = [
  { key: 'overview', label: { ru: 'Обзор', en: 'Overview', th: 'ภาพรวม' } },
  { key: 'availability', label: { ru: 'Доступность', en: 'Availability', th: 'ห้องที่ว่าง' } },
  { key: 'units', label: { ru: 'Юниты', en: 'Units', th: 'ยูนิต' } },
  { key: 'plans', label: { ru: 'Планировки', en: 'Floor plans', th: 'แปลนห้อง' } },
  { key: 'terms', label: { ru: 'Условия', en: 'Terms', th: 'เงื่อนไข' } },
  { key: 'updates', label: { ru: 'Обновления', en: 'Updates', th: 'อัปเดต' } },
  { key: 'developer', label: { ru: 'О девелопере', en: 'Developer', th: 'ผู้พัฒนา' } },
] as const;

export interface NewbuildProjectDeepTabsProps {
  project: NewbuildProject;
  /** Full newbuilds page: hero + sidebar. Embedded: tabs only (e.g. inside AppLayout /property/offplan/:id). */
  variant: 'full' | 'embedded';
}

export function NewbuildProjectDeepTabs({ project, variant }: NewbuildProjectDeepTabsProps) {
  const { language } = useLanguage();
  const t = (copy: LangValues) => pickLang(language, copy);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedImage, setSelectedImage] = useState(0);
  const showSidebar = variant === 'full';

  const gallery = project.gallery_urls || project.images || [];
  const heroImage = gallery[selectedImage] || project.cover_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80';

  return (
    <div className="nb-theme">
      {variant === 'full' && (
        <>
          <section className="max-w-7xl mx-auto px-4 mb-6">
            <div className="relative rounded-none overflow-hidden aspect-[16/9] md:aspect-[21/9]">
              <img src={heroImage} alt={project.name_en} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <NbProjectStatusBadge status={project.project_status} />
                {project.is_featured && (
                  <span
                    className="nb-badge"
                    style={{
                      background: 'hsl(var(--nb-gold) / 0.15)',
                      color: 'hsl(var(--nb-gold))',
                      border: '1px solid hsl(var(--nb-gold) / 0.3)',
                    }}
                  >
                    FEATURED
                  </span>
                )}
              </div>
            </div>
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {gallery.slice(0, 8).map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className="flex-shrink-0 w-20 h-14 rounded-none overflow-hidden transition-all"
                    style={{
                      border: selectedImage === i ? '2px solid hsl(var(--nb-gold))' : '2px solid transparent',
                      opacity: selectedImage === i ? 1 : 0.6,
                    }}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="max-w-7xl mx-auto px-4 mb-8">
            <div className="nb-glass p-5 flex flex-wrap gap-6 md:gap-10 items-center">
              <p>{t({ ru: 'Цена требует подтверждения', en: 'Price requires confirmation', th: 'ราคาต้องยืนยัน' })}</p>
            </div>
          </section>
        </>
      )}

      {variant === 'embedded' && (
        <div className="px-1 pb-2 mb-4 border-b" style={{ borderColor: 'hsl(var(--nb-gold) / 0.15)' }}>
          <p className="text-sm font-medium" style={{ color: 'hsl(var(--nb-text))' }}>
            {t({ ru: 'Полная карточка проекта', en: 'Project details', th: 'รายละเอียดโครงการ' })}
          </p>
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>
            {t({ ru: 'Планировки, инвентарь, условия и сделки — в одном месте', en: 'Floor plans, inventory, terms and deals in one place', th: 'แปลนห้อง รายการยูนิต เงื่อนไข และข้อเสนอในที่เดียว' })}
          </p>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto mb-6 pb-2" style={{ borderBottom: '1px solid hsl(var(--nb-gold) / 0.15)' }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className="px-3 py-2 text-xs md:text-sm whitespace-nowrap transition-all rounded-none flex-shrink-0"
            style={{
              color: activeTab === tab.key ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted))',
              borderBottom: activeTab === tab.key ? '2px solid hsl(var(--nb-gold))' : '2px solid transparent',
              fontFamily: 'var(--font-body-nb)',
            }}
          >
            {t(tab.label)}
          </button>
        ))}
      </div>

      <div className={`flex gap-8 ${variant === 'embedded' ? 'flex-col' : ''}`}>
        <div className="flex-1 min-w-0">
          {activeTab === 'availability' && (
            <BuyerProjectUnits projectId={project.id} />
          )}

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="prose prose-invert max-w-none">
                <p className="text-base leading-relaxed" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                  {(language === 'ru' ? project.description_ru || project.description_en : project.description_en || project.description_ru) || t({ ru: 'Описание проекта пока не добавлено.', en: 'Project description is not available yet.', th: 'ยังไม่มีรายละเอียดโครงการ' })}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t({ ru: 'Всего юнитов', en: 'Total units', th: 'ยูนิตทั้งหมด' }), value: project.total_units },
                  { label: t({ ru: 'Типы', en: 'Types', th: 'ประเภท' }), value: project.unit_types?.join(', ') },
                ]
                  .filter(s => s.value != null && s.value !== '')
                  .map(spec => (
                    <div key={spec.label} className="nb-glass p-4">
                      <p className="nb-label text-[10px] mb-1">{spec.label}</p>
                      <p className="text-lg font-semibold" style={{ color: 'hsl(var(--nb-text))' }}>
                        {spec.value}
                      </p>
                    </div>
                  ))}
              </div>

              <div className="nb-glass p-5">
                <p className="nb-label mb-4">{t({ ru: 'Прогресс строительства', en: 'Construction progress', th: 'ความคืบหน้าการก่อสร้าง' })}</p>
                <NbConstructionProgress
                  progress={project.construction_progress}
                  completionDate={project.completion_date}
                  size="md"
                />
              </div>

              {project.amenities && project.amenities.length > 0 && (
                <div>
                  <p className="nb-label mb-3">{t({ ru: 'Удобства', en: 'Amenities', th: 'สิ่งอำนวยความสะดวก' })}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.amenities.map(a => (
                      <span
                        key={a}
                        className="px-3 py-1.5 rounded-none text-sm"
                        style={{
                          background: 'hsl(var(--nb-gold) / 0.08)',
                          color: 'hsl(var(--nb-gold) / 0.8)',
                          border: '1px solid hsl(var(--nb-gold) / 0.15)',
                        }}
                      >
                        {projectFeatureLabel(a, language)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'units' && <BuyerProjectUnits projectId={project.id} />}

          {activeTab === 'plans' && <BuyerProjectUnits projectId={project.id} plansOnly />}

          {activeTab === 'terms' && <BuyerProjectTerms projectId={project.id} />}

          {activeTab === 'updates' && (
            <NbUpdatesTab
              projectId={project.id}
              currentProgress={project.construction_progress}
              completionDate={project.completion_date}
            />
          )}

          {activeTab === 'developer' && project.developer_id && (
            <NbDeveloperTab developerId={project.developer_id} currentProjectId={project.id} />
          )}

          {activeTab === 'developer' && !project.developer_id && (
            <div className="text-center py-16">
              <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>
                {t({ ru: 'Информация о девелопере не указана', en: 'Developer information is not available', th: 'ไม่มีข้อมูลผู้พัฒนา' })}
              </p>
            </div>
          )}
        </div>

        {showSidebar && (
          <div className="hidden lg:block w-[340px] flex-shrink-0 space-y-6">
            <div id="lead-form">
              <BuyerRequestForm projectId={project.id} />
            </div>
            <div className="nb-glass p-5">
              <NbROICalculator
                defaultPrice={project.price_from}
                defaultRoi={(project as { roi_projected?: number }).roi_projected}
                defaultCamFee={(project as { cam_fee_per_sqm?: number }).cam_fee_per_sqm}
                compact
              />
            </div>
            <NbServicesSection />
          </div>
        )}
      </div>
    </div>
  );
}
