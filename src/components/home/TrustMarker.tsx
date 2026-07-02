import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * TrustMarker — inline "licensed & regulated" row (mockup `screen.jsx · Trust`).
 *
 * Trust is UI, not a footer (ARCHITECTURE_V2 §01). A quiet, accent-free strip:
 * a mono index and the regulatory line. Static content, canon styling.
 */
export function TrustMarker() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="px-4 pb-8">
      <div className="flex items-center gap-3.5 rounded-none border border-border/[0.06] p-3.5">
        <div className="font-mono text-[20px] font-medium tracking-[0.01em] text-foreground">03</div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-foreground">
            {isRu ? 'Лицензировано и регулируется' : 'Licensed & regulated'}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {isRu
              ? 'SEC Таиланд · DBD 0105567890123 · соответствие PDPA'
              : 'SEC Thailand · DBD 0105567890123 · PDPA compliant'}
          </div>
        </div>
      </div>
    </div>
  );
}
