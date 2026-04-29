/**
 * Auto-split from personaLandings.ts (Wave 1.B cleanup, 2026-04).
 * Original file became 1689 lines — each persona lives in its own module.
 * The barrel file personaLandings.ts keeps the public API stable.
 */
import type { PersonaLanding } from '@/lib/landings/types';
import { OG_DEFAULT } from './_shared';

export const P11_MN_INVESTORS: PersonaLanding = {
  personaCode: 'P11',
  slug: 'mn-investors',
  status: 'live',
  h1: {
    ru: 'Диверсификация для монгольских семей: Пхукет',
    en: 'Phuket diversification for Mongolian families',
  },
  subtitle: {
    ru: 'Юань-зона, USD-выручка через STR, foreign quota подтверждён. Многосторонние сделки с участием 3–5 членов семьи — поддерживаем как стандарт.',
    en: 'Yuan-zone exposure, USD income via STR, verified foreign quota. Multi-stakeholder deals with 3–5 family members — supported as standard.',
  },
  pains: [
    { ru: 'Капитал в MNT/CNY теряет покупательную способность — нужна USD-диверсификация.', en: 'MNT/CNY capital loses purchasing power — you need USD diversification.' },
    { ru: 'Решение принимается семьёй из 3–5 человек — нужен общий thread, не WhatsApp хаос.', en: 'Decisions involve 3–5 family members — you need a shared thread, not WhatsApp chaos.' },
    { ru: 'Не понятен FET-процесс при ввозе средств из третьей страны.', en: 'Unclear FET process when bringing funds from a third country.' },
    { ru: 'Ищете объекты под краткосрочную аренду в USD/THB, не THB-only.', en: 'You want properties for STR rental in USD/THB, not THB-only.' },
  ],
  services: [
    { slug: 'fet-guide', label: { ru: 'FET для третьих стран', en: 'FET for third countries' }, oneLiner: { ru: 'Перевод из MNT/CNY в THB через банк-партнёр.', en: 'MNT/CNY to THB via partner bank.' }, href: '/knowledge/pillars/fet-process' },
    { slug: 'multi-stakeholder', label: { ru: 'Multi-stakeholder deal thread', en: 'Multi-stakeholder deal thread' }, oneLiner: { ru: 'Общий workspace для 3–5 членов семьи: документы, голосование, история.', en: 'Shared workspace for 3–5 family members: documents, voting, history.' }, href: '/property/mandate' },
    { slug: 'str-investment', label: { ru: 'STR-объекты с USD выручкой', en: 'STR properties with USD income' }, oneLiner: { ru: 'Кондо в Бангтао/Сурине под Airbnb — yield 6–8%.', en: 'Bangtao/Surin condos for Airbnb — 6–8% yield.' }, href: '/property/offplan?preset=str' },
    { slug: 'tax-mn-th', label: { ru: 'Налоговая структура MN ↔ TH', en: 'MN ↔ TH tax structure' }, oneLiner: { ru: 'Сравнение СОИДН и оптимальной структуры владения.', en: 'DTA comparison and optimal ownership structure.' }, href: '/legal/tax' },
  ],
  faq: [
    { q: { ru: 'Можно ли перевести MNT/CNY напрямую?', en: 'Can I transfer MNT/CNY directly?' }, a: { ru: 'Через банк-партнёр в Гонконге/Сингапуре с конвертацией в USD/THB. FET-сертификат выдаётся при поступлении в Таиланд — обязательно для будущей репатриации.', en: 'Via a partner bank in Hong Kong/Singapore with conversion to USD/THB. FET certificate is issued on arrival in Thailand — mandatory for future repatriation.' } },
    { q: { ru: 'Как организован deal с участием 5 членов семьи?', en: 'How does a deal with 5 family members work?' }, a: { ru: 'Закрытый workspace с ролями (lead buyer, co-investors, advisor). Все документы и голосования — в одном thread. Юрист один на всю семью.', en: 'A private workspace with roles (lead buyer, co-investors, advisor). All documents and votes in one thread. One lawyer for the whole family.' } },
    { q: { ru: 'Какой минимальный бюджет для STR-объекта?', en: 'What’s the minimum STR budget?' }, a: { ru: 'Кондо 1BR в Бангтао — от ฿6M (~USD 175K). Pool villa в Раваи — от ฿15M. Меньшие бюджеты — кондо в Чалонге/Раваи (long-stay rental).', en: '1BR condo in Bangtao — from ฿6M (~USD 175K). Pool villa in Rawai — from ฿15M. Smaller budgets — Chalong/Rawai condos (long-stay rental).' } },
    { q: { ru: 'Поддерживаете ли монгольский язык?', en: 'Do you support Mongolian language?' }, a: { ru: 'Сейчас интерфейс RU + EN. Монгольский планируем на 2026 H2. Пока — все документы и переговоры на RU/EN, юрист с опытом работы с MN-клиентами.', en: 'Currently RU + EN. Mongolian planned for 2026 H2. For now — all documents and negotiations in RU/EN, lawyer with MN-client experience.' } },
  ],
  primaryCta: {
    label: { ru: 'Запросить шорт-лист STR', en: 'Request an STR shortlist' },
    href: '/property/mandate?source=mn',
  },
  secondaryCta: {
    label: { ru: 'FET процесс', en: 'FET process' },
    href: '/knowledge/pillars/fet-process',
  },
  seo: {
    metaTitle: { ru: 'Пхукет для монгольских семей: STR + диверсификация — myUNO', en: 'Phuket for Mongolian families: STR + diversification — myUNO' },
    metaDescription: { ru: 'Недвижимость Пхукета для монгольских инвесторов: USD-выручка через STR, FET из третьих стран, multi-stakeholder сделки.', en: 'Phuket real estate for Mongolian investors: USD income via STR, FET from third countries, multi-stakeholder deals.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/mn-investors',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/mn-investors?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/mn-investors?lang=en' },
    ],
  },
};
