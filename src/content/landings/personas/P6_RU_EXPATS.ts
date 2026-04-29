/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';

export const P6_RU_EXPATS: PersonaLanding = {
  personaCode: 'P6',
  slug: 'ru-expats',
  status: 'live',
  h1: {
    ru: 'От аренды к собственности на Пхукете',
    en: 'From renting to owning in Phuket',
  },
  subtitle: {
    ru: 'Вы живёте здесь больше 6 месяцев. Платите аренду, которая больше не вернётся. Покажем, что меняется при покупке — на ваших расходах, не в общих цифрах.',
    en: 'You’ve been living here for over 6 months. Rent you’ll never see again. We’ll show what changes when you buy — based on your real expenses, not generic numbers.',
  },
  pains: [
    {
      ru: 'Аренда ฿40–80K/мес уходит в никуда, дом не становится «своим».',
      en: '฿40–80K/mo rent disappears with nothing to show for it.',
    },
    {
      ru: 'Хочется сделать ремонт под себя, держать животных, не зависеть от owner-а.',
      en: 'You want to renovate to your taste, keep pets, stop depending on the landlord.',
    },
    {
      ru: 'Не понимаете разницу между leasehold и freehold для иностранца.',
      en: 'You don’t understand leasehold vs freehold for foreigners.',
    },
    {
      ru: 'Боитесь застрять с активом, который сложно продать через 3–5 лет.',
      en: 'You worry about being stuck with an asset that’s hard to sell in 3–5 years.',
    },
  ],
  services: [
    {
      slug: 'rent-vs-buy',
      label: { ru: 'Калькулятор «Аренда vs покупка»', en: '“Rent vs Buy” calculator' },
      oneLiner: { ru: 'Preset для resident: 12 мес/год self-use, без сдачи.', en: 'Resident preset: 12 mo/yr self-use, no rental.' },
      href: '/newbuilds/calculator?preset=resident',
    },
    {
      slug: 'resale-catalog',
      label: { ru: 'Готовое жильё (resale)', en: 'Move-in ready (resale)' },
      oneLiner: { ru: 'Дома с историей, проверенный титул, можно жить сразу.', en: 'Homes with track record, verified title, move in immediately.' },
      href: '/property/resale',
    },
    {
      slug: 'leasehold-guide',
      label: { ru: 'Leasehold vs Freehold', en: 'Leasehold vs Freehold' },
      oneLiner: { ru: 'Гайд по правам собственности для иностранца на Пхукете.', en: 'Foreign-buyer guide to ownership rights on Phuket.' },
      href: '/knowledge/pillars/leasehold-vs-freehold',
    },
    {
      slug: 'foreign-quota',
      label: { ru: 'Foreign quota: что это', en: 'Foreign quota explained' },
      oneLiner: { ru: '49% правило, как проверить available quota в проекте.', en: 'The 49% rule, how to check available quota in a project.' },
      href: '/knowledge/pillars/foreign-quota',
    },
  ],
  faq: [
    {
      q: { ru: 'Когда покупка дешевле аренды для resident?', en: 'When does buying beat renting for a resident?' },
      a: {
        ru: 'При плане жить 4+ года — обычно дешевле owning. На горизонте 1–2 года — аренда (transaction costs не успеют отыграться).',
        en: 'If you plan to stay 4+ years, owning is usually cheaper. For 1–2 years — rent (transaction costs won’t pay back).',
      },
    },
    {
      q: { ru: 'Можно ли иностранцу владеть кондо в собственность (freehold)?', en: 'Can a foreigner own a condo freehold?' },
      a: {
        ru: 'Да, до 49% площади здания. Виллы — только leasehold (30+30+30 лет) или через тайскую компанию.',
        en: 'Yes, up to 49% of the building floor area. Villas — only leasehold (30+30+30 yrs) or via a Thai company.',
      },
    },
    {
      q: { ru: 'Что с налогами на покупку?', en: 'What are the purchase taxes?' },
      a: {
        ru: 'Transfer fee 2%, stamp duty 0.5%, withholding tax 1%, business tax при перепродаже до 5 лет — 3.3%. Точные цифры в Purchase Costs Calculator.',
        en: 'Transfer fee 2%, stamp duty 0.5%, withholding tax 1%, business tax (if reselling within 5 yrs) 3.3%. Exact numbers in the Purchase Costs Calculator.',
      },
    },
    {
      q: { ru: 'Помогаете с ипотекой?', en: 'Do you help with mortgages?' },
      a: {
        ru: 'Тайские банки обычно не дают ипотеку иностранцам. Помогаем сравнить ставки в банках вашей страны и подготовить FET документы.',
        en: 'Thai banks rarely lend to foreigners. We help compare rates in your home country and prepare FET documents.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Сравнить аренду и покупку', en: 'Compare rent vs buy' },
    href: '/newbuilds/calculator?preset=resident',
  },
  secondaryCta: {
    label: { ru: 'Готовое жильё (resale)', en: 'Move-in ready' },
    href: '/property/resale',
  },
  seo: {
    metaTitle: {
      ru: 'Купить жильё на Пхукете для жизни — myUNO',
      en: 'Buy a home to live in on Phuket — myUNO',
    },
    metaDescription: {
      ru: 'От аренды к собственности на Пхукете. Калькулятор для resident, leasehold vs freehold, налоги, готовое жильё (resale).',
      en: 'From renting to owning on Phuket. Resident calculator, leasehold vs freehold, taxes, move-in resale homes.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/ru-expats',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/ru-expats?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/ru-expats?lang=en' },
    ],
  },
};
