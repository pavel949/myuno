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
//  Canonical list (P1..P25)
// ──────────────────────────────────────────────────────────────────────

export const PERSONA_LANDINGS: readonly PersonaLanding[] = [
  P1_TOURISTS,
  draftPersona('P2', 'cn-investors', { ru: 'Гости из Китая', en: 'Chinese tourists & scouts' }),
  draftPersona('P3', 'eu-guests', { ru: 'Гости из Европы', en: 'European guests' }),
  P4_DIGITAL_NOMADS,
  P5_SNOWBIRDS,
  P6_RU_EXPATS,
  P7_FAMILIES,
  P8_PASSIVE_INVESTORS,
  P9_HNW,
  P10_OPERATORS,
  P11_MN_INVESTORS,
  draftPersona('P12', 'bn-business', { ru: 'Бизнес-аудитория из Бангладеш', en: 'Bangladeshi business audience' }),
  P13_PET_OWNERS,
  P14_MEDICAL,
  P15_WEDDINGS,
  draftPersona('P16', 'athletes', { ru: 'Спортсмены и Fight Camp', en: 'Athletes & fight camps' }),
  draftPersona('P17', 'halal', { ru: 'Мусульманские путешественники', en: 'Muslim travellers' }),
  draftPersona('P18', 'lgbtq', { ru: 'ЛГБТК+ путешественники и резиденты', en: 'LGBTQ+ travellers & residents' }),
  draftPersona('P19', 'accessibility', { ru: 'Путешественники с ограниченными возможностями', en: 'Accessibility-first travellers' }),
  P20_RETIREES,
  draftPersona('P21', 'providers', { ru: 'Локальные подрядчики', en: 'Local providers' }),
  // M10b — два slug под P22 (taxonomy conflict, см. m10b-completion.md):
  draftPersona('P22', 'freelancers', { ru: 'Локальные фрилансеры', en: 'Local freelancers' }),
  P22_DEVELOPER_PARTNER,
  draftPersona('P23', 'smb', { ru: 'Локальный малый бизнес', en: 'Local SMB' }),
  draftPersona('P24', 'creatives', { ru: 'Creative Class', en: 'Creative class' }),
  draftPersona('P25', 'students', { ru: 'Студенты и молодые взрослые', en: 'Students & young adults' }),
] as const;

export const LIVE_PERSONA_SLUGS: readonly string[] = [
  'tourists',          // P1
  'digital-nomads',    // P4  — Sprint 1
  'snowbirds',         // P5  — M10b
  'ru-expats',         // P6  — M10b
  'families',          // P7  — Sprint 1
  'passive-investors', // P8  — M10b (main IPP funnel)
  'hnw',               // P9
  'operators',         // P10 — M10b
  'mn-investors',      // P11 — M10b
  'pet-owners',        // P13
  'medical',           // P14 — Sprint 2
  'weddings',          // P15 — Sprint 2
  'retirees',          // P20 — Sprint 2
  'developer-partner', // P22 — M10b
] as const;
