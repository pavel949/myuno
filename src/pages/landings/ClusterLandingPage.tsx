/**
 * @file ClusterLandingPage.tsx
 * @description Cluster landing `/cluster/:cluster` — premium template matching
 * PersonaLandingPage. Resolves SSOT slugs (arrive/live/manage/...) → lifecycle
 * landings (arrival/lifestyle/operations/...) via slugAliases.
 */
import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { withPersonaParam } from '@/lib/landings/personaTagMap';
import { resolveClusterSlug, resolvePersonaSlug } from '@/lib/landings/slugAliases';
import {
  findClusterLandingBySlug,
  isLiveClusterLanding,
  isLivePersonaLanding,
  type ClusterLanding,
} from '@/lib/landings/types';
import { CLUSTER_LANDINGS } from '@/content/landings/clusterLandings';
import { PERSONA_LANDINGS } from '@/content/landings/personaLandings';
import NotFound from '@/pages/NotFound';
import { Button } from '@/components/ui/button';
import LandingSeoHead from '@/components/seo/LandingSeoHead';
import { tokenColor } from '@/lib/utils/hslAlpha';
import {
  ArrowRight, CheckCircle2, Sparkles, Plane, Shield,
  TrendingUp, Wrench, Scale, AlertTriangle, Sun, LogOut, Building2, Repeat,
  type LucideIcon,
} from 'lucide-react';

interface ClusterTheme {
  icon: LucideIcon;
  color: string;
  colorAccent: string;
  tagline: { ru: string; en: string };
}

const CLUSTER_THEME: Record<string, ClusterTheme> = {
  arrival:     { icon: Plane,         color: 'cluster-arrive',  colorAccent: 'accent-cyan',   tagline: { ru: 'Жизненный цикл · Прибытие',     en: 'Lifecycle · Arrival' } },
  extension:   { icon: Repeat,        color: 'accent-amber',    colorAccent: 'cluster-arrive',tagline: { ru: 'Жизненный цикл · Продление',    en: 'Lifecycle · Extension' } },
  settlement:  { icon: Building2,     color: 'cluster-live',    colorAccent: 'accent-purple', tagline: { ru: 'Жизненный цикл · Заселение',    en: 'Lifecycle · Settlement' } },
  investment:  { icon: TrendingUp,    color: 'cluster-invest',  colorAccent: 'accent-cyan',   tagline: { ru: 'Жизненный цикл · Инвестиции',   en: 'Lifecycle · Investment' } },
  transaction: { icon: Building2,     color: 'cluster-build',   colorAccent: 'accent-amber',  tagline: { ru: 'Жизненный цикл · Сделка',       en: 'Lifecycle · Transaction' } },
  operations:  { icon: Wrench,        color: 'cluster-manage',  colorAccent: 'cluster-invest',tagline: { ru: 'Жизненный цикл · Управление',   en: 'Lifecycle · Operations' } },
  compliance:  { icon: Scale,         color: 'cluster-legal',   colorAccent: 'accent-amber',  tagline: { ru: 'Жизненный цикл · Право',        en: 'Lifecycle · Compliance' } },
  emergency:   { icon: AlertTriangle, color: 'destructive',     colorAccent: 'accent-coral',  tagline: { ru: 'Жизненный цикл · Экстренно',    en: 'Lifecycle · Emergency' } },
  lifestyle:   { icon: Sun,           color: 'accent-coral',    colorAccent: 'accent-purple', tagline: { ru: 'Жизненный цикл · Образ жизни',  en: 'Lifecycle · Lifestyle' } },
  exit:        { icon: LogOut,        color: 'muted-foreground',colorAccent: 'cluster-invest',tagline: { ru: 'Жизненный цикл · Выход',        en: 'Lifecycle · Exit' } },
};

function getClusterTheme(slug: string): ClusterTheme {
  return CLUSTER_THEME[slug] ?? {
    icon: Sparkles,
    color: 'primary',
    colorAccent: 'accent-cyan',
    tagline: { ru: 'Кластер', en: 'Cluster' },
  };
}

interface ClusterLandingViewProps {
  landing: ClusterLanding;
}

