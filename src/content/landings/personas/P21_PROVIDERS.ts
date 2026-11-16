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
  subtitle: { ru: 'Представьте свои услуги управляющим компаниям, собственникам и гостям. Условия сотрудничества и расчётов нужно согласовать до начала работы.', en: 'Introduce your services to management companies, owners and guests. Agree collaboration and settlement terms before work begins.' },
  pains: [
    { ru: 'Поток заказов нестабилен, всё держится на сарафане.', en: 'Order flow is unstable, everything depends on word of mouth.' },
    { ru: 'Платформы берут комиссию 25–30%, оставляя крошки.', en: 'Platforms charge 25-30% commission, leaving crumbs.' },
    { ru: 'Гости пишут на разных языках, нет единого окна.', en: 'Guests message in many languages, no single inbox.' },
    { ru: 'Сложно доказать качество без публичного рейтинга.', en: 'Hard to prove quality without a public rating.' },
  ],
  services: [
    { slug: 'vendor-onboarding', label: { ru: 'Заявка поставщика', en: 'Provider application', th: 'ใบสมัครผู้ให้บริการ' }, oneLiner: { ru: 'Укажите сведения о себе или компании и своих услугах.', en: 'Provide your individual or company details and services.', th: 'ระบุข้อมูลส่วนตัวหรือบริษัทและบริการของคุณ' }, href: '/vendor/onboarding' },
    { slug: 'unified-inbox', label: { ru: 'Единый чат с клиентами', en: 'Unified guest inbox' }, oneLiner: { ru: 'WhatsApp + in-app, авто-перевод RU/EN/TH.', en: 'WhatsApp + in-app, auto-translate RU/EN/TH.' }, href: '/vendor/messages' },
    { slug: 'commission', label: { ru: 'Прозрачная комиссия', en: 'Transparent commission' }, oneLiner: { ru: 'Обсудите комиссию, получателя и порядок расчётов.', en: 'Discuss fees, the recipient and settlement terms.' }, href: '/vendor/billing', availability: 'unavailable' },
    { slug: 'rating', label: { ru: 'Прозрачный рейтинг', en: 'Transparent rating' }, oneLiner: { ru: 'Отзывы только от подтверждённых клиентов.', en: 'Reviews only from verified customers.' }, href: '/vendor' },
  ],
  faq: [
    { q: { ru: 'Какая комиссия?', en: 'What’s the commission?' }, a: { ru: 'Подтвердите условия размещения, комиссии и доступные инструменты для вашей услуги. Заявка поставщика не означает согласования тарифов.', en: 'Confirm listing terms, fees and available tools for your service. A provider application does not establish agreed pricing.' } },
    { q: { ru: 'Когда приходят выплаты?', en: 'When do I get paid?' }, a: { ru: 'Получатель, способ и сроки расчётов согласуются для вашей услуги. Проверьте подтверждённые условия перед выполнением заказа.', en: 'The recipient, method and settlement timing are agreed for your service. Review confirmed terms before fulfilling an order.' } },
  ],
  primaryCta: { label: { ru: 'Подать заявку поставщика', en: 'Start provider application', th: 'เริ่มสมัครเป็นผู้ให้บริการ' }, href: '/vendor/onboarding' },
  secondaryCta: { label: { ru: 'Узнать о тарифах', en: 'See pricing' }, href: '/pricing' },
  seo: {
    metaTitle: { ru: 'Стать поставщиком myUNO: заявка и условия сотрудничества', en: 'Become a myUNO provider: application and collaboration terms' },
    metaDescription: { ru: 'Представьте услуги и обсудите размещение, права доступа и условия сотрудничества как локальный поставщик myUNO.', en: 'Introduce your services and discuss listing, access and collaboration terms as a local myUNO provider.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/providers',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://www.myuno.app/for/providers?lang=ru' },
      { lang: 'en', href: 'https://www.myuno.app/for/providers?lang=en' },
    ],
  },
};
