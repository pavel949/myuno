import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

/**
 * HomeConcierge — inline concierge nudge on the mockup-faithful Home.
 *
 * Mirrors `screen.jsx · Concierge`: a dashed card whose copy blends by how many
 * roles are active, with three one-tap affordances. The concierge never moves
 * money (ARCHITECTURE_V2 §13 hard rule #5) — "Ask" opens the concierge/search
 * surface, "Focus"/"Later" are local emphasis/dismiss only.
 */
export function HomeConcierge() {
  const { language } = useLanguage();
  const { effectivePersonas } = useUserPersonas();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const isRu = language === 'ru';
  const personas = effectivePersonas;
  const primary = personas[0];
  const primaryMeta = primary ? ROLE_META[primary] : undefined;

  if (dismissed || !primaryMeta) return null;

  const primaryLabel = (isRu ? primaryMeta.labelRu : primaryMeta.label).toLowerCase();
  const secondMeta = personas[1] ? ROLE_META[personas[1]] : undefined;
  const secondLabel = secondMeta ? (isRu ? secondMeta.labelRu : secondMeta.short).toLowerCase() : '';

  const nudge = personas.length > 1
    ? isRu
      ? `Сегодня вы носите ${personas.length} шляп. Я поставил задачи по роли «${primaryLabel}» первыми${secondLabel ? `, ниже — ветки по «${secondLabel}»` : ''}.`
      : `You're wearing ${personas.length} hats today. I lined up your ${primaryLabel} priority first${secondLabel ? `, with ${secondLabel} threads below` : ''}.`
    : isRu
      ? `Я собрал ваши приоритеты по роли «${primaryLabel}» — попросите переключить фокус в любой момент.`
      : `I lined up your ${primaryLabel} priority — ask me to switch focus anytime.`;

  return (
    <div className="px-4 pb-5">
      <div className="flex items-start gap-3 rounded-none border border-dashed border-border-strong p-4">
        <div className="mt-0.5 grid h-[26px] w-[26px] flex-shrink-0 place-items-center rounded-full bg-accent font-display text-[11px] font-bold text-accent-foreground">
          U
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-label uppercase tracking-[0.08em] text-muted-foreground/70 font-semibold mb-1">
            {isRu ? 'Консьерж' : 'Concierge'}
          </div>
          <p className="text-[13.5px] leading-relaxed text-foreground text-pretty">{nudge}</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Pill primary onClick={() => navigate(APP_ROUTES.SEARCH)}>
              {isRu ? 'Режим фокуса' : 'Focus mode'}
            </Pill>
            <Pill onClick={() => setDismissed(true)}>{isRu ? 'Позже' : 'Later'}</Pill>
            <Pill onClick={() => navigate(APP_ROUTES.SEARCH)}>{isRu ? 'Спросить' : 'Ask'}</Pill>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[32px] items-center rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors',
        primary
          ? 'bg-foreground text-background border-foreground'
          : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/40',
      )}
    >
      {children}
    </button>
  );
}
