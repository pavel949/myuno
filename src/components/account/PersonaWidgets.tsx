/**
 * PersonaWidgets — M10c (IPP §17.1–17.4)
 *
 * Dashboard widgets that adapt to the user's detected persona (P-code) from
 * `useCanonicalProfile`. Each widget answers ONE concrete question from the
 * IPP "Customer Decision Engine" framework:
 *
 *   §17.1  Rent vs Buy   — for P5/P6 (snowbirds, residents)
 *   §17.2  Own vs Rent   — for P8 (passive investors evaluating a unit)
 *   §17.3  Ready for #2? — for P10 (operators with portfolio)
 *   §17.4  ROI Presets   — quick links to /newbuilds/calculator?preset=…
 *
 * CONNECT BEFORE CREATE: uses existing PeylaaROICalculator math under the
 * hood (yield = annual_net_rent / purchase_price), no new math constants.
 *
 * Gated by `feature_flag:m10c_persona_widgets_v1` in `system_settings`.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calculator, Home, TrendingUp, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCanonicalProfile } from '@/hooks/useCanonicalProfile';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import {
  CALCULATOR_PRESETS,
  presetForPersona,
  type PresetSlug,
} from '@/lib/calculator/personaPresets';

type WidgetKey = 'rent_vs_buy' | 'own_vs_rent' | 'ready_for_second' | 'roi_presets';

const WIDGETS_BY_PERSONA: Record<string, WidgetKey[]> = {
  P5:  ['rent_vs_buy', 'roi_presets'],
  P6:  ['rent_vs_buy', 'roi_presets'],
  P8:  ['own_vs_rent', 'roi_presets'],
  P9:  ['own_vs_rent', 'roi_presets'],
  P10: ['ready_for_second', 'roi_presets'],
  P11: ['own_vs_rent', 'roi_presets'],
};

const FALLBACK_WIDGETS: WidgetKey[] = ['roi_presets'];

export function PersonaWidgets() {
  const enabled = useFeatureFlag('m10c_persona_widgets_v1', true);
  const { language } = useLanguage();
  const { profile, isLoading } = useCanonicalProfile();
  const isRu = language === 'ru';

  if (!enabled || isLoading) return null;

  const persona = profile?.detectedPersona ?? null;
  const widgets = persona ? WIDGETS_BY_PERSONA[persona] ?? FALLBACK_WIDGETS : FALLBACK_WIDGETS;
  const presetSlug = presetForPersona(persona);

  if (widgets.length === 0) return null;

  return (
    <section
      aria-labelledby="persona-widgets-heading"
      className="space-y-4"
      data-testid="persona-widgets"
    >
      <div className="flex items-baseline justify-between">
        <h2
          id="persona-widgets-heading"
          className="text-lg font-semibold text-foreground"
        >
          {isRu ? 'Полезные расчёты для вас' : 'Useful calculators for you'}
        </h2>
        {persona && (
          <span className="text-xs text-muted-foreground">
            {isRu ? 'на основе вашего профиля' : 'based on your profile'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.includes('rent_vs_buy') && (
          <RentVsBuyWidget isRu={isRu} presetSlug={presetSlug} />
        )}
        {widgets.includes('own_vs_rent') && (
          <OwnVsRentWidget isRu={isRu} presetSlug={presetSlug} />
        )}
        {widgets.includes('ready_for_second') && (
          <ReadyForSecondWidget isRu={isRu} />
        )}
        {widgets.includes('roi_presets') && (
          <RoiPresetsWidget isRu={isRu} primarySlug={presetSlug} />
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual widgets                                                */
/* ------------------------------------------------------------------ */

interface BaseProps {
  isRu: boolean;
  presetSlug: PresetSlug | null;
}

function RentVsBuyWidget({ isRu, presetSlug }: BaseProps) {
  // Quick math: monthly rent vs cost-of-ownership over 5 years.
  const slug = presetSlug ?? 'resident';
  const preset = CALCULATOR_PRESETS[slug];
  const annualRent = preset.monthlyRent * 12;
  const fiveYearRent = annualRent * 5;
  const ownershipCost5y =
    preset.purchasePrice * 0.05 + // ~5% transaction + furnishings
    preset.camFeeMonthly * 12 * 5 -
    preset.purchasePrice * 0.04 * 5; // assume 4% appreciation captured

  const buyAdvantage = fiveYearRent - ownershipCost5y;

  return (
    <WidgetCard
      icon={Home}
      title={isRu ? 'Аренда или покупка?' : 'Rent or buy?'}
      hint={isRu ? '5-летний горизонт' : '5-year horizon'}
    >
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label={isRu ? 'Аренда 5 лет' : 'Rent 5y'} value={formatThbCompact(fiveYearRent)} />
        <Stat label={isRu ? 'Владение 5 лет' : 'Own 5y (net)'} value={formatThbCompact(ownershipCost5y)} />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {buyAdvantage > 0
          ? isRu
            ? `Покупка экономит ~${formatThbCompact(buyAdvantage)} за 5 лет.`
            : `Buying saves ~${formatThbCompact(buyAdvantage)} over 5 years.`
          : isRu
            ? 'Аренда выгоднее на текущих параметрах.'
            : 'Renting is cheaper at current inputs.'}
      </p>
      <Link to={`/newbuilds/calculator?preset=${slug}`}>
        <Button variant="outline" size="sm" className="w-full">
          {isRu ? 'Открыть калькулятор' : 'Open calculator'}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </Link>
    </WidgetCard>
  );
}

