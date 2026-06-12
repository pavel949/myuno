/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P22_DEVELOPER_PARTNER: PersonaLanding = {
  personaCode: 'P22',
  slug: 'developer-partner',
  status: 'live',
  h1: {
    ru: 'Получите ClearView™ листинг проекта на myUNO',
    en: 'List your project on myUNO with ClearView™ certification',
  },
  subtitle: {
    ru: 'Прозрачный рейтинг застройщика, доступ к 800+ верифицированным инвесторам, прямой канал лидов без brokers chain.',
    en: 'Transparent developer rating, access to 800+ verified investors, direct lead channel without broker chains.',
  },
  pains: [
    { ru: 'Brokers требуют 10–15% комиссии и не дают доступа к инвестору напрямую.', en: 'Brokers demand 10–15% commission and block direct investor access.' },
    { ru: 'Лиды от обычных порталов — низкое качество, нет проверки бюджета и intent.', en: 'Generic-portal leads are low quality, no budget or intent verification.' },
    { ru: 'Нужен независимый рейтинг, который покажет реальные сильные стороны проекта.', en: 'You need an independent rating that highlights real project strengths.' },
    { ru: 'Хотите управлять inventory и ценами в реальном времени, не через email.', en: 'You want to manage inventory and pricing in real-time, not via email.' },
  ],
  services: [
    { slug: 'clearview-certification', label: { ru: 'ClearView™ сертификация проекта', en: 'ClearView™ project certification' }, oneLiner: { ru: 'Рейтинг AAA–CCC по 8 категориям, отчёт за 5 рабочих дней.', en: 'AAA–CCC rating across 8 categories, report in 5 working days.' }, href: '/property/clearview' },
    { slug: 'developer-portal', label: { ru: 'Developer Portal', en: 'Developer Portal' }, oneLiner: { ru: 'Inventory, цены, лиды, аналитика — единый dashboard.', en: 'Inventory, pricing, leads, analytics — single dashboard.' }, href: '/developer-portal/apply' },
    { slug: 'verified-leads', label: { ru: 'Верифицированные лиды', en: 'Verified leads' }, oneLiner: { ru: 'Lead score 80+, проверенный бюджет, intent confirmed.', en: 'Lead score 80+, verified budget, intent confirmed.' }, href: '/developer-portal/apply' },
    { slug: 'commission-structure', label: { ru: 'Прозрачная commission structure', en: 'Transparent commission structure' }, oneLiner: { ru: '5–10% off-plan condo, 3–8% villa — без скрытых fees.', en: '5–10% off-plan condo, 3–8% villa — no hidden fees.' }, href: '/developer-portal/apply' },
  ],
  faq: [
    { q: { ru: 'Как стать партнёром?', en: 'How do I become a partner?' }, a: { ru: 'Подача заявки в Developer Portal → due diligence (3–5 дней) → подписание агентского соглашения → ClearView assessment → листинг.', en: 'Apply via Developer Portal → due diligence (3–5 days) → sign agency agreement → ClearView assessment → listing.' } },
    { q: { ru: 'Сколько стоит ClearView сертификация?', en: 'How much does ClearView certification cost?' }, a: { ru: 'Developer Assessment ฿350–600K (one-time, зависит от размера проекта). Quarterly Monitoring ฿15K/квартал. Listing fee ฿120–180K/год.', en: 'Developer Assessment ฿350–600K (one-time, depends on project size). Quarterly Monitoring ฿15K/quarter. Listing fee ฿120–180K/year.' } },
    { q: { ru: 'Что входит в аналитику Developer Portal?', en: 'What’s included in Developer Portal analytics?' }, a: { ru: 'Лиды по этапам воронки, источники трафика, conversion по unit-types, comparison с конкурентами в районе.', en: 'Leads by funnel stage, traffic sources, conversion by unit type, comparison with district competitors.' } },
    { q: { ru: 'Можем ли мы управлять inventory сами?', en: 'Can we manage inventory ourselves?' }, a: { ru: 'Да. Bulk upload через CSV, real-time updates через Developer Portal или API. Все изменения отражаются на публичном каталоге за 5 минут.', en: 'Yes. Bulk upload via CSV, real-time updates via Developer Portal or API. Changes reflect in the public catalogue within 5 minutes.' } },
  ],
  primaryCta: {
    label: { ru: 'Подать заявку на партнёрство', en: 'Apply for partnership' },
    href: '/developer-portal/apply',
  },
  secondaryCta: {
    label: { ru: 'О ClearView™', en: 'About ClearView™' },
    href: '/property/clearview',
  },
  seo: {
    metaTitle: { ru: 'Партнёрство с myUNO для застройщиков Пхукета — myUNO', en: 'Partner with myUNO as a Phuket developer — myUNO' },
    metaDescription: { ru: 'ClearView™ сертификация, Developer Portal, верифицированные лиды от 800+ инвесторов. Прозрачная commission structure, прямой канал.', en: 'ClearView™ certification, Developer Portal, verified leads from 800+ investors. Transparent commission, direct channel.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/developer-partner',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/developer-partner?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/developer-partner?lang=en' },
    ],
  },
};
