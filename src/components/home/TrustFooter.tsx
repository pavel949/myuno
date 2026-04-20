import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export function TrustFooter() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="px-4 pb-8">
      <div className="rounded-[14px] border border-border/10 p-4 flex gap-3.5 items-start">
        <div className="font-mono text-[20px] font-medium text-foreground leading-none mt-0.5">03</div>
        <div className="flex-1">
          <div className="text-[12.5px] font-medium text-foreground">
            {isRu ? 'Сервис работает в правовом поле Таиланда' : 'Service operates within the legal framework of Thailand'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
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
