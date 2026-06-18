/**
 * /for-owners — civic-grade landing for individual property owners and small MCs.
 *
 * Two clear paths on one page:
 *   1. Передать в управление (Full Management 70/30)
 *   2. Управлять самому (myUNO PMS, $25/property)
 * Plus invite section for logged-in owners (Owner-to-Owner referral).
 *
 * Design tone: GOV.UK / e-Estonia / Apple support — calm, authoritative,
 * sharp corners, mono numerics, single accent (orange).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Check, BarChart3, Users, Sparkles, CalendarRange, Wallet, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { OwnerReferralCard } from '@/components/referral/OwnerReferralCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

const FEATURES = [
  { icon: BarChart3,    ru: 'Отчёты собственнику', en: 'Owner reports', descRu: 'PDF и онлайн P&L каждый месяц.',         descEn: 'Monthly P&L, PDF + online.' },
  { icon: Users,        ru: 'Гости и заявки',      en: 'Guests & inbox', descRu: 'Чат, заявки, отзывы — в одном окне.', descEn: 'Chat, leads, reviews in one inbox.' },
  { icon: Sparkles,     ru: 'Уборка и check-in',   en: 'Cleaning & check-in', descRu: 'Задачи команде, чек-листы.',  descEn: 'Team tasks, checklists.' },
  { icon: Wallet,       ru: 'Финансы',             en: 'Finance', descRu: 'Доходы, расходы, выплаты собственнику.', descEn: 'Income, expenses, owner payouts.' },
  { icon: CalendarRange,ru: 'Каналы и iCal',       en: 'Channels & iCal', descRu: 'Airbnb, Booking, VRBO — синхрон.',descEn: 'Airbnb, Booking, VRBO sync.' },
  { icon: FileText,     ru: 'Договоры и документы',en: 'Contracts & docs', descRu: 'Хранилище, подписи, налоги.', descEn: 'Vault, e-sign, tax filings.' },
];

const PRICING = [
  {
    kind: 'self',
    name: 'Starter',
    price: '$199',
    period: '/мес',
    periodEn: '/mo',
    slotsRu: 'до 5 объектов',
    slotsEn: 'up to 5 properties',
    items: ['PMS', 'iCal sync', 'Calendar', 'Email support'],
    cta: 'Начать',
    ctaEn: 'Start',
    href: '/mc/onboarding?plan=starter',
    primary: false,
  },
  {
    kind: 'self',
    name: 'Pro',
    price: '$399',
    period: '/мес',
    periodEn: '/mo',
    slotsRu: 'до 15 объектов',
    slotsEn: 'up to 15 properties',
    items: ['Всё из Starter', 'CRM + Pipeline', 'Owner reports', 'Channel manager', 'WhatsApp alerts'],
    itemsEn: ['Everything in Starter', 'CRM + Pipeline', 'Owner reports', 'Channel manager', 'WhatsApp alerts'],
    cta: 'Начать',
    ctaEn: 'Start',
    href: '/mc/onboarding?plan=pro',
    primary: true,
  },
  {
    kind: 'full',
    name: 'Full Management',
    price: '70 / 30',
    period: '',
    periodEn: '',
    slotsRu: 'мы делаем всё',
    slotsEn: 'we run everything',
    items: ['Поиск гостей', 'Уборка', 'Check-in', 'Ежемесячный отчёт', 'Поддержка 24/7'],
    itemsEn: ['Guest acquisition', 'Cleaning', 'Check-in', 'Monthly report', '24/7 support'],
    cta: 'Оставить заявку',
    ctaEn: 'Request a call',
    href: '/owner/management-landing',
    primary: false,
  },
];

const FAQ = [
  {
    qRu: 'Сколько стоит и как работает оплата?',
    qEn: 'How much does it cost and how is it billed?',
    aRu: 'Self-Service: фиксированная подписка $199–399/мес, оплата картой раз в месяц. Full Management: 30% от выручки, удерживается из выплат, ежемесячный отчёт без скрытых комиссий.',
    aEn: 'Self-Service: flat $199–399/mo subscription, monthly card billing. Full Management: 30% of revenue netted from payouts, monthly statement, no hidden fees.',
  },
  {
    qRu: 'Что если у меня 1–2 объекта?',
    qEn: 'What if I only have 1–2 properties?',
    aRu: 'Подойдёт Self-Service Starter ($199) или Full Management. У УК с 5+ объектами условия лучше — см. отдельную страницу.',
    aEn: 'Self-Service Starter ($199) or Full Management both fit. Companies with 5+ properties get better terms on the dedicated MC page.',
  },
  {
    qRu: 'Можно ли вернуться к самостоятельному управлению?',
    qEn: 'Can I switch back to self-management?',
    aRu: 'Да, в любой момент. Данные ваши: календарь, контакты, история — экспортируются одной кнопкой.',
    aEn: 'Yes, any time. Your data — calendar, contacts, history — exports in one click.',
  },
  {
    qRu: 'Кто видит мои финансы?',
    qEn: 'Who can see my financials?',
    aRu: 'Только вы и назначенные вами члены команды. Доступ — на уровне объекта, аудит-лог на каждое действие.',
    aEn: 'Only you and the team members you authorise. Per-property access with audit logs on every action.',
  },
  {
    qRu: 'А приглашённый сосед — сколько он получит?',
    qEn: 'What does the friend I invite get?',
    aRu: 'Приглашённый получает 1 месяц PMS бесплатно. Вы — 1 месяц бесплатно к своей подписке после оплаты его первой подписки.',
    aEn: 'They get one month of PMS free. You get one month free on your own plan after their first paid subscription.',
  },
];

const ForOwnersPage: React.FC = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const title = isRu ? 'Собственникам недвижимости и малым УК — myUNO' : 'For owners & small management companies — myUNO';
  const description = isRu
    ? 'Управляйте недвижимостью на Пхукете сами через myUNO PMS или передайте нам в управление. Отчёты, гости, уборка, финансы — в одном кабинете.'
    : 'Manage your Phuket property yourself with myUNO PMS or hand it over to us. Reports, guests, cleaning, finance — one workspace.';

  return (
    <AppLayout>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href="https://www.myuno.app/for-owners" />
      </Helmet>

      <div className="px-4 pt-8 pb-24 md:px-6 md:pt-12 max-w-3xl mx-auto">
        {/* HERO */}
        <header className="mb-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            {isRu ? 'Для собственников и УК' : 'For owners & MCs'}
          </p>
          <h1 className="text-[32px] sm:text-[42px] font-serif font-semibold leading-[1.05] tracking-[-0.02em] text-foreground">
            {isRu ? 'Ваша недвижимость — под контролем.' : 'Your property — under control.'}
          </h1>
          <p className="mt-4 text-[15px] sm:text-[16px] text-muted-foreground leading-[1.55] max-w-2xl">
            {isRu
              ? 'Сдавайте сами через myUNO PMS — или передайте нам в полное управление. Отчёты, гости, уборка, финансы и каналы — в одном кабинете.'
              : 'Self-manage with myUNO PMS — or hand it over for full management. Reports, guests, cleaning, finance and channels in one workspace.'}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href="#paths"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground hover:opacity-90 text-[14px] font-medium transition-opacity min-h-[44px]"
            >
              {isRu ? 'Передать в управление' : 'Hand over to us'}
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </a>
            <a
              href="#paths"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border text-foreground hover:border-primary/40 text-[14px] font-medium transition-colors min-h-[44px]"
            >
              {isRu ? 'Управлять самому' : 'Self-manage'}
            </a>
          </div>
        </header>

        {/* TWO PATHS */}
        <section id="paths" className="mb-14 scroll-mt-24">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pb-3 mb-6 border-b border-border">
            {isRu ? 'Два пути' : 'Two paths'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="border border-border p-6 bg-card">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
                {isRu ? 'Передать нам' : 'Hand over'}
              </p>
              <h3 className="text-[20px] font-serif font-semibold text-foreground leading-tight">
                {isRu ? 'Full Management · 70 / 30' : 'Full Management · 70 / 30'}
              </h3>
              <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
                {isRu
                  ? 'Мы находим гостей, убираем, встречаем, ведём финансы и отправляем отчёт раз в месяц. Вы получаете 70% выручки.'
                  : 'We find guests, clean, check-in, run finance and send a monthly statement. You keep 70% of revenue.'}
              </p>
              <Link
                to="/owner/management-landing"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity min-h-[44px]"
              >
                {isRu ? 'Оставить заявку' : 'Request a call'}
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </article>

            <article className="border border-border p-6 bg-card">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent mb-2">
                {isRu ? 'Управлять самому' : 'Self-manage'}
              </p>
              <h3 className="text-[20px] font-serif font-semibold text-foreground leading-tight">
                {isRu ? 'myUNO PMS · от $25 / объект' : 'myUNO PMS · from $25 / property'}
              </h3>
              <p className="mt-2 text-[13.5px] text-muted-foreground leading-relaxed">
                {isRu
                  ? 'Календарь, iCal, финансы, отчёты, channel manager. Подписка по тарифу — без процента с выручки.'
                  : 'Calendar, iCal, finance, reports, channel manager. Flat subscription — no revenue share.'}
              </p>
              <Link
                to="/mc/onboarding"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-[13px] font-medium hover:border-primary hover:text-primary transition-colors min-h-[44px]"
              >
                {isRu ? 'Открыть кабинет' : 'Open dashboard'}
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </Link>
            </article>
          </div>
        </section>

        {/* WHAT YOU GET */}
        <section className="mb-14">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pb-3 mb-6 border-b border-border">
            {isRu ? 'Что вы получаете' : 'What you get'}
          </h2>
          <ul className="divide-y divide-border">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.en} className="flex items-start gap-4 py-4">
                  <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.75} />
                  <div className="flex-1">
                    <div className="text-[15px] font-medium text-foreground">{isRu ? f.ru : f.en}</div>
                    <div className="text-[13px] text-muted-foreground mt-0.5">{isRu ? f.descRu : f.descEn}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* PRICING */}
        <section className="mb-14">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pb-3 mb-6 border-b border-border">
            {isRu ? 'Тарифы' : 'Pricing'}
          </h2>
          <div className="space-y-3">
            {PRICING.map((p) => (
              <Link
                key={p.name}
                to={p.href}
                className={`flex items-center justify-between gap-4 border p-5 hover:border-primary transition-colors ${
                  p.primary ? 'border-primary bg-primary/[0.03]' : 'border-border bg-card'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-[15px] font-semibold text-foreground">{p.name}</span>
                    {p.primary && (
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">
                        {isRu ? 'рекомендуем' : 'recommended'}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12.5px] text-muted-foreground">
                    {isRu ? p.slotsRu : p.slotsEn}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[18px] text-foreground tabular-nums">
                    {p.price}<span className="text-[12px] text-muted-foreground">{isRu ? p.period : p.periodEn}</span>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground mt-0.5">
                    {isRu ? p.cta : p.ctaEn} →
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-4 text-[12.5px] text-muted-foreground">
            {isRu ? 'Управляющая компания с 5+ объектами? ' : 'Running 5+ properties as a company? '}
            <Link to="/for-management-companies" className="text-primary underline hover:no-underline">
              {isRu ? 'Условия для УК →' : 'See MC plans →'}
            </Link>
          </p>
        </section>

        {/* REFERRAL */}
        <section className="mb-14">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pb-3 mb-6 border-b border-border">
            {isRu ? 'Пригласить' : 'Invite'}
          </h2>
          <OwnerReferralCard />
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground pb-3 mb-4 border-b border-border">
            {isRu ? 'Частые вопросы' : 'FAQ'}
          </h2>
          <Accordion type="single" collapsible className="divide-y divide-border">
            {FAQ.map((item, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`} className="border-b-0 border-t-0">
                <AccordionTrigger className="text-[14.5px] font-medium text-foreground py-4 hover:no-underline">
                  {isRu ? item.qRu : item.qEn}
                </AccordionTrigger>
                <AccordionContent className="text-[13.5px] text-muted-foreground leading-relaxed pb-4">
                  {isRu ? item.aRu : item.aEn}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* FOOTER CTA */}
        <section className="border-t border-border pt-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
            {isRu ? 'Готовы начать?' : 'Ready to start?'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/owner/management-landing"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground text-[14px] font-medium hover:opacity-90 transition-opacity min-h-[44px]"
            >
              {isRu ? 'Передать в управление' : 'Hand over to us'}
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </Link>
            <a
              href="https://wa.me/66922407355"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-border text-foreground text-[14px] font-medium hover:border-primary hover:text-primary transition-colors min-h-[44px]"
            >
              WhatsApp →
            </a>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default ForOwnersPage;
