/**
 * /newbuilds/calculator — Standalone ROI Calculator Page
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Calculator } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbROICalculator } from '@/components/newbuilds/NbROICalculator';
import { useNewbuildProjects } from '@/hooks/useNewbuildProjects';
import { APP_ROUTES } from '@/lib/config/routes';

export default function NewbuildsCalculator() {
  const { data: projects } = useNewbuildProjects({ sort: 'featured' });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const selectedProject = (projects || []).find(p => p.id === selectedProjectId);

  return (
    <NewbuildsLayout>
      <section className="relative px-4 pt-20 pb-12 nb-blueprint nb-grain overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <Link to={APP_ROUTES.NEWBUILDS} className="inline-flex items-center gap-1 text-sm mb-4 transition-colors hover:opacity-80" style={{ color: 'hsl(var(--nb-gold))' }}>
            <ChevronLeft className="w-4 h-4" /> Новостройки
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="w-8 h-8" style={{ color: 'hsl(var(--nb-gold))' }} />
            <h1 className="nb-display text-3xl md:text-5xl" style={{ color: 'hsl(var(--nb-gold))' }}>
              ROI Калькулятор
            </h1>
          </div>
          <p className="mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>
            Рассчитайте доходность инвестиций в новостройки Пхукета
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Project selector */}
        {projects && projects.length > 0 && (
          <div className="nb-glass p-5">
            <p className="nb-label mb-3">ВЫБРАТЬ ПРОЕКТ</p>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm"
              style={{
                background: 'hsl(var(--nb-surface))',
                color: 'hsl(var(--nb-text))',
                border: '1px solid hsl(var(--nb-gold) / 0.2)',
              }}
            >
              <option value="">Произвольный расчёт (без привязки к проекту)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name_ru || p.name_en} — {p.location_area || p.district || ''} {p.price_from ? `от ฿${(p.price_from / 1_000_000).toFixed(1)}M` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Calculator */}
        <div className="nb-glass p-6 md:p-8">
          <NbROICalculator
            key={selectedProjectId}
            defaultPrice={selectedProject?.price_from}
            defaultRoi={(selectedProject as any)?.roi_projected}
            defaultCamFee={(selectedProject as any)?.cam_fee_per_sqm}
          />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center" style={{ color: 'hsl(var(--nb-muted))' }}>
          Расчёты носят оценочный характер и не являются гарантией доходности.
          Фактическая доходность зависит от множества факторов, включая рыночную конъюнктуру,
          управление объектом и макроэкономические условия.
        </p>
      </div>
    </NewbuildsLayout>
  );
}
