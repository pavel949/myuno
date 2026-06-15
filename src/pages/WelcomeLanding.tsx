/**
 * WelcomeLanding — first touchpoint for guest users.
 * Single narrative: «один аккаунт — вся жизнь за границей».
 *
 * Layout (top → bottom):
 *  1. Hero  — title + two CTAs (signup, «Я инвестор» → Navigator /invest cluster) + live stats.
 *  2. Persona router — three meaningful entry paths (arrive · live · invest).
 *  3. Clusters — simplified grid (no 01→06, no service counts).
 *  4. Benefits — «Почему один аккаунт удобнее».
 *  5. Trust strip.
 *  6. Closing CTA + footer (Privacy · Terms · Support · Contact).
 *  7. Sticky signup bar on mobile.
 */
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Globe, Sparkles, Plane, ChevronDown, Car, Compass, Anchor, ShieldCheck, Smartphone, Wallet, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { buildCatalogAudienceMetrics } from '@/lib/catalog/catalogMetrics';
import { APP_ROUTES } from '@/lib/config/routes';
import {
  LandingChrome,
  WelcomePersonaRouter,
  WelcomeBenefitsSection,
  buildWelcomeNavigatorHref,
} from '@/components/landings';
import {
  LandingContainer,
  LandingHero,
  LandingSection,
  LandingTrustRow,
} from '@/components/landings/LandingPrimitives';

function useWelcomeCatalogMetrics() {
  const { clusters, categories } = useCatalogFromDB();
  return useMemo(
    () => buildCatalogAudienceMetrics(clusters, categories, { personas: [], role: null }),
    [clusters, categories],
  );
}

/** Russian plural for «N раздел(а/ов) платформы» */
function platformSectionsTitleRu(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} раздел платформы`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${n} раздела платформы`;
  return `${n} разделов платформы`;
}

const TRUST = [
  { icon: Shield, en: 'Bank-grade KYC', ru: 'KYC банковского уровня' },
  { icon: Globe, en: 'EN · RU · TH', ru: 'EN · RU · TH' },
  { icon: Sparkles, en: 'AI concierge', ru: 'AI-консьерж' },
];

