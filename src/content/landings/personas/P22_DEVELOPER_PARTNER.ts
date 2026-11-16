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
    ru: 'Представьте проект на myUNO',
    en: 'Introduce your project on myUNO',
  },
  subtitle: {
    ru: 'Подготовьте сведения о компании и проекте. Условия размещения, оценки и работы с обращениями согласуются после проверки заявки.',
    en: 'Prepare company and project details. Listing, assessment and enquiry terms are agreed after application review.',
  },
  pains: [
    { ru: 'Вы хотите понять условия сотрудничества и порядок работы с обращениями.', en: 'You want clear collaboration terms and an enquiry-handling process.' },
    { ru: 'Лиды от обычных порталов — низкое качество, нет проверки бюджета и intent.', en: 'Generic-portal leads are low quality, no budget or intent verification.' },
    { ru: 'Нужен независимый рейтинг, который покажет реальные сильные стороны проекта.', en: 'You need an independent rating that highlights real project strengths.' },
    { ru: 'Хотите управлять inventory и ценами в реальном времени, не через email.', en: 'You want to manage inventory and pricing in real-time, not via email.' },
  ],
  services: [
    { slug: 'clearview-certification', label: { ru: 'ClearView™ сертификация проекта', en: 'ClearView™ project certification' }, oneLiner: { ru: 'Уточните формат, сроки и стоимость оценки проекта.', en: 'Confirm the format, timing and price of a project assessment.' }, href: '/property/clearview' },
    { slug: 'developer-portal', label: { ru: 'Developer Portal', en: 'Developer Portal' }, oneLiner: { ru: 'Inventory, цены, лиды, аналитика — единый dashboard.', en: 'Inventory, pricing, leads, analytics, single dashboard.' }, href: '/developer-portal/apply' },
    { slug: 'verified-leads', label: { ru: 'Работа с обращениями', en: 'Manage enquiries' }, oneLiner: { ru: 'Обращения и их статусы в кабинете после подтверждения доступа.', en: 'Enquiries and their status in the portal after access is confirmed.' }, href: '/developer-portal/apply' },
    { slug: 'commission-structure', label: { ru: 'Прозрачная commission structure', en: 'Transparent commission structure' }, oneLiner: { ru: 'Состав услуг, комиссии и плательщик согласуются до начала работы.', en: 'Agree service scope, fees and who pays before work begins.' }, href: '/developer-portal/apply' },
  ],
  faq: [
    { q: { ru: 'Как стать партнёром?', en: 'How do I become a partner?' }, a: { ru: 'Подайте заявку в Developer Portal. Сведения, условия сотрудничества и порядок публикации согласуются после проверки; отправка заявки не гарантирует размещение.', en: 'Apply via Developer Portal. Details, collaboration terms and publication steps are agreed after review; an application does not guarantee a listing.' } },
    { q: { ru: 'Сколько стоит ClearView сертификация?', en: 'How much does ClearView certification cost?' }, a: { ru: 'Формат, стоимость и сроки оценки или мониторинга нужно подтвердить для конкретного проекта. Проверьте актуальные условия до заказа услуги.', en: 'Confirm the assessment or monitoring scope, price and timing for the specific project. Review current terms before ordering.' } },
    { q: { ru: 'Что входит в аналитику Developer Portal?', en: 'What’s included in Developer Portal analytics?' }, a: { ru: 'Лиды по этапам воронки, источники трафика, conversion по unit-types, comparison с конкурентами в районе.', en: 'Leads by funnel stage, traffic sources, conversion by unit type, comparison with district competitors.' } },
    { q: { ru: 'Можем ли мы управлять inventory сами?', en: 'Can we manage inventory ourselves?' }, a: { ru: 'Доступные инструменты кабинета зависят от подтверждённых прав и настроек компании. Изменения проходят предусмотренную проверку перед публикацией.', en: 'Available portal tools depend on confirmed permissions and company settings. Changes follow the required review process before publication.' } },
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
    metaTitle: { ru: 'Партнёрство с myUNO для застройщиков Пхукета — myUNO', en: 'Partner with myUNO as a Phuket developer, myUNO' },
    metaDescription: { ru: 'Заявка застройщика, сведения о компании, материалы проекта и обращения. Размещение, доступ и условия сотрудничества зависят от проверки и согласования.', en: 'Developer application, company details, project materials and enquiries. Listing, access and collaboration terms depend on review and agreement.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/developer-partner',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://www.myuno.app/for/developer-partner?lang=ru' },
      { lang: 'en', href: 'https://www.myuno.app/for/developer-partner?lang=en' },
    ],
  },
};
