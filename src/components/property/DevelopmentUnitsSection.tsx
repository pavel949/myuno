/**
 * DevelopmentUnitsSection — shows unit types/floor plans for a project
 * Used in OffplanDetail page
 */
import React from 'react';
import { BedDouble, Bath, Maximize2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useDevelopmentUnits, type DevelopmentUnit } from '@/hooks/useDevelopmentUnits';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DevelopmentUnitsSectionProps {
  developmentId: string;
}

const VIEW_LABELS: Record<string, { en: string; ru: string }> = {
  sea_view: { en: 'Sea View', ru: 'Вид на море' },
  pool_view: { en: 'Pool View', ru: 'Вид на бассейн' },
  garden_view: { en: 'Garden View', ru: 'Вид на сад' },
  mountain_view: { en: 'Mountain View', ru: 'Вид на горы' },
};

const STATUS_CONFIG: Record<string, { en: string; ru: string; className: string }> = {
  available: { en: 'Available', ru: 'В наличии', className: 'bg-primary/10 text-primary border-primary/30' },
  limited: { en: 'Limited', ru: 'Мало', className: 'bg-warning/10 text-warning border-warning/30' },
  sold_out: { en: 'Sold Out', ru: 'Продано', className: 'bg-destructive/10 text-destructive border-destructive/30' },
};

export function DevelopmentUnitsSection({ developmentId }: DevelopmentUnitsSectionProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const { data: units, isLoading } = useDevelopmentUnits(developmentId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!units || units.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-base">
        {isRu ? 'Планировки и цены' : 'Floor Plans & Pricing'}
      </h3>

      {units.map(unit => {
        const name = (isRu && unit.name_ru) ? unit.name_ru : unit.name;
        const statusCfg = STATUS_CONFIG[unit.status] || STATUS_CONFIG.available;
        const isSoldOut = unit.status === 'sold_out';

        return (
          <div
            key={unit.id}
            className={cn(
              "border rounded-xl p-3 space-y-2",
              isSoldOut ? "opacity-60 border-border/30" : "border-border/50"
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-sm">{name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5">
                    <Maximize2 className="w-3 h-3" />
                    {unit.area_sqm} м²
                  </span>
                  {unit.bedrooms > 0 && (
                    <span className="flex items-center gap-0.5">
                      <BedDouble className="w-3 h-3" />
                      {unit.bedrooms}
                    </span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <Bath className="w-3 h-3" />
                    {unit.bathrooms}
                  </span>
                  {unit.floor_from && unit.floor_to && (
                    <span className="flex items-center gap-0.5">
                      <Layers className="w-3 h-3" />
                      {unit.floor_from}-{unit.floor_to} {isRu ? 'эт.' : 'fl.'}
                    </span>
                  )}
                </div>
              </div>

              <Badge variant="outline" className={cn("text-[10px]", statusCfg.className)}>
                {isRu ? statusCfg.ru : statusCfg.en}
                {!isSoldOut && unit.available_units > 0 && (
                  <span className="ml-1">({unit.available_units})</span>
                )}
              </Badge>
            </div>

            <div className="flex items-baseline justify-between">
              <span className={cn("font-bold", isSoldOut ? "text-muted-foreground" : "text-foreground")}>
                {isRu ? 'от ' : 'from '}{formatPrice(unit.price)}
              </span>
              {unit.price_per_sqm && (
                <span className="text-xs text-muted-foreground">
                  {formatPrice(unit.price_per_sqm)}/м²
                </span>
              )}
            </div>

            {/* Views */}
            {unit.views && unit.views.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {unit.views.map(v => (
                  <Badge key={v} variant="outline" className="text-[10px]">
                    {VIEW_LABELS[v]?.[isRu ? 'ru' : 'en'] || v}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
