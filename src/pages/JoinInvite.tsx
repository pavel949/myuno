/**
 * JoinInvite — shareable invite landing at /join (and alias /invite).
 *
 * Goal: single-purpose conversion page for word-of-mouth invitations.
 * One narrative, one CTA — «создать аккаунт». Supports ?ref=<code> for
 * future referral attribution (stored in localStorage so it survives the
 * auth round-trip).
 *
 * NOT a catalog page — by design. For the full ecosystem overview see
 * WelcomeLanding at "/".
 */
import React, { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  Globe,
  Wallet,
  Building2,
  Stethoscope,
  Scale,
  MessageCircle,
  Check,
  Star,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LandingChrome } from '@/components/landings';
import { SEOHead } from '@/components/seo';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics/track';

const track = (event: string, props: Record<string, unknown> = {}) =>
  trackEvent(event, props);

const REFERRAL_STORAGE_KEY = 'myuno_referral_code';

type Bilingual = { ru: string; en: string };
const tx = (isRu: boolean, v: Bilingual) => (isRu ? v.ru : v.en);

const BENEFITS: Array<{ icon: React.ComponentType<{ className?: string }>; title: Bilingual; body: Bilingual }> = [
  {
    icon: Sparkles,
    title: { ru: 'Один аккаунт — вся жизнь за границей', en: 'One account — your whole life abroad' },
    body: {
      ru: 'Жильё, виза, врач, машина, школа, бизнес. 40+ сервисов в одном приложении, без десятка чатов и посредников.',
      en: 'Housing, visa, doctor, car, school, business. 40+ services in one app — no chats, no middlemen chain.',
    },
  },
  {
    icon: Wallet,
    title: { ru: 'Прозрачные цены в ฿, $, ₽, €', en: 'Transparent prices in ฿, $, ₽, €' },
    body: {
      ru: 'Все цены, чеки и комиссии — открыто. Платите картой, переводом или СБП. Никаких «договоримся на месте».',
      en: 'All prices, receipts and fees — open. Pay by card, bank transfer or SBP. No “let’s settle on the spot”.',
    },
  },
  {
    icon: ShieldCheck,
    title: { ru: 'Проверенные исполнители', en: 'Verified providers only' },
    body: {
      ru: 'Каждый партнёр проходит KYC, документы и отзывы. Спор — решает платформа, деньги защищены до оказания услуги.',
      en: 'Every partner passes KYC, document and review checks. Dispute? Platform mediates, money is held until delivery.',
    },
  },
  {
    icon: MessageCircle,
    title: { ru: 'AI-консьерж 24/7 на вашем языке', en: 'AI concierge 24/7 in your language' },
    body: {
      ru: 'Спросите голосом или текстом — ассистент подберёт услугу, заполнит заявку и подскажет, что делать «если…».',
      en: 'Ask by voice or text — assistant picks the right service, fills the form and tells you what to do «if…».',
    },
  },
  {
    icon: Globe,
    title: { ru: 'RU · EN · TH', en: 'RU · EN · TH' },
    body: {
      ru: 'Полная локализация и поддержка на трёх языках. Документы, договоры и поддержка — на родном.',
      en: 'Full localization and support in three languages. Documents, contracts, support — in your own.',
    },
  },
  {
    icon: Lock,
    title: { ru: 'Безопасность банковского уровня', en: 'Bank-grade security' },
    body: {
      ru: 'KYC, 2FA, шифрование данных, RLS на уровне базы. Ваши документы видите только вы и выбранный специалист.',
      en: 'KYC, 2FA, encrypted data, row-level DB security. Your documents are visible only to you and the chosen pro.',
    },
  },
];

const VERTICALS: Array<{ icon: React.ComponentType<{ className?: string }>; label: Bilingual }> = [
  { icon: Building2, label: { ru: 'Недвижимость и аренда', en: 'Property & rentals' } },
  { icon: Stethoscope, label: { ru: 'Медицина и страховка', en: 'Health & insurance' } },
  { icon: Scale, label: { ru: 'Визы и юристы', en: 'Visas & lawyers' } },
  { icon: Wallet, label: { ru: 'Финансы и переводы', en: 'Finance & transfers' } },
  { icon: Sparkles, label: { ru: 'Транспорт, рестораны, досуг', en: 'Transport, dining, leisure' } },
  { icon: ShieldCheck, label: { ru: 'Семья, школа, питомцы', en: 'Family, school, pets' } },
];

const STEPS: Array<{ n: string; title: Bilingual; body: Bilingual }> = [
  {
    n: '01',
    title: { ru: 'Создаёте аккаунт за 30 секунд', en: 'Create account in 30 seconds' },
    body: { ru: 'Email или телефон. Без пластика и подписок на старте.', en: 'Email or phone. No card or subscription to start.' },
  },
  {
    n: '02',
    title: { ru: 'Выбираете, что нужно сейчас', en: 'Pick what you need now' },
    body: { ru: 'AI-консьерж задаст 2-3 вопроса и предложит подходящий сервис.', en: 'AI concierge asks 2-3 questions and proposes the right service.' },
  },
  {
    n: '03',
    title: { ru: 'Получаете услугу, оплачиваете в приложении', en: 'Get the service, pay in-app' },
    body: { ru: 'История, чеки и документы — навсегда в личном кабинете.', en: 'History, receipts and documents — saved in your account forever.' },
  },
];

