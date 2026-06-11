/**
 * @file PersonaAreaLandingPage.tsx
 * @description Wave 4 — long-tail SEO `/for/:persona/in/:area`.
 * Combines persona content with localized area context (price, yield, beach,
 * pros/cons) and a pre-tagged lead form.
 */
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin, CheckCircle2, AlertCircle, Sparkles, MessageCircle, Star } from 'lucide-react';
import { findPersonaAreaOverride } from '@/content/landings/personaAreaOverrides';
import { getWhatsAppUrl } from '@/lib/config/contacts';
import { findPersonaAreaLanding } from '@/content/landings/personaAreaLandings';
import { resolvePersonaSlug } from '@/lib/landings/slugAliases';
import { getPersonaTheme } from '@/lib/landings/personaTheme';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { LandingLeadForm } from '@/components/landings/LandingLeadForm';
import { LandingContainer } from '@/components/landings';
import { withPersonaParam } from '@/lib/landings/personaTagMap';
import {
  buildPersonaOgUrl,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_TYPE,
  OG_IMAGE_WIDTH,
} from '@/lib/seo/ogImage';
import NotFound from '@/pages/NotFound';

const PersonaAreaLandingPage = () => {
  const { persona: personaParam, area: areaParam } = useParams<{ persona: string; area: string }>();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(p: { ru: T; en: T }): T => (isRu ? p.ru : p.en);

  const data = useMemo(() => {
    if (!personaParam || !areaParam) return undefined;
    const slug = resolvePersonaSlug(personaParam);
    return findPersonaAreaLanding(slug, areaParam);
  }, [personaParam, areaParam]);

  if (!data) return <NotFound />;

  const { persona, area } = data;
  const a = area.area;
  const theme = getPersonaTheme(persona.slug);
  const Icon = theme.icon;
  const wp = (href: string) => withPersonaParam(href, persona.slug);
  const override = findPersonaAreaOverride(persona.slug, a.slug);
  const waUrl = override ? getWhatsAppUrl(t(override.whatsappMessage)) : null;

  const og = buildPersonaOgUrl({
    persona: persona.slug,
    area: a.slug,
    areaName: isRu ? a.name_ru : a.name_en,
    lang: isRu ? 'ru' : 'en',
  });
  const canonical = `https://myuno.app/for/${persona.slug}/in/${a.slug}`;
  const titleRu = `${t(persona.h1)} в ${a.name_ru} · myUNO`;
  const titleEn = `${t(persona.h1)} in ${a.name_en} · myUNO`;
  const title = (isRu ? titleRu : titleEn).slice(0, 60);
  const descRu = `${a.name_ru}: ฿${(a.avg_price_sqm / 1000).toFixed(0)}K/м², доходность ${a.avg_yield}%. Подборка под задачу: ${t(persona.h1)}.`;
  const descEn = `${a.name_en}: ฿${(a.avg_price_sqm / 1000).toFixed(0)}K/sqm, yield ${a.avg_yield}%. Curated for: ${t(persona.h1)}.`;
  const description = (isRu ? descRu : descEn).slice(0, 160);
  const ogAlt = isRu
    ? `${t(persona.h1)} в ${a.name_ru} — myUNO`
    : `${t(persona.h1)} in ${a.name_en} — myUNO`;

  const pros = isRu ? a.pros_ru : a.pros_en;
  const cons = isRu ? a.cons_ru : a.cons_en;

  return (
    <AppLayout>
      <Helmet>
        <html lang={language} />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="ru" href={`${canonical}?lang=ru`} />
        <link rel="alternate" hrefLang="en" href={`${canonical}?lang=en`} />
        <link rel="alternate" hrefLang="x-default" href={canonical} />
        {/* Preload OG so social crawlers fetch it warm and the image is ready */}
        <link rel="preload" as="image" href={og} type={OG_IMAGE_TYPE} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={og} />
        <meta property="og:image:secure_url" content={og} />
        <meta property="og:image:type" content={OG_IMAGE_TYPE} />
        <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
        <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
        <meta property="og:image:alt" content={ogAlt} />
        <meta property="og:locale" content={isRu ? 'ru_RU' : 'en_US'} />
        <meta property="og:locale:alternate" content={isRu ? 'en_US' : 'ru_RU'} />
        <meta property="og:site_name" content="myUNO" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={og} />
        <meta name="twitter:image:alt" content={ogAlt} />
      </Helmet>

      {/* HERO */}
      <header
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${tokenColor(theme.color, 0.18)} 0%, ${tokenColor(theme.colorAccent, 0.08)} 60%, transparent 100%)`,
        }}
      >
        <LandingContainer className="relative max-w-3xl py-12 sm:py-16">
          <div
            className="mb-5 inline-flex items-center gap-2 border border-border bg-background/60 px-3 py-1.5 backdrop-blur"
            style={{ borderColor: tokenColor(theme.color, 0.4) }}
          >
            <Icon className="h-4 w-4" style={{ color: tokenColor(theme.color) }} />
            <span className="text-xs font-medium uppercase tracking-wider text-foreground">
              {t(theme.tagline)} · {isRu ? a.name_ru : a.name_en}
            </span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {t(persona.h1)} {isRu ? 'в' : 'in'} {isRu ? a.name_ru : a.name_en}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {isRu ? a.description_ru : a.description_en}
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-3 border border-border bg-card/60 p-4 backdrop-blur">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">{isRu ? 'Цена' : 'Price'}</dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">
                ฿{(a.avg_price_sqm / 1000).toFixed(0)}K<span className="text-xs text-muted-foreground">/{isRu ? 'м²' : 'sqm'}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">{isRu ? 'Доходность' : 'Yield'}</dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">{a.avg_yield}%</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">{isRu ? 'Пляж' : 'Beach'}</dt>
              <dd className="mt-1 text-lg font-semibold text-foreground">
                {a.distance_beach_km < 1
                  ? `${(a.distance_beach_km * 1000).toFixed(0)} ${isRu ? 'м' : 'm'}`
                  : `${a.distance_beach_km} ${isRu ? 'км' : 'km'}`}
              </dd>
            </div>
          </dl>

          <div className="mt-7">
            <Button asChild size="lg" className="shadow-lg">
              <a href={wp(`${persona.primaryCta.href}${persona.primaryCta.href.includes('?') ? '&' : '?'}area=${a.slug}`)}>
                {t(persona.primaryCta.label)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </LandingContainer>
      </header>

      <article>
        <LandingContainer className="max-w-3xl py-10 sm:py-14">
        {/* PROS / CONS for this area */}
        <section className="mb-12 grid gap-6 sm:grid-cols-2">
          <div className="border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <CheckCircle2 className="h-5 w-5" style={{ color: tokenColor(theme.color) }} />
              {isRu ? 'Почему здесь подходит' : 'Why this area works'}
            </h2>
            <ul className="space-y-2">
              {pros.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/90">
                  <span style={{ color: tokenColor(theme.color) }}>•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              {isRu ? 'О чём подумать' : 'What to consider'}
            </h2>
            <ul className="space-y-2">
              {cons.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span>•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* SERVICES */}
        {persona.services.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-foreground">
              {isRu ? `Услуги в ${a.name_ru}` : `Services in ${a.name_en}`}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {persona.services.slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <a
                    href={wp(`${s.href}${s.href.includes('?') ? '&' : '?'}area=${a.slug}`)}
                    className="group flex h-full items-start gap-3 border border-border bg-card p-4 transition-all hover:border-primary/60"
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tokenColor(theme.color) }} />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{t(s.label)}</div>
                      {s.oneLiner ? (
                        <div className="mt-1 text-sm text-muted-foreground">{t(s.oneLiner)}</div>
                      ) : null}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* LEAD FORM */}
        <section className="mb-10">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-foreground">
              {isRu
                ? `Подборка под ${a.name_ru} — за 24 часа`
                : `Curated picks for ${a.name_en} — within 24 hours`}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRu
                ? 'Соберём варианты с учётом района и вашей задачи. Пришлём в WhatsApp.'
                : 'We will curate options matching the area and your goal. Sent via WhatsApp.'}
            </p>
          </div>
          <LandingLeadForm
            variant="universal"
            verticalId="properties"
            universalRequestType="vacation_rental"
            entryPoint={`persona-area:${persona.slug}:${a.slug}`}
            leadSource="cta"
            messagePlaceholder={{
              ru: `Кратко: ${a.name_ru}, бюджет, даты, особые пожелания.`,
              en: `Briefly: ${a.name_en}, budget, dates, special requests.`,
            }}
          />
        </section>

        {/* RELATED LINKS */}
        <section className="border-t border-border pt-8">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <MapPin className="h-5 w-5" style={{ color: tokenColor(theme.color) }} />
            {isRu ? 'Связанные страницы' : 'Related pages'}
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <a href={`/for/${persona.slug}`} className="border border-border bg-card p-3 hover:border-primary/60">
              <div className="text-foreground">{isRu ? 'Все районы для' : 'All areas for'}</div>
              <div className="mt-0.5 font-medium text-foreground">{t(persona.h1)}</div>
            </a>
            <a href={`/area/${a.slug}`} className="border border-border bg-card p-3 hover:border-primary/60">
              <div className="text-foreground">{isRu ? 'Гид по району' : 'Area guide'}</div>
              <div className="mt-0.5 font-medium text-foreground">{isRu ? a.name_ru : a.name_en}</div>
            </a>
          </div>
        </section>
        </LandingContainer>
      </article>

      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
        <Button asChild size="lg" className="w-full">
          <a href={wp(persona.primaryCta.href)}>{t(persona.primaryCta.label)}</a>
        </Button>
      </div>
    </AppLayout>
  );
};

export default PersonaAreaLandingPage;
