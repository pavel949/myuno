/**
 * WelcomeLanding — первый экран для неавторизованных пользователей.
 *
 * Стиль: Vercel-минимализм (геометрия, hairline borders, mono-цифры,
 * тонкая типографика) + myUNO mint accent.
 *
 * Цели экрана:
 *  1) За 3 секунды объяснить ЧТО такое myUNO (40+ сервисов в одном)
 *  2) Показать 6 кластеров и сигналы доверия
 *  3) Один первичный CTA → /auth (signup), вторичный → /auth (login)
 *
 * Логика signIn/signUp/OAuth не трогается — этот экран только маркетинговый.
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Briefcase,
  Plane,
  Heart,
  Scale,
  Hammer,
  Shield,
  Globe,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { cn } from '@/lib/utils';

type Cluster = {
  id: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  labelEn: string;
  labelRu: string;
  hintEn: string;
  hintRu: string;
};

const CLUSTERS: Cluster[] = [
  { id: 'arrive', icon: Plane, labelEn: 'Arrive', labelRu: 'Прилёт', hintEn: 'SIM · Transfer · eSIM', hintRu: 'SIM · Трансфер · eSIM' },
  { id: 'live', icon: Heart, labelEn: 'Live', labelRu: 'Жизнь', hintEn: 'Food · Beauty · Health', hintRu: 'Еда · Красота · Здоровье' },
  { id: 'manage', icon: Briefcase, labelEn: 'Manage', labelRu: 'Управление', hintEn: 'Property · PMS · Staff', hintRu: 'Объекты · PMS · Команда' },
  { id: 'invest', icon: Building2, labelEn: 'Invest', labelRu: 'Инвестиции', hintEn: 'Off-plan · Resale · Deals', hintRu: 'Новостройки · Resale · Сделки' },
  { id: 'legal', icon: Scale, labelEn: 'Legal', labelRu: 'Юр.услуги', hintEn: 'Visa · Company · KYC', hintRu: 'Виза · Компания · KYC' },
  { id: 'build', icon: Hammer, labelEn: 'Build', labelRu: 'Строительство', hintEn: 'Renovation · Design', hintRu: 'Ремонт · Дизайн' },
];

const TRUST = [
  { icon: Shield, en: 'Bank-grade KYC', ru: 'KYC банковского уровня' },
  { icon: Globe, en: 'EN · RU · TH', ru: 'EN · RU · TH' },
  { icon: Sparkles, en: 'AI concierge', ru: 'AI-консьерж' },
];

export default function WelcomeLanding() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
              <span className="text-[11px] font-bold tracking-tight">M</span>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              myUNO
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <Link
              to="/auth"
              className="hidden sm:inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRu ? 'Войти' : 'Sign in'}
            </Link>
            <Link
              to="/auth?mode=signup"
              className={cn(
                'inline-flex h-8 items-center gap-1 rounded-md px-3 text-[13px] font-semibold',
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
        {/* Subtle grid background */}
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
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {isRu ? 'Phuket · Live now' : 'Phuket · Live now'}
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
                Жизнь иностранца{' '}
                <span className="text-muted-foreground/60">на Пхукете —</span>{' '}
                <span className="text-primary">в одном приложении.</span>
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
              ? '40+ сервисов: недвижимость, аренда, трансферы, виза, доставка, услуги для дома. Один аккаунт. Один кошелёк. AI-консьерж 24/7.'
              : '40+ services: property, rentals, airport transfers, visa, delivery, home care. One account. One wallet. AI concierge 24/7.'}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className={cn(
                'group inline-flex h-11 items-center gap-2 rounded-lg px-5 text-[14px] font-semibold',
                'bg-foreground text-background hover:bg-foreground/90 transition-all',
                'shadow-[0_1px_0_0_hsl(var(--background))_inset,0_0_0_1px_hsl(var(--foreground))]'
              )}
            >
              {isRu ? 'Создать аккаунт' : 'Create account'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="inline-flex h-11 items-center rounded-lg border border-border bg-card/40 px-5 text-[14px] font-medium text-foreground hover:bg-card transition-colors"
            >
              {isRu ? 'У меня есть аккаунт' : 'I have an account'}
            </button>
          </motion.div>

          {/* Stat row — mono numbers, Vercel style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border/50 max-w-2xl"
          >
            {[
              { num: '40+', en: 'micro-apps', ru: 'микро-приложений' },
              { num: '6', en: 'life clusters', ru: 'кластеров жизни' },
              { num: '24/7', en: 'AI concierge', ru: 'AI-консьерж' },
            ].map((s) => (
              <div key={s.num} className="bg-background px-5 py-4">
                <div className="font-mono text-[22px] font-semibold tracking-tight tabular-nums">
                  {s.num}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                  {isRu ? s.ru : s.en}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Clusters grid */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em]">
              {isRu ? 'Шесть кластеров жизни' : 'Six clusters of life'}
            </h2>
            <span className="hidden sm:inline text-[12px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
              {isRu ? '01 → 06' : '01 → 06'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border/50">
            {CLUSTERS.map((c, i) => {
              const Icon = c.icon;
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="group relative bg-background p-5 sm:p-6 hover:bg-card/40 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-card text-foreground group-hover:border-primary/40 group-hover:text-primary transition-colors">
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-[15px] font-semibold tracking-tight">
                          {isRu ? c.labelRu : c.labelEn}
                        </h3>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {isRu ? c.hintRu : c.hintEn}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
            {isRu
              ? 'Один аккаунт. Вся жизнь на острове.'
              : 'One account. Everything you need.'}
          </h2>
          <p className="mt-4 text-[14px] sm:text-[15px] text-muted-foreground">
            {isRu
              ? 'Бесплатно. 60 секунд на регистрацию.'
              : 'Free. 60 seconds to sign up.'}
          </p>
          <div className="mt-7 flex justify-center">
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className={cn(
                'group inline-flex h-12 items-center gap-2 rounded-lg px-6 text-[14px] font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-all',
                'shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.5)]'
              )}
            >
              {isRu ? 'Начать сейчас' : 'Start now'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </button>
          </div>

          <p className="mt-8 text-[11px] uppercase tracking-[0.14em] text-muted-foreground/60">
            {isRu
              ? '© myUNO · Phuket · Made for foreigners'
              : '© myUNO · Phuket · Made for foreigners'}
          </p>
        </div>
      </section>
    </div>
  );
}
