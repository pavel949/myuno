import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** Interest editing stays beside recommendations, below account actions. */
export function HomePreferencesEntry({ onOpen }: { onOpen: () => void }) {
  const { language } = useLanguage();
  return (
    <div className="mx-4 mb-3 flex flex-wrap items-center justify-between gap-x-3 border-t border-border pt-3">
      <p className="text-sm text-muted-foreground">{pickLang(language, { ru: 'Подборки по вашим интересам', en: 'Explore your interests', th: 'สำรวจตามความสนใจของคุณ' })}</p>
      <button type="button" onClick={onOpen} aria-haspopup="dialog" className="-mr-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-primary underline underline-offset-4 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden="true" />
        {pickLang(language, { ru: 'Настроить главную', en: 'Customize home', th: 'ปรับแต่งหน้าหลัก' })}
      </button>
    </div>
  );
}