function OwnVsRentWidget({ isRu, presetSlug }: BaseProps) {
  const slug = presetSlug ?? 'investor';
  const preset = CALCULATOR_PRESETS[slug];
  const annualRent = preset.monthlyRent * 12 * (preset.occupancyRate / 100);
  const annualCam = preset.camFeeMonthly * 12;
  const mgmt = annualRent * (preset.managementFee / 100);
  const netRent = annualRent - annualCam - mgmt;
  const grossYield = (annualRent / preset.purchasePrice) * 100;
  const netYield = (netRent / preset.purchasePrice) * 100;

  return (
    <WidgetCard
      icon={TrendingUp}
      title={isRu ? 'Сдавать или жить?' : 'Rent out or live in?'}
      hint={isRu ? `Загрузка ${preset.occupancyRate}%` : `${preset.occupancyRate}% occupancy`}
    >
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label={isRu ? 'Gross yield' : 'Gross yield'} value={`${grossYield.toFixed(1)}%`} accent />
        <Stat label={isRu ? 'Net yield' : 'Net yield'} value={`${netYield.toFixed(1)}%`} accent />
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {isRu
          ? `Net доход ~${formatThbCompact(netRent)}/год после CAM и управления.`
          : `Net income ~${formatThbCompact(netRent)}/yr after CAM and mgmt.`}
      </p>
      <Link to={`/newbuilds/calculator?preset=${slug}`}>
        <Button variant="outline" size="sm" className="w-full">
          {isRu ? 'Подробный расчёт' : 'Full breakdown'}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </Link>
    </WidgetCard>
  );
}

function ReadyForSecondWidget({ isRu }: { isRu: boolean }) {
  // Simple readiness signal — placeholder until M10g portfolio data lands.
  return (
    <WidgetCard
      icon={Layers}
      title={isRu ? 'Готовы ко второму объекту?' : 'Ready for property #2?'}
      hint={isRu ? 'Для операторов' : 'For operators'}
    >
      <p className="text-sm text-foreground leading-relaxed">
        {isRu
          ? 'Анализ загрузки, денежного потока и сезонности по вашему текущему портфелю.'
          : 'Analyse occupancy, cash flow and seasonality across your current portfolio.'}
      </p>
      <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
        <li>{isRu ? 'Свободный денежный поток' : 'Free cash flow'}</li>
        <li>{isRu ? 'Кросс-сезонность объектов' : 'Cross-seasonality'}</li>
        <li>{isRu ? 'Доступ к urgent-сделкам' : 'Access to urgent deals'}</li>
      </ul>
      <Link to="/owner">
        <Button variant="outline" size="sm" className="w-full">
          {isRu ? 'Открыть портфель' : 'Open portfolio'}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Button>
      </Link>
    </WidgetCard>
  );
}

function RoiPresetsWidget({ isRu, primarySlug }: { isRu: boolean; primarySlug: PresetSlug | null }) {
  const slugs: PresetSlug[] = primarySlug
    ? [primarySlug, ...(['investor', 'snowbird', 'hnw'] as PresetSlug[]).filter(s => s !== primarySlug)].slice(0, 3)
    : (['investor', 'snowbird', 'hnw'] as PresetSlug[]);

  return (
    <WidgetCard
      icon={Calculator}
      title={isRu ? 'Готовые сценарии ROI' : 'ROI scenario presets'}
      hint={isRu ? 'Один клик' : 'One click'}
    >
      <div className="space-y-2">
        {slugs.map(slug => {
          const p = CALCULATOR_PRESETS[slug];
          return (
            <Link
              key={slug}
              to={`/newbuilds/calculator?preset=${slug}`}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/40 hover:bg-muted/70 transition-colors group"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {isRu ? p.labelRu : p.labelEn}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {formatThbCompact(p.purchasePrice)} · {p.occupancyRate}% occ
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </WidgetCard>
  );
}

/* ------------------------------------------------------------------ */
/*  Primitives                                                        */
/* ------------------------------------------------------------------ */

function WidgetCard({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          {hint && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{hint}</span>}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md bg-muted/40 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`text-base font-bold ${accent ? 'text-primary' : 'text-foreground'}`}
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {value}
      </div>
    </div>
  );
}

function formatThbCompact(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}฿${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}฿${(abs / 1_000).toFixed(0)}K`;
  return `${sign}฿${abs.toFixed(0)}`;
}
