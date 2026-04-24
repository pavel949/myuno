/**
 * /newbuilds/calculator — Standalone ROI Calculator Page
 *
 * Supports `?preset=<slug>` query param (M10c) — applies persona-specific
 * defaults (snowbird, resident, investor, operator, hnw, mn) so persona
 * landing CTAs land on a pre-shaped calculator, not a blank one.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calculator, Building2, GitCompare, ShieldCheck } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NewbuildsHero } from '@/components/newbuilds/NewbuildsHero';
import { NbROICalculator } from '@/components/newbuilds/NbROICalculator';
import { useNewbuildProjects } from '@/hooks/useNewbuildProjects';
import { useContextualOffplanMatches } from '@/hooks/useContextualMatches';
import { ContextualCTA, type ContextualAction } from '@/components/shared/ContextualCTA';
import { useIPPLeadEvent } from '@/hooks/useIPPLeadEvent';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { getPreset } from '@/lib/calculator/personaPresets';

export default function NewbuildsCalculator() {
  const { data: projects } = useNewbuildProjects({ sort: 'featured' });
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const presetSlug = searchParams.get('preset');
  const preset = useMemo(() => getPreset(presetSlug), [presetSlug]);

  const selectedProject = (projects || []).find(p => p.id === selectedProjectId);
  const { track } = useIPPLeadEvent();

  // Preset wins over project defaults when set
  const initialPrice = preset?.purchasePrice ?? selectedProject?.price_from ?? null;
  const initialRoi = preset?.annualAppreciation ?? (selectedProject as { roi_projected?: number } | undefined)?.roi_projected ?? null;
  const initialCamPerSqm = preset
    ? Math.round(preset.camFeeMonthly / preset.area)
    : (selectedProject as { cam_fee_per_sqm?: number } | undefined)?.cam_fee_per_sqm ?? null;

  // IPP §3 lead event: ROI calculator engaged (+25). Fire once per page mount
  // when an actual price is being modelled.
  useEffect(() => {
    if (initialPrice && initialPrice > 0) {
      track({
        eventType: 'roi_calculator_run',
        projectId: selectedProjectId || null,
        meta: { preset: presetSlug ?? null },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetSlug, selectedProjectId]);

  // M10f cross-journey: "N properties matching this ROI" — band ±35% around price.
  const matchBand = useMemo(() => {
    if (!initialPrice || initialPrice <= 0) return null;
    return {
      min: Math.round(initialPrice * 0.65),
      max: Math.round(initialPrice * 1.35),
      district: selectedProject?.location_area ?? null,
    };
  }, [initialPrice, selectedProject?.location_area]);
  const matches = useContextualOffplanMatches(matchBand);

  const ctaActions = useMemo<ContextualAction[]>(() => {
    const list: ContextualAction[] = [];
    if (matches.count > 0) {
      list.push({
        id: 'matching-properties',
        to: matches.href,
        label: isRu
          ? `${matches.count} проектов в этом ценовом диапазоне`
          : `${matches.count} projects in this price band`,
        hint: matchBand
          ? `฿${(matchBand.min! / 1_000_000).toFixed(1)}M – ฿${(matchBand.max! / 1_000_000).toFixed(1)}M${matchBand.district ? ` · ${matchBand.district}` : ''}`
          : null,
        icon: Building2,
        transactional: true,
      });
    }
    if (selectedProjectId) {
      list.push({
        id: 'clearview-apply',
        to: `${APP_ROUTES.CLEARVIEW_APPLY}?project=${selectedProjectId}`,
        label: isRu ? 'Заказать ClearView™ на этот проект' : 'Order ClearView™ for this project',
        hint: '฿4,900 · 15 ' + (isRu ? 'рабочих дней' : 'business days'),
        icon: ShieldCheck,
        transactional: true,
        trackEvent: 'clearview_summary_open',
      });
    }
    list.push({
      id: 'compare',
      to: APP_ROUTES.NEWBUILDS_COMPARE,
      label: isRu ? 'Сравнить с другими проектами' : 'Compare with other projects',
      icon: GitCompare,
    });
    return list;
  }, [matches.count, matches.href, matchBand, selectedProjectId, isRu]);

  return (
    <NewbuildsLayout>
      <NewbuildsHero
        icon={Calculator}
        title={isRu ? 'ROI Калькулятор' : 'ROI Calculator'}
        subtitle={isRu
          ? 'Рассчитайте доходность инвестиций в новостройки Пхукета'
          : 'Calculate investment returns on Phuket new developments'}
        backTo={APP_ROUTES.NEWBUILDS}
        backLabel={isRu ? 'Новостройки' : 'New developments'}
      />

      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Preset banner */}
        {preset && (
          <div className="nb-glass p-5 border-l-2 border-accent">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  {isRu ? 'Сценарий' : 'Scenario'}
                </div>
                <div className="text-lg font-semibold text-white">
                  {isRu ? preset.labelRu : preset.labelEn}
                </div>
              </div>
              <a
                href="?"
                className="text-xs text-white/50 hover:text-accent underline-offset-2 hover:underline"
              >
                {isRu ? 'Сбросить' : 'Reset'}
              </a>
            </div>
            <p className="text-xs text-white/50 mt-2 leading-relaxed">
              {isRu
                ? 'Параметры предзаполнены под типовой профиль. Скорректируйте под свой случай.'
                : 'Defaults pre-filled for typical profile. Adjust to fit your case.'}
            </p>
          </div>
        )}

        {/* Project selector */}
        {projects && projects.length > 0 && (
          <div className="nb-glass p-5">
            <label htmlFor="project-select" className="nb-label mb-3 block">
              {isRu ? 'ВЫБРАТЬ ПРОЕКТ' : 'SELECT PROJECT'}
            </label>
            <select
              id="project-select"
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-3 rounded-none text-sm bg-background text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">
                {isRu ? 'Произвольный расчёт (без привязки к проекту)' : 'Custom calculation (no project)'}
              </option>
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
            key={`${selectedProjectId}-${presetSlug ?? 'none'}`}
            defaultPrice={initialPrice}
            defaultRoi={initialRoi}
            defaultCamFee={initialCamPerSqm}
          />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-center text-muted-foreground">
          {isRu
            ? 'Расчёты носят оценочный характер и не являются гарантией доходности. Фактическая доходность зависит от множества факторов, включая рыночную конъюнктуру, управление объектом и макроэкономические условия.'
            : 'Estimates are informational and do not guarantee returns. Actual yield depends on market conditions, operations, and macroeconomic factors.'}
        </p>
      </div>
    </NewbuildsLayout>
  );
}