const ClusterLandingView = ({ landing }: ClusterLandingViewProps) => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const isRu = language === 'ru';
  const t = <T,>(pair: { ru: T; en: T }): T => (isRu ? pair.ru : pair.en);
  const theme = getClusterTheme(landing.slug);
  const Icon = theme.icon;

  const personaSlug = useMemo(() => {
    const raw = searchParams.get('persona');
    return raw ? resolvePersonaSlug(raw) : null;
  }, [searchParams]);

  const withPersona = (href: string) =>
    personaSlug ? withPersonaParam(href, personaSlug) : href;

  const livePersonaLinks = useMemo(() => {
    const codes = new Set(landing.relatedPersonas);
    return PERSONA_LANDINGS.filter(
      (p) => codes.has(p.personaCode) && isLivePersonaLanding(p),
    );
  }, [landing.relatedPersonas]);

  return (
    <AppLayout>
      <LandingSeoHead landing={landing} type="cluster" language={language as 'ru' | 'en'} />

      {/* ─── HERO ───────────────────────────────────────────────── */}
      <header
        className="relative overflow-hidden border-b border-border"
        style={{
          background: `linear-gradient(135deg, ${tokenColor(theme.color, 0.18)} 0%, ${tokenColor(theme.colorAccent, 0.08)} 60%, transparent 100%)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full blur-3xl"
          style={{ background: tokenColor(theme.color, 0.25) }}
        />
        <div className="relative mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
          <div
            className="mb-5 inline-flex items-center gap-2 border bg-background/60 px-3 py-1.5 backdrop-blur"
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
              <a href={landing.primaryCta.href}>
                {t(landing.primaryCta.label)}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {landing.secondaryCta ? (
              <Button asChild size="lg" variant="outline">
                <a href={landing.secondaryCta.href}>{t(landing.secondaryCta.label)}</a>
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

      <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {/* ─── JOBS (lifecycle phrases) ──────────────────────────── */}
        {landing.jobs.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-foreground">
              {isRu ? 'Что делают на этом этапе' : 'What people do at this stage'}
            </h2>
            <ul className="space-y-2">
              {landing.jobs.map((job, i) => (
                <li key={i} className="flex items-start gap-3 border border-border bg-card p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: tokenColor(theme.color) }} />
                  <span className="text-sm text-foreground/90">{t(job)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* ─── SERVICES ──────────────────────────────────────────── */}
        {landing.services.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-foreground">
              {isRu ? 'Услуги кластера' : 'Cluster services'}
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
                        <div className="mt-1 text-sm text-muted-foreground">{t(service.oneLiner)}</div>
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
              <h3 className="text-lg font-semibold text-foreground">{t(landing.bundle.title)}</h3>
              <div className="text-2xl font-bold text-foreground">
                ฿{landing.bundle.priceThb.toLocaleString()}
              </div>
            </div>
            {landing.bundle.terms ? (
              <p className="mt-2 text-sm text-muted-foreground">{t(landing.bundle.terms)}</p>
            ) : null}
          </section>
        ) : null}

        {/* ─── RELATED PERSONAS ─────────────────────────────────── */}
        {livePersonaLinks.length > 0 ? (
          <section className="mb-12">
            <h2 className="mb-5 text-2xl font-semibold text-foreground">
              {isRu ? 'Кому актуально' : 'Who this is for'}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {livePersonaLinks.map((p) => (
                <li key={p.slug}>
                  <a
                    href={`/for/${p.slug}`}
                    className="block border border-border bg-card p-4 transition-colors hover:border-primary/60"
                  >
                    <div className="flex items-center gap-2 text-foreground">
                      <Shield className="h-4 w-4" style={{ color: tokenColor(theme.color) }} />
                      <span className="font-medium">{t(p.h1)}</span>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
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

const ClusterLandingPage = () => {
  const { cluster: slug } = useParams<{ cluster: string }>();

  if (!slug) {
    return <NotFound />;
  }

  const landing = findClusterLandingBySlug(CLUSTER_LANDINGS, resolveClusterSlug(slug));

  if (!landing || !isLiveClusterLanding(landing)) {
    return <NotFound />;
  }

  return <ClusterLandingView landing={landing} />;
};

export default ClusterLandingPage;
