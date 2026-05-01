/**
 * @file AreaLandingPage.tsx
 * @description Public area landing at `/area/:slug`.
 *
 * Renders area profile (stats, pros/cons), seeded listings (rentals + offplan
 * filtered by district), and cross-links back to live persona / cluster pages.
 *
 * Routing contract:
 *  - Unknown slug → 404 (NotFound).
 *  - All cross-link slugs are pre-filtered against LIVE_PERSONA_SLUGS /
 *    LIVE_CLUSTER_SLUGS in areaLandings.ts so links never resolve to a 404.
 */
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle,
  Building2,
  Check,
  Map as MapIcon,
  MapPin,
  Plane,
  Star,
  TrendingUp,
  Waves,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageShell } from '@/components/page/PageShell';
import { Button } from '@/components/ui/button';
import NotFound from '@/pages/NotFound';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  AREA_LANDINGS,
  findAreaLandingBySlug,
} from '@/content/landings/areaLandings';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import { CLUSTER_LANDINGS } from '@/content/landings/clusterLandings';
import { useProperties } from '@/hooks/useProperties';
import { useOffplanProjects } from '@/hooks/useOffplanProjects';
import {
  surfaceFromProperty,
  surfaceFromOffplanProject,
  type UnifiedListingSurface,
} from '@/lib/real-estate/listingViewModel';
import {
  buildAreaOgUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
} from '@/lib/seo/ogImage';

const SEED_LISTING_LIMIT = 6;

interface SeedCardProps {
  surface: UnifiedListingSurface;
  isRu: boolean;
}

