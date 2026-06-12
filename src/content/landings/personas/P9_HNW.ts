/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P9_HNW: PersonaLanding = {
  personaCode: 'P9',
  slug: 'hnw',
  status: 'live',
  h1: {
    ru: 'Недвижимость Пхукета для частного капитала',
    en: 'Phuket real estate for private capital',
  },
  subtitle: {
    ru: 'Закрытый шорт-лист объектов, ClearView™ рейтинг застройщиков, юрист и налоговый консультант — на одном договоре.',
    en: 'A private shortlist of properties, ClearView™ developer ratings, lawyer and tax advisor — under one engagement.',
  },
  pains: [
    { ru: 'Брокеры показывают одни и те же 30 объектов — нужен независимый анализ.', en: 'Brokers show the same 30 listings — you need an independent view.' },
    { ru: 'Нет понимания, какой застройщик доделает проект, а какой — нет.', en: 'No clarity on which developer will deliver and which won’t.' },
    { ru: 'Нужна структура владения, которая выдержит проверку в РФ и ЕС.', en: 'You need an ownership structure that holds up in Russia and the EU.' },
    { ru: 'Хотите управлять активом удалённо, без мелочной операционки.', en: 'You want to manage the asset remotely, without operational micro-decisions.' },
    { ru: 'Важна конфиденциальность — без публикации сделки в открытых каналах.', en: 'Confidentiality matters — no deal published in public channels.' },
  ],
  services: [
    { slug: 'clearview-rating', label: { ru: 'ClearView™ рейтинг застройщика', en: 'ClearView™ developer rating' }, oneLiner: { ru: '8 категорий, шкала AAA–CCC, отчёт за 5 рабочих дней.', en: '8 categories, AAA–CCC scale, report in 5 working days.' }, href: '/property/clearview' },
    { slug: 'private-shortlist', label: { ru: 'Закрытый шорт-лист объектов', en: 'Private shortlist' }, oneLiner: { ru: '5–8 объектов под ваш мандат, без публичной выдачи.', en: '5–8 properties matched to your mandate, off-market.' }, href: '/property/mandate' },
    { slug: 'legal-structuring', label: { ru: 'Юридическая структура владения', en: 'Ownership structuring' }, oneLiner: { ru: 'Freehold, leasehold, BVI/Thai company — сравнение по налогам и наследованию.', en: 'Freehold, leasehold, BVI/Thai company — compared on tax and inheritance.' }, href: '/legal' },
    { slug: 'tax-advisory', label: { ru: 'Налоговая консультация', en: 'Tax advisory' }, oneLiner: { ru: 'Налогообложение в Таиланде, СОИДН с РФ и ЕС.', en: 'Thai taxation and double-tax treaties with Russia and the EU.' }, href: '/legal/tax' },
    { slug: 'asset-management', label: { ru: 'Управление активом', en: 'Asset management' }, oneLiner: { ru: 'Сдача в аренду, отчёт ежемесячно, аудит ежегодно.', en: 'Rental management, monthly reporting, annual audit.' }, href: '/owner' },
  ],
  faq: [
    { q: { ru: 'Как устроен ClearView™ рейтинг?', en: 'How does the ClearView™ rating work?' }, a: { ru: '8 категорий с весами: финансы застройщика, юридический статус земли, история сдач, эскроу, локация, продукт, управление, выход. Шкала AAA, AA, A, BBB, BB, B, CCC.', en: 'Eight weighted categories: developer finance, land legal status, delivery history, escrow, location, product, management, exit. Scale AAA, AA, A, BBB, BB, B, CCC.' } },
    { q: { ru: 'Какой минимальный бюджет?', en: 'What’s the minimum budget?' }, a: { ru: 'Шорт-лист собираем от 15 млн THB. Для бюджета ниже — стандартный каталог.', en: 'We curate shortlists from 15M THB. Below that — the standard catalogue.' } },
    { q: { ru: 'Можно ли купить на иностранную компанию?', en: 'Can a foreign company hold the asset?' }, a: { ru: 'Да: BVI/Singapore через тайскую компанию-владельца, либо leasehold напрямую. Юрист соберёт варианты под ваш профиль.', en: 'Yes: BVI/Singapore through a Thai holding entity, or leasehold directly. The lawyer maps options to your profile.' } },
    { q: { ru: 'Как защищён депозит до сделки?', en: 'How is the deposit protected before closing?' }, a: { ru: 'Через эскроу-счёт банка-партнёра. Возврат при отказе застройщика от сроков — по тайскому Condominium Act.', en: 'Via a partner bank escrow. Refundable on developer delay per the Thai Condominium Act.' } },
    { q: { ru: 'Какая комиссия myUNO?', en: 'What’s myUNO’s fee?' }, a: { ru: 'Фиксированная плата за ClearView-отчёт и шорт-лист; на сделке комиссия от застройщика, без надбавки к цене для вас.', en: 'Fixed fee for the ClearView report and shortlist; deal commission from the developer, no markup on your price.' } },
    { q: { ru: 'Будет ли сделка публичной?', en: 'Will the deal be public?' }, a: { ru: 'Нет. NDA подписывается до передачи объектов; отчёт и переписка хранятся в закрытом workspace.', en: 'No. NDA is signed before any disclosure; reports and chat live in a private workspace.' } },
  ],
  primaryCta: {
    label: { ru: 'Запросить шорт-лист', en: 'Request a shortlist' },
    href: '/property/mandate',
    subtitle: { ru: 'Ответ в течение 24 часов от партнёра.', en: 'Response within 24 hours from a partner.' },
  },
  secondaryCta: {
    label: { ru: 'Прочитать ClearView™', en: 'Read about ClearView™' },
    href: '/property/clearview',
  },
  seo: {
    metaTitle: { ru: 'Недвижимость Пхукета для частного капитала — myUNO', en: 'Phuket real estate for private capital — myUNO' },
    metaDescription: { ru: 'Закрытый шорт-лист недвижимости на Пхукете для частного капитала. ClearView™ рейтинг застройщика, юрист и налоговый консультант — на одном договоре.', en: 'Private Phuket real-estate shortlist for HNW capital. ClearView™ developer rating, lawyer and tax advisor — under one engagement.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/hnw',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/hnw?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/hnw?lang=en' },
    ],
  },
};
