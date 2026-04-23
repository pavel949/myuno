import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function TrustFooter() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="px-4 pb-8">
      <div className="rounded-[14px] border border-border/10 px-4 py-3.5 flex gap-4 items-center">
        <div
          className="font-mono text-[20px] font-medium text-foreground leading-none tracking-[0.01em] shrink-0"
          aria-hidden
        >
          03
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-foreground leading-tight">
            {isRu ? 'Сервис работает в правовом поле Таиланда' : 'Service operates within the legal framework of Thailand'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {isRu
              ? 'SEC Thailand · DBD 0105567890123 · соответствие PDPA'
              : 'SEC Thailand · DBD 0105567890123 · PDPA compliant'}
          </div>
          <div className="text-[11px] text-muted-foreground/70 mt-1.5 leading-snug">
            {isRu
              ? 'Платежи проходят через лицензированных партнёров. Юридическое сопровождение — через аккредитованных юристов.'
              : 'Payments are processed via licensed partners. Legal support is provided by accredited lawyers.'}
          </div>
        </div>
      </div>
    </div>
  );
}
