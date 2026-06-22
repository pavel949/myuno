/**
 * MiniAppCard — rich card for /discover icon-grid.
 * icon + label + 1-line value-prop + a "why this is for you" hint chip.
 *
 * Hint resolution (first match wins):
 *   1. matching activeSituationCode → "Ситуация: <title>"
 *   2. matching active persona      → "Для: <personaLabel>"
 *   3. matching role tag            → "Роль: <roleLabel>"
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import type { FlatService, RoleTag } from '@/lib/catalog/taxonomy';
import { PERSONA_INFO, type UserPersona } from '@/hooks/useUserPersonas';
import type { LifeOSRole } from '@/hooks/useLifeOS';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Language } from '@/i18n';
import { cn } from '@/lib/utils';

interface SituationLabel { ru: string; en: string; th?: string }

/** Resolve a situation label for the active language (th→en→ru fallback). */
function pickSituationLabel(lbl: SituationLabel, language: Language): string {
  if (language === 'ru') return lbl.ru;
  if (language === 'th') return lbl.th ?? lbl.en;
  return lbl.en;
}

interface MiniAppCardProps {
  svc: FlatService;
  personas: readonly UserPersona[];
  role: LifeOSRole;
  activeSituationCode?: string;
  situationLabels?: Record<string, SituationLabel>;
}

const ROLE_LABELS: Record<LifeOSRole, { ru: string; en: string; th: string }> = {
  guest:     { ru: 'Гость',          en: 'Guest',      th: 'ผู้มาเยือน' },
  resident:  { ru: 'Резидент',       en: 'Resident',   th: 'ผู้พำนัก' },
  owner:     { ru: 'Собственник',    en: 'Owner',      th: 'เจ้าของ' },
  mc:        { ru: 'УК',             en: 'MC',         th: 'MC' },
  investor:  { ru: 'Инвестор',       en: 'Investor',   th: 'นักลงทุน' },
  developer: { ru: 'Застройщик',     en: 'Developer',  th: 'ผู้พัฒนา' },
  vendor:    { ru: 'Поставщик',      en: 'Vendor',     th: 'ผู้ให้บริการ' },
};

const ROLE_TO_TAGS: Record<LifeOSRole, RoleTag[]> = {
  guest:     ['consumer'],
  resident:  ['consumer', 'resident-user'],
  owner:     ['operator', 'investor-passive'],
  mc:        ['operator', 'provider'],
  investor:  ['investor-active', 'investor-passive'],
  developer: ['operator', 'provider'],
  vendor:    ['provider'],
};

function pickHint(
  svc: FlatService,
  personas: readonly UserPersona[],
  role: LifeOSRole,
  activeSituationCode: string | undefined,
  situationLabels: Record<string, SituationLabel> | undefined,
  language: Language,
): string | null {
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const situationWord = isRu ? 'Ситуация' : isTh ? 'สถานการณ์' : 'Situation';
  const forWord = isRu ? 'Для' : isTh ? 'สำหรับ' : 'For';
  const roleWord = isRu ? 'Роль' : isTh ? 'บทบาท' : 'Role';

  if (
    activeSituationCode &&
    svc.situationCodes?.includes(activeSituationCode) &&
    situationLabels?.[activeSituationCode]
  ) {
    const lbl = situationLabels[activeSituationCode];
    return `${situationWord}: ${pickSituationLabel(lbl, language)}`;
  }

  if (svc.personaTags?.length && personas.length) {
    for (const p of personas) {
      if (svc.personaTags.includes(p)) {
        const info = PERSONA_INFO[p];
        // PERSONA_INFO has only RU/EN — Thai falls back to EN.
        if (info) return `${forWord}: ${isRu ? info.labelRu : info.labelEn}`;
      }
    }
  }

  if (svc.roleTags?.length) {
    const roleTags = ROLE_TO_TAGS[role] ?? [];
    if (svc.roleTags.some((t) => t === 'all' || roleTags.includes(t))) {
      const lbl = ROLE_LABELS[role];
      return `${roleWord}: ${isRu ? lbl.ru : isTh ? lbl.th : lbl.en}`;
    }
  }

  // Fallback: first situation code (give user something concrete)
  if (svc.situationCodes?.length && situationLabels) {
    for (const code of svc.situationCodes) {
      if (situationLabels[code]) {
        const lbl = situationLabels[code];
        return `${situationWord}: ${pickSituationLabel(lbl, language)}`;
      }
    }
  }

  return null;
}

export const MiniAppCard: React.FC<MiniAppCardProps> = ({
  svc,
  personas,
  role,
  activeSituationCode,
  situationLabels,
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const Icon = svc.icon;
  const isSoon = svc.status === 'soon';

  // FlatService labels carry only RU/EN — Thai falls back to EN.
  const label = isRu ? svc.labelRu : svc.labelEn;
  const category = isRu ? svc.categoryLabelRu : svc.categoryLabelEn;
  const hint = pickHint(svc, personas, role, activeSituationCode, situationLabels, language);

  return (
    <Link
      to={svc.path}
      className={cn(
        'group relative flex flex-col gap-2 p-3 min-h-[124px]',
        'border border-border bg-card hover:border-primary/50 hover:bg-primary/[0.03]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'transition-colors',
        isSoon && 'opacity-75',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 flex items-center justify-center bg-muted/60 border border-border group-hover:border-primary/40 transition-colors">
          <Icon className="w-[22px] h-[22px] text-foreground" strokeWidth={1.75} />
        </div>
        {isSoon ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            {isRu ? 'скоро' : isTh ? 'เร็ว ๆ นี้' : 'soon'}
          </span>
        ) : (
          <ArrowUpRight
            className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors"
            strokeWidth={2}
          />
        )}
      </div>

      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
          {label}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-1">
          {category}
        </div>
      </div>

      {hint && (
        <div className="mt-auto pt-1.5 flex items-center gap-1 border-t border-border/60">
          <Sparkles className="w-3 h-3 text-primary/70 shrink-0" strokeWidth={2} />
          <span className="text-[10.5px] text-muted-foreground leading-tight line-clamp-1">
            {hint}
          </span>
        </div>
      )}
    </Link>
  );
};

export default MiniAppCard;
