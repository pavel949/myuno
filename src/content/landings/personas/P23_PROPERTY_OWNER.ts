/**
 * Sprint C (orphan coverage): canonical P23_property_owner.
 * Owners of Phuket property — for myUNO PMS funnel.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P23_PROPERTY_OWNER: PersonaLanding = {
  personaCode: 'P8',
  slug: 'property-owner',
  status: 'live',
  h1: {
    ru: 'Владельцу жилья на Пхукете: управление, аренда, налоги',
    en: 'For Phuket property owners: management, rental, taxes',
  },
  subtitle: {
    ru: 'Обсудите аренду, управление и обслуживание вашего объекта. Состав работ, стоимость и сроки согласуются индивидуально.',
    en: 'Discuss rental, management and maintenance for your property. Scope, pricing and timing are agreed individually.',
  },
  pains: [
    { ru: 'Жильё простаивает, пока вы в другой стране, и вы хотите оценить варианты аренды.', en: 'Your property sits empty while you are abroad and you want to review rental options.' },
    { ru: 'Вы хотите понять комиссию управляющего и видеть понятную отчётность.', en: 'You want to understand management fees and see clear reports.' },
    { ru: 'Не понимаете, какой налог платить с аренды и как декларировать.', en: 'You cannot figure out the rental tax and how to declare it.' },
    { ru: 'Боитесь, что без вас сделают ремонт «как попало» или не сделают вовсе.', en: 'You fear maintenance gets botched or skipped while you are away.' },
    { ru: 'Хотите видеть бронирования, доходы и расходы в одном дашборде.', en: 'You want bookings, income and expenses in a single dashboard.' },
  ],
  services: [
    { slug: 'pms-onboarding', label: { ru: 'Инструменты собственника', en: 'Owner workspace tools' }, oneLiner: { ru: 'Календарь, бронирования, отчёты, iCal-синхронизация.', en: 'Calendar, bookings, reports, iCal sync.' }, href: '/owner' },
    { slug: 'str-listing', label: { ru: 'Размещение в STR', en: 'STR listing' }, oneLiner: { ru: 'Подготовка сведений об объекте и условий размещения.', en: 'Prepare property details and listing terms.' }, href: '/owner/onboarding' },
    { slug: 'long-term-tenants', label: { ru: 'Долгосрочные арендаторы', en: 'Long-term tenants' }, oneLiner: { ru: 'Обсудите поиск арендаторов и условия договора.', en: 'Discuss tenant search and lease terms.' }, href: '/property?intent=rent-long' },
    { slug: 'tax-rental', label: { ru: 'Налог с аренды', en: 'Rental tax' }, oneLiner: { ru: 'PND.93, VAT-порог, House & Land tax.', en: 'PND.93, VAT threshold, House & Land tax.' }, href: '/legal/tax' },
    { slug: 'maintenance', label: { ru: 'Техобслуживание', en: 'Maintenance' }, oneLiner: { ru: 'Уборка, ремонт, бассейн, сад — по расписанию.', en: 'Cleaning, repairs, pool, garden — on schedule.' }, href: '/owner/maintenance', availability: 'unavailable' },
    { slug: 'owner-reports', label: { ru: 'Дашборд владельца', en: 'Owner dashboard' }, oneLiner: { ru: 'P&L по месяцам, акт сверки, выплата на счёт.', en: 'Monthly P&L, reconciliation, payout to your account.' }, href: '/my-property' },
  ],
  faq: [
    { q: { ru: 'Какая комиссия?', en: 'What is the commission?' }, a: { ru: 'Стоимость и состав управления зависят от объекта и выбранных услуг. Комиссию, дополнительные расходы и порядок расчётов нужно согласовать до начала работы.', en: 'Management pricing and scope depend on the property and selected services. Agree fees, additional costs and settlement terms before work begins.' } },
    { q: { ru: 'Можно ли уйти от текущего MC и переключиться на вас?', en: 'Can I switch from my current MC to you?' }, a: { ru: 'Сначала нужно проверить действующий договор, обязательства и доступы. Порядок передачи объекта, документов и бронирований согласуется отдельно.', en: 'First review the current contract, obligations and access. Agree how the property, documents and bookings will be transferred.' } },
    { q: { ru: 'Какой реальный доход с виллы 3BR в Бангтао?', en: 'What is realistic yield on a 3BR villa in Bang Tao?' }, a: { ru: 'Доход зависит от объекта, сезона, загрузки и расходов. Оценку можно подготовить по подтверждённым данным конкретного объекта; прогноз не гарантирует результат.', en: 'Income depends on the property, season, occupancy and costs. An assessment should use confirmed property data; a forecast does not guarantee results.' } },
    { q: { ru: 'Кто платит налог с аренды — я или вы?', en: 'Who pays rental tax — me or you?' }, a: { ru: 'Налоговые обязанности зависят от статуса собственника и договора. Уточните необходимые декларации, ставки и полномочия представителя у квалифицированного консультанта.', en: 'Tax obligations depend on the owner’s status and contract. Confirm required filings, rates and representative authority with a qualified advisor.' } },
    { q: { ru: 'Что с депозитами от гостей и арендаторов?', en: 'How are guest and tenant deposits handled?' }, a: { ru: 'Получатель, порядок хранения, удержаний и возврата депозита должны быть указаны в согласованных условиях конкретной аренды. Перед оплатой проверьте договор и подтверждение получателя.', en: 'The recipient, handling, deductions and return of a deposit must be specified in the agreed rental terms. Review the contract and confirmed recipient before paying.' } },
  ],
  primaryCta: {
    label: { ru: 'Подготовить объект', en: 'Prepare your property' },
    href: '/owner/onboarding',
    subtitle: { ru: 'Для работы нужны вход и подтверждённый доступ к объекту.', en: 'Sign-in and confirmed property access are required.' },
  },
  secondaryCta: {
    label: { ru: 'Инструменты собственника', en: 'Owner workspace tools' },
    href: '/owner',
  },
  seo: {
    metaTitle: { ru: 'Управление недвижимостью на Пхукете для владельца — myUNO', en: 'Phuket property management for owners — myUNO' },
    metaDescription: { ru: 'Управление, аренда, обслуживание и отчётность для собственника жилья на Пхукете. Состав работ, стоимость и сроки согласуются для конкретного объекта.', en: 'Management, rental, maintenance and reporting for Phuket property owners. Scope, pricing and timing are agreed for the specific property.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/property-owner',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://www.myuno.app/for/property-owner?lang=ru' },
      { lang: 'en', href: 'https://www.myuno.app/for/property-owner?lang=en' },
    ],
  },
};
