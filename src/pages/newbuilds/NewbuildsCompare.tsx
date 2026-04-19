/**
 * /newbuilds/compare — Side-by-side project comparison
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Building2, Calendar, Layers, Award, X } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { useNbCompare } from '@/components/newbuilds/NbCompareProvider';
import { NbPriceDisplay } from '@/components/newbuilds/NbPriceDisplay';
import { NbConstructionProgress } from '@/components/newbuilds/NbConstructionProgress';
import { NbProjectStatusBadge } from '@/components/newbuilds/NbProjectStatusBadge';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

const unitTypeLabels: Record<string, string> = {
  studio: 'Студия', '1br': '1 BR', '2br': '2 BR', '3br': '3 BR', penthouse: 'Пентхаус', villa: 'Вилла',
};

export default function NewbuildsCompare() {
  const { items, remove, clear } = useNbCompare();

  if (items.length === 0) {
    return (
      <NewbuildsLayout>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center space-y-4">
            <p className="nb-display text-2xl text-foreground">Нет проектов для сравнения</p>
            <p className="text-sm text-muted-foreground">
              Добавьте проекты к сравнению из каталога
            </p>
            <Link
              to={APP_ROUTES.OFFPLAN}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              К каталогу
            </Link>
          </div>
        </div>
      </NewbuildsLayout>
    );
  }

  const rows: { label: string; render: (item: typeof items[0]) => React.ReactNode }[] = [
    {
      label: 'Фото',
      render: item => item.cover_image ? (
        <img src={item.cover_image} alt="" className="w-full h-32 rounded-lg object-cover" />
      ) : <div className="w-full h-32 rounded-lg bg-muted" />,
    },
    {
      label: 'Статус',
      render: item => <NbProjectStatusBadge status={item.project_status || 'under_construction'} />,
    },
    {
      label: 'Цена',
      render: item => <NbPriceDisplay price={item.price_from || null} priceTo={item.price_to} size="md" />,
    },
    {
      label: 'Район',
      render: item => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden />
          {item.location_area || '—'}
        </span>
      ),
    },
    {
      label: 'Девелопер',
      render: item => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" aria-hidden />
          {item.developer_name || '—'}
        </span>
      ),
    },
    {
      label: 'Прогресс',
      render: item => <NbConstructionProgress progress={item.construction_progress || 0} completionDate={item.completion_date} size="sm" />,
    },
    {
      label: 'Сдача',
      render: item => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <Calendar className="w-3.5 h-3.5 text-primary" aria-hidden />
          {item.completion_date ? new Date(item.completion_date).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      label: 'Юнитов',
      render: item => (
        <span className="flex items-center gap-1 text-sm text-foreground">
          <Layers className="w-3.5 h-3.5 text-primary" aria-hidden />
          {item.total_units || '—'}
        </span>
      ),
    },
    {
      label: 'Типы юнитов',
      render: item => (
        <div className="flex flex-wrap gap-1">
          {(item.unit_types || []).map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {unitTypeLabels[t] || t}
            </span>
          ))}
          {(!item.unit_types || item.unit_types.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
    {
      label: 'myUNO Score',
      render: item => item.muuno_score ? (
        <span className="flex items-center gap-1 nb-mono text-sm font-bold text-primary">
          <Award className="w-3.5 h-3.5" aria-hidden /> {item.muuno_score}
        </span>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      label: 'Удобства',
      render: item => (
        <div className="flex flex-wrap gap-1">
          {(item.amenities || []).slice(0, 5).map(a => (
            <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {a}
            </span>
          ))}
          {(!item.amenities || item.amenities.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      ),
    },
  ];

  return (
    <NewbuildsLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
          <div>
            <Link
              to={APP_ROUTES.OFFPLAN}
              className="inline-flex items-center gap-1 text-sm mb-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden /> Каталог
            </Link>
            <h1 className="nb-display text-2xl md:text-3xl text-foreground font-semibold">Сравнение проектов</h1>
          </div>
          <button
            onClick={clear}
            className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground border border-border hover:text-foreground hover:border-foreground/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Очистить
          </button>
        </div>

        {/* Comparison table */}
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full" style={{ minWidth: items.length * 250 + 150 }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 w-[150px]" />
                {items.map(item => (
                  <th key={item.id} className="text-left py-3 px-3 min-w-[220px]">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={APP_ROUTES.OFFPLAN_DETAIL(item.id)}
                        className="nb-display text-base text-foreground hover:text-primary transition-colors"
                      >
                        {item.name_ru || item.name_en}
                      </Link>
                      <button
                        onClick={() => remove(item.id)}
                        className="p-1 flex-shrink-0 text-muted-foreground hover:text-foreground rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Убрать ${item.name_ru || item.name_en} из сравнения`}
                      >
                        <X className="w-4 h-4" aria-hidden />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={row.label}
                  className={cn('border-b border-border/60', idx % 2 === 1 && 'bg-muted/30')}
                >
                  <td className="py-3 pr-4 text-xs font-medium align-top text-muted-foreground">
                    {row.label}
                  </td>
                  {items.map(item => (
                    <td key={item.id} className="py-3 px-3 align-top">
                      {row.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk lead form */}
        <div className="nb-separator my-10" />
        <div className="max-w-md mx-auto">
          <div className="text-center mb-4">
            <h3 className="nb-display text-xl text-foreground">Запросить информацию</h3>
            <p className="text-sm mt-1 text-muted-foreground">По всем {items.length} проектам одним запросом</p>
          </div>
          <NbLeadForm source={`compare_${items.map(i => i.id).join(',')}`} />
        </div>
      </div>
    </NewbuildsLayout>
  );
}
