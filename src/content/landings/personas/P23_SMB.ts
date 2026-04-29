/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P23_SMB: PersonaLanding = {
  personaCode: 'P23',
  slug: 'smb',
  status: 'live',
  h1: { ru: 'Локальный малый бизнес на Пхукете', en: 'Local small business on Phuket' },
  subtitle: { ru: 'Кафе, спа, школы, прокат — получите витрину, бронирование, CRM и поток клиентов в одном инструменте.', en: 'Cafés, spas, schools, rentals — get a storefront, bookings, CRM and client flow in one tool.' },
  pains: [
    { ru: 'Нет нормального online-присутствия, кроме Google Maps.', en: 'No proper online presence beyond Google Maps.' },
    { ru: 'CRM на коленке: Excel, WhatsApp, бумажные записи.', en: 'CRM held together by Excel, WhatsApp and paper notes.' },
    { ru: 'Сложно принимать online-оплату от иностранцев.', en: 'Hard to accept online payments from foreigners.' },
    { ru: 'Нет ресурса на маркетинг — нужны клиенты «под ключ».', en: 'No bandwidth for marketing — you need turnkey clients.' },
  ],
  services: [
    { slug: 'storefront', label: { ru: 'Брендированная витрина', en: 'Branded storefront' }, oneLiner: { ru: 'Каталог услуг, фото, отзывы, бронирование.', en: 'Service menu, photos, reviews, bookings.' }, href: '/vendor/apply' },
    { slug: 'crm', label: { ru: 'Lite CRM', en: 'Lite CRM' }, oneLiner: { ru: 'Контакты, задачи, повторные клиенты.', en: 'Contacts, tasks, repeat customers.' }, href: '/vendor' },
    { slug: 'payments', label: { ru: 'Online-оплата', en: 'Online payments' }, oneLiner: { ru: 'Stripe, QR PromptPay, USDT.', en: 'Stripe, QR PromptPay, USDT.' }, href: '/vendor/billing' },
    { slug: 'leads', label: { ru: 'Поток клиентов', en: 'Client flow' }, oneLiner: { ru: 'AI-консьерж рекомендует вас гостям и резидентам.', en: 'AI concierge recommends you to guests and residents.' }, href: '/pricing' },
  ],
  faq: [
    { q: { ru: 'Подходит, если у меня уже есть Line/IG?', en: 'Useful if I already use Line / IG?' }, a: { ru: 'Да — myUNO добавляет англоязычных гостей и резидентов острова, без замены ваших каналов.', en: 'Yes — myUNO adds English-speaking guests and residents, without replacing your channels.' } },
    { q: { ru: 'Сколько это стоит?', en: 'What does it cost?' }, a: { ru: 'Базовая витрина бесплатна. Платформа удерживает 10% с заказов через myUNO.', en: 'Basic storefront is free. The platform retains 10% on orders made via myUNO.' } },
  ],
  primaryCta: { label: { ru: 'Создать витрину', en: 'Create a storefront' }, href: '/vendor/apply' },
  secondaryCta: { label: { ru: 'Тарифы', en: 'Pricing' }, href: '/pricing' },
  seo: {
    metaTitle: { ru: 'SMB на Пхукете: витрина, CRM, оплата — myUNO', en: 'Phuket SMB: storefront, CRM, payments — myUNO' },
    metaDescription: { ru: 'Локальный малый бизнес на Пхукете: брендированная витрина, lite-CRM, online-оплата и поток клиентов через AI-консьерж.', en: 'Phuket small business: branded storefront, lite CRM, online payments and client flow via AI concierge.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/smb',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/smb?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/smb?lang=en' },
    ],
  },
};
