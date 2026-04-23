/**
 * /newbuilds/calculator — Standalone ROI Calculator Page
 */
import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NewbuildsHero } from '@/components/newbuilds/NewbuildsHero';
import { NbROICalculator } from '@/components/newbuilds/NbROICalculator';
import { useNewbuildProjects } from '@/hooks/useNewbuildProjects';
import { APP_ROUTES } from '@/lib/config/routes';

export default function NewbuildsCalculator() {
  const { data: projects } = useNewbuildProjects({ sort: 'featured' });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const selectedProject = (projects || []).find(p => p.id === selectedProjectId);

  return (
    <NewbuildsLayout>
      <NewbuildsHero
        icon={Calculator}
        title="ROI Калькулятор"
        subtitle="Рассчитайте доходность инвестиций в новостройки Пхукета"
        backTo={APP_ROUTES.NEWBUILDS}
        backLabel="Новостройки"
      />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Project selector */}
        {projects && projects.length > 0 && (
          <div className="nb-glass p-5">
            <label htmlFor="project-select" className="nb-label mb-3 block">
              ВЫБРАТЬ ПРОЕКТ
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-3 rounded-none text-sm bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
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
        <p className="text-xs text-center text-muted-foreground">
          Расчёты носят оценочный характер и не являются гарантией доходности.
          Фактическая доходность зависит от множества факторов, включая рыночную конъюнктуру,
          управление объектом и макроэкономические условия.
        </p>
      </div>
    </NewbuildsLayout>
  );
}
