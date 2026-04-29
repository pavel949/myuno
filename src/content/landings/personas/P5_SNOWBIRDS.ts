/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P5_SNOWBIRDS: PersonaLanding = {
  personaCode: 'P5',
  slug: 'snowbirds',
  status: 'live',
  h1: {
    ru: 'Купите свой зимний дом на Пхукете',
    en: 'Own your winter home on Phuket',
  },
  subtitle: {
    ru: 'Если вы возвращаетесь сюда каждую зиму — расчёт «свой vs аренда» обычно сходится за 5–6 сезонов. Покажем цифры на ваших данных.',
    en: 'If you return every winter, owning typically beats renting in 5–6 seasons. We’ll show the numbers on your real data.',
  },
  pains: [
    {
      ru: 'Каждый год платите за аренду 3–5 месяцев — и не получаете актив.',
      en: 'You pay for 3–5 months of rent every year — and own nothing at the end.',
    },
    {
      ru: 'Хотите свой ключ, мебель, кухню — но не хотите 12-месячную операционку.',
      en: 'You want your own key, furniture and kitchen — without year-round operations.',
    },
    {
      ru: 'Не понятно, что выгоднее: condo с rental program или villa-leasehold.',
      en: 'It’s unclear which works best: a condo with rental program or a villa leasehold.',
    },
    {
      ru: 'Боитесь, что недвижимость встанет «мёртвым грузом» 7 месяцев в году.',
      en: 'You worry the property will sit idle for 7 months a year.',
    },
  ],
  services: [
    {
      slug: 'roi-snowbird',
      label: { ru: 'Калькулятор «Свой vs аренда»', en: '“Own vs Rent” calculator' },
      oneLiner: {
        ru: 'Preset для зимовщика: 4 мес жизни + 8 мес сдачи через PM.',
        en: 'Snowbird preset: 4 months self-use + 8 months PM rental.',
      },
      href: '/newbuilds/calculator?preset=snowbird',
    },
    {
      slug: 'condo-catalog',
      label: { ru: 'Кондо для зимовщика', en: 'Condos for snowbirds' },
      oneLiner: { ru: 'Под управлением myUNO PM, freehold quota подтверждён.', en: 'Under myUNO PM, foreign quota verified.' },
      href: '/property/offplan?preset=snowbird',
    },
    {
      slug: 'pm-platform',
      label: { ru: 'Управление в ваше отсутствие', en: 'Management while you’re away' },
      oneLiner: { ru: 'Сдача в аренду 8 мес, отчёт ежемесячно, ключ ждёт.', en: '8-month rental, monthly report, key waiting on arrival.' },
      href: '/owner',
    },
    {
      slug: 'mortgage-estimator',
      label: { ru: 'Финансирование от родного банка', en: 'Financing from your home bank' },
      oneLiner: { ru: 'Сравним ставки в стране резидентства vs Thai mortgage.', en: 'Compare rates in your home country vs Thai mortgage.' },
      href: '/property/mortgage',
    },
  ],
  faq: [
    {
      q: { ru: 'Через сколько лет владение «отбивает» аренду?', en: 'How many years until owning beats renting?' },
      a: {
        ru: 'При 4 мес жизни + 8 мес сдачи через PM — типично 5–6 сезонов до точки безубыточности с учётом cap rate, transaction fees и FX.',
        en: 'With 4 months of self-use + 8 months of PM rental, breakeven is typically 5–6 seasons, including cap rate, transaction fees and FX.',
      },
    },
    {
      q: { ru: 'Кто платит за коммуналку и обслуживание, пока меня нет?', en: 'Who pays utilities and upkeep while I’m away?' },
      a: {
        ru: 'PM-оператор удерживает все коммунальные и common fees из rental income. Вы получаете чистый payout.',
        en: 'The PM operator deducts utilities and common fees from rental income. You receive a net payout.',
      },
    },
    {
      q: { ru: 'Что если я хочу прилетать в любое время, не только зимой?', en: 'What if I want to come outside winter too?' },
      a: {
        ru: 'Owner-blocked dates через PMS-календарь: блокируете нужные даты, на остальные — аренда. Минимальное окно — 5 дней.',
        en: 'Owner-blocked dates via the PMS calendar: block the dates you need, the rest goes to rental. Minimum window — 5 days.',
      },
    },
    {
      q: { ru: 'Какой freehold-кондо в моём бюджете?', en: 'Which freehold condos fit my budget?' },
      a: {
        ru: 'Базовый сегмент Snowbird — Standard (฿3.5–8M). Запустите калькулятор: подберём 5 проектов под ваш бюджет с available foreign quota.',
        en: 'The base Snowbird segment is Standard (฿3.5–8M). Run the calculator: we’ll match 5 projects with available foreign quota.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Запустить калькулятор', en: 'Run the calculator' },
    href: '/newbuilds/calculator?preset=snowbird',
    subtitle: { ru: 'Без обязательств, бесплатно.', en: 'No commitments, free.' },
  },
  secondaryCta: {
    label: { ru: 'Каталог кондо', en: 'Condo catalogue' },
    href: '/property/offplan',
  },
  seo: {
    metaTitle: {
      ru: 'Свой зимний дом на Пхукете — myUNO',
      en: 'Your winter home on Phuket — myUNO',
    },
    metaDescription: {
      ru: 'Расчёт «свой vs аренда» для зимовщика на Пхукете. Кондо с rental program, freehold quota, управление 8 мес в ваше отсутствие.',
      en: 'Own-vs-rent calculator for Phuket snowbirds. Condos with rental program, freehold quota, 8-month management while you’re away.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/snowbirds',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/snowbirds?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/snowbirds?lang=en' },
    ],
  },
};
