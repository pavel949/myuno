/**
 * WelcomeLanding — главный лендинг myUNO («/»).
 *
 * Тон: гражданская инфраструктура (GOV.UK, e-Estonia). Без продающей лексики.
 * Две конверсии равного веса:
 *   1) частный пользователь → «Создать аккаунт»
 *   2) местный бизнес     → «Стать партнёром» (/vendor/join)
 *
 * Структура (top → bottom):
 *   1.  Hero с двумя CTA и реальными счётчиками из useCatalogFromDB
 *   2.  Развилка «Я пришёл за…» (якорная навигация)
 *   3.  Для кого экосистема — 6 аудиторий
 *   4.  Что входит в экосистему — 6 кластеров Master Taxonomy v1.0
 *   5.  Как это работает — 3 пункта
 *   6.  Доверие и данные
 *   7.  Помощь в экстренной ситуации (ConciergeHelpSheet, без логина)
 *   8.  Для местных бизнесов
 *   9.  Для застройщиков
 *   10. Финальный двойной CTA + footer
 *   11. Sticky mobile bar — переключается между signup и partner по скроллу
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Plane,
  Home,
  TrendingUp,
  KeyRound,
  Building2,
  Briefcase,
  ShieldCheck,
  Languages,
  Wallet,
  FileCheck2,
  ClipboardCheck,
  Headphones,
  Database,
  LifeBuoy,
  CircleDot,
  HeartPulse,
  CarFront,
  FileWarning,
  Gavel,
  Compass,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { useCatalogFromDB } from '@/lib/catalog/useCatalogFromDB';
import { buildCatalogAudienceMetrics } from '@/lib/catalog/catalogMetrics';
import { APP_ROUTES } from '@/lib/config/routes';
import { LandingChrome } from '@/components/landings';
import {
  LandingContainer,
  LandingHero,
  LandingSection,
} from '@/components/landings/LandingPrimitives';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';

type Bi = { ru: string; en: string };
const tx = (isRu: boolean, v: Bi) => (isRu ? v.ru : v.en);

/** Russian plural for «N сервис(а/ов)». */
function pluralRu(n: number, forms: [string, string, string]): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} ${forms[0]}`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return `${n} ${forms[1]}`;
  return `${n} ${forms[2]}`;
}

function useWelcomeMetrics() {
  const { clusters, categories } = useCatalogFromDB();
  return useMemo(
    () => buildCatalogAudienceMetrics(clusters, categories, { personas: [], role: null }),
    [clusters, categories],
  );
}

/* ------------------------------------------------------------------ */
/*  Контент: 6 аудиторий                                              */
/* ------------------------------------------------------------------ */

const AUDIENCES: Array<{
  id: string;
  icon: LucideIcon;
  title: Bi;
  lead: Bi;
  tasks: Bi[];
  href: string;
}> = [
  {
    id: 'tourist',
    icon: Plane,
    title: { ru: 'Турист и гость', en: 'Tourist & guest' },
    lead: {
      ru: 'Поездка на Пхукет: всё, что нужно от прилёта до возвращения.',
      en: 'A trip to Phuket: everything from arrival to departure.',
    },
    tasks: [
      { ru: 'Трансфер из аэропорта и аренда транспорта', en: 'Airport transfer and vehicle rental' },
      { ru: 'SIM-карта, обмен валюты, страховка', en: 'SIM card, currency exchange, insurance' },
      { ru: 'Экскурсии, яхты, рестораны, бьюти', en: 'Tours, yachts, restaurants, beauty' },
      { ru: 'Врач и помощь 24/7 на родном языке', en: 'Doctor and 24/7 help in your language' },
    ],
    href: APP_ROUTES.ARRIVE_CLUSTER,
  },
  {
    id: 'resident',
    icon: Home,
    title: { ru: 'Резидент', en: 'Resident' },
    lead: {
      ru: 'Жизнь на острове: жильё, дети, медицина, быт и сопровождение.',
      en: 'Life on the island: housing, children, medicine, daily routines.',
    },
    tasks: [
      { ru: 'Долгосрочная аренда и покупка жилья', en: 'Long-term rental and home purchase' },
      { ru: 'Школа, детский сад, врач, аптека', en: 'School, kindergarten, doctor, pharmacy' },
      { ru: 'Транспорт, банк, коммунальные платежи', en: 'Transport, bank, utility payments' },
      { ru: 'Бытовые услуги: уборка, ремонт, доставка', en: 'Daily services: cleaning, repairs, delivery' },
    ],
    href: APP_ROUTES.LIVE_CLUSTER,
  },
  {
    id: 'investor',
    icon: TrendingUp,
    title: { ru: 'Инвестор', en: 'Investor' },
    lead: {
      ru: 'Подбор и сопровождение сделок с проверкой и независимым рейтингом.',
      en: 'Deal sourcing and end-to-end support with independent ratings.',
    },
    tasks: [
      { ru: 'Подбор объектов под цель и бюджет', en: 'Property selection by goal and budget' },
      { ru: 'Независимый рейтинг ClearView для off-plan', en: 'ClearView independent rating for off-plan' },
      { ru: 'Юридическая и налоговая проверка', en: 'Legal and tax due diligence' },
      { ru: 'Сопровождение сделки и стратегия выхода', en: 'Deal execution and exit strategy' },
    ],
    href: APP_ROUTES.INVEST_CLUSTER,
  },
  {
    id: 'owner',
    icon: KeyRound,
    title: { ru: 'Собственник жилья', en: 'Property owner' },
    lead: {
      ru: 'Управление объектом из любой страны: бронирования, отчёты, обслуживание.',
      en: 'Manage your property from anywhere: bookings, reports, maintenance.',
    },
    tasks: [
      { ru: 'Управление арендой и каналами бронирования', en: 'Rental management and channel sync' },
      { ru: 'Уборка, ремонт, плановое обслуживание', en: 'Cleaning, repairs, scheduled maintenance' },
      { ru: 'P&L, отчёты владельцу, налоговые документы', en: 'P&L, owner statements, tax documents' },
      { ru: 'Доступ команды и владельца из-за рубежа', en: 'Team and owner access from abroad' },
    ],
    href: APP_ROUTES.MANAGE_CLUSTER,
  },
  {
    id: 'developer',
    icon: Building2,
    title: { ru: 'Застройщик', en: 'Developer' },
    lead: {
      ru: 'Витрина проекта, проверка и поток заявок от целевой аудитории.',
      en: 'Project showcase, independent review and qualified inbound leads.',
    },
    tasks: [
      { ru: 'Профиль проекта и портал застройщика', en: 'Project profile and developer portal' },
      { ru: 'Сертификация по методологии ClearView', en: 'ClearView certification methodology' },
      { ru: 'Маркетинг для иностранной аудитории', en: 'Marketing for international audience' },
      { ru: 'Прозрачные правила работы и отчётность', en: 'Transparent rules of engagement and reporting' },
    ],
    href: APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS,
  },
  {
    id: 'business',
    icon: Briefcase,
    title: { ru: 'Бизнес и предприниматель', en: 'Business & entrepreneur' },
    lead: {
      ru: 'Регистрация, бухгалтерия, визы команды, помещение и сопровождение.',
      en: 'Registration, accounting, team visas, premises and ongoing support.',
    },
    tasks: [
      { ru: 'Регистрация компании и бухгалтерия', en: 'Company registration and accounting' },
      { ru: 'Визы для основателя и сотрудников', en: 'Visas for founder and employees' },
      { ru: 'Поиск помещения и юридическое сопровождение', en: 'Premises search and legal support' },
      { ru: 'Выход на иностранную аудиторию', en: 'Reach an international customer base' },
    ],
    href: APP_ROUTES.LEGAL_CLUSTER,
  },
];

/* ------------------------------------------------------------------ */

const HOW_IT_WORKS: Bi[] = [
  {
    ru: 'Один аккаунт и один профиль для всех сервисов экосистемы.',
    en: 'One account and one profile across every service in the ecosystem.',
  },
  {
    ru: 'Исполнители проходят KYC и проверку документов. Оплата защищена до получения услуги; спор решает платформа.',
    en: 'Providers pass KYC and document checks. Payments are held until delivery; disputes are resolved by the platform.',
  },
  {
    ru: 'Запрос идёт через myUNO — координацию, перевод и контроль ведёт консьерж. Прямые контакты исполнителей не показываются.',
    en: 'Requests go through myUNO — the concierge handles coordination, translation and oversight. Provider contacts are not exposed.',
  },
];

const TRUST_FACTS: { icon: React.ComponentType<{ className?: string }>; text: Bi }[] = [
  { icon: ShieldCheck, text: { ru: 'KYC уровня банка', en: 'Bank-grade KYC' } },
  { icon: FileCheck2, text: { ru: 'Юридическое лицо в Таиланде', en: 'Registered entity in Thailand' } },
  { icon: Database, text: { ru: 'Хранение данных по PDPA', en: 'Data stored in line with PDPA' } },
  { icon: Headphones, text: { ru: 'Поддержка 24/7 — RU · EN · TH', en: '24/7 support — RU · EN · TH' } },
  { icon: Wallet, text: { ru: 'Открытые цены в ฿, $, ₽, €', en: 'Transparent prices in ฿, $, ₽, €' } },
  { icon: ClipboardCheck, text: { ru: 'Аудит-метка на каждой транзакции', en: 'Audit marker on every transaction' } },
];

const EMERGENCY_ITEMS: { icon: React.ComponentType<{ className?: string }>; text: Bi }[] = [
  { icon: HeartPulse, text: { ru: 'Медицинская помощь и госпитализация', en: 'Medical assistance and hospitalisation' } },
  { icon: CarFront, text: { ru: 'ДТП и оформление страхового случая', en: 'Road accident and insurance claim' } },
  { icon: FileWarning, text: { ru: 'Потеря документов и связь с консульством', en: 'Lost documents and consulate liaison' } },
  { icon: Gavel, text: { ru: 'Правовая защита и срочный юрист', en: 'Legal protection and urgent lawyer' } },
  { icon: LifeBuoy, text: { ru: 'Эвакуация и сопровождение в больнице', en: 'Evacuation and in-hospital support' } },
];

const PARTNER_BENEFITS: { title: Bi; body: Bi }[] = [
  {
    title: { ru: 'Поток заявок от верифицированных клиентов', en: 'Inbound from verified customers' },
    body: {
      ru: 'Запросы приходят от пользователей экосистемы, прошедших KYC, с понятным контекстом и историей.',
      en: 'Requests come from KYC-verified ecosystem users with full context and history.',
    },
  },
  {
    title: { ru: 'Прозрачные комиссии и защищённая оплата', en: 'Transparent fees and protected payments' },
    body: {
      ru: 'Условия фиксируются заранее. Оплата клиента удерживается до подтверждения исполнения.',
      en: 'Terms are agreed upfront. Customer payment is held until the service is confirmed.',
    },
  },
  {
    title: { ru: 'Единая репутация на платформе', en: 'A single platform-wide reputation' },
    body: {
      ru: 'Профиль, отзывы и история сделок видны клиенту. Репутация накапливается и работает на вас.',
      en: 'Profile, reviews and deal history are visible to the customer. Reputation compounds.',
    },
  },
];

const PARTNER_CATEGORIES: Bi = {
  ru: 'Услуги для жилья, перевозки и логистика, медицина, юристы, бухгалтерия, ремонт, транспорт, экскурсии, образование, бьюти, IT и другие категории.',
  en: 'Home services, moving and logistics, medical, legal, accounting, repairs, transport, tours, education, beauty, IT and more.',
};

/* ------------------------------------------------------------------ */

export default function WelcomeLanding() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const { byCluster, totalEligibleServices, clustersCount: _allClusters, totalActiveLifeSituations } =
    useWelcomeMetrics();
  // Гость видит только accessible-кластеры (manage/workspace скрыт). Считаем по факту,
  // чтобы цифра в hero совпадала с тем, что реально отрендерено в секции «Что входит».
  const visibleClusters = useMemo(
    () => byCluster.filter((c) => c.isAccessibleToViewer && c.servicesCount > 0),
    [byCluster],
  );
  const clustersCount = visibleClusters.length;
  void _allClusters;

  const [helpOpen, setHelpOpen] = useState(false);

  /* Sticky bar: переключаемся на partner CTA, когда виден блок «Для бизнесов». */
  const partnerRef = useRef<HTMLDivElement | null>(null);
  const [stickyMode, setStickyMode] = useState<'signup' | 'partner'>('signup');
  useEffect(() => {
    const el = partnerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setStickyMode(entry.isIntersecting ? 'partner' : 'signup'),
      { rootMargin: '-30% 0px -30% 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const heroStats = [
    {
      num: String(totalEligibleServices),
      label: isRu ? 'сервисов' : 'services',
    },
    {
      num: String(clustersCount),
      label: isRu ? 'разделов' : 'sections',
    },
    {
      num: String(totalActiveLifeSituations),
      label: isRu ? 'жизненных ситуаций' : 'life situations',
    },
    { num: '24/7', label: isRu ? 'поддержка' : 'support' },
  ];

  const ecosystemHeading = isRu
    ? `${pluralRu(clustersCount, ['раздел', 'раздела', 'разделов'])}, ${pluralRu(
        totalEligibleServices,
        ['сервис', 'сервиса', 'сервисов'],
      )} — один аккаунт`
    : `${clustersCount} sections, ${totalEligibleServices} services — one account`;

  const heroSubtitle: Bi = {
    ru: `Экосистема myUNO объединяет ${totalEligibleServices} проверенных сервисов для иностранцев и местных бизнесов, готовых их обслуживать — в одном аккаунте, на русском, английском и тайском.`,
    en: `The myUNO ecosystem brings together ${totalEligibleServices} vetted services for foreigners and the local businesses that serve them — in one account, in Russian, English and Thai.`,
  };

  return (
    <div
      data-testid="welcome-landing"
      className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary pb-20 sm:pb-0"
    >
      <LandingChrome isRu={isRu} />

      {/* ============================ 1. HERO ============================ */}
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
            className="inline-flex items-center gap-2 rounded-none border border-border bg-card/60 px-3 py-1 font-sans text-caption font-medium uppercase tracking-[0.12em] text-muted-foreground"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">myUNO</span>
            <span>{tx(isRu, { ru: 'инфраструктура для жизни', en: 'infrastructure for living' })}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-display mt-5 max-w-3xl text-h1 font-normal leading-[1.05] tracking-tight sm:text-display"
          >
            {tx(isRu, { ru: 'Инфраструктура для жизни', en: 'Infrastructure for living' })}
            <br />
            {tx(isRu, { ru: 'на Пхукете', en: 'on Phuket' })}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-2xl font-sans text-body-lg font-normal leading-relaxed text-muted-foreground"
          >
            {tx(isRu, heroSubtitle)}
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
                'group inline-flex h-11 min-w-[200px] items-center justify-center gap-2 rounded-none px-5 font-sans text-body font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {tx(isRu, { ru: 'Создать аккаунт', en: 'Create account' })}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              to={APP_ROUTES.VENDOR_JOIN}
              data-testid="welcome-cta-partner"
              className={cn(
                'inline-flex h-11 min-w-[200px] items-center justify-center gap-2 rounded-none border border-foreground px-5 font-sans text-body font-medium text-foreground',
                'hover:bg-foreground hover:text-background transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {tx(isRu, { ru: 'Стать партнёром', en: 'Become a partner' })}
            </Link>
          </motion.div>

          <p className="mt-3 font-sans text-caption text-muted-foreground">
            {tx(isRu, { ru: 'Уже есть аккаунт — ', en: 'Already registered — ' })}
            <Link
              to={APP_ROUTES.AUTH}
              className="underline underline-offset-4 hover:text-foreground"
            >
              {tx(isRu, { ru: 'войти', en: 'sign in' })}
            </Link>
          </p>

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

      {/* ============================ 2. РАЗВИЛКА ============================ */}
      <LandingSection>
        <LandingContainer className="py-8 sm:py-10">
          <p className="mb-4 font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
            {tx(isRu, { ru: 'Я пришёл за…', en: 'I am here to…' })}
          </p>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2">
            <a
              href="#for-audiences"
              className="group flex items-start gap-4 bg-background p-5 transition-colors hover:bg-card/50"
            >
              <Compass className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="font-sans text-h4 font-medium tracking-tight text-foreground">
                  {tx(isRu, { ru: 'Решить свой вопрос', en: 'Resolve my own matter' })}
                </div>
                <div className="mt-1 font-sans text-body-sm text-muted-foreground">
                  {tx(isRu, {
                    ru: 'Найти нужный сервис, получить сопровождение, оформить заявку.',
                    en: 'Find the right service, get support, submit a request.',
                  })}
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </a>
            <a
              href="#for-partners"
              className="group flex items-start gap-4 bg-background p-5 transition-colors hover:bg-card/50"
            >
              <Briefcase className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <div className="font-sans text-h4 font-medium tracking-tight text-foreground">
                  {tx(isRu, { ru: 'Предложить свои услуги', en: 'Offer my services' })}
                </div>
                <div className="mt-1 font-sans text-body-sm text-muted-foreground">
                  {tx(isRu, {
                    ru: 'Подключиться к экосистеме как проверенный исполнитель.',
                    en: 'Join the ecosystem as a verified provider.',
                  })}
                </div>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </a>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 3. АУДИТОРИИ ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20 scroll-mt-20">
          <span id="for-audiences" className="block -mt-20 pt-20" aria-hidden />
          <div className="mb-8 max-w-2xl space-y-3">
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(isRu, { ru: 'Для кого экосистема', en: 'Who the ecosystem is for' })}
            </h2>
            <p className="font-sans text-body-sm font-normal leading-relaxed text-muted-foreground">
              {tx(isRu, {
                ru: 'Каждая из аудиторий получает свой набор сервисов и сопровождение. Один аккаунт — для всех ролей в одной жизни.',
                en: 'Each audience gets a tailored set of services and support. One account covers every role in one life.',
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              return (
                <Link
                  key={a.id}
                  to={a.href}
                  data-testid={`welcome-audience-${a.id}`}
                  className="group flex flex-col gap-3 bg-background p-6 transition-colors hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-card text-foreground">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">
                      {tx(isRu, a.title)}
                    </h3>
                  </div>
                  <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                    {tx(isRu, a.lead)}
                  </p>
                  <ul className="mt-1 space-y-1.5 font-sans text-body-sm text-foreground/85">
                    {a.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CircleDot className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={2} />
                        <span>{tx(isRu, task)}</span>
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 font-sans text-caption font-medium uppercase tracking-[0.12em] text-foreground transition-transform group-hover:translate-x-0.5">
                    {tx(isRu, { ru: 'Перейти в раздел', en: 'Open section' })}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </Link>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 4. КЛАСТЕРЫ ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="mb-8 max-w-2xl space-y-3">
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(isRu, { ru: 'Что входит в экосистему', en: 'What the ecosystem includes' })}
            </h2>
            <p className="font-sans text-body-sm font-normal leading-relaxed text-muted-foreground">
              {ecosystemHeading}.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
            {byCluster.map((c) => {
              const Icon = c.icon;
              const label = isRu ? c.labelRu : c.labelEn;
              const hint = isRu ? c.hintsRu : c.hintsEn;
              if (!c.servicesCount) return null;
              return (
                <button
                  key={c.id}
                  type="button"
                  data-testid="welcome-cluster-card"
                  data-cluster-id={c.id}
                  onClick={() => navigate(c.homeRoute)}
                  className="group flex flex-col gap-3 bg-background p-6 text-left transition-colors hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center border border-border bg-card text-foreground">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-caption tabular-nums text-muted-foreground">
                      {isRu
                        ? pluralRu(c.servicesCount, ['сервис', 'сервиса', 'сервисов'])
                        : `${c.servicesCount} ${c.servicesCount === 1 ? 'service' : 'services'}`}
                    </span>
                  </div>
                  <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">
                    {label}
                  </h3>
                  <p className="font-sans text-body-sm leading-relaxed text-muted-foreground line-clamp-3">
                    {hint}
                  </p>
                </button>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 5. КАК РАБОТАЕТ ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(isRu, { ru: 'Как это работает', en: 'How it works' })}
            </h2>
          </div>
          <ol className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={i} className="flex flex-col gap-3 bg-background p-6">
                <span className="font-mono text-caption font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="font-sans text-body leading-relaxed text-foreground">
                  {tx(isRu, step)}
                </p>
              </li>
            ))}
          </ol>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 6. ДОВЕРИЕ ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(isRu, { ru: 'Доверие и данные', en: 'Trust & data' })}
            </h2>
            <p className="mt-3 font-sans text-body-sm leading-relaxed text-muted-foreground">
              {tx(isRu, {
                ru: 'Сухие факты, без обещаний. Подробнее — в разделах «Конфиденциальность» и «Условия».',
                en: 'Facts, not promises. See Privacy and Terms for details.',
              })}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_FACTS.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="flex items-center gap-3 bg-background p-5">
                  <Icon className="h-5 w-5 shrink-0 text-foreground" />
                  <span className="font-sans text-body-sm text-foreground">{tx(isRu, f.text)}</span>
                </div>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 7. ЭКСТРЕННАЯ ПОМОЩЬ ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(0,1.2fr)]">
            <div className="space-y-3">
              <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
                {tx(isRu, { ru: 'Помощь в экстренной ситуации', en: 'Help in an emergency' })}
              </h2>
              <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                {tx(isRu, {
                  ru: 'Доступно гостю без аккаунта. Запрос принимает дежурный консьерж — на русском, английском или тайском.',
                  en: 'Available without an account. A duty concierge receives the request — in Russian, English or Thai.',
                })}
              </p>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                data-testid="welcome-cta-emergency"
                className="mt-2 inline-flex h-11 items-center gap-2 rounded-none border border-foreground bg-foreground px-5 font-sans text-body font-semibold text-background hover:bg-foreground/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <LifeBuoy className="h-4 w-4" strokeWidth={2} />
                {tx(isRu, { ru: 'Запросить помощь', en: 'Request help' })}
              </button>
            </div>
            <ul className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2">
              {EMERGENCY_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-center gap-3 bg-background p-4">
                    <Icon className="h-4 w-4 shrink-0 text-foreground" />
                    <span className="font-sans text-body-sm text-foreground">{tx(isRu, item.text)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 8. ДЛЯ БИЗНЕСОВ ============================ */}
      <div ref={partnerRef}>
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20 scroll-mt-20">
          <span id="for-partners" className="block -mt-20 pt-20" aria-hidden />
          <div className="mb-8 max-w-3xl space-y-3">
            <p className="font-sans text-caption uppercase tracking-[0.14em] text-primary">
              {tx(isRu, { ru: 'Для местных бизнесов', en: 'For local businesses' })}
            </p>
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(isRu, {
                ru: 'Работайте с иностранной аудиторией по прозрачным правилам',
                en: 'Work with an international audience by transparent rules',
              })}
            </h2>
            <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
              {tx(isRu, {
                ru: 'Экосистема myUNO открыта для проверенных исполнителей: подключение к потоку заявок, прозрачные комиссии, единая репутация.',
                en: 'The myUNO ecosystem is open to verified providers: access to inbound, transparent fees, a single reputation across the platform.',
              })}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 lg:grid-cols-3">
            {PARTNER_BENEFITS.map((b, i) => (
              <div key={i} className="bg-background p-6">
                <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">
                  {tx(isRu, b.title)}
                </h3>
                <p className="mt-2 font-sans text-body-sm leading-relaxed text-muted-foreground">
                  {tx(isRu, b.body)}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6 border-l-2 border-border pl-4 font-sans text-body-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              {tx(isRu, { ru: 'Кому подходит: ', en: 'Who can join: ' })}
            </span>
            {tx(isRu, PARTNER_CATEGORIES)}
          </div>

          <Link
            to={APP_ROUTES.VENDOR_JOIN}
            data-testid="welcome-cta-partner-bottom"
            className="inline-flex h-11 min-w-[200px] items-center justify-center gap-2 rounded-none bg-primary px-5 font-sans text-body font-semibold text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {tx(isRu, { ru: 'Стать партнёром', en: 'Become a partner' })}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 9. ДЛЯ ЗАСТРОЙЩИКОВ ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl space-y-3">
              <p className="font-sans text-caption uppercase tracking-[0.14em] text-primary">
                {tx(isRu, { ru: 'Для застройщиков', en: 'For developers' })}
              </p>
              <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
                {tx(isRu, {
                  ru: 'Прозрачная витрина и независимая проверка проекта',
                  en: 'A transparent showcase and independent project review',
                })}
              </h2>
              <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                {tx(isRu, {
                  ru: 'Профиль проекта, методология ClearView и поток квалифицированных заявок от иностранной аудитории. Регистрация — через лендинг для застройщиков.',
                  en: 'Project profile, ClearView methodology and qualified inbound from international buyers. Registration via the developer landing.',
                })}
              </p>
            </div>
            <Link
              to={APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS}
              data-testid="welcome-cta-developers"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-none border border-foreground px-5 font-sans text-body font-medium text-foreground hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {tx(isRu, { ru: 'Портал застройщика', en: 'Developer portal' })}
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
          </div>
        </LandingContainer>
      </LandingSection>
      </div>

      {/* ============================ 10. ФИНАЛЬНЫЙ CTA + FOOTER ============================ */}
      <LandingSection border={false}>
        <LandingContainer className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <h2 className="font-display text-h1 font-normal leading-[1.05] tracking-tight sm:text-display">
            {tx(isRu, { ru: 'Один аккаунт —', en: 'One account —' })}
            <br />
            {tx(isRu, { ru: 'вся жизнь на Пхукете', en: 'a full life on Phuket' })}
          </h2>
          <p className="mt-4 font-sans text-body-sm text-muted-foreground sm:text-body">
            {tx(isRu, {
              ru: 'Создайте аккаунт за минуту или подайте заявку на подключение бизнеса. Без обязательств.',
              en: 'Create an account in a minute, or apply to join as a business. No commitments.',
            })}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to={`${APP_ROUTES.AUTH}?mode=signup`}
              className={cn(
                'group inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-none px-6 font-sans text-body font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {tx(isRu, { ru: 'Создать аккаунт', en: 'Create account' })}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              to={APP_ROUTES.VENDOR_JOIN}
              className={cn(
                'inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-none border border-foreground px-6 font-sans text-body font-medium text-foreground',
                'hover:bg-foreground hover:text-background transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {tx(isRu, { ru: 'Стать партнёром', en: 'Become a partner' })}
            </Link>
          </div>

          <nav
            aria-label={isRu ? 'Юридическая информация и поддержка' : 'Legal and support'}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-caption text-muted-foreground"
          >
            <Link to={APP_ROUTES.PRIVACY} className="hover:text-foreground transition-colors">
              {tx(isRu, { ru: 'Конфиденциальность', en: 'Privacy' })}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link to={APP_ROUTES.TERMS} className="hover:text-foreground transition-colors">
              {tx(isRu, { ru: 'Условия', en: 'Terms' })}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link to={APP_ROUTES.SUPPORT} className="hover:text-foreground transition-colors">
              {tx(isRu, { ru: 'Поддержка', en: 'Support' })}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link to={APP_ROUTES.CONTACT} className="hover:text-foreground transition-colors">
              {tx(isRu, { ru: 'Контакты', en: 'Contact' })}
            </Link>
          </nav>

          <p className="mt-6 inline-flex items-center gap-1.5 font-sans text-caption tracking-[0.08em] text-muted-foreground/60">
            <Languages className="h-3 w-3" />
            RU · EN · TH · © myUNO
          </p>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 11. STICKY MOBILE ============================ */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:hidden">
        {stickyMode === 'partner' ? (
          <Link
            to={APP_ROUTES.VENDOR_JOIN}
            data-testid="welcome-sticky-partner"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-none border border-foreground bg-foreground font-sans text-body font-semibold text-background"
          >
            {tx(isRu, { ru: 'Стать партнёром', en: 'Become a partner' })}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        ) : (
          <Link
            to={`${APP_ROUTES.AUTH}?mode=signup`}
            data-testid="welcome-sticky-signup"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-none bg-primary font-sans text-body font-semibold text-primary-foreground"
          >
            {tx(isRu, { ru: 'Создать аккаунт', en: 'Create account' })}
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </Link>
        )}
      </div>

      <ConciergeHelpSheet
        open={helpOpen}
        onOpenChange={setHelpOpen}
        topic="general"
        initialSubject={isRu ? 'Экстренная помощь' : 'Emergency assistance'}
        sourceData={{ source_page: 'welcome_landing', emergency: true }}
      />
    </div>
  );
}
