/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P21_PROVIDERS: PersonaLanding = {
  personaCode: 'P21',
  slug: 'providers',
  status: 'live',
  h1: { ru: 'Локальные подрядчики на myUNO', en: 'Local providers on myUNO' },
  subtitle: { ru: 'Получайте заказы от УК, владельцев и гостей. Без комиссии за вход, оплата на счёт компании, прозрачный рейтинг.', en: 'Get orders from MCs, owners and guests. No entry fee, payouts to your company account, transparent rating.' },
  pains: [
    { ru: 'Поток заказов нестабилен, всё держится на сарафане.', en: 'Order flow is unstable, everything depends on word of mouth.' },
    { ru: 'Платформы берут комиссию 25–30%, оставляя крошки.', en: 'Platforms charge 25–30% commission, leaving crumbs.' },
    { ru: 'Гости пишут на разных языках, нет единого окна.', en: 'Guests message in many languages, no single inbox.' },
    { ru: 'Сложно доказать качество без публичного рейтинга.', en: 'Hard to prove quality without a public rating.' },
  ],
  services: [
    { slug: 'vendor-onboarding', label: { ru: 'Подключение поставщика', en: 'Vendor onboarding' }, oneLiner: { ru: 'Регистрация за 15 минут, KYC онлайн.', en: 'Sign-up in 15 minutes, online KYC.' }, href: '/vendor/apply' },
    { slug: 'unified-inbox', label: { ru: 'Единый чат с клиентами', en: 'Unified guest inbox' }, oneLiner: { ru: 'WhatsApp + in-app, авто-перевод RU/EN/TH.', en: 'WhatsApp + in-app, auto-translate RU/EN/TH.' }, href: '/vendor/messages' },
    { slug: 'commission', label: { ru: 'Прозрачная комиссия', en: 'Transparent commission' }, oneLiner: { ru: 'Единая ставка по вертикали, payout каждые 7 дней.', en: 'Flat per-vertical rate, payout every 7 days.' }, href: '/vendor/billing' },
    { slug: 'rating', label: { ru: 'Прозрачный рейтинг', en: 'Transparent rating' }, oneLiner: { ru: 'Отзывы только от подтверждённых клиентов.', en: 'Reviews only from verified customers.' }, href: '/vendor' },
  ],
  faq: [
    { q: { ru: 'Какая комиссия?', en: 'What’s the commission?' }, a: { ru: 'Единая ставка по вашей вертикали (актуальный список — /vendor/billing). Никаких подписок и скрытых платежей.', en: 'Single per-vertical rate (live list at /vendor/billing). No subscriptions, no hidden fees.' } },
    { q: { ru: 'Когда приходят выплаты?', en: 'When do I get paid?' }, a: { ru: 'Каждые 7 дней на счёт компании или Wise.', en: 'Every 7 days to your company account or Wise.' } },
  ],
  primaryCta: { label: { ru: 'Подключиться поставщиком', en: 'Become a provider' }, href: '/vendor/apply' },
  secondaryCta: { label: { ru: 'Узнать о тарифах', en: 'See pricing' }, href: '/pricing' },
  seo: {
    metaTitle: { ru: 'Стать поставщиком myUNO: прозрачная комиссия, payout 7 дней', en: 'Become a myUNO provider: transparent commission, 7-day payout' },
    metaDescription: { ru: 'Подключитесь к myUNO как локальный подрядчик: прозрачная комиссия, единый чат, рейтинг и payout каждые 7 дней.', en: 'Join myUNO as a local provider: transparent commission, unified chat, rating and 7-day payout.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/providers',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/providers?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/providers?lang=en' },
    ],
  },
};
