/**
 * @file PersonaLandingPage.tsx
 * @description Persona landing `/for/:persona` — premium template with per-persona
 * theming (icon, gradient, social proof) + area cross-link + sticky CTA.
 *
 * Behaviour:
 *  - Resolves slug via `resolvePersonaSlug` (legacy aliases → canonical)
 *  - 404 if not found or `status !== 'live'`
 *  - Hero · Pains · Services · Areas · FAQ · Repeat CTA · Sticky mobile CTA
 */
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  findPersonaLandingBySlug,
  isLivePersonaLanding,
  type PersonaLanding,
} from '@/lib/landings/types';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import { resolvePersonaSlug } from '@/lib/landings/slugAliases';
import { getPersonaTheme } from '@/lib/landings/personaTheme';
import { AREA_LANDINGS } from '@/content/landings/areaLandings';
import NotFound from '@/pages/NotFound';
import { Button } from '@/components/ui/button';
import LandingSeoHead from '@/components/seo/LandingSeoHead';
import { tokenColor } from '@/lib/utils/hslAlpha';
import { ArrowRight, CheckCircle2, MapPin, Sparkles, Grid3x3 } from 'lucide-react';
import { getAppsForPersona, withPersonaParam } from '@/lib/landings/personaTagMap';

interface PersonaLandingViewProps {
  landing: PersonaLanding;
}

