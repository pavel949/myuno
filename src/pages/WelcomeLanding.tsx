/**
 * WelcomeLanding — first touchpoint for guest users.
 * Goal: clearly explain value and lead to one next action.
 */
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Globe,
  Sparkles,
  Plane,
  Home,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { cn } from '@/lib/utils';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { buildCatalogAudienceMetrics } from '@/lib/catalog/catalogMetrics';
import { useActiveLifeSituationsCount } from '@/hooks/useActiveLifeSituationsCount';
import { APP_ROUTES } from '@/lib/config/routes';

function useWelcomeCatalogMetrics() {
  const { clusters, categories } = useCatalogFromDB();
  return useMemo(
    () => buildCatalogAudienceMetrics(clusters, categories, { personas: [], role: null }),
    [clusters, categories],
  );
}

const TRUST = [
  { icon: Shield, en: 'Bank-grade KYC', ru: 'KYC банковского уровня' },
  { icon: Globe, en: 'EN · RU · TH', ru: 'EN · RU · TH' },
  { icon: Sparkles, en: 'AI concierge', ru: 'AI-консьерж' },
];

const QUICK_SCENARIOS = [
  {
    id: 'arrive',
    icon: Plane,
    route: APP_ROUTES.ARRIVE_CLUSTER,
    titleRu: 'Я только прилетел',
    titleEn: 'I just arrived',
    bulletsRu: ['Трансфер и Fast Track', 'SIM и обмен валют', 'Поддержка 24/7'],
    bulletsEn: ['Transfer & Fast Track', 'SIM and exchange', '24/7 support'],
  },
  {
    id: 'live',
    icon: Home,
    route: APP_ROUTES.DISCOVER,
    titleRu: 'Я обустраиваю жизнь',
    titleEn: 'I am settling in',
    bulletsRu: ['Дом и бытовые сервисы', 'Медицина, семья, питомцы', 'Проверенные исполнители'],
    bulletsEn: ['Home and daily services', 'Health, family, pets', 'Verified providers'],
  },
  {
    id: 'invest',
    icon: TrendingUp,
    route: APP_ROUTES.INVEST,
    titleRu: 'Я смотрю инвестиции',
    titleEn: 'I explore investments',
    bulletsRu: ['Каталог объектов', 'Сделка и due diligence', 'Юр. и финансовая поддержка'],
    bulletsEn: ['Property catalog', 'Deal and due diligence', 'Legal and finance support'],
  },
] as const;

