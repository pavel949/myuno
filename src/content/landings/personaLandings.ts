/**
 * @module content/landings/personaLandings
 * @description M6 · Tracks B.2 + B.7 — конфиг 25 persona-лендингов.
 *
 * Источник правды:
 *  - `docs/canonical/01-segmentation-framework.md` §4 (P1..P25)
 *  - `docs/canonical/IPP.md` PART II §11–§16 (IPP investor personas P5/P6/P8/P9/P10/P11/P22)
 *  - `docs/canonical/03-tone-of-voice.md` §14
 *
 * M10b · 2026-04-24 — добавлены IPP investor personas (P5/P6/P8/P10/P11/P22) как live.
 * Контент base (P1, P9, P13) сохранён без изменений.
 *
 * Slug-конвенция: kebab-case, английский, человеко-читаемый.
 */

import type { PersonaLanding } from '@/lib/landings/types';

// ──────────────────────────────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────────────────────────────

function draftPersona(
  personaCode: PersonaLanding['personaCode'],
  slug: string,
  hint: { ru: string; en: string },
): PersonaLanding {
  return {
    personaCode,
    slug,
    status: 'draft',
    h1: hint,
    subtitle: {
      ru: 'Страница в разработке.',
      en: 'Page under development.',
    },
    pains: [],
    services: [],
    faq: [],
    primaryCta: {
      label: { ru: 'На главную', en: 'Go home' },
      href: '/',
    },
  };
}

const OG_DEFAULT = 'https://myuno.app/og/default-og.jpg';

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P1 — Туристы из России
// ──────────────────────────────────────────────────────────────────────

