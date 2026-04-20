import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import type { UserPersona } from '@/hooks/useUserPersonas';
import { ROLE_META } from '@/lib/roleBlend';

interface ConciergeCardProps {
  personas: UserPersona[];
}

export function ConciergeCard({ personas }: ConciergeCardProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [dismissed, setDismissed] = useState(false);
  const primaryMeta = ROLE_META[personas[0]];
  const accentColor = primaryMeta?.color || '#00D68F';

  if (dismissed) return null;

  const nudge = isRu
    ? 'Доступен каталог сервисов по профилю. Обращение в справочную — по вопросам услуг, тарифов и сроков.'
    : 'Catalog of services is available for your profile. Contact the help desk for questions on services, rates and timing.';

  return (
    <div className="px-4 pb-5">
      <div className="rounded-[16px] border border-dashed border-border p-4 flex gap-3">
        {/* Service marker */}
        <div
          className="w-[26px] h-[26px] rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center font-display text-[11px] font-bold text-background"
          style={{ background: accentColor }}
        >
          i
        </div>
        <div className="flex-1">
          <div className="text-[10.5px] tracking-[0.08em] uppercase text-muted-foreground/50 font-semibold mb-1">
            {isRu ? 'Уведомление' : 'Notice'}
          </div>
          <div className="text-[13.5px] text-foreground leading-relaxed">{nudge}</div>
          <div className="flex gap-1.5 mt-2.5">
            <button
              onClick={() => navigate('/discover')}
              className="px-2.5 py-1.5 rounded-full text-[11px] font-medium bg-foreground text-background border border-foreground"
            >
              {isRu ? 'Перейти к разделу' : 'Go to section'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-2.5 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground border border-border"
            >
              {isRu ? 'Отложить' : 'Postpone'}
            </button>
            <button
              onClick={() => navigate('/discover?ai=1')}
              className="px-2.5 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground border border-border"
            >
              {isRu ? 'Обращение в справочную' : 'Contact help desk'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
