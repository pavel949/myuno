import React from 'react';
import { Zap, Droplets, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

interface UtilitiesInfoProps {
  electricity?: {
    included: boolean;
    unitPrice?: number;
    provider?: string;
    metering?: string;
    notes?: string;
    notes_ru?: string;
  };
  water?: {
    included: boolean;
    unitPrice?: number;
    notes?: string;
    notes_ru?: string;
  };
  internet?: {
    speed?: string;
    provider?: string;
  };
  className?: string;
}

export function UtilitiesInfo({ electricity, water, internet, className }: UtilitiesInfoProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const hasAnyUtilityInfo = electricity || water || internet;
  if (!hasAnyUtilityInfo) return null;

  const meteringLabels: Record<string, { en: string; ru: string }> = {
    meter: { en: 'Meter reading', ru: 'По счётчику' },
    fixed: { en: 'Fixed rate', ru: 'Фиксированная' },
    estimated: { en: 'Estimated', ru: 'Расчётная' },
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3">
        {isRu ? 'Коммунальные услуги' : 'Utilities'}
      </h3>
      <div className="space-y-3">
        {/* Electricity */}
        {electricity && (
          <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="font-medium">{isRu ? 'Электричество' : 'Electricity'}</span>
              </div>
              <Badge variant={electricity.included ? 'default' : 'secondary'}>
                {electricity.included 
                  ? (isRu ? 'Включено' : 'Included')
                  : (isRu ? 'Не включено' : 'Not included')}
              </Badge>
            </div>
            {!electricity.included && electricity.unitPrice && (
              <p className="text-sm text-muted-foreground">
                ฿{electricity.unitPrice}/{isRu ? 'кВт' : 'kWh'}
                {electricity.provider && ` · ${electricity.provider}`}
                {electricity.metering && ` · ${meteringLabels[electricity.metering]?.[isRu ? 'ru' : 'en'] || electricity.metering}`}
              </p>
            )}
            {(electricity.notes || electricity.notes_ru) && (
              <p className="text-xs text-muted-foreground mt-1">
                {isRu ? electricity.notes_ru || electricity.notes : electricity.notes}
              </p>
            )}
          </div>
        )}

        {/* Water */}
        {water && (
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{isRu ? 'Вода' : 'Water'}</span>
              </div>
              <Badge variant={water.included ? 'default' : 'secondary'}>
                {water.included 
                  ? (isRu ? 'Включено' : 'Included')
                  : (isRu ? 'Не включено' : 'Not included')}
              </Badge>
            </div>
            {!water.included && water.unitPrice && (
              <p className="text-sm text-muted-foreground">
                ฿{water.unitPrice}/{isRu ? 'ед.' : 'unit'}
              </p>
            )}
            {(water.notes || water.notes_ru) && (
              <p className="text-xs text-muted-foreground mt-1">
                {isRu ? water.notes_ru || water.notes : water.notes}
              </p>
            )}
          </div>
        )}

        {/* Internet */}
        {internet && (internet.speed || internet.provider) && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-5 h-5 text-primary" />
              <span className="font-medium">{isRu ? 'Интернет' : 'Internet'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {internet.speed && <span className="font-medium">{internet.speed}</span>}
              {internet.speed && internet.provider && ' · '}
              {internet.provider}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
