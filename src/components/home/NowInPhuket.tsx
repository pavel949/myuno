import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePhuketConditions } from '@/hooks/usePhuketConditions';
import { cn } from '@/lib/utils';

// WMO weather codes → short label (Open-Meteo)
function weatherLabel(code: number | null, isRu: boolean): string {
  if (code === null) return isRu ? '—' : '—';
  if (code === 0) return isRu ? 'Ясно' : 'Clear';
  if (code <= 2) return isRu ? 'Перем. обл.' : 'Partly cloudy';
  if (code === 3) return isRu ? 'Облачно' : 'Cloudy';
  if (code >= 45 && code <= 48) return isRu ? 'Туман' : 'Fog';
  if (code >= 51 && code <= 57) return isRu ? 'Морось' : 'Drizzle';
  if (code >= 61 && code <= 67) return isRu ? 'Дождь' : 'Rain';
  if (code >= 71 && code <= 77) return isRu ? 'Снег' : 'Snow';
  if (code >= 80 && code <= 82) return isRu ? 'Ливни' : 'Showers';
  if (code >= 95) return isRu ? 'Гроза' : 'Thunderstorm';
  return isRu ? '—' : '—';
}

function aqiLabel(band: ReturnType<typeof usePhuketConditions>['aqiBand'], isRu: boolean): string {
  switch (band) {
    case 'good': return isRu ? 'Хорошо' : 'Good';
    case 'moderate': return isRu ? 'Умеренно' : 'Moderate';
    case 'unhealthy': return isRu ? 'Вредно' : 'Unhealthy';
    case 'hazardous': return isRu ? 'Опасно' : 'Hazardous';
    default: return '—';
  }
}

export function NowInPhuket() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { temp, aqi, rate, weatherCode, aqiBand, rateDelta, isLoading } = usePhuketConditions();

  return (
    <div className="px-4 pb-5">
      <div className="grid grid-cols-3 border-t border-b border-border/[0.05] py-3.5">
        <DataCell
          label={isRu ? 'Пхукет' : 'Phuket'}
          value={isLoading && temp === '—' ? '…' : temp}
          sub={weatherLabel(weatherCode, isRu)}
        />
        <DataCell
          label="AQI"
          value={isLoading && aqi === '—' ? '…' : aqi}
          sub={aqiLabel(aqiBand, isRu)}
          border
        />
        <DataCell
          label="THB/USD"
          value={isLoading && rate === '—' ? '…' : rate}
          sub={rateDelta || '—'}
          border
        />
      </div>
    </div>
  );
}

function DataCell({ label, value, sub, border }: { label: string; value: string; sub: string; border?: boolean }) {
  return (
    <div className={cn('px-3.5', border && 'border-l border-border/[0.05] -ml-px')}>
      <div className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground/50 font-semibold mb-1.5">{label}</div>
      <div className="font-mono text-[18px] font-medium text-foreground leading-none">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}
