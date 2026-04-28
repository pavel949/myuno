/**
 * WelcomeLanding — первый экран для неавторизованных пользователей.
 *
 * Стиль: Vercel-минимализм + myUNO mint accent.
 *
 * Источник истины по кластерам/категориям/сервисам:
 *   `src/lib/catalog/taxonomy.ts` (SSOT, 6 кластеров × 16 категорий × ~80 сервисов).
 *
 * Все счётчики на этом экране берутся напрямую из SSOT — никаких
 * параллельных списков и магических чисел.
 */
import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Shield,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { APP_ROUTES } from '@/lib/config/routes';

/**
 * Считаем сервисы и категории на каждый кластер из ЖИВОЙ БД (Master Taxonomy v1.0).
 * Хук фолбечится на статический SSOT, если БД недоступна.
 * Числа на лендинге всегда совпадают с тем, что показывает навигатор.
 */
function useClusterStats() {
  const { clusters, categories } = useCatalogFromDB();
  return useMemo(() => {
    const totalServices = categories.reduce((sum, cat) => sum + cat.services.length, 0);
    const byCluster = clusters.map((c) => {
      const cats = categories.filter((cat) => cat.clusterId === c.id);
      const services = cats.reduce((sum, cat) => sum + cat.services.length, 0);
      const isWorkspaceEmpty = c.audience === 'workspace' && services === 0;
      return {
        ...c,
        categoriesCount: cats.length,
        servicesCount: services,
        hintsRu: isWorkspaceEmpty ? c.valueRu : cats.slice(0, 4).map((cat) => cat.labelRu).join(' · '),
        hintsEn: isWorkspaceEmpty ? c.valueEn : cats.slice(0, 4).map((cat) => cat.labelEn).join(' · '),
      };
    });
    return { byCluster, totalServices, clustersCount: clusters.length };
  }, [clusters, categories]);
}

const TRUST = [
  { icon: Shield, en: 'Bank-grade KYC', ru: 'KYC банковского уровня' },
  { icon: Globe, en: 'EN · RU · TH', ru: 'EN · RU · TH' },
  { icon: Sparkles, en: 'AI concierge', ru: 'AI-консьерж' },
];

// Реальное количество жизненных ситуаций в БД (`life_situations` where is_active).
// Проверено 2026-04-24, держим вручную — если сильно поменяется, обновим.
const LIFE_SITUATIONS_COUNT = 17;

export default function WelcomeLanding() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { byCluster, totalServices, clustersCount } = useClusterStats();
  const categoriesCount = byCluster.reduce((sum, c) => sum + c.categoriesCount, 0);

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid h-7 w-7 place-items-center rounded-none bg-primary/15 text-primary ring-1 ring-primary/30">
              <span className="text-[11px] font-bold tracking-tight">M</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              myUNO
            </span>
          </Link>

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

      {/* Hero */}
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
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {isRu ? (
              <>
                <span className="font-semibold text-primary">ПХУКЕТ</span>
                <span className="text-muted-foreground">· LIVE</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-primary">PHUKET</span>
                <span className="text-muted-foreground">· LIVE NOW</span>
              </>
            )}
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 text-[40px] sm:text-[64px] font-semibold leading-[1.02] tracking-[-0.035em] max-w-3xl"
          >
            {isRu ? (
              <>
                Жизнь за границей —<br />
                в одном приложении
              </>
            ) : (
              <>
                Your life abroad,{' '}
                <span className="text-muted-foreground/60">simplified —</span>{' '}
                <span className="text-primary">one account.</span>
              </>
            )}
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 max-w-xl text-[15px] sm:text-[17px] leading-relaxed text-muted-foreground"
          >
            {isRu
              ? `${totalServices}+ сервисов в единой платформе: переезд и документы, жильё и управление недвижимостью, транспорт, медицина и страхование, lifestyle и family-сервисы, инвестиции и юридическое сопровождение. Один аккаунт, единый платёжный контур, проверенные партнёры и поддержка 24/7.`
              : `${totalServices}+ services in one platform: relocation and documents, housing and property management, transport, healthcare and insurance, lifestyle and family services, investments and legal support. One account, one payment layer, verified partners, and 24/7 support.`}
          </motion.p>

          {/* CTAs */}
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
              {isRu ? 'Создать аккаунт' : 'Create account'}
              <ArrowRight className="h-4 w-4 transition-transform " strokeWidth={2.5} />
            </Link>
            <Link
              to="/auth"
              className="inline-flex h-11 items-center rounded-none border border-border bg-card/40 px-5 text-[14px] font-medium text-foreground hover:bg-card transition-colors"
            >
              {isRu ? 'У меня есть аккаунт' : 'I have an account'}
            </Link>
          </motion.div>

          {/* Stat row — реальные числа из SSOT и БД */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden rounded-none border border-border bg-border/50 max-w-3xl"
          >
            {[
              { num: String(totalServices), en: 'services in the unified catalog', ru: 'сервисов в едином каталоге' },
              { num: String(clustersCount), en: 'platform sections', ru: 'разделов платформы' },
              { num: String(LIFE_SITUATIONS_COUNT), en: 'life situations covered', ru: 'жизненных ситуаций' },
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

          {/* Clusters grid — 6 canonical navigation surfaces × 3 columns */}
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
              ? `Каталог объединяет ${categoriesCount} категорий и ${totalServices} сервисов. Войдите, чтобы открыть полный навигатор.`
              : `The catalog spans ${categoriesCount} categories and ${totalServices} services. Sign in to open the full navigator.`}
          </p>
        </div>
      </section>

      {/* Trust strip */}
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

      {/* Final CTA */}
      <section>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-24 text-center">
          <h2 className="text-[28px] sm:text-[40px] font-semibold tracking-[-0.025em] leading-[1.05]">
            {isRu ? (
              <>
                Один аккаунт.<br />
                Вся жизнь за рубежом.
              </>
            ) : (
              <>
                One account.<br />
                Everything you need.
              </>
            )}
          </h2>
          <p className="mt-4 text-[14px] sm:text-[15px] text-muted-foreground">
            {isRu
              ? 'Бесплатно. 60 секунд на регистрацию.'
              : 'Free. 60 seconds to sign up.'}
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
              <ArrowRight className="h-4 w-4 transition-transform " strokeWidth={2.5} />
            </Link>
          </div>

          <p className="mt-8 text-[11px] tracking-[0.08em] text-muted-foreground/60">
            © myUNO · Phuket · Made for foreigners
          </p>
        </div>
      </section>
    </div>
  );
}
