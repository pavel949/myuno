/**
 * Landing — new trust-first front door for myUNO («/» for guests).
 *
 * Positioning: "The trusted operating layer for Phuket."
 * Primary conversion: Submit a request (opens ConciergeHelpSheet).
 * Secondary: See how it works (scroll to concierge model).
 * Tertiary: Explore the ecosystem (/ecosystem).
 *
 * Replaces the breadth-first WelcomeLanding as the main public entry.
 * Authed users continue to land on Index (5-zone superapp) via HomeRouter.
 * WelcomeLanding remains in repo as fallback / archive.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Languages,
  Wallet,
  Headphones,
  ClipboardCheck,
  FileCheck2,
  Database,
  Home,
  Scale,
  Stethoscope,
  KeyRound,
  Briefcase,
  LifeBuoy,
  HeartPulse,
  CarFront,
  FileWarning,
  Gavel,
  Plane,
  TrendingUp,
  Building2,
  Users,
  Send,
  CircleAlert,
  Check,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { APP_ROUTES } from '@/lib/config/routes';
import { LandingChrome } from '@/components/landings';
import {
  LandingContainer,
  LandingHero,
  LandingSection,
} from '@/components/landings/LandingPrimitives';
import { ConciergeHelpSheet, type HelpTopic } from '@/components/concierge/ConciergeHelpSheet';

type Bi = { ru: string; en: string; th?: string };
type Lang = 'ru' | 'en' | 'th';

const tx = (lang: Lang, v: Bi): string => {
  if (lang === 'th' && v.th) return v.th;
  if (lang === 'en') return v.en;
  if (lang === 'ru') return v.ru;
  return v.en || v.ru;
};

/* ──────────────────────────────────────────────────────────────────── */
/*  Content                                                              */
/* ──────────────────────────────────────────────────────────────────── */

const TRUST_SIGNALS: { icon: LucideIcon; text: Bi }[] = [
  { icon: ShieldCheck, text: { ru: 'Проверенные исполнители', en: 'Verified providers', th: 'ผู้ให้บริการที่ตรวจสอบแล้ว' } },
  { icon: Languages, text: { ru: 'Поддержка RU · EN · TH', en: 'RU · EN · TH support', th: 'รองรับ RU · EN · TH' } },
  { icon: Wallet, text: { ru: 'Защищённые платежи', en: 'Protected payments', th: 'การชำระเงินที่ปลอดภัย' } },
  { icon: Headphones, text: { ru: 'Контроль консьержа', en: 'Concierge oversight', th: 'การกำกับดูแลโดยคอนเซียร์จ' } },
];

const TRUST_FACTS: { icon: LucideIcon; title: Bi; body: Bi }[] = [
  {
    icon: ShieldCheck,
    title: { ru: 'Верификация исполнителей', en: 'Provider verification' },
    body: {
      ru: 'KYC и проверка документов до того, как заявка дойдёт до клиента. Тайское юрлицо, отзывы и история работ привязаны к профилю.',
      en: 'KYC and document checks before any request reaches a client. Thai-registered entity, reviews and work history bound to the profile.',
    },
  },
  {
    icon: ClipboardCheck,
    title: { ru: 'Структурированная координация', en: 'Structured coordination' },
    body: {
      ru: 'Каждая заявка ведётся в системе: статус, переписка, документы, оплаты. Ничего не теряется между мессенджерами.',
      en: 'Every request runs in one system: status, correspondence, documents, payments. Nothing slips between messaging apps.',
    },
  },
  {
    icon: FileCheck2,
    title: { ru: 'Прозрачность условий', en: 'Transparent terms' },
    body: {
      ru: 'Стоимость, сроки и ответственность фиксируются до начала работы. Аудит-метка на каждой транзакции.',
      en: 'Price, timeline and responsibility are fixed before work begins. Audit marker on every transaction.',
    },
  },
  {
    icon: Languages,
    title: { ru: 'Три рабочих языка', en: 'Three working languages' },
    body: {
      ru: 'Заявка, документы и поддержка — на русском, английском или тайском. Перевод и сверку условий ведёт консьерж.',
      en: 'Requests, documents and support work in Russian, English or Thai. The concierge handles translation and term verification.',
    },
  },
  {
    icon: Database,
    title: { ru: 'Ответственность платформы', en: 'Platform accountability' },
    body: {
      ru: 'Одна точка входа. Спор решает myUNO; оплата удерживается до подтверждения исполнения.',
      en: 'One entry point. Disputes are resolved by myUNO; payment is held until delivery is confirmed.',
    },
  },
  {
    icon: Wallet,
    title: { ru: 'Открытые цены', en: 'Open pricing' },
    body: {
      ru: 'Цены и комиссии видны до подтверждения. Без скрытых платежей и переводов на личные счета.',
      en: 'Prices and fees are visible before confirmation. No hidden charges, no payments to personal accounts.',
    },
  },
];

