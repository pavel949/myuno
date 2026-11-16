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
    ru: 'Изучите опубликованные проекты, доступные оценки и документы. Условия, расходы и риски нужно проверить для конкретного предложения.',
    en: 'Explore published projects, available assessments and documents. Check the terms, costs and risks of each offer.',
  },
  pains: [
    {
      ru: 'Вы хотите проверить допущения в прогнозе дохода и связанные с ними риски.',
      en: 'You want to review the assumptions and risks behind an income forecast.',
    },
    {
      ru: 'Не понятно, какой застройщик действительно достроит, а какой нет.',
      en: 'No clarity on which developer will actually deliver and which won’t.',
    },
    {
      ru: 'Нужно сравнить 5 проектов по одинаковым метрикам — нет такого инструмента.',
      en: 'You need to compare 5 projects on the same metrics, no such tool exists.',
    },
    {
      ru: 'Нет понимания налогов в Таиланде и СОИДН с РФ/ЕС.',
      en: 'No clarity on Thai taxes and double-tax treaties with Russia/EU.',
    },
    {
      ru: 'Не хотите ездить — нужен remote-buyer flow с документами и видеосвязью.',
      en: 'You don’t want to travel, you need a remote-buyer flow with documents and video calls.',
    },
  ],
  services: [
    {
      slug: 'clearview-catalog',
      label: { ru: 'Каталог с ClearView™ рейтингом', en: 'Catalogue with ClearView™ rating' },
      oneLiner: { ru: 'AAA–CCC шкала, 8 категорий, отчёты застройщика.', en: 'AAA-CCC scale, 8 categories, developer reports.' },
      href: '/property/offplan',
    },
    {
      slug: 'roi-investor',
      label: { ru: 'ROI Calculator с реальными benchmark', en: 'ROI Calculator with real benchmarks' },
      oneLiner: { ru: 'STR + LTR сценарии, данные из PM Platform — не из брошюр.', en: 'STR + LTR scenarios, data from PM Platform, not brochures.' },
      href: '/newbuilds/calculator?preset=investor',
    },
    {
      slug: 'project-compare',
      label: { ru: 'Сравнение проектов', en: 'Project comparison' },
      oneLiner: { ru: '2–5 объектов, 32 параметра, shareable link.', en: '2-5 properties, 32 parameters, shareable link.' },
      href: '/newbuilds/compare',
    },
    {
      slug: 'clearview-report',
      label: { ru: 'ClearView™ Full Report (฿4,900)', en: 'ClearView™ Full Report (฿4,900)' },
      oneLiner: { ru: 'Полный due diligence отчёт по застройщику — 30+ страниц.', en: 'Full developer DD report, 30+ pages.' },
      href: '/property/clearview',
    },
    {
      slug: 'tax-jurisdiction',
      label: { ru: 'Сравнение юрисдикций для владения', en: 'Ownership jurisdiction compare' },
      oneLiner: { ru: 'Personal vs BVI vs Thai company — налоги и наследование.', en: 'Personal vs BVI vs Thai company, taxes and inheritance.' },
      href: '/legal/tax',
    },
  ],
  faq: [
    {
      q: { ru: 'Какая реальная доходность кондо на Пхукете?', en: 'What’s the real yield of a Phuket condo?' },
      a: {
        ru: 'Доходность зависит от объекта, загрузки, расходов и условий управления. Используйте проверяемые данные конкретного предложения; прогноз не гарантирует результат.',
        en: 'Returns depend on the property, occupancy, costs and management terms. Use verifiable data for the specific offer; a forecast does not guarantee results.',
      },
    },
    {
      q: { ru: 'Что такое ClearView™ Full Report?', en: 'What is the ClearView™ Full Report?' },
      a: {
        ru: 'Уточните состав анализа, доступные исходные сведения, стоимость и срок подготовки конкретного отчёта. Заказ отчёта не заменяет юридическую проверку сделки.',
        en: 'Confirm the analysis scope, available source information, cost and timing for the specific report. Ordering a report does not replace legal transaction review.',
      },
    },
    {
      q: { ru: 'Можно ли купить удалённо?', en: 'Can I buy remotely?' },
      a: {
        ru: 'Да. Видеотур объекта, юридические документы через DocuSign, FET через банк-партнёр, передача собственности — по доверенности. Многоязычная поддержка (EN/RU/TH) на каждом этапе.',
        en: 'Yes. Video tour, legal docs via DocuSign, FET through partner bank, ownership transfer via Power of Attorney. Multilingual support (EN/RU/TH) at every step.',
      },
    },
    {
      q: { ru: 'Как защищены деньги до сдачи объекта?', en: 'How is money protected before completion?' },
      a: {
        ru: 'Условия оплаты, получатель, возможное эскроу и основания возврата зависят от договора. Проверьте документы и согласуйте механизм защиты средств с квалифицированным юристом до оплаты.',
        en: 'Payment terms, recipient, any escrow and refund conditions depend on the contract. Review the documents and agree fund-protection arrangements with a qualified lawyer before paying.',
      },
    },
    {
      q: { ru: 'Какая комиссия myUNO для инвестора?', en: 'What is myUNO’s commission for the investor?' },
      a: {
        ru: 'Комиссии, стоимость отчётов и плательщик зависят от услуги и сделки. Подтвердите актуальные условия до заказа сопровождения или внесения денег.',
        en: 'Fees, report costs and who pays depend on the service and transaction. Confirm current terms before ordering advice or paying.',
      },
    },
    {
      q: { ru: 'Какой минимальный бюджет?', en: 'What’s the minimum budget?' },
      a: {
        ru: 'Economy сегмент — от ฿3M (студии). Standard ฿3.5–8M (1BR). Premium ฿8–18M (2BR / pool villa). Luxury ฿18–50M+.',
        en: 'Economy from ฿3M (studios). Standard ฿3.5-8M (1BR). Premium ฿8-18M (2BR / pool villa). Luxury ฿18-50M+.',
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
      en: 'Phuket property investment: ClearView™ rating, myUNO',
    },
    metaDescription: {
      ru: 'Кондо и виллы Пхукета: опубликованные проекты, доступные оценки и проверка документов. Условия и риски обсуждаются для конкретного предложения.',
      en: 'Phuket condos and villas: published projects, available assessments and document review. Discuss the terms and risks of each offer.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/passive-investors',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://www.myuno.app/for/passive-investors?lang=ru' },
      { lang: 'en', href: 'https://www.myuno.app/for/passive-investors?lang=en' },
      { lang: 'th', href: 'https://www.myuno.app/for/passive-investors?lang=th' },
      { lang: 'zh-CN', href: 'https://www.myuno.app/for/passive-investors?lang=zh-CN' },
    ],
  },
};
