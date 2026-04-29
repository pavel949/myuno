/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P8_PASSIVE_INVESTORS: PersonaLanding = {
  personaCode: 'P8',
  slug: 'passive-investors',
  status: 'live',
  h1: {
    ru: 'Прозрачные инвестиции в недвижимость Пхукета',
    en: 'Transparent Phuket property investment',
  },
  subtitle: {
    ru: 'ClearView™ рейтинг застройщика, реальный yield из PM-данных, налоговая структура — на одном экране. Без брокерских уловок и завышенных прогнозов.',
    en: 'ClearView™ developer rating, real yield from PM data, tax structure — on one screen. No broker tricks or inflated forecasts.',
  },
  pains: [
    {
      ru: 'Брокеры показывают 8% «гарантированной» доходности — реальная 4–6%.',
      en: 'Brokers promise “guaranteed” 8% yield — reality is 4–6%.',
    },
    {
      ru: 'Не понятно, какой застройщик действительно достроит, а какой нет.',
      en: 'No clarity on which developer will actually deliver and which won’t.',
    },
    {
      ru: 'Нужно сравнить 5 проектов по одинаковым метрикам — нет такого инструмента.',
      en: 'You need to compare 5 projects on the same metrics — no such tool exists.',
    },
    {
      ru: 'Нет понимания налогов в Таиланде и СОИДН с РФ/ЕС.',
      en: 'No clarity on Thai taxes and double-tax treaties with Russia/EU.',
    },
    {
      ru: 'Не хотите ездить — нужен remote-buyer flow с документами и видеосвязью.',
      en: 'You don’t want to travel — you need a remote-buyer flow with documents and video calls.',
    },
  ],
  services: [
    {
      slug: 'clearview-catalog',
      label: { ru: 'Каталог с ClearView™ рейтингом', en: 'Catalogue with ClearView™ rating' },
      oneLiner: { ru: 'AAA–BB шкала, 8 категорий, отчёты застройщика.', en: 'AAA–BB scale, 8 categories, developer reports.' },
      href: '/property/offplan',
    },
    {
      slug: 'roi-investor',
      label: { ru: 'ROI Calculator с реальными benchmark', en: 'ROI Calculator with real benchmarks' },
      oneLiner: { ru: 'STR + LTR сценарии, данные из PM Platform — не из брошюр.', en: 'STR + LTR scenarios, data from PM Platform — not brochures.' },
      href: '/newbuilds/calculator?preset=investor',
    },
    {
      slug: 'project-compare',
      label: { ru: 'Сравнение проектов', en: 'Project comparison' },
      oneLiner: { ru: '2–5 объектов, 32 параметра, shareable link.', en: '2–5 properties, 32 parameters, shareable link.' },
      href: '/newbuilds/compare',
    },
    {
      slug: 'clearview-report',
      label: { ru: 'ClearView™ Full Report (฿4,900)', en: 'ClearView™ Full Report (฿4,900)' },
      oneLiner: { ru: 'Полный due diligence отчёт по застройщику — 30+ страниц.', en: 'Full developer DD report — 30+ pages.' },
      href: '/property/clearview',
    },
    {
      slug: 'tax-jurisdiction',
      label: { ru: 'Сравнение юрисдикций для владения', en: 'Ownership jurisdiction compare' },
      oneLiner: { ru: 'Personal vs BVI vs Thai company — налоги и наследование.', en: 'Personal vs BVI vs Thai company — taxes and inheritance.' },
      href: '/legal/tax',
    },
  ],
  faq: [
    {
      q: { ru: 'Какая реальная доходность кондо на Пхукете?', en: 'What’s the real yield of a Phuket condo?' },
      a: {
        ru: 'STR (Airbnb-стиль) на 1BR в премиум-локации — 5–7% net. LTR (12 мес) — 3–5%. Цифры из PM Platform за 12+ мес, не из обещаний застройщика.',
        en: 'STR (Airbnb-style) for 1BR in a prime location — 5–7% net. LTR (12 mo) — 3–5%. Figures from PM Platform with 12+ mo of data, not developer promises.',
      },
    },
    {
      q: { ru: 'Что такое ClearView™ Full Report?', en: 'What is the ClearView™ Full Report?' },
      a: {
        ru: '30+ страниц анализа застройщика по 8 категориям: финансы, юр-статус земли, история сдач, эскроу, локация, продукт, управление, exit. Стоимость ฿4,900, готовность 5 рабочих дней.',
        en: '30+ pages of developer analysis across 8 categories: finance, land legal status, delivery history, escrow, location, product, management, exit. Cost ฿4,900, ready in 5 working days.',
      },
    },
    {
      q: { ru: 'Можно ли купить удалённо?', en: 'Can I buy remotely?' },
      a: {
        ru: 'Да. Видеотур объекта, юридические документы через DocuSign, FET через банк-партнёр, передача собственности — по доверенности. Поддержка по-русски на каждом этапе.',
        en: 'Yes. Video tour, legal docs via DocuSign, FET through partner bank, ownership transfer via Power of Attorney. Russian-speaking support at every step.',
      },
    },
    {
      q: { ru: 'Как защищены деньги до сдачи объекта?', en: 'How is money protected before completion?' },
      a: {
        ru: 'Эскроу-счёт банка-партнёра. Возврат при срыве сроков застройщиком — по тайскому Condominium Act. Платежи привязаны к строительным вехам.',
        en: 'Partner bank escrow. Refundable on developer delay per the Thai Condominium Act. Payments tied to construction milestones.',
      },
    },
    {
      q: { ru: 'Какая комиссия myUNO для инвестора?', en: 'What is myUNO’s commission for the investor?' },
      a: {
        ru: 'Инвестор не платит комиссию — она от застройщика (5–10% off-plan, 3–5% resale). Доплата только за ClearView Full Report (฿4,900) и Premium Tools (฿990/мес).',
        en: 'The investor pays no commission — it comes from the developer (5–10% off-plan, 3–5% resale). Extra fees only for ClearView Full Report (฿4,900) and Premium Tools (฿990/mo).',
      },
    },
    {
      q: { ru: 'Какой минимальный бюджет?', en: 'What’s the minimum budget?' },
      a: {
        ru: 'Economy сегмент — от ฿3M (студии). Standard ฿3.5–8M (1BR). Premium ฿8–18M (2BR / pool villa). Luxury ฿18–50M+.',
        en: 'Economy from ฿3M (studios). Standard ฿3.5–8M (1BR). Premium ฿8–18M (2BR / pool villa). Luxury ฿18–50M+.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Открыть каталог с ClearView™', en: 'Open the ClearView™ catalogue' },
    href: '/property/offplan',
    subtitle: { ru: 'Без регистрации, фильтры по yield и foreign quota.', en: 'No signup, filters by yield and foreign quota.' },
  },
  secondaryCta: {
    label: { ru: 'Запустить ROI Calculator', en: 'Run the ROI Calculator' },
    href: '/newbuilds/calculator?preset=investor',
  },
  seo: {
    metaTitle: {
      ru: 'Инвестиции в недвижимость Пхукета: ClearView™ рейтинг — myUNO',
      en: 'Phuket property investment: ClearView™ rating — myUNO',
    },
    metaDescription: {
      ru: 'Прозрачные инвестиции в кондо и виллы Пхукета. ClearView™ рейтинг застройщика, реальный yield из PM-данных, remote-buyer flow.',
      en: 'Transparent Phuket condo and villa investing. ClearView™ developer rating, real PM-based yield, remote-buyer flow.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/passive-investors',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/passive-investors?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/passive-investors?lang=en' },
    ],
  },
};
