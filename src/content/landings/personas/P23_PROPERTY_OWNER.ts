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
    ru: 'У вас уже есть кондо или вилла на Пхукете: подключаем PMS за $25/мес/объект, ставим в краткосрочную или долгосрочную аренду, ведём налоговую отчётность и техобслуживание.',
    en: 'You own a condo or villa in Phuket: connect PMS for $25/mo/unit, list for short- or long-term rental, manage taxes and maintenance.',
  },
  pains: [
    { ru: 'Жильё простаивает, пока вы в другой стране — теряете 8–15% годовых.', en: 'The unit sits empty while you are abroad — you lose 8–15% annual yield.' },
    { ru: 'Текущий MC берёт 30–35% комиссии и не показывает прозрачную отчётность.', en: 'Your current MC charges 30–35% commission with no transparent reporting.' },
    { ru: 'Не понимаете, какой налог платить с аренды и как декларировать.', en: 'You cannot figure out the rental tax and how to declare it.' },
    { ru: 'Боитесь, что без вас сделают ремонт «как попало» или не сделают вовсе.', en: 'You fear maintenance gets botched or skipped while you are away.' },
    { ru: 'Хотите видеть бронирования, доходы и расходы в одном дашборде.', en: 'You want bookings, income and expenses in a single dashboard.' },
  ],
  services: [
    { slug: 'pms-onboarding', label: { ru: 'PMS за $25/мес', en: 'PMS for $25/mo' }, oneLiner: { ru: 'Календарь, бронирования, отчёты, iCal-синхронизация.', en: 'Calendar, bookings, reports, iCal sync.' }, href: '/owner' },
    { slug: 'str-listing', label: { ru: 'Размещение в STR', en: 'STR listing' }, oneLiner: { ru: 'Airbnb, Booking, Agoda — один календарь.', en: 'Airbnb, Booking, Agoda — single calendar.' }, href: '/owner/onboarding' },
    { slug: 'long-term-tenants', label: { ru: 'Долгосрочные арендаторы', en: 'Long-term tenants' }, oneLiner: { ru: 'Подбор за 14 дней, депозит-эскроу.', en: 'Filled in 14 days, escrowed deposit.' }, href: '/property?intent=rent-long' },
    { slug: 'tax-rental', label: { ru: 'Налог с аренды', en: 'Rental tax' }, oneLiner: { ru: 'PND.93, VAT-порог, House & Land tax.', en: 'PND.93, VAT threshold, House & Land tax.' }, href: '/legal/tax' },
    { slug: 'maintenance', label: { ru: 'Техобслуживание', en: 'Maintenance' }, oneLiner: { ru: 'Уборка, ремонт, бассейн, сад — по расписанию.', en: 'Cleaning, repairs, pool, garden — on schedule.' }, href: '/owner/maintenance' },
    { slug: 'owner-reports', label: { ru: 'Дашборд владельца', en: 'Owner dashboard' }, oneLiner: { ru: 'P&L по месяцам, акт сверки, выплата на счёт.', en: 'Monthly P&L, reconciliation, payout to your account.' }, href: '/my-property' },
  ],
  faq: [
    { q: { ru: 'Какая комиссия?', en: 'What is the commission?' }, a: { ru: '15% от выручки STR (против рыночных 25–35%) + $25/мес за PMS. Долгосрочная аренда — 1 месяц аренды разово. Без скрытых платежей.', en: '15% of STR revenue (vs market 25–35%) + $25/mo PMS. Long-term rental — 1 month rent one-off. No hidden fees.' } },
    { q: { ru: 'Можно ли уйти от текущего MC и переключиться на вас?', en: 'Can I switch from my current MC to you?' }, a: { ru: 'Да. Переключение занимает 30–45 дней с учётом договорных обязательств. Мы помогаем составить уведомление и перевести iCal/бронирования без потерь.', en: 'Yes. Switch takes 30–45 days subject to contract terms. We draft the notice and migrate iCal/bookings without losses.' } },
    { q: { ru: 'Какой реальный доход с виллы 3BR в Бангтао?', en: 'What is realistic yield on a 3BR villa in Bang Tao?' }, a: { ru: 'STR: ฿180k–280k/мес валовая при загрузке 65–75% в сезон. Чистый — после комиссии, коммуналки, амортизации — ฿110k–180k. Yield на вложенный капитал: 5–8% годовых.', en: 'STR: ฿180k–280k/month gross at 65–75% occupancy in season. Net — after commission, utilities, depreciation — ฿110k–180k. Yield on invested capital: 5–8% annually.' } },
    { q: { ru: 'Кто платит налог с аренды — я или вы?', en: 'Who pays rental tax — me or you?' }, a: { ru: 'Налогоплательщик — собственник. Мы готовим документы и подаём PND.93 от вашего имени по доверенности. Ставка 5% удерживается у источника + годовая декларация PIT.', en: 'The owner is the taxpayer. We prepare and file PND.93 by power of attorney. 5% withholding at source + annual PIT filing.' } },
    { q: { ru: 'Что с депозитами от гостей и арендаторов?', en: 'How are guest and tenant deposits handled?' }, a: { ru: 'Депозиты держим на эскроу-счёте отдельно от выручки. Возврат — в течение 7 дней после check-out при отсутствии повреждений. Все списания — с фото и сметой.', en: 'Deposits held in escrow, separate from revenue. Refunded within 7 days post-checkout if no damage. Any deductions come with photos and itemised quote.' } },
  ],
  primaryCta: {
    label: { ru: 'Подключить PMS за $25/мес', en: 'Connect PMS for $25/mo' },
    href: '/owner/onboarding',
    subtitle: { ru: 'Первый месяц бесплатно.', en: 'First month free.' },
  },
  secondaryCta: {
    label: { ru: 'Расчёт доходности', en: 'Yield calculator' },
    href: '/owner',
  },
  seo: {
    metaTitle: { ru: 'Управление недвижимостью на Пхукете для владельца — myUNO', en: 'Phuket property management for owners — myUNO' },
    metaDescription: { ru: 'PMS за $25/мес/объект, STR-размещение Airbnb/Booking/Agoda, долгосрочные арендаторы, налоги и техобслуживание для владельца жилья на Пхукете.', en: 'PMS at $25/mo/unit, STR listing on Airbnb/Booking/Agoda, long-term tenants, taxes and maintenance for Phuket property owners.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/property-owner',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/property-owner?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/property-owner?lang=en' },
    ],
  },
};
