/**
 * /newbuilds/areas/:slug — Individual area investment profile
 */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, TrendingUp, Star, Plane, Waves, Check, AlertTriangle, Building2 } from 'lucide-react';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { NbProjectCard } from '@/components/newbuilds/NbProjectCard';
import { NbLeadForm } from '@/components/newbuilds/NbLeadForm';
import { getAreaBySlug, PHUKET_AREAS } from '@/lib/config/phuketAreas';
import { useNewbuildProjects } from '@/hooks/useNewbuildProjects';
import { APP_ROUTES } from '@/lib/config/routes';
import { SEOHead, createBreadcrumbSchema } from '@/components/seo';

function isRuAreaTitle() {
  return 'Phuket Investment Guide';
}

export default function NewbuildsAreaDetail() {
  const { slug } = useParams<{ slug: string }>();
  const area = getAreaBySlug(slug || '');
  const { data: allProjects } = useNewbuildProjects();

  if (!area) {
    return (
      <NewbuildsLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="nb-display text-2xl" style={{ color: 'hsl(var(--nb-muted))' }}>Район не найден</p>
            <Link to="/newbuilds/areas" className="text-sm mt-4 inline-block" style={{ color: 'hsl(var(--nb-gold))' }}>
              ← К списку районов
            </Link>
          </div>
        </div>
      </NewbuildsLayout>
    );
  }

  // Filter projects for this area
  const areaProjects = (allProjects || []).filter(p => {
    const loc = (p.location_area || p.district || '').toLowerCase();
    return loc.includes(area.slug.replace('-', ' ')) || loc.includes(area.name_en.toLowerCase());
  });

  // Nearby areas
  const nearbyAreas = PHUKET_AREAS
    .filter(a => a.slug !== area.slug)
    .map(a => ({
      ...a,
      distance: Math.sqrt(Math.pow(a.lat - area.lat, 2) + Math.pow(a.lng - area.lng, 2)),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  const seoTitle = `${area.name_ru} (${area.name_en}) · ${isRuAreaTitle()}`;
  const seoDescription = `${area.name_ru} — район Пхукета. Средняя цена ฿${(area.avg_price_sqm / 1000).toFixed(0)}K/м², доходность ${area.avg_yield}%, ${areaProjects.length} проектов. ${area.description_ru.slice(0, 120)}`;
  const canonicalUrl = `https://myuno.app${APP_ROUTES.NEWBUILDS_AREA(area.slug)}`;
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${area.name_en}, Phuket`,
    description: seoDescription,
    url: canonicalUrl,
    geo: { '@type': 'GeoCoordinates', latitude: area.lat, longitude: area.lng },
  };
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'New Builds', url: 'https://myuno.app/newbuilds' },
    { name: 'Areas', url: 'https://myuno.app/newbuilds/areas' },
    { name: area.name_en, url: canonicalUrl },
  ]);

  return (
    <NewbuildsLayout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        image={'https://myuno.app/og-image.png'}
        url={canonicalUrl}
        jsonLd={{ '@context': 'https://schema.org', '@graph': [placeSchema, breadcrumbSchema] }}
      />
      {/* Hero */}
      <section className="relative px-4 pt-20 pb-16 nb-blueprint nb-grain overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto">
          <Link to="/newbuilds/areas" className="inline-flex items-center gap-1 text-sm mb-6 transition-colors hover:opacity-80" style={{ color: 'hsl(var(--nb-gold))' }}>
            <ChevronLeft className="w-4 h-4" /> Районы Пхукета
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <h1 className="nb-display text-4xl md:text-6xl" style={{ color: 'hsl(var(--nb-gold))' }}>
              {area.name_ru}
            </h1>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5"
                  fill={i < area.investment_rating ? 'hsl(var(--nb-gold))' : 'none'}
                  style={{ color: i < area.investment_rating ? 'hsl(var(--nb-gold))' : 'hsl(var(--nb-muted) / 0.3)' }}
                />
              ))}
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: 'hsl(var(--nb-muted))' }}>{area.name_en}</p>
          <p className="text-base max-w-3xl leading-relaxed" style={{ color: 'hsl(var(--nb-text-secondary))' }}>
            {area.description_ru}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        {/* Market stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="nb-glass p-5 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: 'hsl(var(--nb-gold))' }} />
            <p className="nb-mono text-xl font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>
              ฿{(area.avg_price_sqm / 1000).toFixed(0)}K
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>Средняя цена за м²</p>
          </div>
          <div className="nb-glass p-5 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: 'hsl(142 70% 55%)' }} />
            <p className="nb-mono text-xl font-bold" style={{ color: 'hsl(142 70% 55%)' }}>
              {area.avg_yield}%
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>Средняя доходность</p>
          </div>
          <div className="nb-glass p-5 text-center">
            <Plane className="w-5 h-5 mx-auto mb-2" style={{ color: 'hsl(var(--nb-gold))' }} />
            <p className="nb-mono text-xl font-bold" style={{ color: 'hsl(var(--nb-text))' }}>
              {area.distance_airport_km} км
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>До аэропорта</p>
          </div>
          <div className="nb-glass p-5 text-center">
            <Waves className="w-5 h-5 mx-auto mb-2" style={{ color: 'hsl(215 80% 65%)' }} />
            <p className="nb-mono text-xl font-bold" style={{ color: 'hsl(var(--nb-text))' }}>
              {area.distance_beach_km < 1 ? `${(area.distance_beach_km * 1000).toFixed(0)}м` : `${area.distance_beach_km}км`}
            </p>
            <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>До пляжа</p>
          </div>
        </div>

        {/* Highlights */}
        <div>
          <p className="nb-label mb-4">ОСОБЕННОСТИ РАЙОНА</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {area.highlights_ru.map(h => (
              <div key={h} className="nb-glass p-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(var(--nb-gold))' }} />
                <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{h}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pros & Cons */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="nb-glass p-6">
            <p className="nb-label mb-4">ПРЕИМУЩЕСТВА</p>
            <div className="space-y-3">
              {area.pros_ru.map(pro => (
                <div key={pro} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(142 70% 55%)' }} />
                  <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{pro}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="nb-glass p-6">
            <p className="nb-label mb-4">ОГРАНИЧЕНИЯ</p>
            <div className="space-y-3">
              {area.cons_ru.map(con => (
                <div key={con} className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'hsl(38 92% 60%)' }} />
                  <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>{con}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects in area */}
        {areaProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="nb-label">ПРОЕКТЫ В РАЙОНЕ {area.name_en.toUpperCase()}</p>
              <span className="nb-mono text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>{areaProjects.length} проектов</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {areaProjects.map(p => (
                <NbProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}

        {areaProjects.length === 0 && (
          <div className="nb-glass p-8 text-center">
            <Building2 className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--nb-muted))' }} />
            <p className="nb-display text-lg" style={{ color: 'hsl(var(--nb-muted))' }}>Пока нет проектов в этом районе</p>
            <p className="text-sm mt-2" style={{ color: 'hsl(var(--nb-muted))' }}>Оставьте заявку, и мы найдём варианты для вас</p>
          </div>
        )}

        {/* Lead form */}
        <div className="nb-separator" />
        <div className="max-w-md mx-auto">
          <div className="text-center mb-4">
            <h3 className="nb-display text-xl" style={{ color: 'hsl(var(--nb-text))' }}>
              Инвестировать в {area.name_ru}?
            </h3>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--nb-muted))' }}>
              Получите персональную подборку проектов в этом районе
            </p>
          </div>
          <NbLeadForm source={`area_guide_${area.slug}`} />
        </div>

        {/* Nearby areas */}
        <div>
          <p className="nb-label mb-4">БЛИЖАЙШИЕ РАЙОНЫ</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {nearbyAreas.map(na => (
              <Link key={na.slug} to={`/newbuilds/areas/${na.slug}`} className="nb-glass p-4 flex items-center gap-3 group hover:border-[hsl(var(--nb-gold)/0.5)] transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'hsl(var(--nb-gold) / 0.1)' }}>
                  <MapPin className="w-5 h-5" style={{ color: 'hsl(var(--nb-gold))' }} />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium" style={{ color: 'hsl(var(--nb-text))' }}>{na.name_ru}</h4>
                  <p className="text-xs" style={{ color: 'hsl(var(--nb-muted))' }}>
                    ฿{(na.avg_price_sqm / 1000).toFixed(0)}K/м² · {na.avg_yield}% доходность
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </NewbuildsLayout>
  );
}