const CONCIERGE_STEPS: { num: string; title: Bi; body: Bi }[] = [
  {
    num: '01',
    title: { ru: 'Расскажите, что нужно', en: 'Tell us what you need', th: 'บอกเราว่าคุณต้องการอะไร' },
    body: {
      ru: 'Короткая форма: ситуация, сроки, язык, удобный способ связи. Заявка попадает дежурному консьержу.',
      en: 'A short form: situation, timeline, language, preferred channel. The request goes to the duty concierge.',
    },
  },
  {
    num: '02',
    title: { ru: 'Подбираем проверенного исполнителя', en: 'We coordinate the right verified provider', th: 'เราจัดหาผู้ให้บริการที่ตรวจสอบแล้ว' },
    body: {
      ru: 'Сверяем требования, выбираем исполнителя из реестра myUNO, фиксируем стоимость и сроки. Прямые контакты не показываем.',
      en: 'We match requirements, pick a provider from the myUNO registry, lock price and timeline. Direct contacts are not exposed.',
    },
  },
  {
    num: '03',
    title: { ru: 'Сопровождаем до результата', en: 'We stay involved through delivery', th: 'เราดูแลจนกระทั่งงานเสร็จสมบูรณ์' },
    body: {
      ru: 'Перевод, оплата с защитой, контроль этапов и follow-up после закрытия. Спор решает платформа.',
      en: 'Translation, protected payment, milestone oversight and follow-up after closing. Disputes resolved by the platform.',
    },
  },
];

const USE_CASES: { icon: LucideIcon; title: Bi; body: Bi }[] = [
  {
    icon: Home,
    title: { ru: 'Жильё и долгосрочная аренда', en: 'Housing and long-term rental' },
    body: {
      ru: 'Подбор объекта, проверка договора, депозит, въезд. Без посредников, исчезающих после оплаты.',
      en: 'Property search, contract review, deposit, move-in. Without intermediaries who vanish after payment.',
    },
  },
  {
    icon: Scale,
    title: { ru: 'Визы, налоги, регистрация бизнеса', en: 'Visa, tax and company setup' },
    body: {
      ru: 'Сопровождение тайскими юристами и бухгалтерами под контролем платформы. Сроки и ответственность фиксированы.',
      en: 'Thai lawyers and accountants working under platform oversight. Timelines and accountability are fixed.',
    },
  },
  {
    icon: Stethoscope,
    title: { ru: 'Медицина и срочная помощь', en: 'Medical and urgent assistance' },
    body: {
      ru: 'Координация с больницей, страховой и переводчиком в стрессовый момент. На вашем языке, круглосуточно.',
      en: 'Coordination with the hospital, insurer and interpreter at the moment of stress. In your language, 24/7.',
    },
  },
  {
    icon: KeyRound,
    title: { ru: 'Удалённое управление недвижимостью', en: 'Remote property management' },
    body: {
      ru: 'Когда вы за границей, а в доме нужны уборка, ремонт, гости, отчёт по доходам — без чата в трёх мессенджерах.',
      en: 'When you are abroad and the home needs cleaning, repairs, guests and an owner statement — without three messenger threads.',
    },
  },
  {
    icon: Briefcase,
    title: { ru: 'Сложные локальные согласования', en: 'Sensitive local coordination' },
    body: {
      ru: 'Государственные органы, банки, страховые. Когда цена ошибки или языкового недопонимания высока.',
      en: 'Government bodies, banks, insurers. When the cost of a mistake or a language gap is high.',
    },
  },
];

