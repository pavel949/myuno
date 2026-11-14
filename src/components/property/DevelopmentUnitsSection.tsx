import { publicNewbuildUnit } from '@/lib/real-estate/publicNewbuildPresentation';
/**
 * DevelopmentUnitsSection — public presentation of canonical project_units.
 */
import React from 'react';
import { BedDouble, Bath, Maximize2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectUnits, type ProjectUnit } from '@/hooks/useProjectUnits';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DevelopmentUnitsSectionProps {
  developmentId: string;
  onSelectUnit?: (unit: ProjectUnit) => void;
}

const VIEW_LABELS: Record<string, { en: string; ru: string }> = {
  sea_view: { en: 'Sea View', ru: 'Вид на море' },
  pool_view: { en: 'Pool View', ru: 'Вид на бассейн' },
  garden_view: { en: 'Garden View', ru: 'Вид на сад' },
  mountain_view: { en: 'Mountain View', ru: 'Вид на горы' },
};

export function DevelopmentUnitsSection({ developmentId, onSelectUnit }: DevelopmentUnitsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: units, isLoading } = useProjectUnits(developmentId);

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-none" />)}</div>;
  }

  if (!units || units.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-base">{isRu ? 'Планировки' : 'Floor plans'}</h3>
      {units.map(sourceUnit => {
        const unit = publicNewbuildUnit(sourceUnit);
        const name = (isRu && unit.name_ru) ? unit.name_ru : unit.name;
        const isSoldOut = unit.status === 'sold_out';
        return (
          <div key={unit.id} className={cn('border rounded-none p-3 space-y-2', isSoldOut ? 'opacity-60 border-border/30' : 'border-border/50')}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-medium text-sm">{name}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-0.5"><Maximize2 className="w-3 h-3" />{unit.area_sqm} м²</span>
                  {unit.bedrooms != null && unit.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{unit.bedrooms}</span>}
                  {unit.bathrooms != null && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{unit.bathrooms}</span>}
                  {unit.floor_from != null && unit.floor_to != null && <span className="flex items-center gap-0.5"><Layers className="w-3 h-3" />{unit.floor_from}-{unit.floor_to} {isRu ? 'эт.' : 'fl.'}</span>}
                </div>
              </div>
              {onSelectUnit && !isSoldOut && <Button type="button" size="sm" variant="outline" onClick={() => onSelectUnit(sourceUnit)}>{isRu ? 'Спросить' : 'Ask about this unit'}</Button>}
            </div>
            {unit.price != null && <p className="text-sm font-medium">{unit.price.toLocaleString()} {unit.currency ?? 'THB'}</p>}
            {unit.views && unit.views.length > 0 && <div className="flex gap-1 flex-wrap">{unit.views.map(v => <Badge key={v} variant="outline" className="text-[10px]">{VIEW_LABELS[v]?.[isRu ? 'ru' : 'en'] || v}</Badge>)}</div>}
          </div>
        );
      })}
    </div>
  );
}
