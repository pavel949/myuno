import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { NbProjectStatusBadge } from './NbProjectStatusBadge';
import { NbConstructionProgress } from './NbConstructionProgress';
import { NbPriceDisplay } from './NbPriceDisplay';
import { APP_ROUTES } from '@/lib/config/routes';

export interface NbProjectCardData {
  id: string;
  slug?: string | null;
  name_en: string;
  name_ru?: string | null;
  cover_image?: string | null;
  location_area?: string | null;
  district?: string | null;
  price_from?: number | null;
  price_to?: number | null;
  project_status?: string;
  construction_progress?: number;
  completion_date?: string | null;
  is_featured?: boolean;
  developer_name?: string | null;
  unit_types?: string[] | null;
  units_available?: number;
  total_units?: number;
}

interface Props {
  project: NbProjectCardData;
  variant?: 'compact' | 'featured';
}

const unitTypeLabels: Record<string, string> = {
  studio: 'Студия',
  '1br': '1 BR',
  '2br': '2 BR',
  '3br': '3 BR',
  penthouse: 'Пентхаус',
  villa: 'Вилла',
};

// Projects with dedicated landing pages — link there instead of generic detail
const CUSTOM_LANDING: Record<string, string> = {
  peylaa: '/peylaa',
};

export function NbProjectCard({ project, variant = 'compact' }: Props) {
  const slug = project.slug || project.id;
  const href = (slug && CUSTOM_LANDING[slug]) || APP_ROUTES.OFFPLAN_DETAIL(project.id);
  const img = project.cover_image || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80';

  if (variant === 'featured') {
    return (
      <Link to={href} className="nb-glass group flex overflow-hidden h-[380px] relative">
        {/* Image left */}
        <div className="w-[40%] relative overflow-hidden">
          <img src={img} alt={project.name_en} className="w-full h-full object-cover transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/60" />
        </div>
        
        {/* Content right */}
        <div className="flex-1 p-6 flex flex-col justify-between relative">
          {project.is_featured && (
            <span className="nb-badge absolute top-4 right-4" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}>
              FEATURED
            </span>
          )}
          
          <div>
            {project.developer_name && (
              <p className="nb-label mb-2">{project.developer_name}</p>
            )}
            <h3 className="nb-display text-2xl mb-2" style={{ color: 'hsl(var(--nb-text))' }}>
              {project.name_ru || project.name_en}
            </h3>
            {(project.location_area || project.district) && (
              <div className="flex items-center gap-1.5 mb-4" style={{ color: 'hsl(var(--nb-muted))' }}>
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-sm">{project.location_area || project.district}</span>
              </div>
            )}
            <NbPriceDisplay price={project.price_from || null} priceTo={project.price_to} size="lg" />
          </div>

          <div className="space-y-3">
            {project.unit_types && project.unit_types.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.unit_types.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-none" style={{ background: 'hsl(var(--nb-gold) / 0.1)', color: 'hsl(var(--nb-gold))' }}>
                    {unitTypeLabels[t] || t}
                  </span>
                ))}
              </div>
            )}
            <NbConstructionProgress 
              progress={project.construction_progress || 0} 
              completionDate={project.completion_date} 
            />
            <span className="text-sm font-medium group-hover:text-[hsl(var(--nb-gold))] transition-colors" style={{ color: 'hsl(var(--nb-text))' }}>
              Подробнее →
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Compact card (grid)
  return (
    <Link to={href} className="nb-glass group flex flex-col overflow-hidden">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={img} alt={project.name_en} className="w-full h-full object-cover transition-transform duration-500" />
        <div className="absolute top-3 left-3 z-10">
          <NbProjectStatusBadge status={project.project_status || 'under_construction'} />
        </div>
        {project.is_featured && (
          <span className="absolute top-3 right-3 z-10 nb-badge" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}>
            ★
          </span>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {project.developer_name && (
          <p className="nb-label text-[10px]">{project.developer_name}</p>
        )}
        <h3 className="nb-display text-base leading-tight" style={{ color: 'hsl(var(--nb-text))' }}>
          {project.name_ru || project.name_en}
        </h3>
        {(project.location_area || project.district) && (
          <div className="flex items-center gap-1" style={{ color: 'hsl(var(--nb-muted))' }}>
            <MapPin className="w-3 h-3" />
            <span className="text-xs">{project.location_area || project.district}</span>
          </div>
        )}
        <NbPriceDisplay price={project.price_from || null} size="md" />
        
        {project.unit_types && project.unit_types.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.unit_types.slice(0, 3).map(t => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-none" style={{ background: 'hsl(var(--nb-gold) / 0.08)', color: 'hsl(var(--nb-gold) / 0.8)' }}>
                {unitTypeLabels[t] || t}
              </span>
            ))}
          </div>
        )}
        
        <NbConstructionProgress 
          progress={project.construction_progress || 0} 
          completionDate={project.completion_date}
          size="sm"
        />
        
        <span className="text-xs font-medium mt-auto group-hover:text-[hsl(var(--nb-gold))] transition-colors" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
          Смотреть проект →
        </span>
      </div>
    </Link>
  );
}
