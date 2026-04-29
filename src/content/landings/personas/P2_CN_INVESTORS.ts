/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P2_CN_INVESTORS: PersonaLanding = {
  personaCode: 'P2',
  slug: 'cn-investors',
  status: 'live',
  h1: { ru: 'Пхукет для гостей и инвесторов из Китая', en: 'Phuket for Chinese guests and scouts' },
  subtitle: { ru: 'Виллы и кондо с китайско-говорящим менеджером, оплата в CNY/USDT, экскурсии и сделки без барьеров.', en: 'Villas and condos with Mandarin-speaking concierge, CNY/USDT payments, tours and deals without language barriers.' },
  pains: [
    { ru: 'Языковой барьер в банке, у застройщика и в страховой.', en: 'Language barrier at the bank, developer and insurer.' },
    { ru: 'Сложно оплатить из материкового Китая через SWIFT.', en: 'Hard to pay from mainland China via SWIFT.' },
    { ru: 'Нужен scout-trip с переводчиком и юристом.', en: 'You need a scout trip with translator and lawyer.' },
    { ru: 'Хочется проверить foreign quota и реальный yield.', en: 'You want verified foreign quota and real yield.' },
  ],
  services: [
    { slug: 'mandarin-concierge', label: { ru: 'Mandarin-консьерж', en: 'Mandarin concierge' }, oneLiner: { ru: 'Сопровождение на просмотрах и сделках.', en: 'Support at viewings and closings.' }, href: '/contact' },
    { slug: 'usdt-payment', label: { ru: 'Оплата USDT/CNY', en: 'USDT / CNY payment' }, oneLiner: { ru: 'Бронирование без SWIFT-задержек.', en: 'Booking without SWIFT delays.' }, href: '/property/offplan' },
    { slug: 'scout-trip', label: { ru: 'Scout-trip 3 дня', en: 'Scout trip — 3 days' }, oneLiner: { ru: 'Отель, трансфер, 6–8 объектов.', en: 'Hotel, transfer, 6–8 properties.' }, href: '/property/mandate' },
    { slug: 'condo-catalog', label: { ru: 'Каталог кондо', en: 'Condo catalogue' }, oneLiner: { ru: 'Foreign quota verified, ROI-расчёт.', en: 'Foreign quota verified, ROI included.' }, href: '/property/offplan' },
  ],
  faq: [
    { q: { ru: 'Как платить из Китая?', en: 'How do I pay from China?' }, a: { ru: 'USDT, Hong Kong wire или через Singapore-аккаунт. Оформим под вашу схему.', en: 'USDT, Hong Kong wire or via a Singapore account. We structure to fit you.' } },
    { q: { ru: 'Можно купить freehold?', en: 'Can foreigners buy freehold?' }, a: { ru: 'Да — кондо в пределах 49% foreign quota. Виллы — leasehold 30+30+30.', en: 'Yes — condos within the 49% foreign quota. Villas — leasehold 30+30+30.' } },
  ],
  primaryCta: { label: { ru: 'Запросить scout-trip', en: 'Request scout trip' }, href: '/property/mandate?source=cn' },
  secondaryCta: { label: { ru: 'Каталог кондо', en: 'Condo catalogue' }, href: '/property/offplan' },
  seo: {
    metaTitle: { ru: 'Пхукет для китайских инвесторов: scout-trip, USDT — myUNO', en: 'Phuket for Chinese investors: scout trip, USDT — myUNO' },
    metaDescription: { ru: 'Кондо и виллы на Пхукете для гостей из Китая. Mandarin-консьерж, оплата USDT/CNY, проверенный foreign quota и ROI.', en: 'Condos and villas on Phuket for Chinese guests. Mandarin concierge, USDT/CNY payment, verified foreign quota and ROI.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/cn-investors',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/cn-investors?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/cn-investors?lang=en' },
    ],
  },
};
