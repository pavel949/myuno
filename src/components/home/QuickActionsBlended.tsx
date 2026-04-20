import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';
import { selectActionsForPersonas } from '@/lib/home/quickActionsCatalog';

interface QuickActionsBlendedProps {
  personas: UserPersona[];
}

function SectionHead({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-2.5">
      <div className="text-[11px] tracking-[0.12em] uppercase text-muted-foreground/60 font-semibold">{title}</div>
      {meta && <div className="text-[11px] text-muted-foreground/50">{meta}</div>}
    </div>
  );
}

export function QuickActionsBlended({ personas }: QuickActionsBlendedProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { actions } = useMemo(() => selectActionsForPersonas(personas), [personas]);
  const displayActions = actions.slice(0, 8);

  const primaryColor = ROLE_META[personas[0]]?.color || '#00D68F';

  return (
    <div className="px-4 pb-5">
      <SectionHead
        title={isRu ? 'Для вас' : 'For you'}
        meta={isRu ? 'Из ваших ролей' : 'Mixed from your roles'}
      />
      <div className="grid grid-cols-4 gap-2">
        {displayActions.map((action) => (
          <button
            key={action.id}
            onClick={() => navigate(action.path)}
            className="relative rounded-[14px] bg-card border border-border/50 p-3 pb-2.5 flex flex-col items-center gap-1.5 hover:border-border transition-colors active:scale-[0.98]"
          >
            {/* Role color dot */}
            <span
              className="absolute top-2 right-2 w-[5px] h-[5px] rounded-full"
              style={{ background: action.accentColor || primaryColor }}
            />
            {/* Icon container */}
            <div className="w-8 h-8 rounded-[10px] bg-white/[0.04] border border-border/40 flex items-center justify-center">
              <action.icon className="w-[15px] h-[15px] text-foreground/70" />
            </div>
            <span className="text-[10.5px] font-medium text-foreground text-center leading-tight w-full truncate">
              {isRu ? action.labelRu : action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