const SAFER_CHAOS: Bi[] = [
  { ru: 'Случайные контакты из чатов', en: 'Random contacts from chat groups' },
  { ru: 'Языковые барьеры и недомолвки', en: 'Language barriers and unspoken terms' },
  { ru: 'Непонятно, с кого спросить за результат', en: 'Unclear who is accountable for the result' },
  { ru: 'Переписка размазана по мессенджерам', en: 'Conversations spread across messengers' },
  { ru: 'Оплата на личные счета без защиты', en: 'Payments to personal accounts, no protection' },
];

const SAFER_MYUNO: Bi[] = [
  { ru: 'Одна проверенная точка входа', en: 'A single trusted entry point' },
  { ru: 'Поддержка RU · EN · TH в одной заявке', en: 'RU · EN · TH support in one request' },
  { ru: 'Координацию ведёт консьерж', en: 'A concierge owns the coordination' },
  { ru: 'История, документы и оплаты в одном месте', en: 'History, documents and payments in one place' },
  { ru: 'Платёж удерживается до результата', en: 'Payment is held until delivery' },
];

const EMERGENCY_ITEMS: { icon: LucideIcon; text: Bi }[] = [
  { icon: HeartPulse, text: { ru: 'Медицинская помощь и госпитализация', en: 'Medical assistance and hospitalisation' } },
  { icon: CarFront, text: { ru: 'ДТП и оформление страхового случая', en: 'Road accident and insurance claim' } },
  { icon: FileWarning, text: { ru: 'Потеря документов и связь с консульством', en: 'Lost documents and consulate liaison' } },
  { icon: Gavel, text: { ru: 'Срочный юрист и правовая защита', en: 'Urgent lawyer and legal protection' } },
  { icon: LifeBuoy, text: { ru: 'Эвакуация и сопровождение в больнице', en: 'Evacuation and in-hospital support' } },
];

const AUDIENCES: { icon: LucideIcon; title: Bi; body: Bi }[] = [
  {
    icon: Plane,
    title: { ru: 'Гости и туристы', en: 'Tourists & guests' },
    body: {
      ru: 'Трансфер, SIM, страховка, врач на родном языке, безопасная координация на время поездки.',
      en: 'Transfer, SIM, insurance, a doctor in your language, safe coordination throughout the stay.',
    },
  },
  {
    icon: Home,
    title: { ru: 'Резиденты и экспаты', en: 'Residents & expats' },
    body: {
      ru: 'Жильё, дети, медицина, банк, бытовые сервисы — без поиска новых исполнителей каждый месяц.',
      en: 'Housing, children, medicine, banking, daily services — without re-sourcing providers every month.',
    },
  },
  {
    icon: TrendingUp,
    title: { ru: 'Инвесторы', en: 'Investors' },
    body: {
      ru: 'Подбор сделок, due diligence, независимый рейтинг ClearView, сопровождение и выход.',
      en: 'Deal sourcing, due diligence, ClearView independent ratings, end-to-end support and exit.',
    },
  },
  {
    icon: KeyRound,
    title: { ru: 'Собственники недвижимости', en: 'Property owners' },
    body: {
      ru: 'Управление объектом из любой страны: бронирования, обслуживание, отчёты, налоги.',
      en: 'Manage your property from anywhere: bookings, maintenance, owner reports, taxes.',
    },
  },
  {
    icon: Briefcase,
    title: { ru: 'Основатели и профессионалы', en: 'Founders & professionals' },
    body: {
      ru: 'Регистрация компании, визы команды, бухгалтерия, помещение, юридическое сопровождение.',
      en: 'Company registration, team visas, accounting, premises, legal support.',
    },
  },
];

/* ──────────────────────────────────────────────────────────────────── */
/*  Page                                                                 */
/* ──────────────────────────────────────────────────────────────────── */

