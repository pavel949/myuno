/**
 * TrustStrip — chip-row showing institutional trust signals on a property card.
 * Used in PropertyDetail / OffplanDetail / ResaleDetail.
 *
 * Renders only chips with data; collapses to nothing if empty.
 */

import React from 'react';
import { Shield, ShieldCheck, Award, Droplets, FileCheck, Info, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TITLE_DEED_TYPES, type TitleDeedType } from '@/lib/real-estate/saleIntentTaxonomy';

export interface TrustStripProps {
  titleDeedType?: TitleDeedType | string | null;
  escrowOffered?: boolean | null;
  clearviewBadge?: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | string | null;
  clearviewRecommendation?: 'BUY' | 'WATCH' | 'AVOID' | string | null;
  floodRisk?: 'low' | 'medium' | 'high' | string | null;
  ownerVerified?: boolean | null;
  foreignQuota?: { available: number; total: number } | null;
  isRu: boolean;
  className?: string;
}

const RISK_COLORS: Record<string, string> = {
  low: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
  medium: 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10',
  high: 'border-red-500/40 text-red-700 dark:text-red-400 bg-red-500/10',
};

const REC_COLORS: Record<string, string> = {
  BUY: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10',
  WATCH: 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10',
  AVOID: 'border-red-500/40 text-red-700 dark:text-red-400 bg-red-500/10',
};

interface ChipProps {
  icon: React.ElementType;
  label: string;
  tooltip?: string;
  className?: string;
}

function Chip({ icon: Icon, label, tooltip, className }: ChipProps) {
  return (
    <div
      title={tooltip}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-medium rounded-none',
        'border-border/60 bg-muted/40 text-foreground',
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function TrustStrip({
  titleDeedType,
  escrowOffered,
  clearviewBadge,
  clearviewRecommendation,
  floodRisk,
  ownerVerified,
  foreignQuota,
  isRu,
  className,
}: TrustStripProps) {
  const chips: React.ReactNode[] = [];

  // Title deed
  if (titleDeedType) {
    const meta = TITLE_DEED_TYPES.find((t) => t.value === titleDeedType);
    const label = meta ? (isRu ? meta.ru : meta.en) : String(titleDeedType);
    const tooltip = meta ? (isRu ? meta.desc.ru : meta.desc.en) : undefined;
    const isPremium = titleDeedType === 'chanote';
    chips.push(
      <Chip
        key="deed"
        icon={FileCheck}
        label={label}
        tooltip={tooltip}
        className={isPremium ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : undefined}
      />,
    );
  }

  // Escrow
  if (escrowOffered) {
    chips.push(
      <Chip
        key="escrow"
        icon={Lock}
        label={isRu ? 'Эскроу доступен' : 'Escrow available'}
        tooltip={isRu ? 'Сделка может быть проведена через эскроу-счёт' : 'Deal can be settled via escrow account'}
        className="border-blue-500/40 text-blue-700 dark:text-blue-400 bg-blue-500/10"
      />,
    );
  }

  // ClearView score
  if (clearviewBadge) {
    chips.push(
      <Chip
        key="cv-badge"
        icon={Award}
        label={`ClearView ${clearviewBadge}`}
        tooltip={isRu ? 'Институциональный рейтинг проекта по методологии ClearView V3' : 'Institutional ClearView V3 rating'}
        className="border-primary/40 text-primary bg-primary/10"
      />,
    );
  }

  if (clearviewRecommendation && REC_COLORS[clearviewRecommendation]) {
    chips.push(
      <Chip
        key="cv-rec"
        icon={Info}
        label={clearviewRecommendation}
        tooltip={isRu ? 'Рекомендация ClearView V3' : 'ClearView V3 recommendation'}
        className={REC_COLORS[clearviewRecommendation]}
      />,
    );
  }

  // Flood risk
  if (floodRisk && RISK_COLORS[floodRisk]) {
    const labels: Record<string, { en: string; ru: string }> = {
      low: { en: 'Low flood risk', ru: 'Низкий риск затопления' },
      medium: { en: 'Medium flood risk', ru: 'Средний риск затопления' },
      high: { en: 'High flood risk', ru: 'Высокий риск затопления' },
    };
    chips.push(
      <Chip
        key="flood"
        icon={Droplets}
        label={isRu ? labels[floodRisk].ru : labels[floodRisk].en}
        className={RISK_COLORS[floodRisk]}
      />,
    );
  }

  // Foreign quota
  if (foreignQuota && foreignQuota.total > 0) {
    const left = Math.max(foreignQuota.available, 0);
    const pct = left / foreignQuota.total;
    const cls = pct > 0.4
      ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
      : pct > 0.15
      ? 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10'
      : 'border-red-500/40 text-red-700 dark:text-red-400 bg-red-500/10';
    chips.push(
      <Chip
        key="quota"
        icon={Shield}
        label={
          isRu
            ? `Иностр. квота: ${left}/${foreignQuota.total}`
            : `Foreign quota: ${left}/${foreignQuota.total}`
        }
        tooltip={isRu ? 'Доступно юнитов в иностранной 49% квоте' : 'Units available in 49% foreign quota'}
        className={cls}
      />,
    );
  }

  // Owner verified
  if (ownerVerified) {
    chips.push(
      <Chip
        key="verified"
        icon={ShieldCheck}
        label={isRu ? 'Владелец верифицирован' : 'Owner verified'}
        className="border-primary/40 text-primary bg-primary/10"
      />,
    );
  }

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)} role="list" aria-label={isRu ? 'Сигналы доверия' : 'Trust signals'}>
      {chips}
    </div>
  );
}

export default TrustStrip;
