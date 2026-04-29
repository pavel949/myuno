/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P3_EU_GUESTS: PersonaLanding = {
  personaCode: 'P3',
  slug: 'eu-guests',
  status: 'live',
  h1: {
    ru: 'Пхукет для гостей из Европы',
    en: 'Phuket for European guests',
  },
  subtitle: {
    ru: 'Long-stay виллы, EUR/SEPA-оплата, частные трансферы и сервис на английском — без посредников.',
    en: 'Long-stay villas, EUR/SEPA payments, private transfers and English-speaking service — no middlemen.',
  },
  pains: [
    { ru: 'Сложно найти виллу, которая принимает SEPA или карту EUR.', en: 'Hard to find a villa accepting SEPA or EUR card payments.' },
    { ru: 'Туроператоры предлагают пакетные туры, а вы хотите гибкости.', en: 'Tour operators push packages, but you want flexibility.' },
    { ru: 'Нужен трансфер бизнес-класса, а не общий шаттл.', en: 'You need a business-class transfer, not a shared shuttle.' },
    { ru: 'Хочется wellness-режима: йога, fine dining, дайвинг — без беготни.', en: 'You want a wellness routine: yoga, fine dining, diving — without chaos.' },
  ],
  services: [
    { slug: 'long-stay-villas', label: { ru: 'Long-stay виллы', en: 'Long-stay villas' }, oneLiner: { ru: 'От 14 ночей, прямые контракты с владельцами.', en: 'From 14 nights, direct owner contracts.' }, href: '/property/rent' },
    { slug: 'private-transfer', label: { ru: 'Private transfer', en: 'Private transfer' }, oneLiner: { ru: 'Mercedes/Toyota Alphard, англоговорящий водитель.', en: 'Mercedes/Toyota Alphard, English-speaking driver.' }, href: '/landing/airport-transfer' },
    { slug: 'wellness', label: { ru: 'Wellness & spa', en: 'Wellness & spa' }, oneLiner: { ru: 'Йога, массаж, detox-программы.', en: 'Yoga, massage, detox programmes.' }, href: '/wellness' },
    { slug: 'dining', label: { ru: 'Fine dining', en: 'Fine dining' }, oneLiner: { ru: 'Бронирование Michelin-recommended ресторанов.', en: 'Bookings at Michelin-recommended restaurants.' }, href: '/cluster/lifestyle' },
  ],
  faq: [
    { q: { ru: 'Можно платить в EUR?', en: 'Can I pay in EUR?' }, a: { ru: 'Да — SEPA, EUR-карта или Wise. Курс фиксируется на день оплаты.', en: 'Yes — SEPA, EUR card or Wise. Rate locked on payment day.' } },
    { q: { ru: 'Поддерживаете long-stay (1–3 месяца)?', en: 'Do you support long-stay (1–3 months)?' }, a: { ru: 'Да, со скидкой 20–35% от nightly rate. Контракт на английском.', en: 'Yes, with a 20–35% discount on nightly rate. English contract.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Связаться с консьержем', en: 'Talk to concierge' }, href: '/contact' },
  seo: {
    metaTitle: { ru: 'Пхукет для европейцев: long-stay виллы, EUR-оплата — myUNO', en: 'Phuket for Europeans: long-stay villas, EUR payment — myUNO' },
    metaDescription: { ru: 'Long-stay виллы с прямой арендой, оплата EUR/SEPA, private transfer и wellness без турагентов. Английский сервис на Пхукете.', en: 'Long-stay villas with direct rental, EUR/SEPA payment, private transfer and wellness without tour operators. English service on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/eu-guests',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/eu-guests?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/eu-guests?lang=en' },
    ],
  },
};