const SOCIAL_PROOF: Bilingual[] = [
  { ru: '«Сняли квартиру, оформили визу и нашли школу за неделю — всё в одном приложении.»', en: '«Rented a flat, filed the visa and found a school in a week — all in one app.»' },
  { ru: '«Наконец-то не нужно искать «своего человека» под каждую задачу. Чек, гарантия, поддержка.»', en: '«Finally no need to hunt for «a guy» for every task. Receipt, guarantee, support — included.»' },
  { ru: '«Сравнили предложения врачей и юристов прямо в чате. Сэкономили часы.»', en: '«Compared doctors and lawyers right in chat. Saved hours.»' },
];

export default function JoinInvite() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [params] = useSearchParams();
  const ref = params.get('ref') || params.get('invite') || '';

  // Persist referral code across the auth round-trip
  useEffect(() => {
    if (ref) {
      try {
        localStorage.setItem(REFERRAL_STORAGE_KEY, ref);
        track('invite_landing_view', { ref });
      } catch {
        /* storage blocked */
      }
    } else {
      track('invite_landing_view', {});
    }
  }, [ref]);

  const signupHref = useMemo(() => {
    const base = `${APP_ROUTES.AUTH}?mode=signup&from=invite`;
    return ref ? `${base}&ref=${encodeURIComponent(ref)}` : base;
  }, [ref]);

  const onPrimaryCta = () => track('invite_signup_click', { ref: ref || null, position: 'hero' });
  const onSecondaryCta = () => track('invite_signup_click', { ref: ref || null, position: 'closing' });

  const seoTitle = isRu
    ? 'myUNO — присоединяйтесь по приглашению | Один аккаунт для жизни за границей'
    : 'myUNO — join by invitation | One account for life abroad';
  const seoDescription = isRu
    ? '40+ сервисов в одном приложении: жильё, виза, врач, юрист, транспорт. Прозрачные цены, проверенные исполнители, AI-консьерж 24/7. Создайте аккаунт бесплатно.'
    : '40+ services in one app: housing, visa, doctor, lawyer, transport. Transparent prices, verified providers, AI concierge 24/7. Sign up free.';

  return (
    <>
      <SEOHead title={seoTitle} description={seoDescription} />
      <div className="min-h-screen bg-background text-foreground">
        <LandingChrome isRu={isRu} />

        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
            {ref && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 inline-flex items-center gap-2 border border-accent/40 bg-accent/5 px-3 py-1.5 text-[12px] font-medium text-accent"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isRu ? `Вас пригласил: ${ref}` : `Invited by: ${ref}`}
              </motion.div>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-[40px] leading-[1.05] tracking-tight sm:text-[60px] sm:leading-[1.02]"
            >
              {isRu ? (
                <>
                  Один аккаунт —
                  <br />
                  <span className="text-accent">вся ваша жизнь</span> за границей.
                </>
              ) : (
                <>
                  One account —
                  <br />
                  <span className="text-accent">your whole life</span> abroad.
                </>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-6 max-w-2xl text-[17px] leading-[1.6] text-muted-foreground sm:text-[19px]"
            >
              {isRu
                ? 'myUNO собирает 40+ сервисов для иностранцев на Пхукете в одно приложение: жильё, виза, врач, юрист, транспорт, школа, бизнес. Прозрачные цены, проверенные исполнители, AI-консьерж 24/7.'
                : 'myUNO bundles 40+ services for expats in Phuket into one app: housing, visa, doctor, lawyer, transport, school, business. Transparent prices, verified providers, AI concierge 24/7.'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                to={signupHref}
                onClick={onPrimaryCta}
                className="inline-flex items-center justify-center gap-2 bg-primary px-6 py-4 text-[15px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {isRu ? 'Создать аккаунт бесплатно' : 'Create your free account'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={APP_ROUTES.HOME}
                className="inline-flex items-center justify-center px-4 py-4 text-[14px] font-medium text-muted-foreground hover:text-foreground"
              >
                {isRu ? 'Посмотреть, что внутри →' : 'See what’s inside →'}
              </Link>
            </motion.div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> {isRu ? 'Без подписки' : 'No subscription'}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> {isRu ? 'Без скрытых комиссий' : 'No hidden fees'}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> {isRu ? 'KYC и шифрование' : 'KYC & encryption'}</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-accent" /> RU · EN · TH</span>
            </div>
          </div>
        </section>

        {/* ─── What's inside ─── */}
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
            <h2 className="font-serif text-[28px] leading-tight sm:text-[36px]">
              {isRu ? 'Что внутри одного аккаунта' : 'What’s inside one account'}
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] text-muted-foreground">
              {isRu
                ? 'Шесть кластеров сервисов закрывают почти всё, что нужно человеку за границей — от ВНЖ до врача на дом.'
                : 'Six service clusters cover almost everything an expat needs — from residency to a doctor at home.'}
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {VERTICALS.map(({ icon: Icon, label }) => (
                <div key={label.en} className="flex items-start gap-3 border border-border/60 bg-card p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-[14px] font-medium">{tx(isRu, label)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Benefits ─── */}
        <section className="border-b border-border/60 bg-card/30">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
            <h2 className="font-serif text-[28px] leading-tight sm:text-[36px]">
              {isRu ? 'Почему это удобно и выгодно' : 'Why it’s convenient and worth it'}
            </h2>
            <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title, body }) => (
                <div key={title.en} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-background">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-[15.5px] font-semibold">{tx(isRu, title)}</h3>
                    <p className="mt-1.5 text-[14px] leading-[1.55] text-muted-foreground">{tx(isRu, body)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ─── */}
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
            <h2 className="font-serif text-[28px] leading-tight sm:text-[36px]">
              {isRu ? 'Как это работает' : 'How it works'}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {STEPS.map(({ n, title, body }) => (
                <div key={n} className="border-l-2 border-accent pl-4">
                  <div className="font-mono text-[12px] text-accent">{n}</div>
                  <h3 className="mt-2 text-[15.5px] font-semibold">{tx(isRu, title)}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.55] text-muted-foreground">{tx(isRu, body)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Security ─── */}
        <section className="border-b border-border/60 bg-card/30">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-border bg-background">
                <Lock className="h-6 w-6 text-accent" />
              </div>
              <div className="max-w-2xl">
                <h2 className="font-serif text-[24px] leading-tight sm:text-[30px]">
                  {isRu ? 'Безопасность и приватность' : 'Security & privacy'}
                </h2>
                <ul className="mt-4 space-y-2.5 text-[14.5px] leading-[1.55] text-muted-foreground">
                  {[
                    { ru: 'KYC банковского уровня для всех партнёров и платежей.', en: 'Bank-grade KYC for all partners and payments.' },
                    { ru: '2FA, шифрование данных в покое и при передаче.', en: '2FA, encryption at rest and in transit.' },
                    { ru: 'Row-Level Security: ваши документы видите только вы.', en: 'Row-Level Security: only you see your documents.' },
                    { ru: 'Деньги в escrow до фактического оказания услуги.', en: 'Funds held in escrow until the service is delivered.' },
                    { ru: 'Соответствие PDPA (Таиланд) и GDPR (ЕС).', en: 'Compliant with PDPA (Thailand) and GDPR (EU).' },
                  ].map((it) => (
                    <li key={it.en} className="flex gap-2">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      <span>{tx(isRu, it)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Social proof ─── */}
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
            <h2 className="font-serif text-[28px] leading-tight sm:text-[36px]">
              {isRu ? 'Что говорят пользователи' : 'What users say'}
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {SOCIAL_PROOF.map((q) => (
                <figure key={q.en} className="border border-border/60 bg-card p-5">
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-[14.5px] leading-[1.6] text-foreground">
                    {tx(isRu, q)}
                  </blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Closing CTA ─── */}
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-24">
            <h2 className="font-serif text-[32px] leading-tight sm:text-[44px]">
              {isRu ? 'Создайте аккаунт за 30 секунд' : 'Create your account in 30 seconds'}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15.5px] leading-[1.6] opacity-80">
              {isRu
                ? 'Бесплатно. Без подписки. Без карты на старте. Откройте всю экосистему myUNO и пользуйтесь только тем, что нужно вам.'
                : 'Free. No subscription. No card upfront. Unlock the full myUNO ecosystem and use only what you need.'}
            </p>
            <Link
              to={signupHref}
              onClick={onSecondaryCta}
              className={cn(
                'mt-8 inline-flex items-center justify-center gap-2 bg-accent px-7 py-4 text-[15px] font-semibold text-accent-foreground',
                'transition-opacity hover:opacity-90',
              )}
            >
              {isRu ? 'Зарегистрироваться' : 'Sign up now'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-5 text-[12px] opacity-60">
              {isRu ? 'Уже есть аккаунт?' : 'Already have an account?'}{' '}
              <Link to={APP_ROUTES.AUTH} className="underline underline-offset-2">
                {isRu ? 'Войти' : 'Sign in'}
              </Link>
            </p>
          </div>
        </section>

        <footer className="border-t border-border/60 bg-background">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-5 py-6 text-[12px] text-muted-foreground sm:flex-row sm:items-center">
            <div>© myUNO · Phuket, Thailand</div>
            <div className="flex gap-5">
              <Link to="/legal/privacy" className="hover:text-foreground">{isRu ? 'Приватность' : 'Privacy'}</Link>
              <Link to="/legal/terms" className="hover:text-foreground">{isRu ? 'Условия' : 'Terms'}</Link>
              <Link to="/support" className="hover:text-foreground">{isRu ? 'Поддержка' : 'Support'}</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
