/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P1_TOURISTS: PersonaLanding = {
  personaCode: 'P1',
  slug: 'tourists',
  status: 'live',
  h1: {
    ru: 'Пхукет для русскоязычных туристов',
    en: 'Phuket for Russian-speaking travellers',
  },
  subtitle: {
    ru: 'Трансфер из аэропорта, eSIM, аренда виллы, экскурсии и помощь по-русски — в одном приложении.',
    en: 'Airport transfer, eSIM, villa rental, tours and Russian-speaking support — in one app.',
  },
  pains: [
    {
      ru: 'Не знаете, как доехать из аэропорта без переплаты таксистам.',
      en: 'You don’t know how to get from the airport without overpaying the taxi mafia.',
    },
    {
      ru: 'Нужна связь с первого часа: интернет, навигация, переводчик.',
      en: 'You need connectivity from hour one: internet, navigation, a translator.',
    },
    {
      ru: 'Ищете виллу или отель, где принимают карты «Мир» или платёж в THB.',
      en: 'You’re looking for a villa or hotel that accepts Mir cards or THB payment.',
    },
    {
      ru: 'Хотите посмотреть остров, но не довериться продавцам туров на улице.',
      en: 'You want to see the island without trusting street tour vendors.',
    },
  ],
  services: [
    {
      slug: 'airport-transfer',
      label: { ru: 'Трансфер из аэропорта', en: 'Airport transfer' },
      oneLiner: { ru: 'Минивэн до отеля, цена THB фикс.', en: 'Fixed-price minivan to your hotel.' },
      href: '/landing/airport-transfer',
    },
    {
      slug: 'esim',
      label: { ru: 'eSIM на 7–30 дней', en: 'eSIM 7–30 days' },
      oneLiner: { ru: '4G по всему острову, активация в приложении.', en: '4G across the island, in-app activation.' },
      href: '/sim',
    },
    {
      slug: 'villa-rental',
      label: { ru: 'Аренда виллы', en: 'Villa rental' },
      oneLiner: { ru: 'Каталог проверенных вилл с фото и отзывами.', en: 'Verified villa catalogue with photos and reviews.' },
      href: '/property',
    },
    {
      slug: 'tours',
      label: { ru: 'Экскурсии и активности', en: 'Tours & activities' },
      oneLiner: { ru: 'Острова, кулинарные, дайвинг — без зазывал.', en: 'Islands, cooking, diving — without street touts.' },
      href: '/tours',
    },
  ],
  faq: [
    {
      q: { ru: 'Принимают ли карты «Мир»?', en: 'Are Mir cards accepted?' },
      a: {
        ru: 'В большинстве вилл и сервисов — нет. В приложении можно платить в THB с любой карты или через USDT.',
        en: 'Most villas and services do not accept Mir. In the app you can pay in THB with any card or via USDT.',
      },
    },
    {
      q: { ru: 'Что делать, если потерял документы?', en: 'What if I lose my documents?' },
      a: {
        ru: 'Напишите в чат — мы соединим с консульством и поможем составить заявление в туристическую полицию.',
        en: 'Message us in chat — we’ll connect you to the consulate and help file a tourist police report.',
      },
    },
    {
      q: { ru: 'Безопасно ли арендовать байк?', en: 'Is renting a scooter safe?' },
      a: {
        ru: 'Только при наличии международных прав категории A и шлема. Без прав — штраф 500–2 000 THB.',
        en: 'Only with an international licence (cat. A) and a helmet. Without — fines 500–2,000 THB.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Заказать трансфер', en: 'Book a transfer' },
    href: '/landing/airport-transfer',
    subtitle: { ru: 'Цена в THB, оплата в приложении.', en: 'Price in THB, paid in the app.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть каталог вилл', en: 'Browse villas' },
    href: '/property',
  },
  seo: {
    metaTitle: {
      ru: 'Пхукет по-русски: трансфер, eSIM, виллы, экскурсии — myUNO',
      en: 'Phuket in Russian: transfer, eSIM, villas, tours — myUNO',
    },
    metaDescription: {
      ru: 'Трансфер из аэропорта, eSIM, аренда виллы и экскурсии. Поддержка по-русски, оплата в THB. Без посредников у стойки.',
      en: 'Airport transfer, eSIM, villa rental and tours on Phuket. Russian-speaking support, THB payments, no street vendors.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/tourists',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/tourists?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/tourists?lang=en' },
    ],
  },
};