export default function Landing() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestTopic, setRequestTopic] = useState<HelpTopic>('general');

  const partnerRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { rootMargin: '0px 0px -80% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const openRequest = (topic: HelpTopic = 'general') => {
    setRequestTopic(topic);
    setRequestOpen(true);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* Header nav (trust-first) — rendered as endSlot in LandingChrome on desktop;
     on mobile collapses into the sticky CTA. */
  const navItems: { id: string; label: Bi }[] = [
    { id: 'how-it-works', label: { ru: 'Как работает', en: 'How it works', th: 'ทำงานอย่างไร' } },
    { id: 'trust', label: { ru: 'Доверие', en: 'Trust', th: 'ความน่าเชื่อถือ' } },
    { id: 'emergency', label: { ru: 'Экстренная помощь', en: 'Emergency', th: 'ฉุกเฉิน' } },
    { id: 'ecosystem-link', label: { ru: 'Экосистема', en: 'Ecosystem', th: 'ระบบนิเวศ' } },
    { id: 'for-partners', label: { ru: 'Для партнёров', en: 'For partners', th: 'สำหรับพาร์ทเนอร์' } },
  ];

  const headerEnd = (
    <>
      <nav className="hidden lg:flex items-center gap-1 mr-2">
        {navItems.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => scrollTo(n.id)}
            className="inline-flex h-8 items-center rounded-none px-2.5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
          >
            {tx(language, n.label)}
          </button>
        ))}
      </nav>
      <Link
        to={APP_ROUTES.AUTH}
        className="hidden md:inline-flex h-8 items-center rounded-none px-3 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
      >
        {tx(language, { ru: 'Войти', en: 'Sign in', th: 'เข้าสู่ระบบ' })}
      </Link>
      <button
        type="button"
        onClick={() => openRequest('general')}
        data-testid="landing-header-cta"
        className={cn(
          'inline-flex h-8 items-center justify-center gap-1 rounded-none px-3 text-[13px] font-semibold whitespace-nowrap shrink-0',
          'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
        )}
      >
        <Send className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="hidden sm:inline">{tx(language, { ru: 'Подать заявку', en: 'Submit a request', th: 'ส่งคำขอ' })}</span>
        <span className="sm:hidden">{tx(language, { ru: 'Заявка', en: 'Request', th: 'คำขอ' })}</span>
      </button>
    </>
  );

  return (
    <div
      data-testid="landing-trust-v1"
      className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary pb-20 sm:pb-0"
    >
      <LandingChrome isRu={isRu} endSlot={headerEnd} />

      {/* ============================ 1. HERO ============================ */}
      <LandingSection className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, hsl(var(--border)/0.5) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <LandingHero>
          <div ref={heroRef}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-none border border-border bg-card px-3 py-1 font-sans text-caption font-medium uppercase tracking-[0.12em] text-muted-foreground"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="font-semibold text-foreground">myUNO</span>
              <span>{tx(language, { ru: 'операционный слой Пхукета', en: 'operating layer for Phuket', th: 'โครงสร้างปฏิบัติการสำหรับภูเก็ต' })}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display mt-6 max-w-3xl text-h1 font-normal leading-[1.05] tracking-tight sm:text-display"
            >
              {tx(language, {
                ru: 'Доверенный операционный слой для Пхукета',
                en: 'The trusted operating layer for Phuket',
                th: 'โครงสร้างปฏิบัติการที่น่าเชื่อถือสำหรับภูเก็ต',
              })}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 max-w-2xl font-sans text-body-lg font-normal leading-relaxed text-muted-foreground"
            >
              {tx(language, {
                ru: 'Одна заявка. Консьерж myUNO подбирает проверенного исполнителя и ведёт задачу до результата — на русском, английском или тайском.',
                en: 'One request. The myUNO concierge coordinates a verified provider and stays involved through delivery — in Russian, English or Thai.',
                th: 'หนึ่งคำขอ คอนเซียร์จของ myUNO จะจัดหาผู้ให้บริการที่ตรวจสอบแล้ว และดูแลจนกระทั่งงานเสร็จสมบูรณ์',
              })}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button
                type="button"
                onClick={() => openRequest('general')}
                data-testid="landing-hero-primary"
                className={cn(
                  'group inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-none px-6 font-sans text-body font-semibold',
                  'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                <Send className="h-4 w-4" strokeWidth={2.5} />
                {tx(language, { ru: 'Подать заявку', en: 'Submit a request', th: 'ส่งคำขอ' })}
              </button>
              <button
                type="button"
                onClick={() => scrollTo('how-it-works')}
                data-testid="landing-hero-secondary"
                className={cn(
                  'inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-none border border-foreground px-6 font-sans text-body font-medium text-foreground',
                  'hover:bg-foreground hover:text-background transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                )}
              >
                {tx(language, { ru: 'Как это работает', en: 'See how it works', th: 'ดูวิธีการทำงาน' })}
              </button>
            </motion.div>

            <p className="mt-3 font-sans text-caption text-muted-foreground">
              {tx(language, { ru: 'Регистрация не требуется. ', en: 'No account required. ', th: 'ไม่ต้องสมัครสมาชิก ' })}
              <Link to={APP_ROUTES.AUTH} className="underline underline-offset-4 hover:text-foreground">
                {tx(language, { ru: 'Войти', en: 'Sign in', th: 'เข้าสู่ระบบ' })}
              </Link>
              <span className="mx-1.5 text-muted-foreground/40">·</span>
              <Link to={`${APP_ROUTES.AUTH}?mode=signup`} className="underline underline-offset-4 hover:text-foreground">
                {tx(language, { ru: 'Создать аккаунт', en: 'Create account', th: 'สร้างบัญชี' })}
              </Link>
            </p>

            {/* Trust strip — 4 signals under hero */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-12 grid max-w-3xl grid-cols-2 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-4"
            >
              {TRUST_SIGNALS.map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.text.en} className="flex items-start gap-2.5 bg-background px-4 py-4">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-foreground" strokeWidth={1.75} />
                    <span className="font-sans text-body-sm font-medium leading-snug text-foreground">
                      {tx(language, t.text)}
                    </span>
                  </li>
                );
              })}
            </motion.ul>
          </div>
        </LandingHero>
      </LandingSection>

      {/* ============================ 2. TRUST ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20 scroll-mt-20">
          <span id="trust" className="block -mt-20 pt-20" aria-hidden />
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
              {tx(language, { ru: 'Почему нам можно доверять', en: 'Why you can trust myUNO', th: 'ทำไมจึงเชื่อถือได้' })}
            </p>
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(language, { ru: 'Факты, а не обещания', en: 'Facts, not promises', th: 'ข้อเท็จจริง ไม่ใช่คำสัญญา' })}
            </h2>
            <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
              {tx(language, {
                ru: 'Платформа отвечает за качество координации и за то, что исполнитель действительно тот, за кого себя выдаёт.',
                en: 'The platform is accountable for the quality of coordination and for the provider being who they claim to be.',
              })}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_FACTS.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title.en} className="flex flex-col gap-3 bg-background p-6">
                  <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                  <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">
                    {tx(language, f.title)}
                  </h3>
                  <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                    {tx(language, f.body)}
                  </p>
                </div>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 3. CONCIERGE MODEL ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20 scroll-mt-20">
          <span id="how-it-works" className="block -mt-20 pt-20" aria-hidden />
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
              {tx(language, { ru: 'Как это работает', en: 'How it works', th: 'ทำงานอย่างไร' })}
            </p>
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(language, {
                ru: 'Не каталог исполнителей. Управляемая координация.',
                en: 'Not a directory. A managed coordination layer.',
                th: 'ไม่ใช่สารบัญ แต่เป็นชั้นการประสานงานที่จัดการ',
              })}
            </h2>
          </div>
          <ol className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 md:grid-cols-3">
            {CONCIERGE_STEPS.map((step) => (
              <li key={step.num} className="flex flex-col gap-3 bg-background p-6">
                <span className="font-mono text-caption font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {step.num}
                </span>
                <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">
                  {tx(language, step.title)}
                </h3>
                <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                  {tx(language, step.body)}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => openRequest('general')}
              className="inline-flex h-11 items-center gap-2 rounded-none bg-primary px-5 font-sans text-body font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
              {tx(language, { ru: 'Подать заявку', en: 'Submit a request', th: 'ส่งคำขอ' })}
            </button>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 4. USE CASES ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
              {tx(language, { ru: 'Когда доверие важнее, чем выбор', en: 'When trust matters more than browsing', th: 'เมื่อความน่าเชื่อถือสำคัญกว่าการค้นหา' })}
            </p>
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(language, { ru: 'Ситуации, ради которых построена платформа', en: 'Situations the platform is built for' })}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u) => {
              const Icon = u.icon;
              return (
                <button
                  key={u.title.en}
                  type="button"
                  onClick={() => openRequest('general')}
                  className="group flex flex-col gap-3 bg-background p-6 text-left transition-colors hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                  <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">
                    {tx(language, u.title)}
                  </h3>
                  <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                    {tx(language, u.body)}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 font-sans text-caption font-medium uppercase tracking-[0.12em] text-foreground transition-transform group-hover:translate-x-0.5">
                    {tx(language, { ru: 'Запросить помощь', en: 'Request help' })}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                </button>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 5. WHY SAFER ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
              {tx(language, { ru: 'Сравнение', en: 'Comparison', th: 'การเปรียบเทียบ' })}
            </p>
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(language, {
                ru: 'Чем это безопаснее обычной локальной координации',
                en: 'Why this is safer than ad-hoc local coordination',
              })}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 md:grid-cols-2">
            <div className="flex flex-col gap-4 bg-background p-6">
              <div className="flex items-center gap-2">
                <CircleAlert className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="font-sans text-caption font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {tx(language, { ru: 'Без координирующего слоя', en: 'Without a coordination layer' })}
                </span>
              </div>
              <ul className="space-y-3">
                {SAFER_CHAOS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-sans text-body-sm text-muted-foreground">
                    <X className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" strokeWidth={2} />
                    <span>{tx(language, item)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-4 bg-background p-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-foreground" strokeWidth={1.75} />
                <span className="font-sans text-caption font-semibold uppercase tracking-[0.14em] text-foreground">
                  {tx(language, { ru: 'Через myUNO', en: 'Through myUNO' })}
                </span>
              </div>
              <ul className="space-y-3">
                {SAFER_MYUNO.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 font-sans text-body-sm text-foreground">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={2.5} />
                    <span>{tx(language, item)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 6. EMERGENCY ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20 scroll-mt-20">
          <span id="emergency" className="block -mt-20 pt-20" aria-hidden />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_minmax(0,1.2fr)]">
            <div className="space-y-3">
              <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
                {tx(language, { ru: 'Когда нужна помощь сейчас', en: 'When help is needed now', th: 'เมื่อต้องการความช่วยเหลือทันที' })}
              </p>
              <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
                {tx(language, { ru: 'Экстренная поддержка', en: 'Emergency support', th: 'ความช่วยเหลือฉุกเฉิน' })}
              </h2>
              <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                {tx(language, {
                  ru: 'Доступно без аккаунта. Дежурный консьерж принимает запрос круглосуточно — на русском, английском или тайском.',
                  en: 'Available without an account. The duty concierge takes requests 24/7 — in Russian, English or Thai.',
                })}
              </p>
              <button
                type="button"
                onClick={() => openRequest('general')}
                data-testid="landing-cta-emergency"
                className="mt-2 inline-flex h-11 items-center gap-2 rounded-none border border-foreground bg-foreground px-5 font-sans text-body font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                <LifeBuoy className="h-4 w-4" strokeWidth={2} />
                {tx(language, { ru: 'Запросить помощь', en: 'Request help', th: 'ขอความช่วยเหลือ' })}
              </button>
            </div>
            <ul className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2">
              {EMERGENCY_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={i} className="flex items-center gap-3 bg-background p-4">
                    <Icon className="h-4 w-4 shrink-0 text-foreground" strokeWidth={1.75} />
                    <span className="font-sans text-body-sm text-foreground">{tx(language, item.text)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 7. WHO IT'S FOR ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20">
          <div className="mb-8 max-w-2xl space-y-3">
            <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
              {tx(language, { ru: 'Аудитории', en: 'Audiences', th: 'กลุ่มเป้าหมาย' })}
            </p>
            <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
              {tx(language, { ru: 'Для иностранцев на Пхукете', en: 'For foreigners in Phuket' })}
            </h2>
            <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
              {tx(language, {
                ru: 'Одна и та же модель доверенной координации — от первой поездки до владения недвижимостью.',
                en: 'The same trusted-coordination model — from a first visit to property ownership.',
              })}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.title.en} className="flex flex-col gap-3 bg-background p-6">
                  <Icon className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                  <h3 className="font-sans text-h4 font-medium tracking-tight text-foreground">
                    {tx(language, a.title)}
                  </h3>
                  <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                    {tx(language, a.body)}
                  </p>
                </div>
              );
            })}
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 8. ECOSYSTEM BREADTH ============================ */}
      <LandingSection>
        <LandingContainer className="py-14 sm:py-20 scroll-mt-20">
          <span id="ecosystem-link" className="block -mt-20 pt-20" aria-hidden />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl space-y-3">
              <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
                {tx(language, { ru: 'Глубина платформы', en: 'Depth of the platform', th: 'ความลึกของแพลตฟอร์ม' })}
              </p>
              <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
                {tx(language, {
                  ru: 'За одной заявкой — целая операционная экосистема',
                  en: 'Behind one request: a full operating ecosystem',
                })}
              </h2>
              <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                {tx(language, {
                  ru: 'Недвижимость, юриспруденция, медицина, релокация, владение, бытовые сервисы — на платформе myUNO. Вам не нужно изучать каждый раздел; задача консьержа — соединить вас с правильным.',
                  en: 'Property, legal, medical, relocation, ownership, daily services — all on the myUNO platform. You do not need to learn every section; the concierge connects you to the right one.',
                })}
              </p>
              <p className="pt-2 font-sans text-body-sm text-muted-foreground">
                {tx(language, {
                  ru: 'Если интересно, что доступно — посмотрите экосистему отдельно.',
                  en: 'If you are curious what is available — explore the ecosystem separately.',
                })}
              </p>
            </div>
            <Link
              to={APP_ROUTES.ECOSYSTEM}
              data-testid="landing-cta-ecosystem"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-none border border-foreground px-6 font-sans text-body font-medium text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              {tx(language, { ru: 'Посмотреть экосистему', en: 'Explore the ecosystem', th: 'สำรวจระบบนิเวศ' })}
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
          </div>
        </LandingContainer>
      </LandingSection>

      {/* ============================ 9. PARTNERS ============================ */}
      <div ref={partnerRef}>
        <LandingSection>
          <LandingContainer className="py-14 sm:py-20 scroll-mt-20">
            <span id="for-partners" className="block -mt-20 pt-20" aria-hidden />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-2xl space-y-3">
                <p className="font-sans text-caption uppercase tracking-[0.14em] text-muted-foreground">
                  {tx(language, { ru: 'Для исполнителей', en: 'For providers', th: 'สำหรับผู้ให้บริการ' })}
                </p>
                <h2 className="font-display text-h2 font-normal tracking-tight text-foreground">
                  {tx(language, {
                    ru: 'Проверенные исполнители — в одну структуру с прозрачными правилами',
                    en: 'Verified providers — into one structure with transparent rules',
                  })}
                </h2>
                <p className="font-sans text-body-sm leading-relaxed text-muted-foreground">
                  {tx(language, {
                    ru: 'Поток квалифицированных заявок, защищённая оплата, единая репутация. Условия фиксируются заранее, споры решает платформа.',
                    en: 'Qualified inbound, protected payments, a single platform reputation. Terms are fixed upfront; disputes are resolved by the platform.',
                  })}
                </p>
              </div>
              <Link
                to={APP_ROUTES.VENDOR_JOIN}
                data-testid="landing-cta-partner"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-none border border-foreground px-6 font-sans text-body font-medium text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                <Users className="h-4 w-4" strokeWidth={2} />
                {tx(language, { ru: 'Стать партнёром', en: 'Become a partner', th: 'เป็นพาร์ทเนอร์' })}
              </Link>
            </div>
          </LandingContainer>
        </LandingSection>
      </div>

      {/* ============================ 10. FINAL CTA ============================ */}
      <LandingSection border={false}>
        <LandingContainer className="mx-auto max-w-3xl py-16 text-center sm:py-24">
          <h2 className="font-display text-h1 font-normal leading-[1.05] tracking-tight sm:text-display">
            {tx(language, { ru: 'Одна заявка.', en: 'One request.', th: 'หนึ่งคำขอ' })}
            <br />
            {tx(language, {
              ru: 'Один доверенный операционный слой для Пхукета.',
              en: 'One trusted operating layer for Phuket.',
              th: 'หนึ่งโครงสร้างปฏิบัติการที่น่าเชื่อถือสำหรับภูเก็ต',
            })}
          </h2>
          <p className="mt-5 font-sans text-body-sm text-muted-foreground sm:text-body">
            {tx(language, {
              ru: 'Опишите задачу — консьерж возьмёт её в работу и подберёт проверенного исполнителя.',
              en: 'Describe the task — the concierge takes it from there and matches a verified provider.',
            })}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => openRequest('general')}
              className={cn(
                'group inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-none px-6 font-sans text-body font-semibold',
                'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
              )}
            >
              <Send className="h-4 w-4" strokeWidth={2.5} />
              {tx(language, { ru: 'Подать заявку', en: 'Submit a request', th: 'ส่งคำขอ' })}
            </button>
            <Link
              to={APP_ROUTES.ECOSYSTEM}
              className="inline-flex h-12 min-w-[220px] items-center justify-center gap-2 rounded-none border border-foreground px-6 font-sans text-body font-medium text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              {tx(language, { ru: 'Посмотреть экосистему', en: 'Explore the ecosystem', th: 'สำรวจระบบนิเวศ' })}
            </Link>
          </div>

          <nav
            aria-label={isRu ? 'Юридическая информация и поддержка' : 'Legal and support'}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-sans text-caption text-muted-foreground"
          >
            <Link to={APP_ROUTES.PRIVACY} className="hover:text-foreground transition-colors">
              {tx(language, { ru: 'Конфиденциальность', en: 'Privacy' })}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link to={APP_ROUTES.TERMS} className="hover:text-foreground transition-colors">
              {tx(language, { ru: 'Условия', en: 'Terms' })}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link to={APP_ROUTES.SUPPORT} className="hover:text-foreground transition-colors">
              {tx(language, { ru: 'Поддержка', en: 'Support' })}
            </Link>
            <span aria-hidden className="text-muted-foreground/40">·</span>
            <Link to={APP_ROUTES.CONTACT} className="hover:text-foreground transition-colors">
              {tx(language, { ru: 'Контакты', en: 'Contact' })}
            </Link>
          </nav>

          <p className="mt-6 inline-flex items-center gap-1.5 font-sans text-caption tracking-[0.08em] text-muted-foreground/60">
            <Languages className="h-3 w-3" />
            RU · EN · TH · © myUNO
          </p>
        </LandingContainer>
      </LandingSection>

      {/* ============================ STICKY MOBILE CTA ============================ */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 py-3 sm:hidden transition-transform duration-200',
          showStickyCta ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <button
          type="button"
          onClick={() => openRequest('general')}
          data-testid="landing-sticky-cta"
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-none bg-primary font-sans text-body font-semibold text-primary-foreground"
        >
          <Send className="h-4 w-4" strokeWidth={2.5} />
          {tx(language, { ru: 'Подать заявку', en: 'Submit a request', th: 'ส่งคำขอ' })}
        </button>
      </div>

      <ConciergeHelpSheet
        open={requestOpen}
        onOpenChange={setRequestOpen}
        topic={requestTopic}
        initialSubject={
          language === 'ru'
            ? 'Заявка через myUNO'
            : language === 'th'
              ? 'คำขอผ่าน myUNO'
              : 'Request via myUNO'
        }
        sourceData={{ source_page: 'landing_trust_v1' }}
      />
    </div>
  );
}
