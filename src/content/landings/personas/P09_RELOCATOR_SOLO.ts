/**
 * Sprint C (orphan coverage): canonical P09_relocator_solo.
 * Solo professional / freelancer relocating long-term (not nomad-style 3 months).
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P09_RELOCATOR_SOLO: PersonaLanding = {
  personaCode: 'P6',
  slug: 'relocator-solo',
  status: 'live',
  h1: {
    ru: 'Переезд одному: DTV, аренда на год, легализация',
    en: 'Solo relocation: DTV, year-long rental, legalisation',
  },
  subtitle: {
    ru: 'Уезжаете на 1–2 года без семьи: DTV или Non-B виза, кондо или квартира на год, банковский счёт, страховка и налоговый статус — собираем за 60 дней.',
    en: 'Moving solo for 1–2 years: DTV or Non-B visa, condo or apartment for a year, bank account, insurance, tax residency — set up in 60 days.',
  },
  pains: [
    { ru: 'DTV или Non-B — не понимаете, что подойдёт под вашу занятость.', en: 'DTV vs Non-B — you cannot tell which visa fits your work setup.' },
    { ru: 'Хотите аренду на год без посредника и с защитой депозита.', en: 'You want a 12-month rental without an agent and with deposit protection.' },
    { ru: 'Нужно открыть тайский счёт и понять, как переводить деньги без потерь.', en: 'You need a Thai bank account and FX-efficient transfers.' },
    { ru: 'Боитесь налогового резидентства Таиланда и двойного налогообложения.', en: 'You worry about Thai tax residency and double taxation.' },
    { ru: 'Хотите медицинскую страховку с покрытием экстренной эвакуации.', en: 'You want medical insurance covering emergency evacuation.' },
  ],
  services: [
    { slug: 'visa-quiz', label: { ru: 'Подбор визы (DTV/Non-B/Elite)', en: 'Visa Quiz (DTV/Non-B/Elite)' }, oneLiner: { ru: '5 минут, рекомендация с ценой и сроком.', en: '5 minutes, recommendation with price and timeline.' }, href: '/visa/quiz' },
    { slug: 'long-term-rental', label: { ru: 'Аренда на год', en: 'Year-long rental' }, oneLiner: { ru: 'Кондо и квартиры, контракт с защитой депозита.', en: 'Condos and apartments, deposit-protected contract.' }, href: '/property?intent=rent-long' },
    { slug: 'bank-account', label: { ru: 'Тайский банк', en: 'Thai bank account' }, oneLiner: { ru: 'Kasikorn / Bangkok Bank — за один визит.', en: 'Kasikorn / Bangkok Bank — opened in one visit.' }, href: '/banking' },
    { slug: 'tax-consultation', label: { ru: 'Налоговая консультация', en: 'Tax consultation' }, oneLiner: { ru: 'Резидентство, DTA, отчётность — ฿3 500.', en: 'Residency, DTA, reporting — ฿3,500.' }, href: '/legal/tax' },
    { slug: 'expat-insurance', label: { ru: 'Страховка для экспата', en: 'Expat insurance' }, oneLiner: { ru: 'От ฿35 000/год с эвакуацией.', en: 'From ฿35,000/year with evacuation.' }, href: '/legal/insurance' },
    { slug: 'lawyer-consultation', label: { ru: 'Консультация юриста', en: 'Lawyer consultation' }, oneLiner: { ru: '60 минут по-русски, ฿2 000.', en: '60 minutes in English/Russian, ฿2,000.' }, href: '/legal/consultation' },
  ],
  faq: [
    { q: { ru: 'DTV или Non-B — что лучше для фрилансера?', en: 'DTV or Non-B for a freelancer?' }, a: { ru: 'DTV (Destination Thailand Visa) — 5 лет, дешевле, для удалёнки и фрилансеров без локального дохода. Non-B — если планируете оформлять Work Permit и работать на тайскую компанию. Подбор — в Visa Quiz.', en: 'DTV (Destination Thailand Visa) — 5 years, cheaper, for remote workers/freelancers without Thai income. Non-B — if you plan a Work Permit and Thai employment. Use Visa Quiz.' } },
    { q: { ru: 'Стану ли я налоговым резидентом Таиланда?', en: 'Will I become a Thai tax resident?' }, a: { ru: 'Да, если проводите ≥180 дней в году. С 2024 действует правило: доход, заработанный за рубежом и переведённый в Таиланд в тот же год, облагается налогом. DTA с РФ и большинством стран ЕС защищает от двойного налогообложения.', en: 'Yes, if you spend ≥180 days a year. Since 2024 foreign-source income remitted to Thailand in the same year is taxable. DTAs with RU and most EU countries prevent double taxation.' } },
    { q: { ru: 'Можно ли арендовать жильё без визы?', en: 'Can I rent a place before getting the visa?' }, a: { ru: 'Да, по туристическому штампу. Большинство собственников подписывают 6–12 мес контракт с депозитом 2 месяца. Контракт нужен для подачи на DTV/Non-B как доказательство адреса.', en: 'Yes, on a tourist stamp. Most landlords sign 6–12 month contracts with 2-month deposit. The lease is needed for DTV/Non-B as proof of address.' } },
    { q: { ru: 'Какой бюджет в месяц на одного?', en: 'What is the monthly budget for one person?' }, a: { ru: 'Комфортно: ฿55 000–80 000. Жильё ฿20–35k, еда ฿15k, транспорт ฿7k, страховка ฿3k, мелочи ฿10–20k. Скромно: от ฿35 000 в студии вне туристических районов.', en: 'Comfortable: ฿55,000–80,000. Housing ฿20–35k, food ฿15k, transport ฿7k, insurance ฿3k, extras ฿10–20k. Budget: from ฿35,000 in a studio outside tourist areas.' } },
    { q: { ru: 'Что делать с депозитом, если хозяин не возвращает?', en: 'What if the landlord refuses to refund the deposit?' }, a: { ru: 'Все наши контракты — через эскроу или через MC с защитой депозита. Если арендуете самостоятельно — фотофиксация и опись на въезде обязательны. Юрист поможет за ฿2 000 консультации.', en: 'Our contracts use escrow or MC with deposit protection. If you rent on your own, photos and an inventory at check-in are mandatory. A lawyer consult is ฿2,000.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать визу за 5 минут', en: 'Pick a visa in 5 min' },
    href: '/visa/quiz',
    subtitle: { ru: 'Бесплатно, с ценой и сроком.', en: 'Free, with price and timeline.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть аренду на год', en: 'Browse year-long rentals' },
    href: '/property?intent=rent-long',
  },
  seo: {
    metaTitle: { ru: 'Переезд на Пхукет одному: DTV, аренда, банк — myUNO', en: 'Solo relocation to Phuket: DTV, rental, bank — myUNO' },
    metaDescription: { ru: 'Соло-переезд на Пхукет на 1–2 года: DTV или Non-B, годовая аренда, тайский счёт, страховка, налоговый статус. План за 60 дней.', en: 'Solo relocation to Phuket for 1–2 years: DTV or Non-B, year-long rental, Thai bank, insurance, tax residency. 60-day plan.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/relocator-solo',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/relocator-solo?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/relocator-solo?lang=en' },
    ],
  },
};