const SeedCard = ({ surface, isRu }: SeedCardProps) => {
  const title = isRu ? surface.titleRu : surface.titleEn;
  const priceLine =
    surface.priceHintThb != null
      ? `฿${surface.priceHintThb.toLocaleString('en-US')}${
          surface.priceMode === 'per_night' ? (isRu ? ' / ночь' : ' / night') : ''
        }`
      : null;
  return (
    <Link
      to={surface.href}
      className="group block overflow-hidden rounded-none border border-border bg-card transition-colors hover:border-primary/60"
    >
      {surface.coverImageUrl ? (
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={surface.coverImageUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform "
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
          <Building2 className="h-8 w-8 text-muted-foreground/40" aria-hidden />
        </div>
      )}
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{title}</h3>
        {surface.locationLine ? (
          <p className="mt-1 text-xs text-muted-foreground">{surface.locationLine}</p>
        ) : null}
        {priceLine ? (
          <p className="mt-2 text-sm font-semibold text-foreground">{priceLine}</p>
        ) : null}
      </div>
    </Link>
  );
};

const AreaLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const landing = slug ? findAreaLandingBySlug(slug) : undefined;

  // Hooks must run unconditionally — pass empty district when landing missing.
  const districtFilter = landing?.area.name_en ?? '';
  const { data: rentalProps = [] } = useProperties(
    districtFilter ? { district: districtFilter, listingType: 'rent' } : {},
    SEED_LISTING_LIMIT,
  );
  const { data: offplanProjects = [] } = useOffplanProjects(
    districtFilter ? { district: districtFilter } : undefined,
  );

  const offplanSurfaces = useMemo(
    () => offplanProjects.slice(0, SEED_LISTING_LIMIT).map(surfaceFromOffplanProject),
    [offplanProjects],
  );
  const rentalSurfaces = useMemo(
    () => rentalProps.slice(0, SEED_LISTING_LIMIT).map((p) => surfaceFromProperty(p, 'rent')),
    [rentalProps],
  );

  const nearbyAreas = useMemo(() => {
    if (!landing) return [];
    const me = landing.area;
    return AREA_LANDINGS.filter((l) => l.slug !== me.slug)
      .map((l) => ({
        ...l,
        distance: Math.hypot(l.area.lat - me.lat, l.area.lng - me.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [landing]);

  if (!landing) return <NotFound />;

  const { area, seo, relatedPersonaSlugs, relatedClusterSlugs } = landing;
  const name = isRu ? area.name_ru : area.name_en;
  const description = isRu ? area.description_ru : area.description_en;
  const highlights = isRu ? area.highlights_ru : area.highlights_en;
  const pros = isRu ? area.pros_ru : area.pros_en;
  const cons = isRu ? area.cons_ru : area.cons_en;

  const beachLabel =
    area.distance_beach_km < 1
      ? `${(area.distance_beach_km * 1000).toFixed(0)} ${isRu ? 'м' : 'm'}`
      : `${area.distance_beach_km} ${isRu ? 'км' : 'km'}`;

  const districtParam = encodeURIComponent(area.name_en);
  const rentSearchHref = `/property/browse?district=${districtParam}`;
  const offplanSearchHref = `/property/offplan?district=${districtParam}`;
  // Both map deep-links share the canonical `/property/map?district=…` entry
  // (PropertyMap reads the param, filters server-side, and recenters on it).
  const rentMapHref = `/property/map?district=${districtParam}&listingType=rent`;
  const offplanMapHref = `/property/map?district=${districtParam}&listingType=offplan`;

  // Resolve cross-link labels from canonical landing configs.
  const personaLinks = relatedPersonaSlugs
    .map((s) => PERSONA_LANDINGS.find((p) => p.slug === s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ slug: p.slug, label: isRu ? p.h1.ru : p.h1.en }));
  const clusterLinks = relatedClusterSlugs
    .map((s) => CLUSTER_LANDINGS.find((c) => c.slug === s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .map((c) => ({ slug: c.slug, label: isRu ? c.h1.ru : c.h1.en }));

  const canonicalUrl = `https://myuno.app${seo.canonicalPath}`;
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isRu ? 'Главная' : 'Home', item: 'https://myuno.app/' },
      { '@type': 'ListItem', position: 2, name: isRu ? 'Районы' : 'Areas', item: 'https://myuno.app/area' },
      { '@type': 'ListItem', position: 3, name: area.name_en, item: canonicalUrl },
    ],
  };
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${area.name_en}, Phuket`,
    description: seo.metaDescription[language as 'ru' | 'en'],
    url: canonicalUrl,
    geo: { '@type': 'GeoCoordinates', latitude: area.lat, longitude: area.lng },
  };

  return (
    <AppLayout>
      <Helmet>
        <html lang={language} />
        <title>{seo.metaTitle[language as 'ru' | 'en']}</title>
        <meta name="description" content={seo.metaDescription[language as 'ru' | 'en']} />
        <link rel="canonical" href={canonicalUrl} />
        {seo.hreflangAlternates.map((alt) => (
          <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.href} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
        {(() => {
          const og = buildAreaOgUrl({
            area: area.slug,
            areaName: isRu ? area.name_ru : area.name_en,
            lang: isRu ? 'ru' : 'en',
          });
          const ogAlt = `${isRu ? area.name_ru : area.name_en} — myUNO`;
          return (
            <>
              <link rel="preload" as="image" href={og} type={OG_IMAGE_TYPE} />
              <meta property="og:type" content="website" />
              <meta property="og:title" content={seo.metaTitle[language as 'ru' | 'en']} />
              <meta property="og:description" content={seo.metaDescription[language as 'ru' | 'en']} />
              <meta property="og:url" content={canonicalUrl} />
              <meta property="og:image" content={og} />
              <meta property="og:image:secure_url" content={og} />
              <meta property="og:image:type" content={OG_IMAGE_TYPE} />
              <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
              <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
              <meta property="og:image:alt" content={ogAlt} />
              <meta property="og:locale" content={isRu ? 'ru_RU' : 'en_US'} />
              <meta property="og:site_name" content="myUNO" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content={seo.metaTitle[language as 'ru' | 'en']} />
              <meta name="twitter:description" content={seo.metaDescription[language as 'ru' | 'en']} />
              <meta name="twitter:image" content={og} />
              <meta name="twitter:image:alt" content={ogAlt} />
            </>
          );
        })()}
        <script type="application/ld+json">{JSON.stringify(placeSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Helmet>

      <PageShell width="wide">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <Link to="/area" className="hover:text-foreground">
            ← {isRu ? 'Все районы Пхукета' : 'All Phuket areas'}
          </Link>
        </nav>

        {/* Hero */}
        <header className="mb-8 border-b border-border pb-6">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {name}
            </h1>
            <div
              className="flex gap-0.5"
              aria-label={`${area.investment_rating}/5`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < area.investment_rating
                      ? 'h-4 w-4 fill-primary text-primary'
                      : 'h-4 w-4 text-muted-foreground/40'
                  }
                  aria-hidden
                />
              ))}
            </div>
          </div>
          {isRu ? <p className="text-xs text-muted-foreground">{area.name_en}</p> : null}
          <p className="mt-3 max-w-3xl text-base text-foreground/90">{description}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={rentSearchHref}>
                {isRu ? `Аренда в ${name}` : `Rentals in ${name}`}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={offplanSearchHref}>
                {isRu ? 'Новостройки района' : 'Off-plan in this area'}
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="gap-2">
              <Link
                to={rentMapHref}
                aria-label={
                  isRu
                    ? `Открыть карту аренды в районе ${name}`
                    : `Open rental map for ${name}`
                }
              >
                <MapIcon className="h-4 w-4" aria-hidden />
                {isRu ? 'Открыть на карте' : 'Open on map'}
              </Link>
            </Button>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-none border border-border bg-card p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-4 w-4 text-primary" aria-hidden />
            <p className="text-lg font-semibold text-foreground">
              ฿{(area.avg_price_sqm / 1000).toFixed(0)}K
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isRu ? 'Средняя цена за м²' : 'Average price / sqm'}
            </p>
          </div>
          <div className="rounded-none border border-border bg-card p-4 text-center">
            <TrendingUp className="mx-auto mb-2 h-4 w-4 text-primary" aria-hidden />
            <p className="text-lg font-semibold text-foreground">{area.avg_yield}%</p>
            <p className="text-[11px] text-muted-foreground">
              {isRu ? 'Средняя доходность' : 'Average yield'}
            </p>
          </div>
          <div className="rounded-none border border-border bg-card p-4 text-center">
            <Plane className="mx-auto mb-2 h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="text-lg font-semibold text-foreground">
              {area.distance_airport_km} {isRu ? 'км' : 'km'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isRu ? 'До аэропорта' : 'To the airport'}
            </p>
          </div>
          <div className="rounded-none border border-border bg-card p-4 text-center">
            <Waves className="mx-auto mb-2 h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="text-lg font-semibold text-foreground">{beachLabel}</p>
            <p className="text-[11px] text-muted-foreground">
              {isRu ? 'До пляжа' : 'To the beach'}
            </p>
          </div>
        </section>

        {/* Highlights */}
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            {isRu ? 'Особенности района' : 'Area highlights'}
          </h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((h) => (
              <li
                key={h}
                className="flex items-center gap-2 rounded-none border border-border bg-card p-3 text-sm text-foreground"
              >
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Pros & cons */}
        <section className="mb-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-none border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Преимущества' : 'Pros'}
            </h3>
            <ul className="space-y-2">
              {pros.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-none border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {isRu ? 'Ограничения' : 'Trade-offs'}
            </h3>
            <ul className="space-y-2">
              {cons.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-foreground">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Rental listings */}
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              {isRu ? `Аренда в ${name}` : `Rentals in ${name}`}
            </h2>
            <div className="flex shrink-0 items-center gap-3 text-sm font-medium">
              <Link
                to={rentMapHref}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <MapIcon className="h-3.5 w-3.5" aria-hidden />
                {isRu ? 'На карте' : 'Map'}
              </Link>
              <Link to={rentSearchHref} className="text-primary hover:underline">
                {isRu ? 'Все объекты →' : 'View all →'}
              </Link>
            </div>
          </div>
          {rentalSurfaces.length === 0 ? (
            <p className="rounded-none border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {isRu
                ? 'Пока нет активных объектов. Откройте поиск или загляните позже.'
                : 'No active listings yet. Try the search or check back later.'}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {rentalSurfaces.map((s) => (
                <li key={s.id}>
                  <SeedCard surface={s} isRu={isRu} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Off-plan listings */}
        <section className="mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              {isRu ? 'Новостройки района' : 'Off-plan in this area'}
            </h2>
            <div className="flex shrink-0 items-center gap-3 text-sm font-medium">
              <Link
                to={offplanMapHref}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <MapIcon className="h-3.5 w-3.5" aria-hidden />
                {isRu ? 'На карте' : 'Map'}
              </Link>
              <Link to={offplanSearchHref} className="text-primary hover:underline">
                {isRu ? 'Все проекты →' : 'View all →'}
              </Link>
            </div>
          </div>
          {offplanSurfaces.length === 0 ? (
            <p className="rounded-none border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {isRu
                ? 'Каталог новостроек района обновляется. Напишите нам — подберём вручную.'
                : 'The off-plan catalogue for this area is being updated. Reach out and we will source manually.'}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {offplanSurfaces.map((s) => (
                <li key={s.id}>
                  <SeedCard surface={s} isRu={isRu} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Cross-links: personas + clusters */}
        {(personaLinks.length > 0 || clusterLinks.length > 0) && (
          <section className="mb-10 rounded-none border border-border bg-card p-5">
            {personaLinks.length > 0 && (
              <div className="mb-5">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {isRu ? 'Подходит для' : 'Best for'}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {personaLinks.map((p) => (
                    <li key={p.slug}>
                      <Link
                        to={`/for/${p.slug}`}
                        className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary"
                      >
                        {p.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {clusterLinks.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {isRu ? 'Жизненные сценарии' : 'Life scenarios'}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {clusterLinks.map((c) => (
                    <li key={c.slug}>
                      <Link
                        to={`/cluster/${c.slug}`}
                        className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:text-primary"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Nearby areas */}
        {nearbyAreas.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              {isRu ? 'Ближайшие районы' : 'Nearby areas'}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {nearbyAreas.map((na) => (
                <li key={na.slug}>
                  <Link
                    to={`/area/${na.slug}`}
                    className="flex items-center gap-3 rounded-none border border-border bg-card p-4 transition-colors hover:border-primary/60"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10">
                      <MapPin className="h-5 w-5 text-primary" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">
                        {isRu ? na.area.name_ru : na.area.name_en}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        ฿{(na.area.avg_price_sqm / 1000).toFixed(0)}K/
                        {isRu ? 'м²' : 'sqm'} · {na.area.avg_yield}%
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PageShell>
    </AppLayout>
  );
};

export default AreaLandingPage;
