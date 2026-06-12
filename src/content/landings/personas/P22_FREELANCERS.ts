/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P22_FREELANCERS: PersonaLanding = {
  personaCode: 'P22',
  slug: 'freelancers',
  status: 'live',
  h1: { ru: 'Локальные фрилансеры: фотографы, гиды, мастера', en: 'Local freelancers: photographers, guides, craftspeople' },
  subtitle: { ru: 'Найдите клиентов среди гостей и резидентов острова. Профиль, портфолио, оплата картой и FX-курс к THB.', en: 'Find clients among Phuket guests and residents. Profile, portfolio, card payments and THB FX.' },
  pains: [
    { ru: 'Instagram перестал давать стабильный поток клиентов.', en: 'Instagram no longer brings stable client flow.' },
    { ru: 'Сложно принимать оплату с иностранных карт.', en: 'Hard to accept payments from foreign cards.' },
    { ru: 'Хочется виден ассистент-консьерж, который продаёт за вас.', en: 'You want a concierge assistant that sells for you.' },
    { ru: 'Нужен публичный портфолио без своего сайта.', en: 'You need a public portfolio without building a site.' },
  ],
  services: [
    { slug: 'profile', label: { ru: 'Публичный профиль', en: 'Public profile' }, oneLiner: { ru: 'Портфолио, отзывы, моментальный booking.', en: 'Portfolio, reviews, instant booking.' }, href: '/vendor/apply' },
    { slug: 'card-payments', label: { ru: 'Оплата картой', en: 'Card payments' }, oneLiner: { ru: 'Stripe + Wise, выплата в THB.', en: 'Stripe + Wise, payout in THB.' }, href: '/vendor/billing' },
    { slug: 'concierge', label: { ru: 'AI-консьерж', en: 'AI concierge' }, oneLiner: { ru: 'Подбирает гостям именно вас под их запрос.', en: 'Matches guests to you based on their request.' }, href: '/vendor' },
    { slug: 'classifieds', label: { ru: 'Объявления и лиды', en: 'Listings & leads' }, oneLiner: { ru: 'Доступ к запросам резидентов острова.', en: 'Access to island resident requests.' }, href: '/classifieds' },
  ],
  faq: [
    { q: { ru: 'Нужно ли быть юр.лицом?', en: 'Do I need a registered company?' }, a: { ru: 'Нет — фрилансеры работают как self-employed, нужен только work permit или соответствующая виза.', en: 'No — freelancers work as self-employed; only work permit or matching visa is required.' } },
    { q: { ru: 'Сколько стоит размещение?', en: 'What does it cost?' }, a: { ru: 'Регистрация бесплатна. Платформа берёт стандартную комиссию с выполненных заказов — актуальная ставка на /vendor/billing.', en: 'Sign-up is free. The platform charges its standard commission on completed orders — current rate on /vendor/billing.' } },
  ],
  primaryCta: { label: { ru: 'Создать профиль', en: 'Create a profile' }, href: '/vendor/apply' },
  secondaryCta: { label: { ru: 'Открыть объявления', en: 'Browse listings' }, href: '/classifieds' },
  seo: {
    metaTitle: { ru: 'Фрилансеры на Пхукете: клиенты, оплата, портфолио — myUNO', en: 'Phuket freelancers: clients, payments, portfolio — myUNO' },
    metaDescription: { ru: 'Подключитесь к myUNO как фрилансер: публичный профиль, AI-консьерж, оплата картой и payout в THB. Прозрачная комиссия по вертикали.', en: 'Join myUNO as a freelancer: public profile, AI concierge, card payments and THB payout. Transparent per-vertical commission.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/freelancers',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/freelancers?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/freelancers?lang=en' },
    ],
  },
};
