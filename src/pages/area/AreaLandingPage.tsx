import { ProjectStartingPrice } from '@/components/newbuilds/ProjectStartingPrice';
import { HomeServiceGallery } from '@/components/home/HomeCatalogGalleries';
import '@/styles/premium-public.css';
import { homeAreaCover } from '@/components/home/homeAreaCovers';
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
import { useMemo, useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { publicJourneyState, readPublicJourneyOrigin, publicJourneyReturn } from '@/lib/real-estate/publicJourney';
import { propertyDetailHref } from '@/lib/real-estate/propertyDetailIntent';
import { Helmet } from 'react-helmet-async';
import {
  AlertTriangle,
  Building2,
  Check,
  Map as MapIcon,
  MapPin,
  Plane,
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
  const location = useLocation();
  const origin = readPublicJourneyOrigin(location.state);
  const guestSearch = origin ? new URL(origin.href, 'https://myuno.app').search : location.search;
  const href = surface.kind === 'property_listing' ? propertyDetailHref(surface.id, surface.intent === 'sale' ? 'buy' : 'rent', guestSearch) : surface.href;
  const title = isRu ? surface.titleRu : surface.titleEn;
  const priceLine =
    surface.priceHintThb != null
      ? `฿${surface.priceHintThb.toLocaleString('en-US')}${
          ({ per_night: isRu ? ' / ночь' : ' / night', per_week: isRu ? ' / нед.' : ' / week', per_month: isRu ? ' / мес.' : ' / month', per_year: isRu ? ' / год' : ' / year' } as Record<string, string>)[surface.priceMode] ?? ''
        }`
      : null;
  return (
    <Link
      to={href}
      state={publicJourneyState(location)}
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
        {surface.kind === 'offplan_project' ? <ProjectStartingPrice price={surface.priceHintThb} className="mt-2 text-sm font-semibold" /> : priceLine ? (
          <p className="mt-2 text-sm font-semibold text-foreground">{priceLine}</p>
        ) : null}
      </div>
    </Link>
  );
};

const AreaLandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const journeyOrigin = readPublicJourneyOrigin(location.state);
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [housingMode, setHousingMode] = useState<'rent' | 'buy' | 'projects'>('rent');

  const landing = slug ? findAreaLandingBySlug(slug) : undefined;

  // Hooks must run unconditionally — pass empty district when landing missing.
  const districtFilter = landing?.area.name_en ?? '';
  const rentals = useProperties(
    districtFilter ? { district: districtFilter, listingType: 'rent' } : {},
    SEED_LISTING_LIMIT,
  );
  const projects = useOffplanProjects(
    districtFilter ? { district: districtFilter } : undefined,
  );

  const purchases = useProperties(districtFilter ? { district: districtFilter, listingType: 'sale' } : {}, SEED_LISTING_LIMIT);
  const rentalProps = rentals.data ?? [];
  const offplanProjects = projects.data ?? [];
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

  const purchaseSurfaces = (purchases.data ?? []).slice(0, SEED_LISTING_LIMIT).map(p => surfaceFromProperty(p, 'buy'));
  const housing = housingMode === 'rent' ? rentals : housingMode === 'buy' ? purchases : projects;
  const surfaces = housingMode === 'rent' ? rentalSurfaces : housingMode === 'buy' ? purchaseSurfaces : offplanSurfaces;
  if (!landing) return <NotFound />;

  const { area, seo, relatedPersonaSlugs, relatedClusterSlugs } = landing;
  const name = isRu ? area.name_ru : area.name_en;
  const description = isRu ? area.description_ru : area.description_en;
  const highlights = isRu ? area.highlights_ru : area.highlights_en;
  const cons = isRu ? area.cons_ru : area.cons_en;

  const districtParam = encodeURIComponent(area.name_en);
  const sourceCriteria = journeyOrigin ? new URL(journeyOrigin.href, 'https://myuno.app').search : location.search;
  const rentCriteria = new URLSearchParams(propertyDetailHref('', 'rent', sourceCriteria).split('?')[1]);
  rentCriteria.set('district', area.name_en);
  const rentSearchHref = `/property/browse?${rentCriteria.toString()}`;
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

  const canonicalUrl = `https://www.myuno.app${seo.canonicalPath}`;
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: isRu ? 'Главная' : 'Home', item: 'https://www.myuno.app/' },
      { '@type': 'ListItem', position: 2, name: isRu ? 'Районы' : 'Areas', item: 'https://www.myuno.app/area' },
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

      <PageShell width="full" className="premium-area">
        {journeyOrigin && (
          <Button variant="ghost" className="mb-3 min-h-11" onClick={() => { const plan = publicJourneyReturn(location, rentSearchHref); if ('delta' in plan) navigate(plan.delta); else navigate(plan.href, { replace: plan.replace, state: plan.state }); }}>
            ← {isRu ? 'Вернуться к объекту' : 'Back to property'}
          </Button>
        )}
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <Link to="/area" className="hover:text-foreground">
            ← {isRu ? 'Все районы Пхукета' : 'All Phuket areas'}
          </Link>
        </nav>

        {/* Hero */}
        <header className="premium-area-hero"><div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {name}
            </h1>
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
        </div><div className="premium-area-cover"><img src={homeAreaCover(area.slug).src} alt="" /><span>{isRu ? 'Иллюстрация района' : 'Area illustration'}</span></div></header>

        <p className="mb-5 text-sm text-muted-foreground">
          {isRu ? 'Редакционный путеводитель. Актуальные цены и доходность требуют отдельной проверки; расстояния ориентировочные.' : 'Editorial area guide. Current prices and yields require separate verification; distances are approximate.'}
        </p>
        <section id="area-homes" aria-labelledby="area-homes-title">
          <div className="home-section-heading"><h2 id="area-homes-title">{isRu ? `Жильё в ${name}` : `Homes in ${name}`}</h2><Link className="home-text-link" to={housingMode === 'projects' ? offplanSearchHref : housingMode === 'buy' ? rentSearchHref.replace('mode=rent', 'mode=buy') : rentSearchHref}>{isRu ? 'Весь каталог района' : 'Explore the area catalogue'} →</Link></div>
          <div className="premium-offer-choices" role="group" aria-label={isRu ? 'Жильё в районе' : 'Area homes'}>{(['rent', 'buy', 'projects'] as const).map(mode => <button type="button" key={mode} aria-pressed={housingMode === mode} onClick={() => setHousingMode(mode)}>{mode === 'rent' ? (isRu ? 'Аренда' : 'Rent') : mode === 'buy' ? (isRu ? 'Покупка' : 'Buy') : (isRu ? 'Новостройки' : 'New developments')}</button>)}</div>
          {housing.isLoading ? <p role="status">{isRu ? 'Загружаем предложения…' : 'Loading homes…'}</p> : housing.isError ? <div role="alert"><p>{isRu ? 'Не удалось загрузить предложения.' : 'Could not load homes.'}</p><Button variant="outline" onClick={() => housing.refetch()}>{isRu ? 'Повторить' : 'Try again'}</Button></div> : surfaces.length ? <div className="premium-area-homes">{surfaces.map(surface => <SeedCard key={surface.id} surface={surface} isRu={isRu} />)}</div> : <p>{isRu ? 'Опубликованных предложений для этой подборки пока нет. Можно изменить параметры в каталоге.' : 'No published offers in this selection yet. You can adjust your criteria in the catalogue.'}</p>}
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

        <section><h2>{isRu ? 'Что стоит учесть' : 'Things to consider'}</h2><ul className="premium-area-notes">{cons.map(note => <li key={note}><AlertTriangle className="h-4 w-4" aria-hidden="true" />{note}</li>)}</ul><Link className="home-text-link" to={rentMapHref}>{isRu ? 'Карта района и жилья' : 'Explore the area and homes on the map'} →</Link></section>
        <HomeServiceGallery />
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
                        {isRu ? 'Познакомиться с районом' : 'Explore the area guide'}
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
