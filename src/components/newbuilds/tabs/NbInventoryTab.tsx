/**
 * NbInventoryTab — Unit types grid for a project
 * Shows available units with pricing, floor plans, and availability
 */
import React, { useState } from 'react';
import { Bed, Bath, Maximize, Layers, Eye, FileImage } from 'lucide-react';
import { useProjectUnits, type ProjectUnit } from '@/hooks/useProjectUnits';
import { NbPriceDisplay } from '../NbPriceDisplay';
import { NbLightbox } from '../NbLightbox';
import { NbLeadForm } from '../NbLeadForm';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  projectId: string;
  developerId?: string;
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
  townhouse: 'Таунхаус',
};

const statusStyles: Record<string, { label: string; bg: string; color: string; border: string }> = {
  available: { label: 'Доступен', bg: 'hsl(var(--nb-gold) / 0.12)', color: 'hsl(var(--nb-gold))', border: 'hsl(var(--nb-gold) / 0.3)' },
  limited: { label: 'Осталось мало', bg: 'hsl(38 92% 50% / 0.12)', color: 'hsl(38 92% 60%)', border: 'hsl(38 92% 50% / 0.3)' },
  sold_out: { label: 'Продано', bg: 'hsl(var(--nb-muted) / 0.12)', color: 'hsl(var(--nb-muted))', border: 'hsl(var(--nb-muted) / 0.3)' },
  reserved: { label: 'Забронировано', bg: 'hsl(215 80% 55% / 0.12)', color: 'hsl(215 80% 65%)', border: 'hsl(215 80% 55% / 0.3)' },
};

type SortKey = 'price' | 'area' | 'bedrooms';

export function NbInventoryTab({ projectId, developerId }: Props) {
  const { data: units, isLoading } = useProjectUnits(projectId);
  const [sort, setSort] = useState<SortKey>('price');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [leadUnit, setLeadUnit] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-60 rounded-xl" style={{ background: 'hsl(var(--nb-surface))' }} />
        ))}
      </div>
    );
  }

  if (!units || units.length === 0) {
    return (
      <div className="text-center py-16">
        <Layers className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--nb-muted))' }} />
        <p className="nb-display text-xl" style={{ color: 'hsl(var(--nb-muted))' }}>Инвентарь пока не добавлен</p>
        <p className="text-sm mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>Запросите информацию о доступных юнитах</p>
      </div>
    );
  }

  const sorted = [...units].sort((a, b) => {
    if (sort === 'price') return a.price - b.price;
    if (sort === 'area') return a.area_sqm - b.area_sqm;
    if (sort === 'bedrooms') return (a.bedrooms || 0) - (b.bedrooms || 0);
    return 0;
  });

  const getAvailability = (unit: ProjectUnit) => {
    if (unit.status === 'sold_out' || (unit.available_units !== null && unit.available_units === 0)) return 'sold_out';
    if (unit.status === 'reserved') return 'reserved';
    if (unit.available_units !== null && unit.total_units !== null && unit.available_units <= Math.ceil(unit.total_units * 0.2)) return 'limited';
    return 'available';
  };

  return (
    <div className="space-y-6">
      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>Сортировка:</span>
        {([['price', 'Цена'], ['area', 'Площадь'], ['bedrooms', 'Спальни']] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className="px-3 py-1 rounded-full text-xs transition-all"
            style={{
              background: sort === key ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-gold) / 0.1)',
              color: sort === key ? 'hsl(var(--nb-bg))' : 'hsl(var(--nb-gold))',
              border: `1px solid hsl(var(--nb-gold) / ${sort === key ? '1' : '0.2'})`,
            }}
          >
            {label}
          </button>
        ))}
        <span className="ml-auto nb-mono text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
          {units.length} типов
        </span>
      </div>

      {/* Unit cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map(unit => {
          const avail = getAvailability(unit);
          const style = statusStyles[avail] || statusStyles.available;

          return (
            <div key={unit.id} className="nb-glass p-5 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="nb-display text-lg" style={{ color: 'hsl(var(--nb-text))' }}>
                    {unit.name_ru || unit.name}
                  </h3>
                  <span className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                    {unitTypeLabels[unit.unit_type] || unit.unit_type}
                  </span>
                </div>
                <span
                  className="nb-badge text-[10px]"
                  style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                >
                  {style.label}
                </span>
              </div>

              {/* Floor plan thumbnail */}
              {unit.floor_plan_url && (
                <button
                  onClick={() => setLightboxUrl(unit.floor_plan_url!)}
                  className="w-full aspect-[16/10] rounded-lg overflow-hidden relative group"
                  style={{ background: 'hsl(var(--nb-surface))' }}
                >
                  <img src={unit.floor_plan_url} alt={`${unit.name} floor plan`} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FileImage className="w-6 h-6" style={{ color: 'hsl(var(--nb-gold))' }} />
                  </div>
                </button>
              )}

              {/* Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Maximize className="w-3.5 h-3.5" style={{ color: 'hsl(var(--nb-gold))' }} />
                  <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{unit.area_sqm} m²</span>
                </div>
                {unit.bedrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bed className="w-3.5 h-3.5" style={{ color: 'hsl(var(--nb-gold))' }} />
                    <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{unit.bedrooms} спален</span>
                  </div>
                )}
                {unit.bathrooms !== null && (
                  <div className="flex items-center gap-2">
                    <Bath className="w-3.5 h-3.5" style={{ color: 'hsl(var(--nb-gold))' }} />
                    <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{unit.bathrooms} ванных</span>
                  </div>
                )}
                {(unit.floor_from || unit.floor_to) && (
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" style={{ color: 'hsl(var(--nb-gold))' }} />
                    <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>
                      Этаж {unit.floor_from}{unit.floor_to && unit.floor_to !== unit.floor_from ? `–${unit.floor_to}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Views */}
              {unit.views && unit.views.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {unit.views.map(v => (
                    <span key={v} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded" style={{ background: 'hsl(var(--nb-gold) / 0.08)', color: 'hsl(var(--nb-gold) / 0.8)' }}>
                      <Eye className="w-3 h-3" /> {v}
                    </span>
                  ))}
                </div>
              )}

              {/* Features */}
              {unit.features && unit.features.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {unit.features.map(f => (
                    <span key={f} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'hsl(var(--nb-surface))', color: 'hsl(var(--nb-text-secondary))' }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Price + availability */}
              <div className="nb-separator" />
              <div className="flex items-center justify-between">
                <div>
                  <NbPriceDisplay price={unit.price} showFrom={false} size="lg" />
                  {unit.price_per_sqm && (
                    <p className="nb-mono text-xs mt-0.5" style={{ color: 'hsl(var(--nb-muted))' }}>
                      ฿{unit.price_per_sqm.toLocaleString()}/m²
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {unit.available_units !== null && unit.total_units !== null && (
                    <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                      {unit.available_units} из {unit.total_units} доступно
                    </p>
                  )}
                  {avail !== 'sold_out' && (
                    <button
                      onClick={() => setLeadUnit(unit.name_ru || unit.name)}
                      className="mt-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}
                    >
                      Запросить
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox for floor plans */}
      {lightboxUrl && (
        <NbLightbox images={[lightboxUrl]} onClose={() => setLightboxUrl(null)} />
      )}

      {/* Lead form modal for specific unit */}
      {leadUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setLeadUnit(null)}>
          <div className="max-w-md w-full" onClick={e => e.stopPropagation()}>
            <NbLeadForm projectId={projectId} developerId={developerId} source={`unit_request_${leadUnit}`} />
          </div>
        </div>
      )}
    </div>
  );
}
