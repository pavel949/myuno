import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { usePhuketConditions } from '@/hooks/usePhuketConditions';
import { cn } from '@/lib/utils';
import { pickLang } from '@/lib/i18n/pickLang';

// WMO weather codes → short label (Open-Meteo)
function weatherLabel(code: number | null, language: Language): string {
  if (code === null) return '—';
  if (code === 0) return pickLang(language, { ru: 'Ясно', en: 'Clear', th: 'ท้องฟ้าแจ่มใส' });
  if (code <= 2) return pickLang(language, { ru: 'Перем. обл.', en: 'Partly cloudy', th: 'มีเมฆบางส่วน' });
  if (code === 3) return pickLang(language, { ru: 'Облачно', en: 'Cloudy', th: 'มีเมฆมาก' });
  if (code >= 45 && code <= 48) return pickLang(language, { ru: 'Туман', en: 'Fog', th: 'หมอก' });
  if (code >= 51 && code <= 57) return pickLang(language, { ru: 'Морось', en: 'Drizzle', th: 'ฝนปรอย' });
  if (code >= 61 && code <= 67) return pickLang(language, { ru: 'Дождь', en: 'Rain', th: 'ฝนตก' });
  if (code >= 71 && code <= 77) return pickLang(language, { ru: 'Снег', en: 'Snow', th: 'หิมะ' });
  if (code >= 80 && code <= 82) return pickLang(language, { ru: 'Ливни', en: 'Showers', th: 'ฝนตกเป็นช่วง' });
  if (code >= 95) return pickLang(language, { ru: 'Гроза', en: 'Thunderstorm', th: 'พายุฝนฟ้าคะนอง' });
  return '—';
}

function aqiLabel(band: ReturnType<typeof usePhuketConditions>['aqiBand'], language: Language): string {
  switch (band) {
    case 'good': return pickLang(language, { ru: 'Хорошо', en: 'Good', th: 'ดี' });
    case 'moderate': return pickLang(language, { ru: 'Умеренно', en: 'Moderate', th: 'ปานกลาง' });
    case 'unhealthy': return pickLang(language, { ru: 'Вредно', en: 'Unhealthy', th: 'ไม่ดีต่อสุขภาพ' });
    case 'hazardous': return pickLang(language, { ru: 'Опасно', en: 'Hazardous', th: 'อันตราย' });
    default: return '—';
  }
}

export function NowInPhuket() {
  const { language } = useLanguage();
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
            {pickLang(language, { ru: 'Данные сейчас недоступны', en: 'Live data unavailable', th: 'ข้อมูลไม่พร้อมใช้งาน' })}
          </div>
          <button
            type="button"
            onClick={retry}
            className="flex min-h-11 items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground hover:text-primary transition-colors"
            aria-label={pickLang(language, { ru: 'Повторить', en: 'Retry', th: 'ลองอีกครั้ง' })}
          >
            <RefreshCw className="w-3 h-3" />
            {pickLang(language, { ru: 'Повторить', en: 'Retry', th: 'ลองอีกครั้ง' })}
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
          label={pickLang(language, { ru: 'Пхукет', en: 'Phuket', th: 'ภูเก็ต' })}
          value={temp}
          sub={weatherLabel(weatherCode, language)}
        />
        <DataCell
          label="AQI"
          value={aqi}
          sub={aqiLabel(aqiBand, language)}
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
      {/* Faint navy underline turns the trio into instrumentation rather
          than placeholder dashes. Decorative — `inline-block` keeps the
          underline tight to the value. */}
      <div className="font-mono text-[18px] font-medium text-foreground leading-none inline-block border-b border-primary/15 pb-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function SkeletonCell({ border }: { border?: boolean }) {
  return (
    <div className={cn('px-3.5', border && 'border-l border-border/[0.05] -ml-px')}>
      <div className="h-[10px] w-12 bg-muted/60 mb-2 animate-pulse" />
      <div className="h-[18px] w-14 bg-muted animate-pulse" />
      <div className="h-[11px] w-16 bg-muted/60 mt-1.5 animate-pulse" />
    </div>
  );
}
