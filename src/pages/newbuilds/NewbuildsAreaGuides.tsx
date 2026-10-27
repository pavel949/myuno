/**
 * /newbuilds/areas — Area investment guides index
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, Star, Compass } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NewbuildsHero } from '@/components/newbuilds/NewbuildsHero';
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
      <NewbuildsHero
        icon={Compass}
        title="Районы Пхукета"
        subtitle="Инвестиционные профили районов острова. Средние цены, доходность, инфраструктура и перспективы роста."
        backTo={APP_ROUTES.NEWBUILDS}
        backLabel="Новостройки"
      />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {PHUKET_AREAS.map(area => {
            const projectCount = areaCounts[area.slug] || 0;

            return (
              <Link
                key={area.slug}
                to={`/newbuilds/areas/${area.slug}`}
                className="nb-glass overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Профиль района ${area.name_ru}`}
              >
                {/* Header gradient */}
                <div className="h-32 relative bg-gradient-to-br from-primary/10 via-card to-primary/5">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary/30" aria-hidden />
                  </div>
                  {projectCount > 0 && (
                    <span className="absolute top-3 left-3 nb-badge text-[10px] bg-primary/15 text-primary border border-primary/30">
                      {projectCount} проектов
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <h3 className="nb-display text-xl text-foreground">
                    {area.name_ru}
                  </h3>
                  <p className="text-xs text-muted-foreground">{area.name_en}</p>

                  <p className="text-sm line-clamp-2 text-muted-foreground">
                    {area.description_ru}
                  </p>

                  <div className="nb-separator" />



                  <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors block">
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