export default function WelcomeLanding() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { byCluster, totalEligibleServices, clustersCount, categoriesCountAcrossVisible } =
    useWelcomeCatalogMetrics();
  const { data: lifeSituationsActive = 0, isLoading: lifeCountLoading } =
    useActiveLifeSituationsCount();
  const categoriesCount = categoriesCountAcrossVisible;

  return (
    <div
      data-testid="welcome-landing"
      className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary pb-20 sm:pb-0"
    >
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <BrandWordmark />
          <div className="flex items-center gap-1.5">
            <ThemeSwitcher variant="buttons" size="sm" />
            <LanguageSwitcher />
            <Link
              to="/auth"
              className="hidden sm:inline-flex h-8 items-center rounded-none px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRu ? 'Войти' : 'Sign in'}
            </Link>
            <Link
              to="/auth?mode=signup"
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-none px-3 text-[13px] font-semibold',
                'bg-foreground text-background hover:bg-foreground/90 transition-colors'
              )}
            >
              {isRu ? 'Создать' : 'Get started'}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border/40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border)/0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-5 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-semibold text-primary">{isRu ? 'ПХУКЕТ' : 'PHUKET'}</span>
            <span className="text-muted-foreground">· {isRu ? 'LIVE' : 'LIVE NOW'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-[34px] sm:text-[56px] font-semibold leading-[1.05] tracking-[-0.03em] max-w-3xl"
          >
            {isRu ? (
              <>
                Решите ключевые задачи
                <br />
                на Пхукете в одном приложении
              </>
            ) : (
              <>
                Solve your key Phuket tasks
                <br />
                in one app
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-muted-foreground"
          >
            {isRu
              ? 'Сначала — планирование и прибытие, затем быт, документы и инвестиции. Выберите сценарий ниже и начните за 60 секунд.'
              : 'Start with planning and arrival, then daily life, legal tasks, and investments. Pick your scenario below and begin in 60 seconds.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to="/auth?mode=signup"
              className={cn(
                'group inline-flex h-11 items-center gap-2 rounded-none px-5 text-[14px] font-semibold',
                'bg-foreground text-background hover:bg-foreground/90 transition-all',
                'shadow-[0_1px_0_0_hsl(var(--background))_inset,0_0_0_1px_hsl(var(--foreground))]'
              )}
            >
              {isRu ? 'Начать за 60 секунд' : 'Start in 60 seconds'}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              onClick={() => navigate(APP_ROUTES.DISCOVER)}
              className="inline-flex h-11 items-center rounded-none border border-border bg-card/40 px-5 text-[14px] font-medium text-foreground hover:bg-card transition-colors"
            >
              {isRu ? 'Посмотреть навигатор' : 'Explore navigator'}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-none border border-border bg-border/50 max-w-3xl"
          >
            {[
              { num: String(totalEligibleServices), en: 'services ready now', ru: 'доступных сервисов' },
              { num: String(clustersCount), en: 'platform sections', ru: 'разделов платформы' },
              {
                num: lifeCountLoading ? '...' : String(lifeSituationsActive),
                en: 'life situations',
                ru: 'жизненных ситуаций',
              },
              { num: '24/7', en: 'AI concierge & SOS', ru: 'AI-консьерж и SOS' },
            ].map((s) => (
              <div key={s.num + s.en} className="bg-background px-5 py-4">
                <div className="font-mono text-[22px] font-semibold tracking-tight tabular-nums">
                  {s.num}
                </div>
                <div className="mt-0.5 text-[11px] tracking-[0.04em] text-muted-foreground">
                  {isRu ? s.ru : s.en}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em]">
              {isRu ? 'С чего начать' : 'Where to start'}
            </h2>
            <span className="text-[12px] text-muted-foreground">
              {isRu ? 'Выберите свой сценарий' : 'Choose your scenario'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {QUICK_SCENARIOS.map((s) => {
              const Icon = s.icon;
              const bullets = isRu ? s.bulletsRu : s.bulletsEn;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(s.route)}
                  className="text-left rounded-none border border-border bg-card p-4 hover:bg-card/70 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                    <h3 className="text-[15px] font-semibold">
                      {isRu ? s.titleRu : s.titleEn}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-[13px] text-muted-foreground">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-[7px] h-1 w-1 rounded-full bg-primary/70 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em]">
              {isRu ? '6 разделов платформы' : '6 platform sections'}
            </h2>
            <span className="hidden sm:inline text-[12px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
              01 → {String(clustersCount).padStart(2, '0')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px overflow-hidden rounded-none border border-border bg-border/50">
            {byCluster.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  data-testid="welcome-cluster-card"
                  data-cluster-id={c.id}
                  onClick={() => navigate(c.homeRoute)}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="group relative bg-background p-5 sm:p-6 hover:bg-card/40 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-none border border-border bg-card transition-colors group-hover:border-primary/40"
                      style={{ color: c.color }}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-[15px] font-semibold tracking-tight truncate">
                            {isRu ? c.labelRu : c.labelEn}
                          </h3>
                        </div>
                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70 shrink-0">
                          {c.servicesCount > 0
                            ? `${c.servicesCount} ${isRu ? 'серв' : 'svc'}`
                            : c.audience === 'workspace'
                              ? (isRu ? 'кабинет' : 'workspace')
                              : `0 ${isRu ? 'серв' : 'svc'}`}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground line-clamp-2">
                        {isRu ? c.hintsRu : c.hintsEn}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground/70">
                        {c.categoriesCount > 0 ? (
                          <>
                            {c.categoriesCount}{' '}
                            {isRu
                              ? c.categoriesCount === 1
                                ? 'категория'
                                : c.categoriesCount < 5
                                  ? 'категории'
                                  : 'категорий'
                              : c.categoriesCount === 1
                                ? 'category'
                                : 'categories'}
                          </>
                        ) : (
                          <>{isRu ? 'операционный кабинет' : 'operational workspace'}</>
                        )}
                        {c.audience === 'workspace' && (
                          <span className="ml-2 inline-flex items-center rounded-none border border-border/60 px-1.5 py-px text-[9px] uppercase tracking-[0.08em] text-muted-foreground/80">
                            {isRu ? 'Кабинет' : 'Workspace'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p className="mt-6 text-[12px] text-muted-foreground/70">
            {isRu
              ? `Каталог объединяет ${categoriesCount} категорий и ${totalEligibleServices} доступных сервисов. Войдите, чтобы открыть персональный навигатор.`
              : `The catalog spans ${categoriesCount} categories and ${totalEligibleServices} ready-to-use services. Sign in to unlock your personalized navigator.`}
          </p>
        </div>
      </section>

      <section className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-muted-foreground">
            {TRUST.map((t) => {
              const Icon = t.icon;
              return (
                <li key={t.en} className="inline-flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/70" strokeWidth={2} />
                  <span>{isRu ? t.ru : t.en}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24 text-center">
          <h2 className="text-[28px] sm:text-[40px] font-semibold tracking-[-0.025em] leading-[1.05]">
            {isRu ? (
              <>
                Один аккаунт.
                <br />
                Персональный маршрут по задачам.
              </>
            ) : (
              <>
                One account.
                <br />
                One personalized action path.
              </>
            )}
          </h2>
          <p className="mt-4 text-[14px] sm:text-[15px] text-muted-foreground">
            {isRu
              ? 'Создайте аккаунт и получите персональный маршрут по вашим задачам.'
              : 'Create an account and get a personalized route for your goals.'}
          </p>
          <div className="mt-7 flex justify-center">
            <Link
              to="/auth?mode=signup"
              className={cn(
                'group inline-flex h-12 items-center gap-2 rounded-none px-6 text-[14px] font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-all',
                'shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]'
              )}
            >
              {isRu ? 'Начать сейчас' : 'Start now'}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
          <p className="mt-8 text-[11px] tracking-[0.08em] text-muted-foreground/60">
            © myUNO · Phuket · Made for foreigners
          </p>
        </div>
      </section>

      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-3">
        <Link
          to="/auth?mode=signup"
          className="w-full inline-flex h-11 items-center justify-center gap-2 rounded-none bg-primary text-primary-foreground text-[14px] font-semibold"
        >
          {isRu ? 'Начать за 60 секунд' : 'Start in 60 seconds'}
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
