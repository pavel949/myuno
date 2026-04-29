/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P17_HALAL: PersonaLanding = {
  personaCode: 'P17',
  slug: 'halal',
  status: 'live',
  h1: {
    ru: 'Halal-friendly Пхукет: отдых для мусульманских семей',
    en: 'Halal-friendly Phuket: holidays for Muslim families',
  },
  subtitle: {
    ru: 'Halal-сертифицированные рестораны, виллы с prayer space, мечети рядом и приватные пляжи — спокойный отдых по правилам.',
    en: 'Halal-certified restaurants, villas with prayer space, nearby mosques and private beaches — calm holidays by your rules.',
  },
  pains: [
    { ru: 'Сложно найти halal-сертифицированную еду вне Patong.', en: 'Hard to find halal-certified food outside Patong.' },
    { ru: 'Нужна вилла с приватным бассейном и prayer space.', en: 'You need a villa with a private pool and prayer space.' },
    { ru: 'Хочется быть рядом с мечетью на пятничную молитву.', en: 'You want to be near a mosque for Friday prayer.' },
    { ru: 'Поездка с большой семьёй — нужен минивэн и трансфер на 6+.', en: 'Travelling with extended family — you need a 6+ seater transfer.' },
  ],
  services: [
    { slug: 'halal-villas', label: { ru: 'Halal-friendly виллы', en: 'Halal-friendly villas' }, oneLiner: { ru: 'Privacy, prayer space, kitchen для своей готовки.', en: 'Privacy, prayer space, kitchen for self-cooking.' }, href: '/property/rent' },
    { slug: 'halal-dining', label: { ru: 'Halal-рестораны', en: 'Halal restaurants' }, oneLiner: { ru: 'Сертифицированные заведения по районам.', en: 'Certified venues by area.' }, href: '/cluster/lifestyle' },
    { slug: 'mosque-map', label: { ru: 'Карта мечетей', en: 'Mosque map' }, oneLiner: { ru: 'Bang Tao, Kamala, Phuket Town — расписание молитв.', en: 'Bang Tao, Kamala, Phuket Town — prayer schedule.' }, href: '/map' },
    { slug: 'family-transfer', label: { ru: 'Семейный трансфер', en: 'Family transfer' }, oneLiner: { ru: 'Toyota Commuter / Hiace на 9 пассажиров.', en: 'Toyota Commuter / Hiace for 9 passengers.' }, href: '/landing/airport-transfer' },
  ],
  faq: [
    { q: { ru: 'Где больше всего halal-инфраструктуры?', en: 'Where is most halal infrastructure?' }, a: { ru: 'Bang Tao, Kamala и Phuket Town — мечети, рестораны и магазины.', en: 'Bang Tao, Kamala and Phuket Town — mosques, restaurants and shops.' } },
    { q: { ru: 'Можно бронировать виллу только для женщин?', en: 'Can I book a women-only villa stay?' }, a: { ru: 'Да — приватные виллы со staff по запросу (только женщины).', en: 'Yes — private villas with women-only staff on request.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Открыть карту', en: 'Open the map' }, href: '/map' },
  seo: {
    metaTitle: { ru: 'Halal Пхукет: виллы, рестораны, мечети — myUNO', en: 'Halal Phuket: villas, restaurants, mosques — myUNO' },
    metaDescription: { ru: 'Halal-friendly отдых на Пхукете: сертифицированные рестораны, виллы с prayer space, мечети и семейные трансферы.', en: 'Halal-friendly holidays on Phuket: certified restaurants, villas with prayer space, mosques and family transfers.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/halal',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/halal?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/halal?lang=en' },
    ],
  },
};
