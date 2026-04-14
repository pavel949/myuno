/**
 * NbPlansTab — Floor plans gallery grouped by unit type
 */
import React, { useState } from 'react';
import { FileImage, Maximize, Bed } from 'lucide-react';
import { useProjectUnits } from '@/hooks/useProjectUnits';
import { NbLightbox } from '../NbLightbox';
import { NbPriceDisplay } from '../NbPriceDisplay';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  projectId: string;
}

const unitTypeLabels: Record<string, string> = {
  studio: 'Студия',
  '1br': '1 спальня',
  '2br': '2 спальни',
  '3br': '3 спальни',
  '4br': '4 спальни',
  penthouse: 'Пентхаус',
  villa: 'Вилла',
  duplex: 'Дуплекс',
};

export function NbPlansTab({ projectId }: Props) {
  const { data: units, isLoading } = useProjectUnits(projectId);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; captions: string[] } | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" style={{ background: 'hsl(var(--nb-surface))' }} />
        ))}
      </div>
    );
  }

  const withPlans = (units || []).filter(u => u.floor_plan_url);

  if (withPlans.length === 0) {
    return (
      <div className="text-center py-16">
        <FileImage className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--nb-muted))' }} />
        <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Планировки пока не добавлены</p>
        <p className="text-sm mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>Запросите планировки у девелопера</p>
      </div>
    );
  }

  // Group by unit_type
  const grouped = withPlans.reduce<Record<string, typeof withPlans>>((acc, unit) => {
    const key = unit.unit_type || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(unit);
    return acc;
  }, {});

  const allPlanUrls = withPlans.map(u => u.floor_plan_url!);
  const allCaptions = withPlans.map(u => `${u.name_ru || u.name} — ${u.area_sqm}m²`);

  const openLightbox = (unitUrl: string) => {
    const idx = allPlanUrls.indexOf(unitUrl);
    setLightbox({ images: allPlanUrls, index: idx >= 0 ? idx : 0, captions: allCaptions });
  };

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([type, typeUnits]) => (
        <div key={type}>
          <p className="nb-label mb-4">{unitTypeLabels[type] || type}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeUnits.map(unit => (
              <button
                key={unit.id}
                onClick={() => openLightbox(unit.floor_plan_url!)}
                className="nb-glass overflow-hidden group text-left"
              >
                <div className="aspect-[4/3] relative overflow-hidden" style={{ background: 'hsl(var(--nb-surface))' }}>
                  <img
                    src={unit.floor_plan_url!}
                    alt={`${unit.name} floor plan`}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="nb-badge" style={{ background: 'hsl(var(--nb-gold) / 0.8)', color: 'hsl(var(--nb-bg))' }}>
                      Увеличить
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="nb-display text-base" style={{ color: 'hsl(var(--nb-text))' }}>
                    {unit.name_ru || unit.name}
                  </h4>
                  <div className="flex items-center gap-4 text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                    <span className="flex items-center gap-1">
                      <Maximize className="w-3 h-3" /> {unit.area_sqm}m²
                    </span>
                    {unit.bedrooms !== null && (
                      <span className="flex items-center gap-1">
                        <Bed className="w-3 h-3" /> {unit.bedrooms} BR
                      </span>
                    )}
                  </div>
                  <NbPriceDisplay price={unit.price} showFrom={false} size="sm" />
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {lightbox && (
        <NbLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          captions={lightbox.captions}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
