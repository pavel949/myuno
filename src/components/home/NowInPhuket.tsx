import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePhuketConditions } from '@/hooks/usePhuketConditions';
import { cn } from '@/lib/utils';

export function NowInPhuket() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { temp, aqi, rate } = usePhuketConditions();

  return (
    <div className="px-4 pb-5">
      <div className="grid grid-cols-3 border-t border-b border-border/20 py-3.5">
        <DataCell label={isRu ? 'Пхукет' : 'Phuket'} value={temp} sub={isRu ? 'Ясно' : 'Clear'} />
        <DataCell label="AQI" value={aqi} sub={isRu ? 'Хорошо' : 'Good'} border />
        <DataCell label="THB/USD" value={rate} sub="+0.12" border />
      </div>
    </div>
  );
}

function DataCell({ label, value, sub, border }: { label: string; value: string; sub: string; border?: boolean }) {
  return (
    <div className={cn('px-3.5', border && 'border-l border-border/20 -ml-px')}>
      <div className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold mb-1.5">{label}</div>
      <div className="font-mono text-[18px] font-medium text-foreground leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
