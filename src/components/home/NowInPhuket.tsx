import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePhuketConditions } from '@/hooks/usePhuketConditions';
import { cn } from '@/lib/utils';

// WMO weather codes → short label (Open-Meteo)
function weatherLabel(code: number | null, isRu: boolean): string {
  if (code === null) return '—';
  if (code === 0) return isRu ? 'Ясно' : 'Clear';
  if (code <= 2) return isRu ? 'Перем. обл.' : 'Partly cloudy';
  if (code === 3) return isRu ? 'Облачно' : 'Cloudy';
  if (code >= 45 && code <= 48) return isRu ? 'Туман' : 'Fog';
  if (code >= 51 && code <= 57) return isRu ? 'Морось' : 'Drizzle';
  if (code >= 61 && code <= 67) return isRu ? 'Дождь' : 'Rain';
  if (code >= 71 && code <= 77) return isRu ? 'Снег' : 'Snow';
  if (code >= 80 && code <= 82) return isRu ? 'Ливни' : 'Showers';
  if (code >= 95) return isRu ? 'Гроза' : 'Thunderstorm';
  return '—';
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
  const {
    temp, aqi, rate, weatherCode, aqiBand, rateDelta,
    isLoading, hasAnyData, hasError, retry,
  } = usePhuketConditions();

  // ── Failure state — every external source blocked (common in Telegram /
  //    Instagram in-app browsers). Show one compact row with a retry button
  //    instead of three permanently empty cells. ──
  if (hasError && !hasAnyData) {
    return (
      <div className="px-4 pb-5">
        <div className="flex items-center justify-between border-t border-b border-border/[0.05] py-3.5 px-3.5 gap-3">
          <div className="text-[11px] tracking-[0.04em] uppercase text-muted-foreground/60 font-medium">
            {isRu ? 'Данные сейчас недоступны' : 'Live data unavailable'}
          </div>
          <button
            type="button"
            onClick={retry}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground hover:text-primary transition-colors"
            aria-label={isRu ? 'Повторить' : 'Retry'}
          >
            <RefreshCw className="w-3 h-3" />
            {isRu ? 'Повторить' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  // ── Loading skeleton — first paint with no cached value. Avoids the
  //    em-dash flash that made the section look broken in the screenshot. ──
  if (isLoading && !hasAnyData) {
    return (
      <div className="px-4 pb-5">
        <div className="grid grid-cols-3 border-t border-b border-border/[0.05] py-3.5">
          <SkeletonCell />
          <SkeletonCell border />
          <SkeletonCell border />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-5">
      <div className="grid grid-cols-3 border-t border-b border-border/[0.05] py-3.5">
        <DataCell
          label={isRu ? 'Пхукет' : 'Phuket'}
          value={temp}
          sub={weatherLabel(weatherCode, isRu)}
        />
        <DataCell
          label="AQI"
          value={aqi}
          sub={aqiLabel(aqiBand, isRu)}
          border
        />
        <DataCell
          label="THB/USD"
          value={rate}
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

function SkeletonCell({ border }: { border?: boolean }) {
  return (
    <div className={cn('px-3.5', border && 'border-l border-border/[0.05] -ml-px')}>
      <div className="h-[10px] w-12 bg-muted/60 mb-2 animate-pulse rounded-sm" />
      <div className="h-[18px] w-14 bg-muted animate-pulse rounded-sm" />
      <div className="h-[11px] w-16 bg-muted/60 mt-1.5 animate-pulse rounded-sm" />
    </div>
  );
}