export default function WelcomeLanding() {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const [tripOpen, setTripOpen] = useState(false);

  const tripServices = useMemo(
    () => [
      { icon: Plane, label: t('welcome.hero.pickTrip.svc.transfer'), href: APP_ROUTES.AIRPORT_TRANSFER },
      { icon: Car, label: t('welcome.hero.pickTrip.svc.car'), href: APP_ROUTES.TRANSPORT },
      { icon: Compass, label: t('welcome.hero.pickTrip.svc.tours'), href: APP_ROUTES.EXPERIENCES },
      { icon: Anchor, label: t('welcome.hero.pickTrip.svc.yachts'), href: APP_ROUTES.YACHTS },
      { icon: ShieldCheck, label: t('welcome.hero.pickTrip.svc.insurance'), href: APP_ROUTES.INSURANCE_TRAVEL },
      { icon: Smartphone, label: t('welcome.hero.pickTrip.svc.sim'), href: APP_ROUTES.SIM_START },
      { icon: Wallet, label: t('welcome.hero.pickTrip.svc.exchange'), href: APP_ROUTES.EXCHANGE },
      { icon: Zap, label: t('welcome.hero.pickTrip.svc.fasttrack'), href: APP_ROUTES.FAST_TRACK },
    ],
    [t],
  );
  const {
    byCluster,
    totalEligibleServices,
    clustersCount,
    totalActiveLifeSituations,
  } = useWelcomeCatalogMetrics();

  const heroStats = [
    { num: String(totalEligibleServices), label: t('welcome.hero.statServices') },
    { num: String(clustersCount), label: t('welcome.hero.statSections') },
    { num: String(totalActiveLifeSituations), label: t('welcome.hero.statSituations') },
    { num: '24/7', label: t('welcome.hero.statSupport') },
  ];

  return (
    <div
      data-testid="welcome-landing"
      className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary pb-20 sm:pb-0"
    >
      <LandingChrome isRu={isRu} />

      <LandingSection className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border)/0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <LandingHero>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-sans text-caption font-medium uppercase tracking-[0.12em] text-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-primary">{t('welcome.hero.kickerAccent')}</span>
            <span className="text-muted-foreground">{t('welcome.hero.kickerRest')}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display mt-5 max-w-3xl text-h1 font-normal leading-[1.05] tracking-tight sm:text-display"
          >
            {t('welcome.hero.titleLine1')}
            <br />
            {t('welcome.hero.titleLine2')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl font-sans text-body-lg font-normal leading-relaxed text-muted-foreground"
          >
            {t('welcome.hero.subtitle')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to={`${APP_ROUTES.AUTH}?mode=signup`}
              data-testid="welcome-cta-signup"
              className={cn(
                'group inline-flex h-11 items-center gap-2 rounded-none px-5 font-sans text-body font-semibold',
                'bg-foreground text-background hover:bg-foreground/90 transition-all',
                'shadow-[0_1px_0_0_hsl(var(--background))_inset,0_0_0_1px_hsl(var(--foreground))]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {t('welcome.hero.ctaSignup')}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              onClick={() => {
                try { localStorage.setItem('intent_segment', 'explore'); } catch { /* noop */ }
                navigate(APP_ROUTES.DISCOVER);
              }}
              data-testid="welcome-cta-explore"
              className="inline-flex h-11 items-center rounded-none border border-border bg-card/40 px-5 font-sans text-body font-medium text-foreground hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t('welcome.hero.pickExplore')}
            </button>
          </motion.div>

          {/* Segment picker — 3 entry points (Relocator · Second-home · Investor) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-6 max-w-3xl"
          >
            <p className="mb-3 font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
              {t('welcome.hero.pickIntro')}
            </p>

            {/* Trip planner — expandable, top-priority entry */}
            <div className="mb-2 overflow-hidden border border-border bg-card">
              <button
                type="button"
                data-testid="welcome-cta-trip"
                aria-expanded={tripOpen}
                onClick={() => {
                  try { localStorage.setItem('intent_segment', 'trip'); } catch { /* noop */ }
                  setTripOpen((v) => !v);
                }}
                className={cn(
                  'group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  'hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-background">
                  <Plane className="h-4 w-4 text-primary" strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-sans text-body font-semibold text-foreground">
                    {t('welcome.hero.pickTrip.title')}
                  </span>
                  <span className="font-sans text-caption text-muted-foreground">
                    {t('welcome.hero.pickTrip.sub')}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-sans text-caption uppercase tracking-[0.12em] text-muted-foreground">
                  {tripOpen ? t('welcome.hero.pickTrip.collapse') : t('welcome.hero.pickTrip.expand')}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', tripOpen && 'rotate-180')}
                    strokeWidth={2}
                  />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {tripOpen && (
                  <motion.div
                    key="trip-services"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="border-t border-border"
                  >
                    <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                      {tripServices.map((svc) => (
                        <Link
                          key={svc.href}
                          to={svc.href}
                          data-testid={`welcome-trip-svc-${svc.href}`}
                          className="group flex items-center gap-2 bg-card px-3 py-3 transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        >
                          <svc.icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" strokeWidth={2} />
                          <span className="font-sans text-body-sm text-foreground">
                            {svc.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  id: 'relocator' as const,
                  segment: 'relocator',
                  href: buildWelcomeNavigatorHref(APP_ROUTES.ARRIVE_CLUSTER, 'arrive'),
                  title: t('welcome.hero.pickRelocator.title'),
                  sub: t('welcome.hero.pickRelocator.sub'),
                },
                {
                  id: 'secondhome' as const,
                  segment: 'secondhome',
                  href: buildWelcomeNavigatorHref(APP_ROUTES.DISCOVER, 'live'),
                  title: t('welcome.hero.pickSecondHome.title'),
                  sub: t('welcome.hero.pickSecondHome.sub'),
                },
                {
                  id: 'investor' as const,
                  segment: 'investor',
                  href: buildWelcomeNavigatorHref(APP_ROUTES.INVEST_CLUSTER, 'invest'),
                  title: t('welcome.hero.pickInvestor.title'),
                  sub: t('welcome.hero.pickInvestor.sub'),
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-testid={`welcome-cta-${opt.id}`}
                  onClick={() => {
                    try { localStorage.setItem('intent_segment', opt.segment); } catch { /* noop */ }
                    navigate(opt.href);
                  }}
                  className={cn(
                    'group flex flex-col items-start gap-1 rounded-none border border-border bg-card px-4 py-3 text-left',
                    'transition-colors hover:border-primary hover:bg-card/80',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-2">
                    <span className="font-sans text-body font-semibold text-foreground">
                      {opt.title}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" strokeWidth={2} />
                  </span>
                  <span className="font-sans text-caption text-muted-foreground">
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-none border border-border bg-border/50 sm:grid-cols-4"
          >
            {heroStats.map((s) => (
              <div key={s.num + s.label} className="bg-background px-5 py-4">
                <div className="font-mono text-h3 font-medium tabular-nums tracking-tight">
                  {s.num}
                </div>
                <div className="mt-0.5 font-sans text-caption tracking-wide text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </LandingHero>
      </LandingSection>

      <LandingSection>
        <LandingContainer className="py-10 sm:py-14">
          <div className="mb-6 space-y-2">
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {t('welcome.persona.sectionTitle')}
            </h2>
            <p className="max-w-2xl font-sans text-body-sm font-normal leading-relaxed text-muted-foreground">
              {t('welcome.persona.sectionLead')}
            </p>
          </div>
          <WelcomePersonaRouter />
        </LandingContainer>
      </LandingSection>

      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="mb-3">
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {isRu
                ? platformSectionsTitleRu(clustersCount)
                : `${clustersCount} platform section${clustersCount === 1 ? '' : 's'}`}
            </h2>
          </div>
          <p className="mb-8 max-w-2xl font-sans text-body-sm font-normal leading-relaxed text-muted-foreground">
            {t('welcome.clusters.lead')}
          </p>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-none border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
            {byCluster.map((c, i) => {
              const Icon = c.icon;
              const label = isRu ? c.labelRu : c.labelEn;
              const hint = isRu ? c.hintsRu : c.hintsEn;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  aria-label={isRu ? `${label}. Перейти в раздел.` : `${label}. Open section.`}
                  data-testid="welcome-cluster-card"
                  data-cluster-id={c.id}
                  onClick={() => navigate(c.homeRoute)}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="group relative bg-background p-5 text-left transition-colors hover:bg-card/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-none border border-border bg-card transition-colors group-hover:border-primary/40"
                      style={{ color: c.color }}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-sans text-h4 font-medium tracking-tight">
                        {label}
                      </h3>
                      <p className="mt-1 font-sans text-body-sm leading-relaxed text-muted-foreground line-clamp-2">
                        {hint}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      <LandingSection>
        <WelcomeBenefitsSection />
      </LandingSection>

      <LandingSection>
        <LandingContainer className="py-10">
          <LandingTrustRow items={TRUST} isRu={isRu} />
        </LandingContainer>
      </LandingSection>

      <LandingSection border={false}>
        <LandingContainer className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <h2 className="font-display text-h1 font-normal leading-[1.05] tracking-tight sm:text-display">
            {t('welcome.closing.title.line1')}
            <br />
            {t('welcome.closing.title.line2')}
          </h2>
          <p className="mt-4 font-sans text-body-sm text-muted-foreground sm:text-body">
            {t('welcome.closing.subtitle')}
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              to={`${APP_ROUTES.AUTH}?mode=signup`}
              className={cn(
                'group inline-flex h-12 items-center gap-2 rounded-none px-6 font-sans text-body font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-all',
                'shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {t('welcome.closing.cta')}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>

          <nav
            aria-label={isRu ? 'Юридическая информация и поддержка' : 'Legal and support'}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-caption text-muted-foreground"
          >
            <Link
              to={APP_ROUTES.PRIVACY}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {t('welcome.footer.linkPrivacy')}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link
              to={APP_ROUTES.TERMS}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {t('welcome.footer.linkTerms')}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link
              to={APP_ROUTES.SUPPORT}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {t('welcome.footer.linkSupport')}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link
              to={APP_ROUTES.CONTACT}
              className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {t('welcome.footer.linkContact')}
            </Link>
          </nav>

          <p className="mt-6 font-sans text-caption tracking-[0.08em] text-muted-foreground/60">
            {t('welcome.footer.copyright')}
          </p>
        </LandingContainer>
      </LandingSection>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        <Link
          to={`${APP_ROUTES.AUTH}?mode=signup`}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-none bg-primary font-sans text-body font-semibold text-primary-foreground"
        >
          {t('welcome.hero.ctaSignup')}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