const PersonaLandingView = ({ landing }: PersonaLandingViewProps) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = <T,>(pair: { ru: T; en: T }): T => (isRu ? pair.ru : pair.en);
  const theme = getPersonaTheme(landing.slug);
  const Icon = theme.icon;

  // Persona context flows through every click — catalog pages will read it.
  const wp = (href: string) => withPersonaParam(href, landing.slug);

  // Cross-link: areas where this persona is recommended (max 4)
  const relatedAreas = useMemo(
    () =>
      AREA_LANDINGS.filter((a) =>
        a.relatedPersonaSlugs.includes(landing.slug),
      ).slice(0, 4),
    [landing.slug],
  );

  // "All apps for you" — pulled from the canonical app registry, filtered by
  // persona (with show-all fallback when no specific apps match).
  const personaApps = useMemo(() => getAppsForPersona(landing.slug), [landing.slug]);

  return (
    <AppLayout>
      <LandingSeoHead landing={landing} type="persona" language={language as 'ru' | 'en'} />

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${tokenColor(theme.color, 0.18)} 0%, ${tokenColor(theme.colorAccent, 0.08)} 60%, transparent 100%)`,
        }}
      >
        {/* Decorative orb */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: tokenColor(theme.color, 0.25) }}
        />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          <div
            className="mb-5 inline-flex items-center gap-2 border border-border bg-background/60 px-3 py-1.5 backdrop-blur"
            style={{ borderColor: tokenColor(theme.color, 0.4) }}
          >
            <Icon className="h-4 w-4" style={{ color: tokenColor(theme.color) }} />
            <span className="text-xs font-medium uppercase tracking-wider text-foreground">
              {t(theme.tagline)}
            </span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
            {t(landing.h1)}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {t(landing.subtitle)}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="shadow-lg">
              <a href={wp(landing.primaryCta.href)}>
                {t(landing.primaryCta.label)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {landing.secondaryCta ? (
              <Button asChild size="lg" variant="outline">
                <a href={wp(landing.secondaryCta.href)}>{t(landing.secondaryCta.label)}</a>
              </Button>
            ) : null}
          </div>
          {landing.primaryCta.subtitle ? (
            <p className="mt-3 text-xs text-muted-foreground">
              {t(landing.primaryCta.subtitle)}
            </p>
          ) : null}
        </div>
      </header>

      {/* ─── TRUST STRIP ────────────────────────────────────────── */}
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 px-4 py-5 sm:grid-cols-3 sm:px-6">
          {theme.proof.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: tokenColor(theme.color) }} />
              <span className="text-sm text-foreground">{t(p)}</span>
            </div>
          ))}
        </div>
      </section>

      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* ─── PAINS ─────────────────────────────────────────────── */}
        {landing.pains.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-foreground">
              {isRu ? 'Что вы решаете' : 'What you solve'}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {landing.pains.map((pain, i) => (
                <li
                  key={i}
                  className="flex gap-3 border border-border bg-card p-4"
                >
                  <span
                    aria-hidden
                    className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center text-xs font-semibold"
                    style={{
                      background: tokenColor(theme.color, 0.15),
                      color: tokenColor(theme.color),
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground/90">{t(pain)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ─── SERVICES ──────────────────────────────────────────── */}
        {landing.services.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-foreground">
              {isRu ? 'Услуги под вашу задачу' : 'Services for your goal'}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {landing.services.map((service) => (
                <li key={service.slug}>
                  <a
                    href={service.href}
                    className="group flex h-full items-start gap-3 border border-border bg-card p-4 transition-all hover:border-primary/60 hover:[box-shadow:var(--shadow-elevation-2)]"
                  >
                    <Sparkles
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: tokenColor(theme.color) }}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{t(service.label)}</div>
                      {service.oneLiner ? (
                        <div className="mt-1 text-sm text-muted-foreground">
                          {t(service.oneLiner)}
                        </div>
                      ) : null}
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ─── BUNDLE PRICING ────────────────────────────────────── */}
        {landing.bundle ? (
          <section
            className="mb-12 border-2 p-6"
            style={{ borderColor: tokenColor(theme.color, 0.5), background: tokenColor(theme.color, 0.05) }}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">
                {t(landing.bundle.title)}
              </h3>
              <div className="text-2xl font-bold text-foreground">
                ฿{landing.bundle.priceThb.toLocaleString()}
              </div>
            </div>
            {landing.bundle.terms ? (
              <p className="mt-2 text-sm text-muted-foreground">{t(landing.bundle.terms)}</p>
            ) : null}
          </section>
        ) : null}

        {/* ─── AREA CROSS-LINK ───────────────────────────────────── */}
        {relatedAreas.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 flex items-center gap-2 text-2xl font-semibold text-foreground">
              <MapPin className="h-5 w-5" style={{ color: tokenColor(theme.color) }} />
              {isRu ? 'Подходящие районы' : 'Best-fit areas'}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {relatedAreas.map((a) => (
                <a
                  key={a.slug}
                  href={`/area/${a.slug}`}
                  className="border border-border bg-card p-3 text-center transition-colors hover:border-primary/60"
                >
                  <div className="text-sm font-medium text-foreground">
                    {isRu ? a.area.name_ru : a.area.name_en}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    ฿{(a.area.avg_price_sqm / 1000).toFixed(0)}K · {a.area.avg_yield}%
                  </div>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {/* ─── FAQ ───────────────────────────────────────────────── */}
        {landing.faq.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-foreground">
              {isRu ? 'Вопросы и ответы' : 'Questions & answers'}
            </h2>
            <dl className="space-y-5">
              {landing.faq.map((entry, i) => (
                <div key={i} className="border-l-2 pl-4" style={{ borderColor: tokenColor(theme.color, 0.5) }}>
                  <dt className="font-medium text-foreground">{t(entry.q)}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{t(entry.a)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* ─── REPEAT CTA ────────────────────────────────────────── */}
        <div
          className="mt-8 border p-6 sm:p-8"
          style={{ borderColor: tokenColor(theme.color, 0.4), background: tokenColor(theme.color, 0.06) }}
        >
          <h3 className="text-xl font-semibold text-foreground">
            {isRu ? 'Готовы начать?' : 'Ready to start?'}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRu
              ? 'Ответ дежурного — за 12 минут, без обязательств.'
              : 'Reply within 12 minutes, no commitment.'}
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild size="lg">
              <a href={landing.primaryCta.href}>
                {t(landing.primaryCta.label)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {landing.secondaryCta ? (
              <Button asChild size="lg" variant="ghost">
                <a href={landing.secondaryCta.href}>{t(landing.secondaryCta.label)}</a>
              </Button>
            ) : null}
          </div>
        </div>
      </article>

      {/* ─── STICKY MOBILE CTA ─────────────────────────────────── */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
        <Button asChild size="lg" className="w-full">
          <a href={landing.primaryCta.href}>{t(landing.primaryCta.label)}</a>
        </Button>
      </div>
    </AppLayout>
  );
};

const PersonaLandingPage = () => {
  const { persona: slug } = useParams<{ persona: string }>();

  if (!slug) {
    return <NotFound />;
  }

  const landing = findPersonaLandingBySlug(PERSONA_LANDINGS, resolvePersonaSlug(slug));

  if (!landing || !isLivePersonaLanding(landing)) {
    return <NotFound />;
  }

  return <PersonaLandingView landing={landing} />;
};

export default PersonaLandingPage;