const P1_TOURISTS: PersonaLanding = {
  personaCode: 'P1',
  slug: 'tourists',
  status: 'live',
  h1: {
    ru: 'Пхукет для русскоязычных туристов',
    en: 'Phuket for Russian-speaking travellers',
  },
  subtitle: {
    ru: 'Трансфер из аэропорта, eSIM, аренда виллы, экскурсии и помощь по-русски — в одном приложении.',
    en: 'Airport transfer, eSIM, villa rental, tours and Russian-speaking support — in one app.',
  },
  pains: [
    {
      ru: 'Не знаете, как доехать из аэропорта без переплаты таксистам.',
      en: 'You don’t know how to get from the airport without overpaying the taxi mafia.',
    },
    {
      ru: 'Нужна связь с первого часа: интернет, навигация, переводчик.',
      en: 'You need connectivity from hour one: internet, navigation, a translator.',
    },
    {
      ru: 'Ищете виллу или отель, где принимают карты «Мир» или платёж в THB.',
      en: 'You’re looking for a villa or hotel that accepts Mir cards or THB payment.',
    },
    {
      ru: 'Хотите посмотреть остров, но не довериться продавцам туров на улице.',
      en: 'You want to see the island without trusting street tour vendors.',
    },
  ],
  services: [
    {
      slug: 'airport-transfer',
      label: { ru: 'Трансфер из аэропорта', en: 'Airport transfer' },
      oneLiner: { ru: 'Минивэн до отеля, цена THB фикс.', en: 'Fixed-price minivan to your hotel.' },
      href: '/landing/airport-transfer',
    },
    {
      slug: 'esim',
      label: { ru: 'eSIM на 7–30 дней', en: 'eSIM 7–30 days' },
      oneLiner: { ru: '4G по всему острову, активация в приложении.', en: '4G across the island, in-app activation.' },
      href: '/sim',
    },
    {
      slug: 'villa-rental',
      label: { ru: 'Аренда виллы', en: 'Villa rental' },
      oneLiner: { ru: 'Каталог проверенных вилл с фото и отзывами.', en: 'Verified villa catalogue with photos and reviews.' },
      href: '/property',
    },
    {
      slug: 'tours',
      label: { ru: 'Экскурсии и активности', en: 'Tours & activities' },
      oneLiner: { ru: 'Острова, кулинарные, дайвинг — без зазывал.', en: 'Islands, cooking, diving — without street touts.' },
      href: '/tours',
    },
  ],
  faq: [
    {
      q: { ru: 'Принимают ли карты «Мир»?', en: 'Are Mir cards accepted?' },
      a: {
        ru: 'В большинстве вилл и сервисов — нет. В приложении можно платить в THB с любой карты или через USDT.',
        en: 'Most villas and services do not accept Mir. In the app you can pay in THB with any card or via USDT.',
      },
    },
    {
      q: { ru: 'Что делать, если потерял документы?', en: 'What if I lose my documents?' },
      a: {
        ru: 'Напишите в чат — мы соединим с консульством и поможем составить заявление в туристическую полицию.',
        en: 'Message us in chat — we’ll connect you to the consulate and help file a tourist police report.',
      },
    },
    {
      q: { ru: 'Безопасно ли арендовать байк?', en: 'Is renting a scooter safe?' },
      a: {
        ru: 'Только при наличии международных прав категории A и шлема. Без прав — штраф 500–2 000 THB.',
        en: 'Only with an international licence (cat. A) and a helmet. Without — fines 500–2,000 THB.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Заказать трансфер', en: 'Book a transfer' },
    href: '/landing/airport-transfer',
    subtitle: { ru: 'Цена в THB, оплата в приложении.', en: 'Price in THB, paid in the app.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть каталог вилл', en: 'Browse villas' },
    href: '/property',
  },
  seo: {
    metaTitle: {
      ru: 'Пхукет по-русски: трансфер, eSIM, виллы, экскурсии — myUNO',
      en: 'Phuket in Russian: transfer, eSIM, villas, tours — myUNO',
    },
    metaDescription: {
      ru: 'Трансфер из аэропорта, eSIM, аренда виллы и экскурсии. Поддержка по-русски, оплата в THB. Без посредников у стойки.',
      en: 'Airport transfer, eSIM, villa rental and tours on Phuket. Russian-speaking support, THB payments, no street vendors.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/tourists',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/tourists?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/tourists?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P5 — Snowbirds (IPP §11)
// ──────────────────────────────────────────────────────────────────────

const P5_SNOWBIRDS: PersonaLanding = {
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

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P6 — Russian-speaking expats / settlers (IPP §12)
// ──────────────────────────────────────────────────────────────────────

const P6_RU_EXPATS: PersonaLanding = {
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

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P8 — Passive investors (IPP §13 — main funnel, 70% revenue)
// ──────────────────────────────────────────────────────────────────────

const P8_PASSIVE_INVESTORS: PersonaLanding = {
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

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P9 — HNW (existing, kept verbatim)
// ──────────────────────────────────────────────────────────────────────

const P9_HNW: PersonaLanding = {
  personaCode: 'P9',
  slug: 'hnw',
  status: 'live',
  h1: {
    ru: 'Недвижимость Пхукета для частного капитала',
    en: 'Phuket real estate for private capital',
  },
  subtitle: {
    ru: 'Закрытый шорт-лист объектов, ClearView™ рейтинг застройщиков, юрист и налоговый консультант — на одном договоре.',
    en: 'A private shortlist of properties, ClearView™ developer ratings, lawyer and tax advisor — under one engagement.',
  },
  pains: [
    { ru: 'Брокеры показывают одни и те же 30 объектов — нужен независимый анализ.', en: 'Brokers show the same 30 listings — you need an independent view.' },
    { ru: 'Нет понимания, какой застройщик доделает проект, а какой — нет.', en: 'No clarity on which developer will deliver and which won’t.' },
    { ru: 'Нужна структура владения, которая выдержит проверку в РФ и ЕС.', en: 'You need an ownership structure that holds up in Russia and the EU.' },
    { ru: 'Хотите управлять активом удалённо, без мелочной операционки.', en: 'You want to manage the asset remotely, without operational micro-decisions.' },
    { ru: 'Важна конфиденциальность — без публикации сделки в открытых каналах.', en: 'Confidentiality matters — no deal published in public channels.' },
  ],
  services: [
    { slug: 'clearview-rating', label: { ru: 'ClearView™ рейтинг застройщика', en: 'ClearView™ developer rating' }, oneLiner: { ru: '8 категорий, шкала AAA–BB, отчёт за 5 рабочих дней.', en: '8 categories, AAA–BB scale, report in 5 working days.' }, href: '/property/clearview' },
    { slug: 'private-shortlist', label: { ru: 'Закрытый шорт-лист объектов', en: 'Private shortlist' }, oneLiner: { ru: '5–8 объектов под ваш мандат, без публичной выдачи.', en: '5–8 properties matched to your mandate, off-market.' }, href: '/property/mandate' },
    { slug: 'legal-structuring', label: { ru: 'Юридическая структура владения', en: 'Ownership structuring' }, oneLiner: { ru: 'Freehold, leasehold, BVI/Thai company — сравнение по налогам и наследованию.', en: 'Freehold, leasehold, BVI/Thai company — compared on tax and inheritance.' }, href: '/legal' },
    { slug: 'tax-advisory', label: { ru: 'Налоговая консультация', en: 'Tax advisory' }, oneLiner: { ru: 'Налогообложение в Таиланде, СОИДН с РФ и ЕС.', en: 'Thai taxation and double-tax treaties with Russia and the EU.' }, href: '/legal/tax' },
    { slug: 'asset-management', label: { ru: 'Управление активом', en: 'Asset management' }, oneLiner: { ru: 'Сдача в аренду, отчёт ежемесячно, аудит ежегодно.', en: 'Rental management, monthly reporting, annual audit.' }, href: '/owner' },
  ],
  faq: [
    { q: { ru: 'Как устроен ClearView™ рейтинг?', en: 'How does the ClearView™ rating work?' }, a: { ru: '8 категорий с весами: финансы застройщика, юридический статус земли, история сдач, эскроу, локация, продукт, управление, выход. Шкала AAA, AA, A, BBB, BB.', en: 'Eight weighted categories: developer finance, land legal status, delivery history, escrow, location, product, management, exit. Scale AAA, AA, A, BBB, BB.' } },
    { q: { ru: 'Какой минимальный бюджет?', en: 'What’s the minimum budget?' }, a: { ru: 'Шорт-лист собираем от 15 млн THB. Для бюджета ниже — стандартный каталог.', en: 'We curate shortlists from 15M THB. Below that — the standard catalogue.' } },
    { q: { ru: 'Можно ли купить на иностранную компанию?', en: 'Can a foreign company hold the asset?' }, a: { ru: 'Да: BVI/Singapore через тайскую компанию-владельца, либо leasehold напрямую. Юрист соберёт варианты под ваш профиль.', en: 'Yes: BVI/Singapore through a Thai holding entity, or leasehold directly. The lawyer maps options to your profile.' } },
    { q: { ru: 'Как защищён депозит до сделки?', en: 'How is the deposit protected before closing?' }, a: { ru: 'Через эскроу-счёт банка-партнёра. Возврат при отказе застройщика от сроков — по тайскому Condominium Act.', en: 'Via a partner bank escrow. Refundable on developer delay per the Thai Condominium Act.' } },
    { q: { ru: 'Какая комиссия myUNO?', en: 'What’s myUNO’s fee?' }, a: { ru: 'Фиксированная плата за ClearView-отчёт и шорт-лист; на сделке комиссия от застройщика, без надбавки к цене для вас.', en: 'Fixed fee for the ClearView report and shortlist; deal commission from the developer, no markup on your price.' } },
    { q: { ru: 'Будет ли сделка публичной?', en: 'Will the deal be public?' }, a: { ru: 'Нет. NDA подписывается до передачи объектов; отчёт и переписка хранятся в закрытом workspace.', en: 'No. NDA is signed before any disclosure; reports and chat live in a private workspace.' } },
  ],
  primaryCta: {
    label: { ru: 'Запросить шорт-лист', en: 'Request a shortlist' },
    href: '/property/mandate',
    subtitle: { ru: 'Ответ в течение 24 часов от партнёра.', en: 'Response within 24 hours from a partner.' },
  },
  secondaryCta: {
    label: { ru: 'Прочитать ClearView™', en: 'Read about ClearView™' },
    href: '/property/clearview',
  },
  seo: {
    metaTitle: { ru: 'Недвижимость Пхукета для частного капитала — myUNO', en: 'Phuket real estate for private capital — myUNO' },
    metaDescription: { ru: 'Закрытый шорт-лист недвижимости на Пхукете для частного капитала. ClearView™ рейтинг застройщика, юрист и налоговый консультант — на одном договоре.', en: 'Private Phuket real-estate shortlist for HNW capital. ClearView™ developer rating, lawyer and tax advisor — under one engagement.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/hnw',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/hnw?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/hnw?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P10 — STR/PM operators (IPP §14 — expansion play)
// ──────────────────────────────────────────────────────────────────────

const P10_OPERATORS: PersonaLanding = {
  personaCode: 'P10',
  slug: 'operators',
  status: 'live',
  h1: {
    ru: 'Расширьте портфель: от первого объекта ко второму',
    en: 'Expand your portfolio: from one property to the next',
  },
  subtitle: {
    ru: 'У вас уже есть один работающий объект. Покажем, как добавить второй с диверсификацией района и типа — на ваших данных yield/occupancy.',
    en: 'You already run one property successfully. We’ll show how to add a second with district and type diversification — based on your real yield/occupancy data.',
  },
  pains: [
    { ru: 'Один объект сильно зависит от сезона и ремонта — нужна диверсификация.', en: 'A single property is highly seasonal and repair-dependent — you need diversification.' },
    { ru: 'Нет данных по другим районам и типам, чтобы выбрать второй объект осознанно.', en: 'You lack data on other districts and types to pick the second property wisely.' },
    { ru: 'Управление двумя объектами вручную — нагрузка кратно растёт.', en: 'Self-managing two properties scales operational load non-linearly.' },
    { ru: 'Не знаете, как структурировать ownership чтобы оба объекта были в одной налоговой картине.', en: 'You don’t know how to structure ownership so both properties sit in one tax picture.' },
  ],
  services: [
    { slug: 'portfolio-expansion', label: { ru: '«Готов к #2?» analysis', en: '“Ready for #2?” analysis' }, oneLiner: { ru: 'Анализ текущего объекта + рекомендации диверсификации.', en: 'Current-property review + diversification recommendation.' }, href: '/owner' },
    { slug: 'district-heatmap', label: { ru: 'District Heatmap (Pro)', en: 'District Heatmap (Pro)' }, oneLiner: { ru: 'Yield, occupancy, ADR по 8 районам — реальные PM-данные.', en: 'Yield, occupancy, ADR across 8 districts — real PM data.' }, href: '/property/insights' },
    { slug: 'urgent-deals', label: { ru: 'Urgent deals под ваши критерии', en: 'Urgent deals matching your criteria' }, oneLiner: { ru: 'Distressed-объекты со скидкой 15–25% к AVM.', en: 'Distressed properties with 15–25% discount to AVM.' }, href: '/property/urgent' },
    { slug: 'pm-platform', label: { ru: 'Управление портфелем', en: 'Portfolio management' }, oneLiner: { ru: 'Multi-property dashboard, единая отчётность, налоги.', en: 'Multi-property dashboard, unified reporting, taxes.' }, href: '/owner' },
  ],
  faq: [
    { q: { ru: 'Когда стоит покупать второй объект?', en: 'When should you buy the second property?' }, a: { ru: 'Если первый объект 12+ мес показывает stable occupancy >65% и net yield >5%, имеет смысл диверсифицироваться. Покажем расчёт на ваших данных.', en: 'If your first property shows 12+ mo of stable occupancy >65% and net yield >5%, diversifying makes sense. We’ll model it on your data.' } },
    { q: { ru: 'В какой район диверсифицироваться?', en: 'Which district to diversify into?' }, a: { ru: 'Если первый — Раваи (long-stay), второй — Бангтао/Сурин (premium STR). Если первый — кондо, рассмотрите pool villa. Heatmap покажет.', en: 'If your first is Rawai (long-stay), the second could be Bangtao/Surin (premium STR). If your first is a condo, consider a pool villa. Heatmap will show.' } },
    { q: { ru: 'Что с urgent deals — насколько они «настоящие»?', en: 'How real are urgent deals?' }, a: { ru: 'Каждый urgent объект проходит admin-валидацию: AVM-discount подтверждён, причина продажи verified, title clean. Скам-объекты не публикуются.', en: 'Every urgent property is admin-validated: AVM discount verified, sale reason confirmed, title clean. Scam listings are not published.' } },
    { q: { ru: 'Как оформить второй объект на ту же структуру?', en: 'How to put the second property under the same structure?' }, a: { ru: 'Зависит от первой структуры (personal / Thai company / BVI). Юрист пройдёт по обоим объектам единым проектом — экономия 30–40% vs два отдельных.', en: 'Depends on your first structure (personal / Thai company / BVI). The lawyer covers both properties as one project — 30–40% saving vs two separate.' } },
  ],
  primaryCta: {
    label: { ru: 'Открыть owner-кабинет', en: 'Open the owner dashboard' },
    href: '/owner',
    subtitle: { ru: '«Ready for #2?» виджет — на главной кабинета.', en: '“Ready for #2?” widget on dashboard.' },
  },
  secondaryCta: {
    label: { ru: 'Посмотреть urgent deals', en: 'Browse urgent deals' },
    href: '/property/urgent',
  },
  seo: {
    metaTitle: { ru: 'Расширение портфеля недвижимости на Пхукете — myUNO', en: 'Phuket property portfolio expansion — myUNO' },
    metaDescription: { ru: 'Аналитика для STR/PM операторов: когда покупать второй объект, в какой район диверсифицироваться, urgent deals под ваши критерии.', en: 'Analytics for STR/PM operators: when to add the second property, which district to diversify into, urgent deals matching your criteria.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/operators',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/operators?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/operators?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P11 — Mongolian investors (IPP §15 — niche, RU+EN, no MN)
// ──────────────────────────────────────────────────────────────────────

const P11_MN_INVESTORS: PersonaLanding = {
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

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P13 — Pet owners (existing, kept verbatim)
// ──────────────────────────────────────────────────────────────────────

const P13_PET_OWNERS: PersonaLanding = {
  personaCode: 'P13',
  slug: 'pet-owners',
  status: 'live',
  h1: { ru: 'Пхукет с питомцем: ввоз, виллы, ветеринар', en: 'Phuket with a pet: import, villas, vet' },
  subtitle: {
    ru: 'Помогаем оформить ввоз собаки или кошки, найти pet-friendly виллу и подключить ветеринара по-русски.',
    en: 'We help you import a dog or cat, find a pet-friendly villa and connect with a Russian-speaking vet.',
  },
  pains: [
    { ru: 'Не знаете, какие документы нужны для ввоза питомца в Таиланд.', en: 'You don’t know which papers are required to import a pet to Thailand.' },
    { ru: 'Большинство вилл и кондо отказывают животным или требуют большой депозит.', en: 'Most villas and condos refuse pets or demand a large deposit.' },
    { ru: 'Нужен ветеринар по-русски с круглосуточным дежурством.', en: 'You need a Russian-speaking vet on 24/7 standby.' },
    { ru: 'Хотите гулять, плавать и есть в кафе с питомцем — не везде это разрешено.', en: 'You want to walk, swim and eat out with your pet — but rules differ per spot.' },
  ],
  services: [
    { slug: 'pet-import', label: { ru: 'Ввоз питомца', en: 'Pet import' }, oneLiner: { ru: 'Полный пакет: чип, прививки, R7, перевозка из аэропорта.', en: 'Full pack: chip, shots, R7, airport pickup.' }, href: '/pets/import' },
    { slug: 'pet-friendly-villas', label: { ru: 'Pet-friendly виллы', en: 'Pet-friendly villas' }, oneLiner: { ru: 'Каталог проверенных вилл, где питомца действительно ждут.', en: 'Verified villas where pets are actually welcome.' }, href: '/property?petFriendly=1' },
    { slug: 'vet-network', label: { ru: 'Ветеринары по-русски', en: 'Russian-speaking vets' }, oneLiner: { ru: 'Сеть из 6 клиник, доступ 24/7, скидка участникам.', en: '6-clinic network, 24/7 access, member discount.' }, href: '/pets/vets' },
    { slug: 'grooming-care', label: { ru: 'Груминг и зоомагазины', en: 'Grooming & pet shops' }, oneLiner: { ru: 'Премиум-уход в Раваи и Чалонге, доставка корма.', en: 'Premium care in Rawai and Chalong, pet-food delivery.' }, href: '/pets/care' },
  ],
  faq: [
    { q: { ru: 'Какие документы нужны для ввоза собаки?', en: 'Which documents are needed to import a dog?' }, a: { ru: 'Микрочип, паспорт, прививка от бешенства не моложе 21 дня, справка из госветслужбы и разрешение R7 от тайского DLD.', en: 'Microchip, pet passport, rabies vaccine ≥21 days old, government vet certificate and an R7 permit from Thai DLD.' } },
    { q: { ru: 'Сколько стоит ввоз?', en: 'How much does import cost?' }, a: { ru: 'Госпошлина DLD — около 1 000 THB. Наша помощь с пакетом документов — 6 500 THB. Перевозка из карго — от 2 500 THB.', en: 'DLD fee — about 1,000 THB. Our paperwork help — 6,500 THB. Cargo transfer — from 2,500 THB.' } },
    { q: { ru: 'Есть ли карантин?', en: 'Is there quarantine?' }, a: { ru: 'При полном пакете и прививке от бешенства карантин не требуется — питомец едет с вами после оформления в аэропорту.', en: 'With a complete package and valid rabies shot, no quarantine — the pet leaves with you after airport clearance.' } },
    { q: { ru: 'Какие виллы реально принимают животных?', en: 'Which villas actually accept pets?' }, a: { ru: 'В каталоге 80+ объектов с подтверждённой политикой. Депозит за животное — 5 000–10 000 THB, возвращается при выезде.', en: 'The catalogue lists 80+ properties with confirmed policy. Pet deposit 5,000–10,000 THB, refunded on checkout.' } },
    { q: { ru: 'Можно ли с питомцем в кафе и на пляж?', en: 'Can I go to a café or beach with my pet?' }, a: { ru: 'Часть кафе в Раваи и Чалонге принимает собак. На большинстве пляжей — после 18:00, без ошейника штраф 1 000 THB.', en: 'Some cafés in Rawai and Chalong accept dogs. Most beaches — after 6pm; no collar = 1,000 THB fine.' } },
    { q: { ru: 'Что делать, если питомец заболел ночью?', en: 'What if my pet falls ill at night?' }, a: { ru: 'Дежурная клиника принимает 24/7. Напишите в чат — мы согласуем приём и при необходимости пришлём такси.', en: 'A 24/7 emergency clinic is on call. Message us — we’ll book the visit and dispatch a taxi if needed.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать виллу с питомцем', en: 'Find a pet-friendly villa' },
    href: '/property?petFriendly=1',
    subtitle: { ru: '80+ проверенных объектов в каталоге.', en: '80+ verified properties in the catalogue.' },
  },
  secondaryCta: {
    label: { ru: 'Оформить ввоз', en: 'Start the import paperwork' },
    href: '/pets/import',
  },
  seo: {
    metaTitle: { ru: 'Пхукет с питомцем: ввоз, виллы, ветеринар — myUNO', en: 'Phuket with a pet: import, villas, vet — myUNO' },
    metaDescription: { ru: 'Pet-friendly виллы, ввоз собаки или кошки по правилам DLD, ветеринар по-русски и груминг. Чек-листы, цены в THB.', en: 'Pet-friendly villas, DLD-compliant cat or dog import, Russian-speaking vet and grooming. Checklists, THB pricing.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/pet-owners',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/pet-owners?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/pet-owners?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P22 — Developer partner door (IPP §16)
//
//  ⚠️ TAXONOMY CONFLICT: 01-segmentation-framework.md §4 определяет P22 как
//  «Локальные фрилансеры». IPP.md §16 использует P22 как «Застройщик-партнёр».
//  Разрешение конфликта (M10b decision): сохраняем P22 = freelancers в
//  segmentation framework (старый канон), но добавляем отдельный slug
//  `developer-partner` под P22 для IPP-цели. Личный конфликт зафиксирован в
//  docs/canonical/m10b-completion.md §Open conflicts.
//
//  P22 freelancers остаётся в списке как draft.
// ──────────────────────────────────────────────────────────────────────

const P22_DEVELOPER_PARTNER: PersonaLanding = {
  personaCode: 'P22',
  slug: 'developer-partner',
  status: 'live',
  h1: {
    ru: 'Получите ClearView™ листинг проекта на myUNO',
    en: 'List your project on myUNO with ClearView™ certification',
  },
  subtitle: {
    ru: 'Прозрачный рейтинг застройщика, доступ к 800+ верифицированным инвесторам, прямой канал лидов без brokers chain.',
    en: 'Transparent developer rating, access to 800+ verified investors, direct lead channel without broker chains.',
  },
  pains: [
    { ru: 'Brokers требуют 10–15% комиссии и не дают доступа к инвестору напрямую.', en: 'Brokers demand 10–15% commission and block direct investor access.' },
    { ru: 'Лиды от обычных порталов — низкое качество, нет проверки бюджета и intent.', en: 'Generic-portal leads are low quality, no budget or intent verification.' },
    { ru: 'Нужен независимый рейтинг, который покажет реальные сильные стороны проекта.', en: 'You need an independent rating that highlights real project strengths.' },
    { ru: 'Хотите управлять inventory и ценами в реальном времени, не через email.', en: 'You want to manage inventory and pricing in real-time, not via email.' },
  ],
  services: [
    { slug: 'clearview-certification', label: { ru: 'ClearView™ сертификация проекта', en: 'ClearView™ project certification' }, oneLiner: { ru: 'Рейтинг AAA–BB по 8 категориям, отчёт за 5 рабочих дней.', en: 'AAA–BB rating across 8 categories, report in 5 working days.' }, href: '/property/clearview' },
    { slug: 'developer-portal', label: { ru: 'Developer Portal', en: 'Developer Portal' }, oneLiner: { ru: 'Inventory, цены, лиды, аналитика — единый dashboard.', en: 'Inventory, pricing, leads, analytics — single dashboard.' }, href: '/developer-portal/apply' },
    { slug: 'verified-leads', label: { ru: 'Верифицированные лиды', en: 'Verified leads' }, oneLiner: { ru: 'Lead score 80+, проверенный бюджет, intent confirmed.', en: 'Lead score 80+, verified budget, intent confirmed.' }, href: '/developer-portal/apply' },
    { slug: 'commission-structure', label: { ru: 'Прозрачная commission structure', en: 'Transparent commission structure' }, oneLiner: { ru: '5–10% off-plan condo, 3–8% villa — без скрытых fees.', en: '5–10% off-plan condo, 3–8% villa — no hidden fees.' }, href: '/developer-portal/apply' },
  ],
  faq: [
    { q: { ru: 'Как стать партнёром?', en: 'How do I become a partner?' }, a: { ru: 'Подача заявки в Developer Portal → due diligence (3–5 дней) → подписание агентского соглашения → ClearView assessment → листинг.', en: 'Apply via Developer Portal → due diligence (3–5 days) → sign agency agreement → ClearView assessment → listing.' } },
    { q: { ru: 'Сколько стоит ClearView сертификация?', en: 'How much does ClearView certification cost?' }, a: { ru: 'Developer Assessment ฿350–600K (one-time, зависит от размера проекта). Quarterly Monitoring ฿15K/квартал. Listing fee ฿120–180K/год.', en: 'Developer Assessment ฿350–600K (one-time, depends on project size). Quarterly Monitoring ฿15K/quarter. Listing fee ฿120–180K/year.' } },
    { q: { ru: 'Что входит в аналитику Developer Portal?', en: 'What’s included in Developer Portal analytics?' }, a: { ru: 'Лиды по этапам воронки, источники трафика, conversion по unit-types, comparison с конкурентами в районе.', en: 'Leads by funnel stage, traffic sources, conversion by unit type, comparison with district competitors.' } },
    { q: { ru: 'Можем ли мы управлять inventory сами?', en: 'Can we manage inventory ourselves?' }, a: { ru: 'Да. Bulk upload через CSV, real-time updates через Developer Portal или API. Все изменения отражаются на публичном каталоге за 5 минут.', en: 'Yes. Bulk upload via CSV, real-time updates via Developer Portal or API. Changes reflect in the public catalogue within 5 minutes.' } },
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
    metaTitle: { ru: 'Партнёрство с myUNO для застройщиков Пхукета — myUNO', en: 'Partner with myUNO as a Phuket developer — myUNO' },
    metaDescription: { ru: 'ClearView™ сертификация, Developer Portal, верифицированные лиды от 800+ инвесторов. Прозрачная commission structure, прямой канал.', en: 'ClearView™ certification, Developer Portal, verified leads from 800+ investors. Transparent commission, direct channel.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/developer-partner',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/developer-partner?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/developer-partner?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P4 — Digital nomads
// ──────────────────────────────────────────────────────────────────────

const P4_DIGITAL_NOMADS: PersonaLanding = {
  personaCode: 'P4',
  slug: 'digital-nomads',
  status: 'live',
  h1: {
    ru: 'Пхукет для digital nomad: виза, жильё, коворкинг',
    en: 'Phuket for digital nomads: visa, housing, co-working',
  },
  subtitle: {
    ru: 'DTV-виза на 5 лет, long-stay condo с быстрым интернетом, коворкинги и комьюнити — собрали всё, что нужно для удалённой работы из Таиланда.',
    en: 'DTV visa for up to 5 years, long-stay condos with fast internet, co-working spaces and community — everything you need to work remotely from Thailand.',
  },
  pains: [
    { ru: 'Не понятно, какая виза легально позволяет работать удалённо: туристическая, DTV или Education.', en: 'Unclear which visa lets you legally work remotely: tourist, DTV or Education.' },
    { ru: 'Нужен интернет 100+ Mbps и резерв на отключения — не каждое жильё это даёт.', en: 'You need 100+ Mbps and outage backup — not every rental delivers.' },
    { ru: 'Хочется коворкинг с приличным звуком для созвонов и людей вокруг.', en: 'You want a co-working space with good acoustics for calls and people around.' },
    { ru: 'Приехать одному скучно — где найти комьюнити удалённых работников.', en: 'Coming alone is dull — where to find a remote-worker community.' },
  ],
  services: [
    { slug: 'visa-quiz', label: { ru: 'Подбор визы (DTV / LTR / Education)', en: 'Visa picker (DTV / LTR / Education)' }, oneLiner: { ru: '4 вопроса — рекомендация и список документов.', en: '4 questions — recommendation and document checklist.' }, href: '/visa/quiz' },
    { slug: 'long-stay-condo', label: { ru: 'Long-stay condo', en: 'Long-stay condo' }, oneLiner: { ru: 'От 1 месяца, fiber 200 Mbps, кухня, бассейн.', en: 'From 1 month, 200 Mbps fibre, kitchen, pool.' }, href: '/property?staytype=long' },
    { slug: 'coworking-map', label: { ru: 'Карта коворкингов', en: 'Co-working map' }, oneLiner: { ru: 'KoHub, Garage, Hatch — цены, скорость, день-пасс.', en: 'KoHub, Garage, Hatch — prices, speed, day passes.' }, href: '/services/coworking' },
    { slug: 'nomad-guide', label: { ru: 'Nomad Guide', en: 'Nomad Guide' }, oneLiner: { ru: 'Полный гид по Пхукету для удалёнщика.', en: 'Full Phuket guide for the remote worker.' }, href: '/nomad-guide' },
  ],
  faq: [
    { q: { ru: 'Что такое DTV и кому она подходит?', en: 'What is DTV and who qualifies?' }, a: { ru: 'Destination Thailand Visa — мульти-виза на 5 лет для удалённых работников и фрилансеров. Каждое пребывание до 180 дней. Нужны: контракт/договор, выписка с балансом 500 000 THB, медицинская страховка.', en: 'Destination Thailand Visa — a 5-year multi-entry visa for remote workers and freelancers. Each stay up to 180 days. Required: contract, bank statement showing 500,000 THB, medical insurance.' } },
    { q: { ru: 'Можно ли работать на туристической визе?', en: 'Can I work on a tourist visa?' }, a: { ru: 'Удалённая работа на иностранного работодателя — серая зона. Тайские власти на практике не преследуют, но статус юридически уязвим. DTV закрывает этот вопрос полностью.', en: 'Remote work for a foreign employer is a grey zone. Authorities rarely enforce, but the status is legally fragile. DTV resolves this fully.' } },
    { q: { ru: 'Какой район выбрать для long-stay?', en: 'Which area for long-stay?' }, a: { ru: 'Раваи и Чалонг — нижний бюджет, тихо. Бангтао и Лагуна — премиум, инфраструктура, коворкинги. Камала — баланс. Патонг — только если нужна ночная жизнь.', en: 'Rawai and Chalong — lower budget, quiet. Bang Tao and Laguna — premium, infrastructure, co-working. Kamala — balanced. Patong — only if you want nightlife.' } },
    { q: { ru: 'Сколько стоит жизнь в месяц?', en: 'What is the monthly cost of living?' }, a: { ru: 'Минимум — ฿45 000 (студия, еда вне ресторанов, байк). Комфорт — ฿80 000–120 000 (1-bed condo, рестораны, спорт). Премиум — от ฿200 000.', en: 'Minimum — ฿45,000 (studio, mostly cooking, scooter). Comfortable — ฿80,000–120,000 (1-bed condo, eating out, sports). Premium — from ฿200,000.' } },
    { q: { ru: 'Где познакомиться с другими удалёнщиками?', en: 'Where to meet other nomads?' }, a: { ru: 'KoHub в Раваи — главное место. Telegram-группа myUNO Nomads — 1 200+ участников, события каждую неделю.', en: 'KoHub in Rawai is the main hub. The myUNO Nomads Telegram group — 1,200+ members, weekly events.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать визу', en: 'Pick a visa' },
    href: '/visa/quiz',
    subtitle: { ru: '4 вопроса, бесплатно.', en: '4 questions, free.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть Nomad Guide', en: 'Open the Nomad Guide' },
    href: '/nomad-guide',
  },
  seo: {
    metaTitle: { ru: 'Пхукет для digital nomad: DTV, condo, коворкинг — myUNO', en: 'Phuket for digital nomads: DTV, condo, co-working — myUNO' },
    metaDescription: { ru: 'DTV-виза на 5 лет, long-stay condo с fiber-интернетом, карта коворкингов и комьюнити удалёнщиков на Пхукете.', en: 'DTV 5-year visa, long-stay condos with fibre internet, co-working map and remote-worker community on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/digital-nomads',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/digital-nomads?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/digital-nomads?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P7 — Families with children
// ──────────────────────────────────────────────────────────────────────

const P7_FAMILIES: PersonaLanding = {
  personaCode: 'P7',
  slug: 'families',
  status: 'live',
  h1: {
    ru: 'Пхукет с детьми: школы, виллы, безопасность',
    en: 'Phuket with kids: schools, villas, safety',
  },
  subtitle: {
    ru: 'Международные школы, family-villas с бассейном и кухней, педиатры по-русски, экскурсии для детей — выстраиваем переезд или зимовку под ваш состав семьи.',
    en: 'International schools, family villas with pool and kitchen, Russian-speaking paediatricians and kid-friendly tours — we plan your move or winter stay around your family.',
  },
  pains: [
    { ru: 'Не понимаете, какая школа подходит ребёнку: British, IB, Russian curriculum.', en: 'Unclear which school fits your child: British, IB, Russian curriculum.' },
    { ru: 'Нужна вилла с огороженной территорией, кухней и стиральной машиной.', en: 'You need a villa with enclosed grounds, kitchen and washing machine.' },
    { ru: 'Боитесь ехать без понимания, как устроена медицина для детей.', en: 'You worry about coming over without understanding how kids healthcare works.' },
    { ru: 'Хотите занятия для детей: спорт, английский, плавание, лагерь на каникулах.', en: 'You want activities for kids: sports, English, swimming, holiday camps.' },
  ],
  services: [
    { slug: 'school-finder', label: { ru: 'Поиск школы', en: 'School Finder' }, oneLiner: { ru: '15 школ, фильтр по программе, бюджету и району.', en: '15 schools filtered by curriculum, budget and area.' }, href: '/school-finder' },
    { slug: 'family-villas', label: { ru: 'Family-friendly виллы', en: 'Family-friendly villas' }, oneLiner: { ru: 'Бассейн с забором, кухня, детская мебель.', en: 'Fenced pool, kitchen, child-safe furniture.' }, href: '/property?audience=family' },
    { slug: 'kids-activities', label: { ru: 'Занятия для детей', en: 'Kids activities' }, oneLiner: { ru: 'Спорт, плавание, art, robotics, лагеря на каникулах.', en: 'Sports, swimming, art, robotics, holiday camps.' }, href: '/kids' },
    { slug: 'paediatrics', label: { ru: 'Детская медицина', en: 'Paediatric care' }, oneLiner: { ru: 'Bangkok Hospital, BIH, частные педиатры по-русски.', en: 'Bangkok Hospital, BIH, Russian-speaking paediatricians.' }, href: '/services/health/paediatrics' },
    { slug: 'visa-family', label: { ru: 'Виза для семьи', en: 'Family visa' }, oneLiner: { ru: 'Education visa, dependent visa, DTV — что подходит.', en: 'Education, dependent or DTV visa — pick the right one.' }, href: '/visa/quiz' },
    { slug: 'family-tours', label: { ru: 'Семейные экскурсии', en: 'Family tours' }, oneLiner: { ru: 'Без укачивания, с детским меню и санузлами.', en: 'No motion sickness, kids menu, toilets.' }, href: '/tours?audience=family' },
  ],
  faq: [
    { q: { ru: 'Какая международная школа лучше всего для русскоязычного ребёнка?', en: 'Which international school works best for a Russian-speaking child?' }, a: { ru: 'Зависит от возраста и плана возврата. UWC (IB), British International School (British) — топ. Headstart — баланс цена/качество. HeadStart Russian — программа РФ + английский. Запустите School Finder с возрастом и бюджетом.', en: 'Depends on age and return plan. UWC (IB), British International School (British) — top tier. Headstart — best price/quality. HeadStart Russian — Russian curriculum + English. Run School Finder with age and budget.' } },
    { q: { ru: 'Сколько стоит школа в год?', en: 'What does school cost per year?' }, a: { ru: 'Бюджет — ฿200 000–350 000 (HeadStart, BCIS). Средний — ฿450 000–650 000 (Berda Claude, KIS). Топ — ฿800 000–1 200 000 (UWC, BISP). Плюс application fee, форма, автобус.', en: 'Budget — ฿200,000–350,000 (HeadStart, BCIS). Mid — ฿450,000–650,000 (Berda Claude, KIS). Top — ฿800,000–1,200,000 (UWC, BISP). Plus application, uniform, bus.' } },
    { q: { ru: 'Какой район выбрать для семьи?', en: 'Which area is best for families?' }, a: { ru: 'Бангтао и Лагуна — рядом с UWC и BISP, премиум. Камала — баланс цены/инфраструктуры. Чалонг — рядом с BCIS, бюджетнее. Раваи — для младших школьников и дошкольников.', en: 'Bang Tao and Laguna — close to UWC and BISP, premium. Kamala — balance of price and infrastructure. Chalong — near BCIS, more affordable. Rawai — for primary and pre-school.' } },
    { q: { ru: 'Где наблюдать ребёнка по медицине?', en: 'Where to handle paediatric care?' }, a: { ru: 'Bangkok Hospital Phuket и BIH — детские отделения с врачами, говорящими по-русски через переводчика. Частные педиатры — приём от ฿1 500. Прививки и анализы — там же.', en: 'Bangkok Hospital Phuket and BIH — paediatric wards with Russian translation. Private paediatricians from ฿1,500/visit. Vaccines and labs at the same hospitals.' } },
    { q: { ru: 'Какая виза для ребёнка-школьника?', en: 'Which visa for a school-age child?' }, a: { ru: 'Education visa (ED) — 1 год с продлением, оформляет школа. Родитель — Guardian visa параллельно. Альтернатива — DTV родителя + dependent visa ребёнку. Подбор — в Visa Quiz.', en: 'Education visa (ED) — 1 year renewable, issued by the school. Parent — guardian visa in parallel. Alternative — parent DTV + dependent for the child. Use Visa Quiz to choose.' } },
    { q: { ru: 'Безопасно ли отпускать детей одних?', en: 'Is it safe to let kids out alone?' }, a: { ru: 'Школьники с 12 лет — да, в гейтед-комьюнити (Лагуна, BCIS area). Младшие — только со взрослым или организованным транспортом школы. Уличное движение — главный риск.', en: 'School-age 12+ — yes, in gated communities (Laguna, BCIS area). Younger kids — only with an adult or organised school transport. Traffic is the main risk.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать школу', en: 'Find a school' },
    href: '/school-finder',
    subtitle: { ru: 'Бесплатно, результат за 5 минут.', en: 'Free, results in 5 minutes.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть family-виллы', en: 'Browse family villas' },
    href: '/property?audience=family',
  },
  seo: {
    metaTitle: { ru: 'Пхукет с детьми: школы, виллы, медицина — myUNO', en: 'Phuket with kids: schools, villas, healthcare — myUNO' },
    metaDescription: { ru: 'Международные школы, family-friendly виллы, педиатры по-русски, экскурсии и виза для семьи на Пхукете.', en: 'International schools, family villas, Russian-speaking paediatricians, kid-friendly tours and family visas on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/families',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/families?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/families?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P14 — Medical tourists
// ──────────────────────────────────────────────────────────────────────

const P14_MEDICAL: PersonaLanding = {
  personaCode: 'P14',
  slug: 'medical',
  status: 'live',
  h1: {
    ru: 'Медицинский туризм на Пхукете: клиники и сопровождение',
    en: 'Medical tourism on Phuket: clinics and concierge',
  },
  subtitle: {
    ru: 'JCI-аккредитованные госпитали, координатор по-русски, страховой cashless и пакеты check-up — лечение и обследование без языкового барьера и переплат.',
    en: 'JCI-accredited hospitals, Russian-speaking coordinator, cashless insurance and check-up packages — treatment and diagnostics without language barrier or markup.',
  },
  pains: [
    { ru: 'Не понятно, в какую клинику с какой проблемой ехать.', en: 'Unclear which hospital to choose for which condition.' },
    { ru: 'Страховая может отказать в cashless без правильно оформленной guarantee letter.', en: 'Insurer may refuse cashless without a properly issued guarantee letter.' },
    { ru: 'Языковой барьер с врачом — критично при сложном диагнозе.', en: 'Language barrier with the doctor — critical for complex diagnoses.' },
    { ru: 'Цены на check-up отличаются в 3 раза между клиниками за тот же набор анализов.', en: 'Check-up prices vary 3× between clinics for the same panel.' },
  ],
  services: [
    { slug: 'hospital-match', label: { ru: 'Подбор клиники', en: 'Hospital matching' }, oneLiner: { ru: 'Bangkok Hospital, BIH, Mission, Vachira — под диагноз и бюджет.', en: 'Bangkok Hospital, BIH, Mission, Vachira — by diagnosis and budget.' }, href: '/services/health/hospitals' },
    { slug: 'medical-coordinator', label: { ru: 'Координатор по-русски', en: 'Russian-speaking coordinator' }, oneLiner: { ru: 'Сопровождение на приёмы, перевод заключений.', en: 'Appointment escort, report translation.' }, href: '/concierge?topic=medical' },
    { slug: 'insurance-liaison', label: { ru: 'Связь со страховой', en: 'Insurance liaison' }, oneLiner: { ru: 'Cashless approval и работа с ассистансом.', en: 'Cashless approval and assistance coordination.' }, href: '/services/insurance/liaison' },
    { slug: 'checkup', label: { ru: 'Пакеты check-up', en: 'Check-up packages' }, oneLiner: { ru: 'Executive ฿18 000, кардио ฿28 000, женский ฿22 000.', en: 'Executive ฿18,000, cardio ฿28,000, women’s ฿22,000.' }, href: '/services/health/checkup' },
    { slug: 'dental', label: { ru: 'Стоматология', en: 'Dentistry' }, oneLiner: { ru: 'Имплантация Straumann ฿55 000, виниры ฿18 000.', en: 'Straumann implants ฿55,000, veneers ฿18,000.' }, href: '/services/health/dental' },
    { slug: 'surgery-recovery', label: { ru: 'Восстановление после операции', en: 'Post-surgery recovery' }, oneLiner: { ru: 'Виллы с медсестрой и реабилитационная программа.', en: 'Villas with on-call nurse and rehab program.' }, href: '/services/health/recovery' },
  ],
  faq: [
    { q: { ru: 'Какие клиники аккредитованы JCI?', en: 'Which hospitals are JCI-accredited?' }, a: { ru: 'Bangkok Hospital Phuket и BIH — обе с JCI. Mission Hospital — без JCI, но с международным отделением. Vachira (государственная) — без JCI, но 24/7 для критических случаев.', en: 'Bangkok Hospital Phuket and BIH — both JCI-accredited. Mission Hospital — no JCI but has an international wing. Vachira (public) — no JCI, 24/7 for critical cases.' } },
    { q: { ru: 'Как организован cashless с международной страховкой?', en: 'How does cashless work with international insurance?' }, a: { ru: 'Координатор клиники запрашивает guarantee letter у вашего ассистанса до приёма. Без letter — оплата на месте с последующим возмещением (3–6 недель).', en: 'The hospital coordinator requests a guarantee letter from your assistance before the visit. Without it — pay-and-claim with 3–6-week reimbursement.' } },
    { q: { ru: 'Сколько стоит executive check-up?', en: 'What does an executive check-up cost?' }, a: { ru: 'Bangkok Hospital — ฿18 000–25 000 (анализы крови, ЭКГ, УЗИ органов, консультация). BIH — ฿20 000–35 000. Полный кардио-чек с эхо и КТ — ฿28 000–45 000.', en: 'Bangkok Hospital — ฿18,000–25,000 (blood panel, ECG, organ ultrasound, consult). BIH — ฿20,000–35,000. Full cardio with echo + CT — ฿28,000–45,000.' } },
    { q: { ru: 'Можно ли приехать только на стоматологию?', en: 'Can I come just for dental work?' }, a: { ru: 'Да: импланты, виниры, ортодонтия. Цены в 2–3 раза ниже Европы. Срок 5–14 дней с учётом приживления абатмента. Совмещают с зимовкой 30+ дней.', en: 'Yes: implants, veneers, orthodontics. Prices 2–3× cheaper than Europe. Timeline 5–14 days incl. abutment healing. Often combined with a 30+ day stay.' } },
    { q: { ru: 'Кто оформит документы для возврата по страховой?', en: 'Who handles paperwork for insurance reimbursement?' }, a: { ru: 'Координатор myUNO собирает: счёт-фактуру, заключения, рецепты, протокол на английском. Отправляем пакет ассистансу. Выплата 3–6 недель.', en: 'The myUNO coordinator collects: invoice, doctor reports, prescriptions, English protocol. We send the package to your assistance. Payout 3–6 weeks.' } },
    { q: { ru: 'Можно ли остаться на восстановление после операции?', en: 'Can I stay for post-op recovery?' }, a: { ru: 'Да: виллы 1–3 спальни с медсестрой 8/16/24 часа в день, физиотерапевт, диетолог. Пакет 14 дней — от ฿180 000. Помощь с продлением визы.', en: 'Yes: 1–3 BR villas with 8/16/24-hour nurse, physiotherapist, nutritionist. 14-day package — from ฿180,000. Visa extension assistance included.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать клинику', en: 'Match a hospital' },
    href: '/services/health/hospitals',
    subtitle: { ru: 'Бесплатно, ответ за 4 часа.', en: 'Free, reply within 4 hours.' },
  },
  secondaryCta: {
    label: { ru: 'Заказать check-up', en: 'Book a check-up' },
    href: '/services/health/checkup',
  },
  seo: {
    metaTitle: { ru: 'Медицинский туризм на Пхукете: JCI-клиники — myUNO', en: 'Medical tourism on Phuket: JCI hospitals — myUNO' },
    metaDescription: { ru: 'Bangkok Hospital, BIH, координатор по-русски, cashless страховка и пакеты check-up. Без языкового барьера и переплат.', en: 'Bangkok Hospital, BIH, Russian-speaking coordinator, cashless insurance and check-up packages. No language barrier, no markup.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/medical',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/medical?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/medical?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P15 — Wedding travellers
// ──────────────────────────────────────────────────────────────────────

const P15_WEDDINGS: PersonaLanding = {
  personaCode: 'P15',
  slug: 'weddings',
  status: 'live',
  h1: {
    ru: 'Свадьба на Пхукете под ключ',
    en: 'Destination wedding on Phuket',
  },
  subtitle: {
    ru: 'Площадка с видом на закат, юридическая регистрация, сценография, фотограф и логистика гостей — собираем свадьбу на 10–120 человек без сюрпризов в счёте.',
    en: 'Sunset venue, legal registration, styling, photographer and guest logistics — weddings for 10–120 with no budget surprises.',
  },
  pains: [
    { ru: 'Не понятно, как сделать тайскую свадьбу юридически признаваемой дома.', en: 'Unclear how to make a Thai wedding legally valid back home.' },
    { ru: 'Цены площадок отличаются в 5 раз — сложно сравнить «что входит».', en: 'Venue prices vary 5× — hard to compare what is actually included.' },
    { ru: 'Координировать гостей из разных стран и часовых поясов.', en: 'Coordinating guests across countries and time zones is tough.' },
    { ru: 'Хочется уникальную локацию, но не сорвать сроки и бюджет.', en: 'You want a unique venue without blowing the timeline or budget.' },
  ],
  services: [
    { slug: 'wedding-venues', label: { ru: 'Подбор площадки', en: 'Venue scouting' }, oneLiner: { ru: 'Виллы, beach clubs, отели — 60+ верифицированных локаций.', en: 'Villas, beach clubs, hotels — 60+ verified venues.' }, href: '/wedding/venues' },
    { slug: 'wedding-legal', label: { ru: 'Юридическая регистрация', en: 'Legal registration' }, oneLiner: { ru: 'Marriage certificate, апостиль, признание в стране.', en: 'Marriage certificate, apostille, home-country recognition.' }, href: '/wedding/legal' },
    { slug: 'wedding-planner', label: { ru: 'Wedding planner', en: 'Wedding planner' }, oneLiner: { ru: 'Сценография, тайминг, координация подрядчиков.', en: 'Styling, timeline, vendor coordination.' }, href: '/wedding/planner' },
    { slug: 'wedding-photo', label: { ru: 'Фото и видео', en: 'Photo & video' }, oneLiner: { ru: 'Профессионалы с портфолио на Пхукете.', en: 'Professional portfolios shot on Phuket.' }, href: '/wedding/photo' },
    { slug: 'guest-logistics', label: { ru: 'Логистика гостей', en: 'Guest logistics' }, oneLiner: { ru: 'Трансфер из аэропорта, блок в отеле, welcome pack.', en: 'Airport transfers, hotel block, welcome pack.' }, href: '/wedding/guests' },
    { slug: 'honeymoon', label: { ru: 'Honeymoon escape', en: 'Honeymoon escape' }, oneLiner: { ru: 'Виллы 5★ с приватным шефом и dinner setup.', en: '5★ villas with private chef and dinner setup.' }, href: '/property?audience=honeymoon' },
  ],
  faq: [
    { q: { ru: 'Признаётся ли тайская свадьба в России?', en: 'Is a Thai marriage recognised in Russia?' }, a: { ru: 'Да, через консульский апостиль и легализацию. Свидетельство о браке выдаёт амфур (район), переводится и легализуется. Срок — 7–14 дней после церемонии.', en: 'Yes, via consular apostille and legalisation. The amphur (district office) issues the certificate; it is translated and legalised. Timeline — 7–14 days after the ceremony.' } },
    { q: { ru: 'Сколько стоит свадьба на 30 человек?', en: 'How much is a 30-guest wedding?' }, a: { ru: 'Бюджет: ฿380 000–550 000 (вилла, кейтеринг, фото, декор). Средний: ฿650 000–950 000. Премиум beach club с яхтой: ฿1 200 000–2 500 000. Юр. оформление — ฿35 000.', en: 'Budget: ฿380,000–550,000 (villa, catering, photo, decor). Mid: ฿650,000–950,000. Premium beach club + yacht: ฿1,200,000–2,500,000. Legal — ฿35,000.' } },
    { q: { ru: 'Лучшее время года для свадьбы?', en: 'Best time of year for a wedding?' }, a: { ru: 'Ноябрь–март — высокий сезон, без дождей, цены +25%. Апрель–май и октябрь — баланс. Июнь–сентябрь — сезон дождей, скидки до −40%, нужен резервный indoor-план.', en: 'November–March — high season, dry, prices +25%. April–May and October — balanced. June–September — rainy, up to −40% but needs an indoor plan.' } },
    { q: { ru: 'Какие площадки самые востребованные?', en: 'Which venues are most popular?' }, a: { ru: 'Sri Panwa, Trisara, Cape Sienna, Iniala — премиум. Surin Beach villas — средний сегмент. Catch Beach Club и HQ Beach Lounge — beach club свадьбы.', en: 'Sri Panwa, Trisara, Cape Sienna, Iniala — premium. Surin Beach villas — mid. Catch Beach Club, HQ Beach Lounge — beach club weddings.' } },
    { q: { ru: 'Нужен ли planner или можно своими силами?', en: 'Do I need a planner or can I DIY?' }, a: { ru: 'До 15 гостей — реально без planner, через одну вендор-цепочку. От 30+ человек planner экономит больше, чем стоит — за счёт скидок у проверенных подрядчиков и timeline-контроля.', en: 'Up to 15 guests — DIY is realistic with one vendor chain. From 30+ a planner saves more than they cost via vendor discounts and timeline control.' } },
    { q: { ru: 'Можно ли совместить свадьбу и отпуск гостей?', en: 'Can we bundle the wedding with a guest holiday?' }, a: { ru: 'Да — стандарт «3-day wedding»: welcome dinner, церемония + reception, recovery brunch. Блок в отеле со скидкой 15–25% при бронировании ≥10 номеров.', en: 'Yes — the standard “3-day wedding”: welcome dinner, ceremony + reception, recovery brunch. Hotel block 15–25% off when booking 10+ rooms.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать площадку', en: 'Scout a venue' },
    href: '/wedding/venues',
    subtitle: { ru: 'Подборка под бюджет за 48 часов.', en: 'Curated shortlist within 48 hours.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть wedding-гид', en: 'Open the wedding guide' },
    href: '/wedding',
  },
  seo: {
    metaTitle: { ru: 'Свадьба на Пхукете под ключ — myUNO', en: 'Destination wedding on Phuket — myUNO' },
    metaDescription: { ru: 'Площадки, юридическая регистрация, planner, фото и логистика гостей. Свадьбы на 10–120 человек без сюрпризов в счёте.', en: 'Venues, legal registration, planner, photo and guest logistics. Weddings for 10–120 guests with no budget surprises.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/weddings',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/weddings?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/weddings?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P20 — Retirees
// ──────────────────────────────────────────────────────────────────────

const P20_RETIREES: PersonaLanding = {
  personaCode: 'P20',
  slug: 'retirees',
  status: 'live',
  h1: {
    ru: 'Пенсионная зимовка и переезд на Пхукет',
    en: 'Retirement on Phuket: from snowbird to long-term',
  },
  subtitle: {
    ru: 'Retirement visa O-A на год, медицинская страховка, condo на одном уровне с лифтом, тайская медицина и комьюнити — устойчивая жизнь после 50.',
    en: 'Retirement O-A visa for a year, health insurance, single-level lift-access condo, Thai healthcare and community — sustainable life after 50.',
  },
  pains: [
    { ru: 'Не понятно, какая виза подходит и какие финансовые требования.', en: 'Unclear which visa suits you and what finances are required.' },
    { ru: 'Сложно найти страховку, которая принимает заявителей 60+.', en: 'Hard to find insurance that accepts 60+ applicants.' },
    { ru: 'Боитесь жить в condo с лестницей и без лифта в 30°C.', en: 'Worried about stairs and no-lift condos in 30°C heat.' },
    { ru: 'Хочется русскоязычное комьюнити рядом, не одному.', en: 'You want a Russian-speaking community nearby, not isolation.' },
  ],
  services: [
    { slug: 'retirement-visa', label: { ru: 'Retirement visa O-A', en: 'Retirement O-A visa' }, oneLiner: { ru: '1 год + продление, ฿800 000 на счету или ฿65 000/мес.', en: '1 year + renewal, ฿800,000 on deposit or ฿65,000/mo.' }, href: '/legal/retirement-visa' },
    { slug: 'senior-insurance', label: { ru: 'Страховка 60+', en: 'Insurance 60+' }, oneLiner: { ru: 'Pacific Cross, April — принимают до 75 лет.', en: 'Pacific Cross, April — accept up to age 75.' }, href: '/services/insurance/senior' },
    { slug: 'senior-housing', label: { ru: 'Comfort condo и виллы', en: 'Comfort condos & villas' }, oneLiner: { ru: 'Один уровень, лифт, рядом hospital и market.', en: 'Single level, lift, near hospital and market.' }, href: '/property?audience=senior' },
    { slug: 'thai-healthcare', label: { ru: 'Тайская медицина', en: 'Thai healthcare' }, oneLiner: { ru: 'Bangkok Hospital, BIH, кардиолог по-русски.', en: 'Bangkok Hospital, BIH, Russian-speaking cardiologist.' }, href: '/services/health/hospitals' },
    { slug: 'senior-community', label: { ru: 'Комьюнити и события', en: 'Community & events' }, oneLiner: { ru: 'Бридж-клуб, шахматы, Telegram-группа 800+.', en: 'Bridge club, chess, 800+ member Telegram group.' }, href: '/community/seniors' },
    { slug: 'home-help', label: { ru: 'Помощь по дому', en: 'Home help' }, oneLiner: { ru: 'Уборка ฿500/раз, готовка по-русски, ремонт.', en: 'Cleaning ฿500/visit, Russian cooking, repairs.' }, href: '/services/home/cleaning' },
  ],
  faq: [
    { q: { ru: 'Какая разница между O-A и O-X visa?', en: 'O-A vs O-X — what is the difference?' }, a: { ru: 'O-A — 1 год + продление, ฿800 000 на счету или ฿65 000/мес дохода. O-X — 5+5 лет, ฿3 млн на счету. Для большинства снежных птиц достаточно O-A.', en: 'O-A — 1 year + renewable, ฿800,000 deposit or ฿65,000/mo income. O-X — 5+5 years, ฿3M deposit. O-A suffices for most snowbirds.' } },
    { q: { ru: 'Какая страховка нужна для retirement visa?', en: 'What insurance is required for the retirement visa?' }, a: { ru: 'Минимум: $100 000 outpatient + $100 000 inpatient. Покрытие COVID-19 обязательно. Pacific Cross Thailand и April International — оба соответствуют требованиям.', en: 'Minimum: $100,000 outpatient + $100,000 inpatient. COVID-19 coverage required. Pacific Cross Thailand and April International both qualify.' } },
    { q: { ru: 'Сколько стоит жить на пенсии в месяц?', en: 'Monthly cost of retirement living?' }, a: { ru: 'Минимум — ฿55 000 (1-bed condo, готовка дома, без машины). Комфорт — ฿95 000–140 000 (вилла, рестораны, медицинские check-up). Премиум — от ฿200 000.', en: 'Minimum — ฿55,000 (1-bed condo, home cooking, no car). Comfortable — ฿95,000–140,000 (villa, dining out, regular check-ups). Premium — from ฿200,000.' } },
    { q: { ru: 'Какие районы лучше для пенсионеров?', en: 'Which areas are best for retirees?' }, a: { ru: 'Раваи и Чалонг — спокойствие, рядом рынок и medical. Камала — баланс инфраструктуры и тишины. Бангтао — премиум, рядом BIH. Патонга избегаем — шум.', en: 'Rawai and Chalong — calm, near markets and medical. Kamala — balanced. Bang Tao — premium, near BIH. Avoid Patong — too noisy.' } },
    { q: { ru: 'Где познакомиться с другими русскоязычными пенсионерами?', en: 'Where to meet other Russian-speaking retirees?' }, a: { ru: 'Telegram-группа myUNO Seniors (800+ участников), бридж-клуб в Чалонге по средам, шахматный клуб в Раваи. Ежемесячные ужины в ресторанах.', en: 'myUNO Seniors Telegram group (800+ members), bridge club in Chalong on Wednesdays, chess club in Rawai. Monthly community dinners.' } },
    { q: { ru: 'Что делать в экстренной медицинской ситуации?', en: 'What to do in a medical emergency?' }, a: { ru: 'Скорая 1669, Bangkok Hospital Phuket — 24/7 emergency. SOS-чат myUNO дублирует — координатор связывается со страховой и встречает в приёмном покое.', en: 'Ambulance 1669, Bangkok Hospital Phuket — 24/7 emergency. The myUNO SOS chat backs you up: the coordinator contacts the insurer and meets you at admissions.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать retirement visa', en: 'Pick a retirement visa' },
    href: '/legal/retirement-visa',
    subtitle: { ru: 'Бесплатная 15-минутная консультация.', en: '15-minute free consultation.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть comfort condo', en: 'Browse comfort condos' },
    href: '/property?audience=senior',
  },
  seo: {
    metaTitle: { ru: 'Пенсия и зимовка на Пхукете: O-A visa, страховка — myUNO', en: 'Retirement on Phuket: O-A visa, insurance, housing — myUNO' },
    metaDescription: { ru: 'Retirement visa O-A, страховка 60+, comfort condo, тайская медицина и русскоязычное комьюнити. Устойчивая жизнь после 50.', en: 'Retirement O-A visa, 60+ insurance, comfort condo, Thai healthcare and Russian-speaking community. Sustainable life after 50.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/retirees',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/retirees?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/retirees?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P3 — Гости из Европы (Sprint 3)
// ──────────────────────────────────────────────────────────────────────

const P3_EU_GUESTS: PersonaLanding = {
  personaCode: 'P3',
  slug: 'eu-guests',
  status: 'live',
  h1: {
    ru: 'Пхукет для гостей из Европы',
    en: 'Phuket for European guests',
  },
  subtitle: {
    ru: 'Long-stay виллы, EUR/SEPA-оплата, частные трансферы и сервис на английском — без посредников.',
    en: 'Long-stay villas, EUR/SEPA payments, private transfers and English-speaking service — no middlemen.',
  },
  pains: [
    { ru: 'Сложно найти виллу, которая принимает SEPA или карту EUR.', en: 'Hard to find a villa accepting SEPA or EUR card payments.' },
    { ru: 'Туроператоры предлагают пакетные туры, а вы хотите гибкости.', en: 'Tour operators push packages, but you want flexibility.' },
    { ru: 'Нужен трансфер бизнес-класса, а не общий шаттл.', en: 'You need a business-class transfer, not a shared shuttle.' },
    { ru: 'Хочется wellness-режима: йога, fine dining, дайвинг — без беготни.', en: 'You want a wellness routine: yoga, fine dining, diving — without chaos.' },
  ],
  services: [
    { slug: 'long-stay-villas', label: { ru: 'Long-stay виллы', en: 'Long-stay villas' }, oneLiner: { ru: 'От 14 ночей, прямые контракты с владельцами.', en: 'From 14 nights, direct owner contracts.' }, href: '/property/rent' },
    { slug: 'private-transfer', label: { ru: 'Private transfer', en: 'Private transfer' }, oneLiner: { ru: 'Mercedes/Toyota Alphard, англоговорящий водитель.', en: 'Mercedes/Toyota Alphard, English-speaking driver.' }, href: '/landing/airport-transfer' },
    { slug: 'wellness', label: { ru: 'Wellness & spa', en: 'Wellness & spa' }, oneLiner: { ru: 'Йога, массаж, detox-программы.', en: 'Yoga, massage, detox programmes.' }, href: '/wellness' },
    { slug: 'dining', label: { ru: 'Fine dining', en: 'Fine dining' }, oneLiner: { ru: 'Бронирование Michelin-recommended ресторанов.', en: 'Bookings at Michelin-recommended restaurants.' }, href: '/cluster/lifestyle' },
  ],
  faq: [
    { q: { ru: 'Можно платить в EUR?', en: 'Can I pay in EUR?' }, a: { ru: 'Да — SEPA, EUR-карта или Wise. Курс фиксируется на день оплаты.', en: 'Yes — SEPA, EUR card or Wise. Rate locked on payment day.' } },
    { q: { ru: 'Поддерживаете long-stay (1–3 месяца)?', en: 'Do you support long-stay (1–3 months)?' }, a: { ru: 'Да, со скидкой 20–35% от nightly rate. Контракт на английском.', en: 'Yes, with a 20–35% discount on nightly rate. English contract.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Связаться с консьержем', en: 'Talk to concierge' }, href: '/contact' },
  seo: {
    metaTitle: { ru: 'Пхукет для европейцев: long-stay виллы, EUR-оплата — myUNO', en: 'Phuket for Europeans: long-stay villas, EUR payment — myUNO' },
    metaDescription: { ru: 'Long-stay виллы с прямой арендой, оплата EUR/SEPA, private transfer и wellness без турагентов. Английский сервис на Пхукете.', en: 'Long-stay villas with direct rental, EUR/SEPA payment, private transfer and wellness without tour operators. English service on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/eu-guests',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/eu-guests?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/eu-guests?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P16 — Спортсмены и Fight Camp (Sprint 3)
// ──────────────────────────────────────────────────────────────────────

const P16_ATHLETES: PersonaLanding = {
  personaCode: 'P16',
  slug: 'athletes',
  status: 'live',
  h1: {
    ru: 'Тренировочные сборы на Пхукете: MMA, Muay Thai, fitness',
    en: 'Training camps on Phuket: MMA, Muay Thai, fitness',
  },
  subtitle: {
    ru: 'Tiger Muay Thai, Phuket Top Team, AKA Thailand — сборы, проживание рядом с залом, восстановление и виза.',
    en: 'Tiger Muay Thai, Phuket Top Team, AKA Thailand — camps, gym-side housing, recovery and visa.',
  },
  pains: [
    { ru: 'Не знаете, какой зал подходит под ваш уровень и стиль.', en: 'You don’t know which gym fits your level and style.' },
    { ru: 'Хотите жить в 5 минутах от зала, а не ездить через весь остров.', en: 'You want to live 5 minutes from the gym, not commute across the island.' },
    { ru: 'Нужен Education Visa или ED-виза на срок сборов.', en: 'You need an Education or ED visa for the camp duration.' },
    { ru: 'Восстановление после нагрузки: спортивный массаж, физиотерапевт, питание.', en: 'Recovery after load: sports massage, physio, nutrition.' },
  ],
  services: [
    { slug: 'gym-matcher', label: { ru: 'Подбор зала', en: 'Gym matcher' }, oneLiner: { ru: 'Сравнение Tiger / PTT / AKA / Sinbi по уровню и цене.', en: 'Tiger / PTT / AKA / Sinbi compared by level and price.' }, href: '/cluster/lifestyle' },
    { slug: 'gym-side-housing', label: { ru: 'Жильё рядом с залом', en: 'Gym-side housing' }, oneLiner: { ru: 'Студии в Чалонге и Раваи от 14 ночей.', en: 'Studios in Chalong and Rawai from 14 nights.' }, href: '/property/rent' },
    { slug: 'ed-visa', label: { ru: 'ED Visa', en: 'ED Visa' }, oneLiner: { ru: 'Education Visa через лицензированный зал.', en: 'Education Visa via a licensed gym.' }, href: '/visa/quiz' },
    { slug: 'recovery', label: { ru: 'Sports recovery', en: 'Sports recovery' }, oneLiner: { ru: 'Спорт-массаж, физио, ice bath.', en: 'Sports massage, physio, ice bath.' }, href: '/wellness' },
  ],
  faq: [
    { q: { ru: 'Сколько стоят сборы на месяц?', en: 'How much for a one-month camp?' }, a: { ru: '600–1200 USD за тренировки + 400–900 USD за жильё. Точная смета — по запросу.', en: '600–1200 USD for training + 400–900 USD for housing. Exact quote on request.' } },
    { q: { ru: 'Можно с нуля без опыта?', en: 'Can I start without experience?' }, a: { ru: 'Да. У всех топ-залов есть beginner-классы и персональный тренер.', en: 'Yes. All top gyms run beginner classes and personal trainers.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать зал', en: 'Find a gym' }, href: '/contact' },
  secondaryCta: { label: { ru: 'Получить ED-визу', en: 'Get ED visa' }, href: '/visa/quiz' },
  seo: {
    metaTitle: { ru: 'Сборы на Пхукете: Tiger, PTT, AKA — жильё и виза — myUNO', en: 'Phuket training camps: Tiger, PTT, AKA — housing & visa — myUNO' },
    metaDescription: { ru: 'Сборы по MMA, Muay Thai и fitness в топ-залах Пхукета. Жильё рядом, ED Visa, восстановление и питание под спортсмена.', en: 'MMA, Muay Thai and fitness camps at Phuket top gyms. Gym-side housing, ED Visa, recovery and athlete nutrition.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/athletes',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/athletes?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/athletes?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P17 — Halal-friendly путешественники (Sprint 3)
// ──────────────────────────────────────────────────────────────────────

const P17_HALAL: PersonaLanding = {
  personaCode: 'P17',
  slug: 'halal',
  status: 'live',
  h1: {
    ru: 'Halal-friendly Пхукет: отдых для мусульманских семей',
    en: 'Halal-friendly Phuket: holidays for Muslim families',
  },
  subtitle: {
    ru: 'Halal-сертифицированные рестораны, виллы с prayer space, мечети рядом и приватные пляжи — спокойный отдых по правилам.',
    en: 'Halal-certified restaurants, villas with prayer space, nearby mosques and private beaches — calm holidays by your rules.',
  },
  pains: [
    { ru: 'Сложно найти halal-сертифицированную еду вне Patong.', en: 'Hard to find halal-certified food outside Patong.' },
    { ru: 'Нужна вилла с приватным бассейном и prayer space.', en: 'You need a villa with a private pool and prayer space.' },
    { ru: 'Хочется быть рядом с мечетью на пятничную молитву.', en: 'You want to be near a mosque for Friday prayer.' },
    { ru: 'Поездка с большой семьёй — нужен минивэн и трансфер на 6+.', en: 'Travelling with extended family — you need a 6+ seater transfer.' },
  ],
  services: [
    { slug: 'halal-villas', label: { ru: 'Halal-friendly виллы', en: 'Halal-friendly villas' }, oneLiner: { ru: 'Privacy, prayer space, kitchen для своей готовки.', en: 'Privacy, prayer space, kitchen for self-cooking.' }, href: '/property/rent' },
    { slug: 'halal-dining', label: { ru: 'Halal-рестораны', en: 'Halal restaurants' }, oneLiner: { ru: 'Сертифицированные заведения по районам.', en: 'Certified venues by area.' }, href: '/cluster/lifestyle' },
    { slug: 'mosque-map', label: { ru: 'Карта мечетей', en: 'Mosque map' }, oneLiner: { ru: 'Bang Tao, Kamala, Phuket Town — расписание молитв.', en: 'Bang Tao, Kamala, Phuket Town — prayer schedule.' }, href: '/map' },
    { slug: 'family-transfer', label: { ru: 'Семейный трансфер', en: 'Family transfer' }, oneLiner: { ru: 'Toyota Commuter / Hiace на 9 пассажиров.', en: 'Toyota Commuter / Hiace for 9 passengers.' }, href: '/landing/airport-transfer' },
  ],
  faq: [
    { q: { ru: 'Где больше всего halal-инфраструктуры?', en: 'Where is most halal infrastructure?' }, a: { ru: 'Bang Tao, Kamala и Phuket Town — мечети, рестораны и магазины.', en: 'Bang Tao, Kamala and Phuket Town — mosques, restaurants and shops.' } },
    { q: { ru: 'Можно бронировать виллу только для женщин?', en: 'Can I book a women-only villa stay?' }, a: { ru: 'Да — приватные виллы со staff по запросу (только женщины).', en: 'Yes — private villas with women-only staff on request.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Открыть карту', en: 'Open the map' }, href: '/map' },
  seo: {
    metaTitle: { ru: 'Halal Пхукет: виллы, рестораны, мечети — myUNO', en: 'Halal Phuket: villas, restaurants, mosques — myUNO' },
    metaDescription: { ru: 'Halal-friendly отдых на Пхукете: сертифицированные рестораны, виллы с prayer space, мечети и семейные трансферы.', en: 'Halal-friendly holidays on Phuket: certified restaurants, villas with prayer space, mosques and family transfers.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/halal',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/halal?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/halal?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: Remaining personas activated 2026-04-24 (no more 404 on /for/*)
// ──────────────────────────────────────────────────────────────────────

const P2_CN_INVESTORS: PersonaLanding = {
  personaCode: 'P2',
  slug: 'cn-investors',
  status: 'live',
  h1: { ru: 'Пхукет для гостей и инвесторов из Китая', en: 'Phuket for Chinese guests and scouts' },
  subtitle: { ru: 'Виллы и кондо с китайско-говорящим менеджером, оплата в CNY/USDT, экскурсии и сделки без барьеров.', en: 'Villas and condos with Mandarin-speaking concierge, CNY/USDT payments, tours and deals without language barriers.' },
  pains: [
    { ru: 'Языковой барьер в банке, у застройщика и в страховой.', en: 'Language barrier at the bank, developer and insurer.' },
    { ru: 'Сложно оплатить из материкового Китая через SWIFT.', en: 'Hard to pay from mainland China via SWIFT.' },
    { ru: 'Нужен scout-trip с переводчиком и юристом.', en: 'You need a scout trip with translator and lawyer.' },
    { ru: 'Хочется проверить foreign quota и реальный yield.', en: 'You want verified foreign quota and real yield.' },
  ],
  services: [
    { slug: 'mandarin-concierge', label: { ru: 'Mandarin-консьерж', en: 'Mandarin concierge' }, oneLiner: { ru: 'Сопровождение на просмотрах и сделках.', en: 'Support at viewings and closings.' }, href: '/contact' },
    { slug: 'usdt-payment', label: { ru: 'Оплата USDT/CNY', en: 'USDT / CNY payment' }, oneLiner: { ru: 'Бронирование без SWIFT-задержек.', en: 'Booking without SWIFT delays.' }, href: '/property/offplan' },
    { slug: 'scout-trip', label: { ru: 'Scout-trip 3 дня', en: 'Scout trip — 3 days' }, oneLiner: { ru: 'Отель, трансфер, 6–8 объектов.', en: 'Hotel, transfer, 6–8 properties.' }, href: '/property/mandate' },
    { slug: 'condo-catalog', label: { ru: 'Каталог кондо', en: 'Condo catalogue' }, oneLiner: { ru: 'Foreign quota verified, ROI-расчёт.', en: 'Foreign quota verified, ROI included.' }, href: '/property/offplan' },
  ],
  faq: [
    { q: { ru: 'Как платить из Китая?', en: 'How do I pay from China?' }, a: { ru: 'USDT, Hong Kong wire или через Singapore-аккаунт. Оформим под вашу схему.', en: 'USDT, Hong Kong wire or via a Singapore account. We structure to fit you.' } },
    { q: { ru: 'Можно купить freehold?', en: 'Can foreigners buy freehold?' }, a: { ru: 'Да — кондо в пределах 49% foreign quota. Виллы — leasehold 30+30+30.', en: 'Yes — condos within the 49% foreign quota. Villas — leasehold 30+30+30.' } },
  ],
  primaryCta: { label: { ru: 'Запросить scout-trip', en: 'Request scout trip' }, href: '/property/mandate?source=cn' },
  secondaryCta: { label: { ru: 'Каталог кондо', en: 'Condo catalogue' }, href: '/property/offplan' },
  seo: {
    metaTitle: { ru: 'Пхукет для китайских инвесторов: scout-trip, USDT — myUNO', en: 'Phuket for Chinese investors: scout trip, USDT — myUNO' },
    metaDescription: { ru: 'Кондо и виллы на Пхукете для гостей из Китая. Mandarin-консьерж, оплата USDT/CNY, проверенный foreign quota и ROI.', en: 'Condos and villas on Phuket for Chinese guests. Mandarin concierge, USDT/CNY payment, verified foreign quota and ROI.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/cn-investors',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/cn-investors?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/cn-investors?lang=en' },
    ],
  },
};

const P12_BN_BUSINESS: PersonaLanding = {
  personaCode: 'P12',
  slug: 'bn-business',
  status: 'live',
  h1: { ru: 'Пхукет для бизнес-аудитории из Бангладеш', en: 'Phuket for Bangladeshi business audience' },
  subtitle: { ru: 'Семейные виллы, halal-инфраструктура, корпоративные ретриты и поддержка по визам — всё в одной точке.', en: 'Family villas, halal infrastructure, corporate retreats and visa support — all in one place.' },
  pains: [
    { ru: 'Сложно подобрать виллу для большой семьи с halal-сервисом.', en: 'Hard to find a large-family villa with halal service.' },
    { ru: 'Нужна виза для ретрита команды на 7–14 дней.', en: 'You need visas for a 7–14 day team retreat.' },
    { ru: 'Хочется проверить инвестиционный кейс перед поездкой.', en: 'You want to vet an investment case before flying in.' },
    { ru: 'Не хватает посредника, который говорит на бенгали или урду.', en: 'You miss a Bangla- or Urdu-speaking liaison.' },
  ],
  services: [
    { slug: 'family-villa', label: { ru: 'Семейная вилла 4–8 спален', en: 'Family villa 4–8 BR' }, oneLiner: { ru: 'Privacy, бассейн, halal-кухня по запросу.', en: 'Privacy, pool, halal kitchen on request.' }, href: '/property/rent' },
    { slug: 'team-retreat', label: { ru: 'Корпоративный ретрит', en: 'Corporate retreat' }, oneLiner: { ru: 'Виллы 10+ спален, конференц-зона, кейтеринг.', en: 'Villas 10+ BR, meeting area, catering.' }, href: '/contact' },
    { slug: 'visa-support', label: { ru: 'Виза и приглашение', en: 'Visa & invitation' }, oneLiner: { ru: 'Tourist / business visa support letter.', en: 'Tourist / business visa support letter.' }, href: '/visa/quiz' },
    { slug: 'investment-brief', label: { ru: 'Investment brief', en: 'Investment brief' }, oneLiner: { ru: 'Письменный обзор рынка перед визитом.', en: 'Written market brief before your visit.' }, href: '/property/mandate' },
  ],
  faq: [
    { q: { ru: 'Можно ли халяль кейтеринг на вилле?', en: 'Can we get halal catering at the villa?' }, a: { ru: 'Да — повар с сертификатом, меню согласовываем заранее.', en: 'Yes — certified chef, menu agreed in advance.' } },
    { q: { ru: 'Какая виза подойдёт для команды?', en: 'Which visa fits a team trip?' }, a: { ru: 'Tourist visa или DTV для корпоративных ретритов до 180 дней.', en: 'Tourist visa or DTV for corporate retreats up to 180 days.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Получить investment brief', en: 'Get investment brief' }, href: '/property/mandate?source=bn' },
  seo: {
    metaTitle: { ru: 'Пхукет для гостей из Бангладеш: виллы, halal, визы — myUNO', en: 'Phuket for Bangladeshi guests: villas, halal, visas — myUNO' },
    metaDescription: { ru: 'Семейные виллы, halal-кейтеринг, корпоративные ретриты и визовая поддержка для гостей из Бангладеш.', en: 'Family villas, halal catering, corporate retreats and visa support for Bangladeshi guests on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/bn-business',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/bn-business?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/bn-business?lang=en' },
    ],
  },
};

const P18_LGBTQ: PersonaLanding = {
  personaCode: 'P18',
  slug: 'lgbtq',
  status: 'live',
  h1: { ru: 'Пхукет для ЛГБТК+ путешественников и резидентов', en: 'Phuket for LGBTQ+ travellers and residents' },
  subtitle: { ru: 'Friendly-виллы и кондо, открытые сообщества, вечеринки и медицинский сервис без вопросов.', en: 'Friendly villas and condos, open community, nightlife and judgement-free healthcare.' },
  pains: [
    { ru: 'Хочется быть уверенным, что вилла или отель примет пару.', en: 'You want to be sure a villa or hotel welcomes couples.' },
    { ru: 'Ищете комьюнити, события и friendly-районы.', en: 'You look for community, events and friendly neighbourhoods.' },
    { ru: 'Нужны клиники с конфиденциальной PrEP/HRT поддержкой.', en: 'You need clinics with confidential PrEP/HRT support.' },
    { ru: 'Хочется долгосрочной аренды или покупки без неловких вопросов.', en: 'You want long-stay rental or purchase without awkward questions.' },
  ],
  services: [
    { slug: 'friendly-stays', label: { ru: 'LGBTQ+ friendly жильё', en: 'LGBTQ+ friendly stays' }, oneLiner: { ru: 'Проверенные виллы и кондо, отзывы сообщества.', en: 'Vetted villas and condos with community reviews.' }, href: '/property/rent' },
    { slug: 'community', label: { ru: 'Сообщество и события', en: 'Community & events' }, oneLiner: { ru: 'Patong / Bangla, Pride-неделя, бранчи.', en: 'Patong / Bangla, Pride week, brunches.' }, href: '/cluster/lifestyle' },
    { slug: 'health', label: { ru: 'PrEP / HRT клиники', en: 'PrEP / HRT clinics' }, oneLiner: { ru: 'Конфиденциальный приём, рецепты на английском.', en: 'Confidential intake, English prescriptions.' }, href: '/cluster/health' },
    { slug: 'long-stay', label: { ru: 'Long-stay аренда', en: 'Long-stay rental' }, oneLiner: { ru: 'Контракт на пару, без discrimination clauses.', en: 'Couple-friendly contract, no discrimination clauses.' }, href: '/property/rent' },
  ],
  faq: [
    { q: { ru: 'Безопасно ли в Таиланде для пар?', en: 'Is Thailand safe for couples?' }, a: { ru: 'Да. С 2024 года в Таиланде легализованы однополые браки. Пхукет — один из самых открытых регионов.', en: 'Yes. Thailand legalised same-sex marriage in 2024. Phuket is among the most open regions.' } },
    { q: { ru: 'Где находится community?', en: 'Where is the community?' }, a: { ru: 'Patong (Paradise complex), Kata, Rawai. Регулярные события и meetups.', en: 'Patong (Paradise complex), Kata, Rawai. Regular events and meetups.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать жильё', en: 'Find a stay' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Открыть сообщество', en: 'Browse community' }, href: '/cluster/lifestyle' },
  seo: {
    metaTitle: { ru: 'LGBTQ+ Пхукет: friendly жильё, сообщество, клиники — myUNO', en: 'LGBTQ+ Phuket: friendly stays, community, clinics — myUNO' },
    metaDescription: { ru: 'LGBTQ+ friendly виллы и кондо, события, PrEP/HRT клиники и long-stay аренда на Пхукете без неловких вопросов.', en: 'LGBTQ+ friendly villas and condos, events, PrEP/HRT clinics and long-stay rental on Phuket — no awkward questions.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/lgbtq',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/lgbtq?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/lgbtq?lang=en' },
    ],
  },
};

const P19_ACCESSIBILITY: PersonaLanding = {
  personaCode: 'P19',
  slug: 'accessibility',
  status: 'live',
  h1: { ru: 'Пхукет для путешественников с ограниченными возможностями', en: 'Phuket for accessibility-first travellers' },
  subtitle: { ru: 'Виллы без ступеней, трансфер с пандусом, медицинская поддержка и сиделки — путешествие без преград.', en: 'Step-free villas, ramp-equipped transfer, medical support and carers — travel without barriers.' },
  pains: [
    { ru: 'Сложно найти виллу или кондо с настоящим step-free доступом.', en: 'Hard to find a truly step-free villa or condo.' },
    { ru: 'Нужен трансфер, в который влезает коляска.', en: 'You need a transfer that fits a wheelchair.' },
    { ru: 'Не понятно, какие пляжи реально доступны.', en: 'It’s unclear which beaches are actually accessible.' },
    { ru: 'Хочется заранее знать, есть ли врач/сиделка по вызову.', en: 'You want to know in advance if a doctor / carer is on call.' },
  ],
  services: [
    { slug: 'accessible-stays', label: { ru: 'Step-free жильё', en: 'Step-free stays' }, oneLiner: { ru: 'Прокат коляски, поручни, roll-in shower.', en: 'Wheelchair rental, grab rails, roll-in shower.' }, href: '/property/rent' },
    { slug: 'wheelchair-transfer', label: { ru: 'Трансфер с пандусом', en: 'Wheelchair transfer' }, oneLiner: { ru: 'Toyota Hiace с лифтом, водитель обучен.', en: 'Toyota Hiace with lift, trained driver.' }, href: '/landing/airport-transfer' },
    { slug: 'beach-guide', label: { ru: 'Доступные пляжи', en: 'Accessible beaches' }, oneLiner: { ru: 'Surin, Bang Tao — beach mat и тень.', en: 'Surin, Bang Tao — beach mat and shade.' }, href: '/map' },
    { slug: 'medical', label: { ru: 'Врач и сиделка', en: 'Doctor & carer' }, oneLiner: { ru: 'Bangkok Hospital, лицензированные сиделки.', en: 'Bangkok Hospital, licensed carers.' }, href: '/cluster/health' },
  ],
  faq: [
    { q: { ru: 'Какой район самый удобный?', en: 'Which area is most convenient?' }, a: { ru: 'Bang Tao, Laguna, Cherngtalay — ровные тротуары и новая застройка с лифтами.', en: 'Bang Tao, Laguna, Cherngtalay — flat sidewalks and modern buildings with lifts.' } },
    { q: { ru: 'Можно арендовать электроколяску?', en: 'Can I rent a power wheelchair?' }, a: { ru: 'Да — доставка к вилле, инструктаж, поддержка 24/7.', en: 'Yes — delivery to the villa, briefing, 24/7 support.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать жильё', en: 'Find a stay' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Заказать трансфер', en: 'Book a transfer' }, href: '/landing/airport-transfer' },
  seo: {
    metaTitle: { ru: 'Доступный Пхукет: жильё, трансфер, врачи — myUNO', en: 'Accessible Phuket: stays, transfer, doctors — myUNO' },
    metaDescription: { ru: 'Step-free виллы, трансфер с пандусом, прокат колясок и медицинская поддержка для путешественников с ограниченными возможностями.', en: 'Step-free villas, ramp transfer, wheelchair rental and medical support for accessibility-first travellers on Phuket.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/accessibility',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/accessibility?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/accessibility?lang=en' },
    ],
  },
};

const P21_PROVIDERS: PersonaLanding = {
  personaCode: 'P21',
  slug: 'providers',
  status: 'live',
  h1: { ru: 'Локальные подрядчики на myUNO', en: 'Local providers on myUNO' },
  subtitle: { ru: 'Получайте заказы от УК, владельцев и гостей. Без комиссии за вход, оплата на счёт компании, прозрачный рейтинг.', en: 'Get orders from MCs, owners and guests. No entry fee, payouts to your company account, transparent rating.' },
  pains: [
    { ru: 'Поток заказов нестабилен, всё держится на сарафане.', en: 'Order flow is unstable, everything depends on word of mouth.' },
    { ru: 'Платформы берут комиссию 25–30%, оставляя крошки.', en: 'Platforms charge 25–30% commission, leaving crumbs.' },
    { ru: 'Гости пишут на разных языках, нет единого окна.', en: 'Guests message in many languages, no single inbox.' },
    { ru: 'Сложно доказать качество без публичного рейтинга.', en: 'Hard to prove quality without a public rating.' },
  ],
  services: [
    { slug: 'vendor-onboarding', label: { ru: 'Подключение поставщика', en: 'Vendor onboarding' }, oneLiner: { ru: 'Регистрация за 15 минут, KYC онлайн.', en: 'Sign-up in 15 minutes, online KYC.' }, href: '/vendor/apply' },
    { slug: 'unified-inbox', label: { ru: 'Единый чат с клиентами', en: 'Unified guest inbox' }, oneLiner: { ru: 'WhatsApp + in-app, авто-перевод RU/EN/TH.', en: 'WhatsApp + in-app, auto-translate RU/EN/TH.' }, href: '/vendor/messages' },
    { slug: 'commission', label: { ru: 'Комиссия 10%', en: '10% commission' }, oneLiner: { ru: 'Фикс 10%, payout каждые 7 дней.', en: 'Flat 10%, payout every 7 days.' }, href: '/vendor/billing' },
    { slug: 'rating', label: { ru: 'Прозрачный рейтинг', en: 'Transparent rating' }, oneLiner: { ru: 'Отзывы только от подтверждённых клиентов.', en: 'Reviews only from verified customers.' }, href: '/vendor' },
  ],
  faq: [
    { q: { ru: 'Какая комиссия?', en: 'What’s the commission?' }, a: { ru: 'Фиксированные 10% с заказа. Никаких подписок и скрытых платежей.', en: 'Flat 10% per order. No subscriptions, no hidden fees.' } },
    { q: { ru: 'Когда приходят выплаты?', en: 'When do I get paid?' }, a: { ru: 'Каждые 7 дней на счёт компании или Wise.', en: 'Every 7 days to your company account or Wise.' } },
  ],
  primaryCta: { label: { ru: 'Подключиться поставщиком', en: 'Become a provider' }, href: '/vendor/apply' },
  secondaryCta: { label: { ru: 'Узнать о тарифах', en: 'See pricing' }, href: '/pricing' },
  seo: {
    metaTitle: { ru: 'Стать поставщиком myUNO: комиссия 10%, payout 7 дней', en: 'Become a myUNO provider: 10% commission, 7-day payout' },
    metaDescription: { ru: 'Подключитесь к myUNO как локальный подрядчик: 10% комиссия, единый чат, прозрачный рейтинг и payout каждые 7 дней.', en: 'Join myUNO as a local provider: 10% commission, unified chat, transparent rating and 7-day payout.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/providers',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/providers?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/providers?lang=en' },
    ],
  },
};

const P22_FREELANCERS: PersonaLanding = {
  personaCode: 'P22',
  slug: 'freelancers',
  status: 'live',
  h1: { ru: 'Локальные фрилансеры: фотографы, гиды, мастера', en: 'Local freelancers: photographers, guides, craftspeople' },
  subtitle: { ru: 'Найдите клиентов среди гостей и резидентов острова. Профиль, портфолио, оплата картой и FX-курс к THB.', en: 'Find clients among Phuket guests and residents. Profile, portfolio, card payments and THB FX.' },
  pains: [
    { ru: 'Instagram перестал давать стабильный поток клиентов.', en: 'Instagram no longer brings stable client flow.' },
    { ru: 'Сложно принимать оплату с иностранных карт.', en: 'Hard to accept payments from foreign cards.' },
    { ru: 'Хочется виден ассистент-консьерж, который продаёт за вас.', en: 'You want a concierge assistant that sells for you.' },
    { ru: 'Нужен публичный портфолио без своего сайта.', en: 'You need a public portfolio without building a site.' },
  ],
  services: [
    { slug: 'profile', label: { ru: 'Публичный профиль', en: 'Public profile' }, oneLiner: { ru: 'Портфолио, отзывы, моментальный booking.', en: 'Portfolio, reviews, instant booking.' }, href: '/vendor/apply' },
    { slug: 'card-payments', label: { ru: 'Оплата картой', en: 'Card payments' }, oneLiner: { ru: 'Stripe + Wise, выплата в THB.', en: 'Stripe + Wise, payout in THB.' }, href: '/vendor/billing' },
    { slug: 'concierge', label: { ru: 'AI-консьерж', en: 'AI concierge' }, oneLiner: { ru: 'Подбирает гостям именно вас под их запрос.', en: 'Matches guests to you based on their request.' }, href: '/vendor' },
    { slug: 'classifieds', label: { ru: 'Объявления и лиды', en: 'Listings & leads' }, oneLiner: { ru: 'Доступ к запросам резидентов острова.', en: 'Access to island resident requests.' }, href: '/classifieds' },
  ],
  faq: [
    { q: { ru: 'Нужно ли быть юр.лицом?', en: 'Do I need a registered company?' }, a: { ru: 'Нет — фрилансеры работают как self-employed, нужен только work permit или соответствующая виза.', en: 'No — freelancers work as self-employed; only work permit or matching visa is required.' } },
    { q: { ru: 'Сколько стоит размещение?', en: 'What does it cost?' }, a: { ru: 'Регистрация бесплатна. Платформа берёт 10% с выполненных заказов.', en: 'Sign-up is free. The platform charges 10% on completed orders.' } },
  ],
  primaryCta: { label: { ru: 'Создать профиль', en: 'Create a profile' }, href: '/vendor/apply' },
  secondaryCta: { label: { ru: 'Открыть объявления', en: 'Browse listings' }, href: '/classifieds' },
  seo: {
    metaTitle: { ru: 'Фрилансеры на Пхукете: клиенты, оплата, портфолио — myUNO', en: 'Phuket freelancers: clients, payments, portfolio — myUNO' },
    metaDescription: { ru: 'Подключитесь к myUNO как фрилансер: публичный профиль, AI-консьерж, оплата картой и payout в THB. Комиссия 10%.', en: 'Join myUNO as a freelancer: public profile, AI concierge, card payments and THB payout. 10% commission.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/freelancers',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/freelancers?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/freelancers?lang=en' },
    ],
  },
};

const P23_SMB: PersonaLanding = {
  personaCode: 'P23',
  slug: 'smb',
  status: 'live',
  h1: { ru: 'Локальный малый бизнес на Пхукете', en: 'Local small business on Phuket' },
  subtitle: { ru: 'Кафе, спа, школы, прокат — получите витрину, бронирование, CRM и поток клиентов в одном инструменте.', en: 'Cafés, spas, schools, rentals — get a storefront, bookings, CRM and client flow in one tool.' },
  pains: [
    { ru: 'Нет нормального online-присутствия, кроме Google Maps.', en: 'No proper online presence beyond Google Maps.' },
    { ru: 'CRM на коленке: Excel, WhatsApp, бумажные записи.', en: 'CRM held together by Excel, WhatsApp and paper notes.' },
    { ru: 'Сложно принимать online-оплату от иностранцев.', en: 'Hard to accept online payments from foreigners.' },
    { ru: 'Нет ресурса на маркетинг — нужны клиенты «под ключ».', en: 'No bandwidth for marketing — you need turnkey clients.' },
  ],
  services: [
    { slug: 'storefront', label: { ru: 'Брендированная витрина', en: 'Branded storefront' }, oneLiner: { ru: 'Каталог услуг, фото, отзывы, бронирование.', en: 'Service menu, photos, reviews, bookings.' }, href: '/vendor/apply' },
    { slug: 'crm', label: { ru: 'Lite CRM', en: 'Lite CRM' }, oneLiner: { ru: 'Контакты, задачи, повторные клиенты.', en: 'Contacts, tasks, repeat customers.' }, href: '/vendor' },
    { slug: 'payments', label: { ru: 'Online-оплата', en: 'Online payments' }, oneLiner: { ru: 'Stripe, QR PromptPay, USDT.', en: 'Stripe, QR PromptPay, USDT.' }, href: '/vendor/billing' },
    { slug: 'leads', label: { ru: 'Поток клиентов', en: 'Client flow' }, oneLiner: { ru: 'AI-консьерж рекомендует вас гостям и резидентам.', en: 'AI concierge recommends you to guests and residents.' }, href: '/pricing' },
  ],
  faq: [
    { q: { ru: 'Подходит, если у меня уже есть Line/IG?', en: 'Useful if I already use Line / IG?' }, a: { ru: 'Да — myUNO добавляет англоязычных гостей и резидентов острова, без замены ваших каналов.', en: 'Yes — myUNO adds English-speaking guests and residents, without replacing your channels.' } },
    { q: { ru: 'Сколько это стоит?', en: 'What does it cost?' }, a: { ru: 'Базовая витрина бесплатна. Платформа удерживает 10% с заказов через myUNO.', en: 'Basic storefront is free. The platform retains 10% on orders made via myUNO.' } },
  ],
  primaryCta: { label: { ru: 'Создать витрину', en: 'Create a storefront' }, href: '/vendor/apply' },
  secondaryCta: { label: { ru: 'Тарифы', en: 'Pricing' }, href: '/pricing' },
  seo: {
    metaTitle: { ru: 'SMB на Пхукете: витрина, CRM, оплата — myUNO', en: 'Phuket SMB: storefront, CRM, payments — myUNO' },
    metaDescription: { ru: 'Локальный малый бизнес на Пхукете: брендированная витрина, lite-CRM, online-оплата и поток клиентов через AI-консьерж.', en: 'Phuket small business: branded storefront, lite CRM, online payments and client flow via AI concierge.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/smb',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/smb?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/smb?lang=en' },
    ],
  },
};

const P24_CREATIVES: PersonaLanding = {
  personaCode: 'P24',
  slug: 'creatives',
  status: 'live',
  h1: { ru: 'Creative class на Пхукете', en: 'Creative class on Phuket' },
  subtitle: { ru: 'Дизайнеры, продюсеры, фотографы, артисты — площадка для жизни, коллабораций и съёмок на острове.', en: 'Designers, producers, photographers, artists — a base for living, collaborating and shooting on the island.' },
  pains: [
    { ru: 'Нет базы локаций, людей и студий — каждый ресёрч с нуля.', en: 'No base of locations, people and studios — every research from scratch.' },
    { ru: 'Сложно собрать команду на проект (камера, MUA, локейшн).', en: 'Hard to assemble a project crew (camera, MUA, location).' },
    { ru: 'Нужна виза для творческой работы — не все знают про DTV.', en: 'You need a visa for creative work — not everyone knows DTV.' },
    { ru: 'Хочется community: meetups, выставки, lab-сессии.', en: 'You want community: meetups, exhibitions, lab sessions.' },
  ],
  services: [
    { slug: 'locations', label: { ru: 'База локаций', en: 'Location library' }, oneLiner: { ru: 'Виллы, студии, природа — с rate card.', en: 'Villas, studios, nature — with rate cards.' }, href: '/property/rent' },
    { slug: 'crew', label: { ru: 'Сборка команды', en: 'Crew booking' }, oneLiner: { ru: 'Камера, MUA, стилист, PA — за 24 ч.', en: 'Camera, MUA, stylist, PA — within 24 h.' }, href: '/contact' },
    { slug: 'dtv-visa', label: { ru: 'DTV для creators', en: 'DTV for creators' }, oneLiner: { ru: 'Destination Thailand Visa: 5 лет, 180 дн.', en: 'Destination Thailand Visa: 5 years, 180 days.' }, href: '/visa/quiz' },
    { slug: 'community', label: { ru: 'Community и события', en: 'Community & events' }, oneLiner: { ru: 'Meetups, лабы, открытые студии.', en: 'Meetups, labs, open studios.' }, href: '/cluster/lifestyle' },
  ],
  faq: [
    { q: { ru: 'Можно ли работать на иностранных клиентов?', en: 'Can I work for foreign clients?' }, a: { ru: 'Да — DTV специально для удалённой работы, выплат от иностранных клиентов через Wise/Stripe.', en: 'Yes — DTV is built for remote work and payments from foreign clients via Wise/Stripe.' } },
    { q: { ru: 'Где собираются креаторы?', en: 'Where does the creative scene gather?' }, a: { ru: 'Phuket Town (Old Town), Cherngtalay, Rawai. Регулярные арт-маркеты и meetups.', en: 'Phuket Town (Old Town), Cherngtalay, Rawai. Regular art markets and meetups.' } },
  ],
  primaryCta: { label: { ru: 'Подобрать локацию', en: 'Find a location' }, href: '/property/rent' },
  secondaryCta: { label: { ru: 'Получить DTV', en: 'Get DTV' }, href: '/visa/quiz' },
  seo: {
    metaTitle: { ru: 'Creative Phuket: локации, команда, DTV — myUNO', en: 'Creative Phuket: locations, crew, DTV — myUNO' },
    metaDescription: { ru: 'Площадка для дизайнеров, продюсеров и фотографов на Пхукете: локации, сборка команды, DTV и community.', en: 'A base for designers, producers and photographers on Phuket: locations, crew, DTV visa and community.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/creatives',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/creatives?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/creatives?lang=en' },
    ],
  },
};

const P25_STUDENTS: PersonaLanding = {
  personaCode: 'P25',
  slug: 'students',
  status: 'live',
  h1: { ru: 'Студенты и молодые взрослые на Пхукете', en: 'Students and young adults on Phuket' },
  subtitle: { ru: 'Учёба, языковые школы, дайвинг, Muay Thai и доступная аренда — Пхукет как gap-year или semester abroad.', en: 'Study, language schools, diving, Muay Thai and affordable rentals — Phuket as a gap year or semester abroad.' },
  pains: [
    { ru: 'Нужна ED-виза, но школы и условия запутаны.', en: 'You need an ED visa, but schools and conditions are confusing.' },
    { ru: 'Бюджет ограничен — нужна аренда от ฿15K и ниже.', en: 'Budget is tight — you need rentals from ฿15K and below.' },
    { ru: 'Хочется учить английский, тайский или дайвинг — не понятно где.', en: 'You want to learn English, Thai or diving — unclear where.' },
    { ru: 'Скучно одному — нужен student community.', en: 'Lonely solo — you need a student community.' },
  ],
  services: [
    { slug: 'language-schools', label: { ru: 'Языковые школы', en: 'Language schools' }, oneLiner: { ru: 'Английский, тайский, китайский — с ED-визой.', en: 'English, Thai, Chinese — with ED visa.' }, href: '/visa/quiz' },
    { slug: 'student-housing', label: { ru: 'Доступная аренда', en: 'Affordable rentals' }, oneLiner: { ru: 'Студии и shared house от ฿10–15K.', en: 'Studios and shared houses from ฿10–15K.' }, href: '/property/rent' },
    { slug: 'activities', label: { ru: 'Дайвинг и Muay Thai', en: 'Diving & Muay Thai' }, oneLiner: { ru: 'Сертификации PADI, тренировки в топ-залах.', en: 'PADI certifications, top gym training.' }, href: '/cluster/lifestyle' },
    { slug: 'community', label: { ru: 'Student community', en: 'Student community' }, oneLiner: { ru: 'Meetups, языковые обмены, спортивные группы.', en: 'Meetups, language exchanges, sports groups.' }, href: '/cluster/lifestyle' },
  ],
  faq: [
    { q: { ru: 'Можно ли работать на ED-визе?', en: 'Can I work on an ED visa?' }, a: { ru: 'Нет — ED-виза только для учёбы. Для работы нужна DTV или work permit.', en: 'No — ED visa is study only. For work you need DTV or a work permit.' } },
    { q: { ru: 'Сколько стоит жизнь в месяц?', en: 'What does a month cost?' }, a: { ru: 'Бюджет студента: ฿30–45K (аренда + еда + транспорт + школа).', en: 'Student budget: ฿30–45K (rent + food + transport + school).' } },
  ],
  primaryCta: { label: { ru: 'Подобрать школу и визу', en: 'Pick school & visa' }, href: '/visa/quiz' },
  secondaryCta: { label: { ru: 'Найти жильё', en: 'Find housing' }, href: '/property/rent' },
  seo: {
    metaTitle: { ru: 'Студенту на Пхукете: ED-виза, школы, жильё — myUNO', en: 'Students on Phuket: ED visa, schools, housing — myUNO' },
    metaDescription: { ru: 'Gap-year или semester abroad на Пхукете: ED-виза, языковые школы, доступная аренда, дайвинг и community.', en: 'Gap year or semester abroad on Phuket: ED visa, language schools, affordable rentals, diving and community.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/students',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/students?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/students?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: P26 — Conscious Eaters (vegan/vegetarian/plant-based/gluten-free)
//  Added 2026-04-25 — fills the dietary-lifestyle gap in canon §4.2.
// ──────────────────────────────────────────────────────────────────────

const P26_CONSCIOUS_EATERS: PersonaLanding = {
  personaCode: 'P26',
  slug: 'conscious-eaters',
  status: 'live',
  h1: {
    ru: 'Растительный Пхукет: vegan, vegetarian и без глютена',
    en: 'Plant-based Phuket: vegan, vegetarian and gluten-free',
  },
  subtitle: {
    ru: '120+ растительных кафе, доставка vegan-меню, виллы с кухней для своей готовки и wellness-ретриты — без компромиссов в питании.',
    en: '120+ plant-based cafés, vegan delivery, villas with self-catering kitchens and wellness retreats — no compromises on what you eat.',
  },
  pains: [
    { ru: 'Большинство тайских меню содержат рыбный соус — даже «вегетарианские».', en: 'Most Thai menus contain fish sauce — even the “vegetarian” ones.' },
    { ru: 'Сложно найти gluten-free хлеб и pasta вне Rawai/Bang Tao.', en: 'Hard to find gluten-free bread and pasta outside Rawai/Bang Tao.' },
    { ru: 'Хочется виллу с настоящей кухней, а не одной плиткой.', en: 'You want a villa with a real kitchen, not a single hotplate.' },
    { ru: 'Нужны wellness-ретриты с plant-based меню и yoga.', en: 'You need wellness retreats with plant-based menus and yoga.' },
  ],
  services: [
    { slug: 'vegan-restaurants', label: { ru: 'Растительные рестораны', en: 'Plant-based restaurants' }, oneLiner: { ru: '120+ кафе с верифицированным vegan/vegetarian меню.', en: '120+ cafés with verified vegan/vegetarian menus.' }, href: '/restaurants' },
    { slug: 'vegan-delivery',    label: { ru: 'Доставка vegan-меню',  en: 'Vegan delivery' },         oneLiner: { ru: 'Plant-based блюда домой за 30–45 минут.', en: 'Plant-based meals delivered in 30–45 min.' }, href: '/delivery' },
    { slug: 'self-catering-villa', label: { ru: 'Вилла с кухней',      en: 'Self-catering villa' },    oneLiner: { ru: 'Полноценная кухня — готовьте по своим правилам.', en: 'Real kitchen — cook by your own rules.' }, href: '/property/rent' },
    { slug: 'wellness-retreats', label: { ru: 'Wellness-ретриты',     en: 'Wellness retreats' },      oneLiner: { ru: 'Yoga, detox, plant-based menu — 3–7 дней.', en: 'Yoga, detox, plant-based menu — 3–7 days.' }, href: '/experiences' },
  ],
  faq: [
    { q: { ru: 'Где больше всего vegan-инфраструктуры?', en: 'Where is most vegan infrastructure?' }, a: { ru: 'Rawai, Bang Tao и Chalong — самая высокая концентрация plant-based кафе и магазинов.', en: 'Rawai, Bang Tao and Chalong — highest concentration of plant-based cafés and stores.' } },
    { q: { ru: 'Как сказать «без рыбного соуса» по-тайски?', en: 'How do I say “no fish sauce” in Thai?' }, a: { ru: '«Mai sai nam plaa» (ไม่ใส่น้ำปลา) — без рыбного соуса. Также: «jay» = строгий вегетарианец.', en: '“Mai sai nam plaa” (ไม่ใส่น้ำปลา) — no fish sauce. Also: “jay” = strict vegetarian.' } },
    { q: { ru: 'Есть ли gluten-free пекарни?', en: 'Are there gluten-free bakeries?' }, a: { ru: 'Да — несколько в Rawai и Bang Tao с сертифицированным GF-хлебом и десертами.', en: 'Yes — several in Rawai and Bang Tao with certified GF bread and desserts.' } },
  ],
  primaryCta: { label: { ru: 'Открыть рестораны', en: 'Browse restaurants' }, href: '/restaurants' },
  secondaryCta: { label: { ru: 'Подобрать виллу', en: 'Find a villa' }, href: '/property/rent' },
  seo: {
    metaTitle: { ru: 'Vegan Пхукет: рестораны, доставка, виллы — myUNO', en: 'Vegan Phuket: restaurants, delivery, villas — myUNO' },
    metaDescription: { ru: 'Vegan, vegetarian и gluten-free Пхукет: 120+ растительных кафе, доставка plant-based меню, виллы с кухней и wellness-ретриты.', en: 'Vegan, vegetarian and gluten-free Phuket: 120+ plant-based cafés, vegan delivery, self-catering villas and wellness retreats.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/for/conscious-eaters',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/for/conscious-eaters?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/for/conscious-eaters?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  Canonical list (P1..P25)
// ──────────────────────────────────────────────────────────────────────

export const PERSONA_LANDINGS: readonly PersonaLanding[] = [
  P1_TOURISTS,
  P2_CN_INVESTORS,
  P3_EU_GUESTS,
  P4_DIGITAL_NOMADS,
  P5_SNOWBIRDS,
  P6_RU_EXPATS,
  P7_FAMILIES,
  P8_PASSIVE_INVESTORS,
  P9_HNW,
  P10_OPERATORS,
  P11_MN_INVESTORS,
  P12_BN_BUSINESS,
  P13_PET_OWNERS,
  P14_MEDICAL,
  P15_WEDDINGS,
  P16_ATHLETES,
  P17_HALAL,
  P18_LGBTQ,
  P19_ACCESSIBILITY,
  P20_RETIREES,
  P21_PROVIDERS,
  // P22 — два slug (taxonomy conflict, см. m10b-completion.md):
  P22_FREELANCERS,
  P22_DEVELOPER_PARTNER,
  P23_SMB,
  P24_CREATIVES,
  P25_STUDENTS,
] as const;

export const LIVE_PERSONA_SLUGS: readonly string[] = [
  'tourists',          // P1
  'cn-investors',      // P2  — 2026-04-24
  'eu-guests',         // P3  — Sprint 3
  'digital-nomads',    // P4  — Sprint 1
  'snowbirds',         // P5  — M10b
  'ru-expats',         // P6  — M10b
  'families',          // P7  — Sprint 1
  'passive-investors', // P8  — M10b (main IPP funnel)
  'hnw',               // P9
  'operators',         // P10 — M10b
  'mn-investors',      // P11 — M10b
  'bn-business',       // P12 — 2026-04-24
  'pet-owners',        // P13
  'medical',           // P14 — Sprint 2
  'weddings',          // P15 — Sprint 2
  'athletes',          // P16 — Sprint 3
  'halal',             // P17 — Sprint 3
  'lgbtq',             // P18 — 2026-04-24
  'accessibility',     // P19 — 2026-04-24
  'retirees',          // P20 — Sprint 2
  'providers',         // P21 — 2026-04-24
  'freelancers',       // P22 — 2026-04-24
  'developer-partner', // P22 — M10b
  'smb',               // P23 — 2026-04-24
  'creatives',         // P24 — 2026-04-24
  'students',          // P25 — 2026-04-24
] as const;
