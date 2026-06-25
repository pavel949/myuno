/**
 * WhyChip — explains personalisation on Home (Wave 3).
 *
 * Sits above PersonalGrid and answers "почему я вижу именно это?":
 * names the primary role driving the For You ranking, hints at extra
 * personas, and opens RoleSheet on tap so the user can adjust.
 *
 * Presentational only — no structural changes to PersonalGrid or page sections.
 */
import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { ROLE_META, personaColor } from '@/lib/roleBlend';

interface WhyChipProps {
  onOpenRoleSheet: () => void;
}

export const WhyChip: React.FC<WhyChipProps> = ({ onOpenRoleSheet }) => {
  const { language } = useLanguage();
  const { effectivePersonas } = useUserPersonas();
  const isRu = language === 'ru';

  const primary = effectivePersonas[0];
  const extras = Math.max(0, effectivePersonas.length - 1);
  const primaryMeta = primary ? ROLE_META[primary] : undefined;

  const primaryLabel = primaryMeta
    ? (isRu ? primaryMeta.labelRu : primaryMeta.label)
    : (isRu ? 'гостя' : 'a guest');

  const reason = primaryMeta
    ? (isRu
        ? `Подобрано как для роли «${primaryLabel}»${extras > 0 ? ` +${extras}` : ''}`
        : `Tuned for your «${primaryLabel}» role${extras > 0 ? ` +${extras}` : ''}`)
    : (isRu
        ? 'Выберите роль, чтобы персонализировать подборку'
        : 'Pick a role to personalise your feed');

  const cta = isRu ? 'Изменить' : 'Change';
  const tint = primary ? personaColor(primary, 0.12) : 'hsl(var(--accent) / 0.10)';
  const border = primary ? personaColor(primary, 0.35) : 'hsl(var(--border))';

  return (
    <div className="px-4 mb-3">
      <button
        type="button"
        onClick={onOpenRoleSheet}
        aria-label={isRu ? 'Почему вы видите это? Изменить роль' : 'Why am I seeing this? Change role'}
        className="w-full flex items-center gap-2 rounded-none border px-3 py-2 text-left transition-colors hover:bg-primary/5"
        style={{ background: tint, borderColor: border }}
      >
        <Sparkles
          className="w-3.5 h-3.5 shrink-0"
          strokeWidth={2}
          style={{ color: primary ? personaColor(primary) : 'hsl(var(--accent))' }}
        />
        <span className="flex-1 text-[12px] leading-snug text-foreground/85 truncate">
          {reason}
        </span>
        <span className="flex items-center gap-0.5 text-[12px] font-medium text-foreground/70 shrink-0">
          {cta}
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        </span>
      </button>
    </div>
  );
};

export default WhyChip;
