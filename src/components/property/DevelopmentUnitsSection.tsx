import { projectPublicDocumentUrl } from '@/lib/real-estate/projectPublicDocumentUrl';
import { QueryRecovery } from '@/components/shared/QueryRecovery';
import { pickLang } from '@/lib/i18n/pickLang';
import { publicNewbuildUnit } from '@/lib/real-estate/publicNewbuildPresentation';
/**
 * DevelopmentUnitsSection — public presentation of canonical project_units.
 */
import React from 'react';
import { BedDouble, Bath, Maximize2, Layers } from 'lucide-react';
import { Link, type Location } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectUnits, type ProjectUnit } from '@/hooks/useProjectUnits';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';

interface DevelopmentUnitsSectionProps {
  developmentId: string;
  onSelectUnit?: (unit: ProjectUnit) => void;
  unitListingContext?: Pick<Location, 'search' | 'state'>;
}

const VIEW_LABELS: Record<string, { en: string; ru: string }> = {
  sea_view: { en: 'Sea View', ru: 'Вид на море' },
  pool_view: { en: 'Pool View', ru: 'Вид на бассейн' },
  garden_view: { en: 'Garden View', ru: 'Вид на сад' },
  mountain_view: { en: 'Mountain View', ru: 'Вид на горы' },
};

export function DevelopmentUnitsSection({ developmentId, onSelectUnit, unitListingContext }: DevelopmentUnitsSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: units, isLoading, isError, refetch } = useProjectUnits(developmentId);

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-none" />)}</div>;
  }

  if (isError) return <QueryRecovery onRetry={refetch} />;

  if (!units || units.length === 0) return (
    <p className="py-3 text-sm text-muted-foreground">
      {pickLang(language, { ru: 'Конкретные объекты пока не опубликованы.', en: 'No individual units have been published yet.', th: 'ยังไม่มีการเผยแพร่ยูนิตรายห้อง' })}
    </p>
  );

  return (
    <div className="space-y-3">
      {units.map(sourceUnit => {
        const unit = publicNewbuildUnit(sourceUnit);
        const name = (isRu && unit.name_ru) ? unit.name_ru : unit.name;
        const planUrl = projectPublicDocumentUrl(unit.floor_plan_url);
        const planLabel = pickLang(language, { ru: 'Открыть план (новая вкладка)', en: 'Open plan (new tab)', th: 'เปิดแปลน (แท็บใหม่)' });
        return (
          <div key={unit.id} className="space-y-2 rounded-[var(--bible-radius-card)] border border-border/50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-medium text-sm">
                  {unit.unit_code && unitListingContext ? (
                    <Link
                      className="inline-flex min-h-11 items-center underline underline-offset-4"
                      to={{ pathname: APP_ROUTES.OFFPLAN_UNIT_DETAIL(developmentId, unit.id), search: unitListingContext.search }}
                      state={unitListingContext.state}
                    >
                      {name}
                    </Link>
                  ) : name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {Number.isFinite(unit.area_sqm) && unit.area_sqm > 0 && <span className="flex items-center gap-0.5"><Maximize2 className="w-3 h-3" />{unit.area_sqm} m²</span>}
                  {unit.bedrooms != null && unit.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{unit.bedrooms}</span>}
                  {unit.bathrooms != null && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{unit.bathrooms}</span>}
                  {unit.floor_from != null && unit.floor_to != null && <span className="flex items-center gap-0.5"><Layers className="w-3 h-3" />{unit.floor_from}-{unit.floor_to} {isRu ? 'эт.' : 'fl.'}</span>}
                </div>
              </div>
              {onSelectUnit && <Button type="button" size="sm" variant="outline" className="min-h-11" onClick={() => onSelectUnit(sourceUnit)}>
                {pickLang(language, { ru: 'Спросить', en: 'Ask about this unit', th: 'สอบถามยูนิตนี้' })}
              </Button>}
            </div>
            {planUrl && <Button asChild variant="link" className="min-h-11 px-0">
              <a href={planUrl} target="_blank" rel="noopener noreferrer" aria-label={`${planLabel}: ${name}`}>
                {planLabel}
              </a>
            </Button>}
            {unit.views && unit.views.length > 0 && <div className="flex gap-1 flex-wrap">{unit.views.map(v => <Badge key={v} variant="outline" className="text-[10px]">{VIEW_LABELS[v]?.[isRu ? 'ru' : 'en'] || v}</Badge>)}</div>}
          </div>
        );
      })}
    </div>
  );
}
