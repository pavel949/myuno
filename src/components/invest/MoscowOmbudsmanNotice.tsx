/**
 * MoscowOmbudsmanNotice — passive notice for buyers from Moscow.
 *
 * Shown on the investment-deal intake page. References the City of Moscow
 * Business Ombudsman as a third-party route for dispute escalation involving
 * Russian-speaking citizens transacting abroad. Intentionally non-promotional.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Scale } from 'lucide-react';

export function MoscowOmbudsmanNotice({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div
      className={`rounded-none border border-border bg-muted/30 px-3 py-2.5 text-[12px] leading-snug ${className ?? ''}`}
      role="note"
    >
      <div className="flex items-start gap-2">
        <Scale className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="font-medium text-foreground">
            {isRu ? 'Защита через омбудсмена Москвы' : 'Moscow Business Ombudsman channel'}
          </div>
          <p className="text-muted-foreground mt-0.5">
            {isRu
              ? 'Для резидентов Москвы доступен канал эскалации споров через Уполномоченного по защите прав предпринимателей в городе Москве. Канал применяется при необходимости и по согласованию сторон сделки.'
              : 'Residents of Moscow may use the dispute escalation channel via the City of Moscow Business Ombudsman. Used on demand and with the consent of the deal parties.'}
          </p>
        </div>
      </div>
    </div>
  );
}
