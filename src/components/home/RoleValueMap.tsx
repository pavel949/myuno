import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';
import { ROLE_VALUE_POINTS } from '@/lib/home/roleValueMap';

interface RoleValueMapProps {
  personas: UserPersona[];
  onMore?: () => void;
}

/**
 * Calm "what this closes for you" card.
 * Shows up to 2 active roles with 3–4 concrete service+mechanism points each.
 */
export function RoleValueMap({ personas, onMore }: RoleValueMapProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!personas.length) return null;

  const visible = personas.slice(0, 2);
  const remaining = personas.length - visible.length;
  const perRole = visible.length === 1 ? 4 : 3;

  const headerRoles = visible
    .map(p => (isRu ? ROLE_META[p]?.labelRu : ROLE_META[p]?.label))
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="px-4 pb-5">
      <div className="rounded-[16px] bg-card border border-border p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 font-semibold">
            {isRu ? 'Что это закрывает для вас' : 'What this closes for you'}
          </div>
          <div className="text-[11px] text-muted-foreground/50 truncate ml-2 min-w-0">
            {headerRoles}
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          {visible.map(persona => {
            const meta = ROLE_META[persona];
            const dict = ROLE_VALUE_POINTS[persona];
            if (!meta || !dict) return null;
            const points = (isRu ? dict.ru : dict.en).slice(0, perRole);
            const roleLabel = isRu ? meta.labelRu : meta.label;

            return (
              <section
                key={persona}
                aria-label={roleLabel}
                className="flex gap-2.5"
              >
                <span
                  aria-hidden
                  className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}55` }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[11px] font-semibold tracking-[0.04em] uppercase mb-1.5"
                    style={{ color: meta.color }}
                  >
                    {roleLabel}
                  </div>
                  <ul className="flex flex-col gap-1">
                    {points.map((point, i) => (
                      <li
                        key={i}
                        className="text-[12.5px] text-foreground/85 leading-snug"
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>

        {remaining > 0 && (
          <button
            onClick={onMore}
            className="mt-3 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors text-left"
          >
            {isRu ? `Ещё ${remaining} ${remaining === 1 ? 'роль' : 'ролей'} →` : `+${remaining} more role${remaining === 1 ? '' : 's'} →`}
          </button>
        )}
      </div>
    </div>
  );
}
