import { Check, X, Gift } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrencySymbol } from '@/lib/config/currencies';

interface Addon {
  name_en?: string;
  name_ru?: string;
  price?: number;
  unit?: string;
}

interface YachtIncludedExcludedProps {
  features: string[] | null;
  exclusions: string[] | null;
  addons: Addon[] | null;
  currency?: string;
  hasCrew?: boolean | null;
}

export function YachtIncludedExcluded({ features, exclusions, addons, currency = 'THB', hasCrew }: YachtIncludedExcludedProps) {
  const { language } = useLanguage();
  const t = language === 'ru';
  const symbol = getCurrencySymbol(currency);

  const hasContent = features?.length || exclusions?.length || addons?.length || hasCrew;
  if (!hasContent) return null;

  return (
    <div className="space-y-5">
      {/* Crew callout */}
      {hasCrew && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-none flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{t ? 'Экипаж включён' : 'Professional crew included'}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t ? 'Капитан и команда входят в стоимость аренды' : 'Captain and crew are included in the charter price'}
            </p>
          </div>
        </div>
      )}

      {/* Included / Not Included grid */}
      {(features?.length || exclusions?.length) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features && features.length > 0 && (
            <div className="p-4 bg-success/10/50 dark:bg-success/20 rounded-none border border-success/40/50 dark:border-success/40/30">
              <h4 className="font-semibold text-sm mb-3 text-success dark:text-success flex items-center gap-2">
                <Check className="w-4 h-4" />
                {t ? 'Включено в стоимость' : "What's included"}
              </h4>
              <div className="space-y-2">
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-success dark:text-success flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exclusions && exclusions.length > 0 && (
            <div className="p-4 bg-destructive/5 rounded-none border border-destructive/20">
              <h4 className="font-semibold text-sm mb-3 text-destructive flex items-center gap-2">
                <X className="w-4 h-4" />
                {t ? 'Не включено' : 'Not included'}
              </h4>
              <div className="space-y-2">
                {exclusions.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <X className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                    <span>{e}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Extras & Add-ons */}
      {addons && addons.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            {t ? 'Дополнительные услуги' : 'Extras & Add-ons'}
          </h4>
          <div className="space-y-2">
            {addons.map((addon, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-none border border-border/50">
                <span className="text-sm">{t ? (addon.name_ru || addon.name_en) : addon.name_en}</span>
                {addon.price != null && addon.price > 0 && (
                  <span className="text-sm font-semibold text-primary whitespace-nowrap ml-3">
                    {symbol}{addon.price.toLocaleString()}
                    {addon.unit ? <span className="text-xs text-muted-foreground font-normal">/{addon.unit.replace('per_', '')}</span> : null}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
