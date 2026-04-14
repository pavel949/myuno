/**
 * /newbuilds/areas — Area investment guides index
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, MapPin, TrendingUp, Star } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { PHUKET_AREAS } from '@/lib/config/phuketAreas';
import { useNewbuildProjects } from '@/hooks/useNewbuildProjects';
import { APP_ROUTES } from '@/lib/config/routes';

export default function NewbuildsAreaGuides() {
  const { data: projects } = useNewbuildProjects();

  // Count projects per area
  const areaCounts: Record<string, number> = {};
  (projects || []).forEach(p => {
    const area = (p.location_area || p.district || '').toLowerCase().replace(/\s+/g, '-');
    PHUKET_AREAS.forEach(a => {
      if (area.includes(a.slug) || a.name_en.toLowerCase() === (p.location_area || '').toLowerCase()) {
        areaCounts[a.slug] = (areaCounts[a.slug] || 0) + 1;
      }
    });
  });

  return (
    <NewbuildsLayout>
      <section className="relative px-4 pt-20 pb-12 nb-blueprint nb-grain overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <Link to={APP_ROUTES.NEWBUILDS} className="inline-flex items-center gap-1 text-sm mb-4 transition-colors hover:opacity-80" style={{ color: 'hsl(var(--nb-gold))' }}>
            <ChevronLeft className="w-4 h-4" /> Новостройки
          </Link>
          <h1 className="nb-display text-3xl md:text-5xl" style={{ color: 'hsl(var(--nb-gold))' }}>
            Районы Пхукета
          </h1>
          <p className="mt-2 max-w-2xl" style={{ color: 'hsl(var(--nb-muted))' }}>
            Инвестиционные профили районов острова. Средние цены, доходность, инфраструктура и перспективы роста.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PHUKET_AREAS.map(area => {
            const projectCount = areaCounts[area.slug] || 0;

            return (
              <Link
                key={area.slug}
                to={`/newbuilds/areas/${area.slug}`}
                className="nb-glass overflow-hidden group"
              >
                {/* Header gradient */}
                <div className="h-32 relative" style={{ background: `linear-gradient(135deg, hsl(var(--nb-surface)), hsl(var(--nb-card)))` }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-8 h-8" style={{ color: 'hsl(var(--nb-gold) / 0.3)' }} />
                  </div>
                  {/* Rating stars */}
                  <div className="absolute top-3 right-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5"
                        fill={i < area.investment_rating ? 'hsl(var(--nb-gold))' : 'none'}
                        style={{ color: i < area.investment_rating ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted) / 0.3)' }}
                      />
                    ))}
                  </div>
                  {projectCount > 0 && (
                    <span className="absolute top-3 left-3 nb-badge text-[10px]" style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}>
                      {projectCount} проектов
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="nb-display text-xl" style={{ color: 'hsl(var(--nb-text))' }}>
                    {area.name_ru}
                  </h3>
                  <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>{area.name_en}</p>

                  <p className="text-sm line-clamp-2" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                    {area.description_ru}
                  </p>

                  <div className="nb-separator" />

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <p className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>
                        ฿{(area.avg_price_sqm / 1000).toFixed(0)}K
                      </p>
                      <p className="text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>за м²</p>
                    </div>
                    <div className="text-center border-x" style={{ borderColor: 'hsl(var(--nb-gold) / 0.15)' }}>
                      <p className="nb-mono text-sm font-bold flex items-center justify-center gap-1" style={{ color: 'hsl(142 70% 55%)' }}>
                        <TrendingUp className="w-3 h-3" /> {area.avg_yield}%
                      </p>
                      <p className="text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>доходность</p>
                    </div>
                    <div className="text-center">
                      <p className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-text))' }}>
                        {area.distance_beach_km < 1 ? `${(area.distance_beach_km * 1000).toFixed(0)}м` : `${area.distance_beach_km}км`}
                      </p>
                      <p className="text-[10px]" style={{ color: 'hsl(var(--nb-muted))' }}>до пляжа</p>
                    </div>
                  </div>

                  <span className="text-xs font-medium group-hover:text-[hsl(var(--nb-gold))] transition-colors block" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
                    Подробнее о районе →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </NewbuildsLayout>
  );
}
