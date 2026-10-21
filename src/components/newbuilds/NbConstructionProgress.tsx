import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { projectCompletionLabel } from '@/lib/offplan/presentation';

interface Props {
  progress: number; // 0-100
  completionDate?: string | null;
  size?: 'sm' | 'md';
}

export function NbConstructionProgress({ progress, completionDate, size = 'md' }: Props) {
  const { language } = useLanguage();
  const h = size === 'sm' ? 'h-1' : 'h-1.5';
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="nb-mono text-xs" style={{ color: 'hsl(var(--nb-gold))' }}>
          {progress}%
        </span>
        {completionDate && (
          <span className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
            {pickLang(language, { ru: 'Сдача:', en: 'Completion:', th: 'กำหนดแล้วเสร็จ:' })} {projectCompletionLabel(completionDate, language)}
          </span>
        )}
      </div>
      <div className={`nb-progress-track ${h}`}>
        <div className="nb-progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </div>
  );
}
