/**
 * @module content/landings/clusterLandings
 * @description M6 · Tracks B.3 + B.8 — конфиг 10 cluster-лендингов (A..J).
 *
 * Источник правды:
 *  - `docs/canonical/01-segmentation-framework.md` §5 (10 кластеров)
 *  - `docs/canonical/01-segmentation-framework.md` §6 (матрица)
 *  - `docs/canonical/03-tone-of-voice.md` §14
 *
 * Состояние:
 *  - 7 кластеров `draft` → /cluster/:slug → 404.
 *  - 3 live: A `arrival`, D `investment`, F `operations`.
 */

import type { ClusterLanding, LandingClusterCode } from '@/lib/landings/types';
import type { PersonaCode } from '@/types/canonical';

function draftCluster(
  clusterCode: LandingClusterCode,
  slug: string,
  hint: { ru: string; en: string },
  relatedPersonas: PersonaCode[],
): ClusterLanding {
  return {
    clusterCode,
    slug,
    status: 'draft',
    h1: hint,
    subtitle: { ru: 'Страница в разработке.', en: 'Page under development.' },
    jobs: [],
    services: [],
    faq: [],
    primaryCta: {
      label: { ru: 'На главную', en: 'Go home' },
      href: '/',
    },
    relatedPersonas,
  };
}

const OG_DEFAULT = 'https://myuno.app/og/default-og.jpg';

// ──────────────────────────────────────────────────────────────────────
//  LIVE: A — Arrival & Orientation
// ──────────────────────────────────────────────────────────────────────

const A_ARRIVAL: ClusterLanding = {
  clusterCode: 'A',
  slug: 'arrival',
  status: 'live',
  h1: {
    ru: 'Прибытие на Пхукет: первые 72 часа',
    en: 'Arriving on Phuket: the first 72 hours',
  },
  subtitle: {
    ru: 'Трансфер, eSIM, наличные THB, заселение, ориентация по районам — пошаговый план без лишних движений.',
    en: 'Transfer, eSIM, THB cash, check-in and area orientation — a step-by-step plan without detours.',
  },
  jobs: [
    { ru: 'Доехать из аэропорта по фиксированной цене.', en: 'Get from the airport at a fixed price.' },
    { ru: 'Подключить интернет в первый час.', en: 'Get online within the first hour.' },
    { ru: 'Снять или обменять THB без потери на курсе.', en: 'Withdraw or exchange THB without losing on the rate.' },
    { ru: 'Заселиться без задержек на ресепшен.', en: 'Check in without reception delays.' },
    { ru: 'Понять, какой район подходит под задачу.', en: 'Figure out which area fits your purpose.' },
    { ru: 'Забронировать первое такси / еду / экскурсию.', en: 'Book your first taxi, meal or experience.' },
  ],
  services: [
    {
      slug: 'airport-transfer',
      label: { ru: 'Трансфер из аэропорта', en: 'Airport transfer' },
      oneLiner: { ru: 'Седан 800 THB, минивэн 1 200 THB.', en: 'Sedan 800 THB, minivan 1,200 THB.' },
      href: '/landing/airport-transfer',
    },
    {
      slug: 'esim',
      label: { ru: 'eSIM', en: 'eSIM' },
      oneLiner: { ru: 'Активация за 5 минут, 4G по всему острову.', en: 'Activated in 5 minutes, 4G island-wide.' },
      href: '/sim',
    },
    {
      slug: 'cash-currency',
      label: { ru: 'Где снять и обменять THB', en: 'Where to withdraw and exchange THB' },
      oneLiner: { ru: 'Карта банкоматов SuperRich и комиссии за снятие.', en: 'SuperRich ATM map and withdrawal fees.' },
      href: '/services/finance/cash',
    },
    {
      slug: 'check-in-help',
      label: { ru: 'Помощь с заселением', en: 'Check-in support' },
      oneLiner: { ru: 'Контроль депозита, состояния номера, договора аренды.', en: 'Deposit, room condition and rental contract review.' },
      href: '/concierge?topic=checkin',
    },
    {
      slug: 'area-guide',
      label: { ru: 'Гид по районам', en: 'Area guide' },
      oneLiner: { ru: 'Патонг, Камала, Сурин, Лагуна, Раваи, Чалонг — за 6 минут.', en: 'Patong, Kamala, Surin, Laguna, Rawai, Chalong in 6 minutes.' },
      href: '/guide/areas',
    },
    {
      slug: 'first-tour',
      label: { ru: 'Первая экскурсия', en: 'First tour' },
      oneLiner: { ru: 'Острова Пхи-Пхи или Джеймс Бонд, без подвоха у стойки.', en: 'Phi Phi or James Bond islands, no street-vendor catches.' },
      href: '/experiences',
    },
  ],
  faq: [
    {
      q: { ru: 'Нужна ли виза для въезда?', en: 'Do I need a visa to enter?' },
      a: {
        ru: 'Граждане РФ — до 60 дней без визы. ЕС — до 30 дней. Продление — на месте через иммиграцию.',
        en: 'Russian citizens — 60 days visa-free. EU — 30 days. Extension via immigration on the island.',
      },
    },
    {
      q: { ru: 'Где брать наличные с минимальной комиссией?', en: 'Where to get cash with the lowest fee?' },
      a: {
        ru: 'Банкоматы Aeon — без комиссии. SuperRich — выгодный курс при обмене USD/EUR/RUB наличными.',
        en: 'Aeon ATMs charge no fee. SuperRich offers competitive rates for USD/EUR/RUB cash exchange.',
      },
    },
    {
      q: { ru: 'Сколько брать наличных в день?', en: 'How much cash per day?' },
      a: {
        ru: 'Ориентир 2 000–3 000 THB на человека: еда, такси, мелкие покупки. Карты Visa/Master принимают почти везде.',
        en: 'Plan 2,000–3,000 THB per person per day: food, taxis, small purchases. Visa/Mastercard accepted almost everywhere.',
      },
    },
    {
      q: { ru: 'Какой район выбрать на первую неделю?', en: 'Which area to pick for the first week?' },
      a: {
        ru: 'Семья — Камала или Бангтао; пара — Сурин; ночная жизнь — Патонг; пенсионеры/долгосрок — Раваи.',
        en: 'Family — Kamala or Bang Tao; couple — Surin; nightlife — Patong; retirees/long-stay — Rawai.',
      },
    },
    {
      q: { ru: 'Можно ли пить воду из-под крана?', en: 'Is tap water drinkable?' },
      a: {
        ru: 'Не рекомендуем. Бутилированная вода — 7–15 THB за 1.5 л. Кулеры в большинстве кондо.',
        en: 'Not recommended. Bottled water 7–15 THB for 1.5L. Coolers in most condos.',
      },
    },
    {
      q: { ru: 'Кому звонить, если что-то пошло не так?', en: 'Who do I call if something goes wrong?' },
      a: {
        ru: 'Туристическая полиция — 1155 (по-английски). Скорая — 1669. Чат myUNO — ответ в течение часа.',
        en: 'Tourist police — 1155 (English). Ambulance — 1669. myUNO chat — reply within an hour.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Заказать трансфер', en: 'Book a transfer' },
    href: '/landing/airport-transfer',
    subtitle: { ru: 'Цена в THB, оплата в приложении.', en: 'Price in THB, paid in the app.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть гид по районам', en: 'Open the area guide' },
    href: '/guide/areas',
  },
  relatedPersonas: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P11', 'P14', 'P15', 'P16', 'P25'],
  seo: {
    metaTitle: {
      ru: 'Прибытие на Пхукет: чек-лист первых 72 часов — myUNO',
      en: 'Arriving on Phuket: a 72-hour checklist — myUNO',
    },
    metaDescription: {
      ru: 'Трансфер, eSIM, наличные THB, заселение и районы — пошаговый план для первых трёх дней на Пхукете.',
      en: 'Transfer, eSIM, THB cash, check-in and areas — a step-by-step plan for your first 72 hours on Phuket.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/arrival',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/arrival?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/arrival?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: D — Investment Consideration
// ──────────────────────────────────────────────────────────────────────

const D_INVESTMENT: ClusterLanding = {
  clusterCode: 'D',
  slug: 'investment',
  status: 'live',
  h1: {
    ru: 'Покупка недвижимости на Пхукете: с чего начать',
    en: 'Buying property on Phuket: where to start',
  },
  subtitle: {
    ru: 'Сравнение районов, ClearView™ рейтинг застройщиков, юридическая структура и сценарии доходности — без давления продавца.',
    en: 'Area comparison, ClearView™ developer ratings, legal structure and yield scenarios — without sales pressure.',
  },
  jobs: [
    { ru: 'Понять, какие районы растут в цене и почему.', en: 'Understand which areas are appreciating and why.' },
    { ru: 'Отличить надёжного застройщика от рискованного.', en: 'Tell a reliable developer from a risky one.' },
    { ru: 'Сравнить freehold, leasehold и компанию-владельца.', en: 'Compare freehold, leasehold and company ownership.' },
    { ru: 'Посчитать реальную доходность с учётом расходов.', en: 'Calculate real yield net of costs.' },
    { ru: 'Согласовать ипотеку или рассрочку от застройщика.', en: 'Arrange a mortgage or developer instalment plan.' },
    { ru: 'Заказать независимый осмотр объекта.', en: 'Order an independent property inspection.' },
  ],
  services: [
    {
      slug: 'area-comparison',
      label: { ru: 'Сравнение районов', en: 'Area comparison' },
      oneLiner: { ru: 'Цены, инфраструктура, динамика за 5 лет.', en: 'Prices, infrastructure, 5-year dynamics.' },
      href: '/property/areas',
    },
    {
      slug: 'clearview-rating',
      label: { ru: 'ClearView™ рейтинг', en: 'ClearView™ rating' },
      oneLiner: { ru: '8 категорий, AAA–BB, отчёт за 5 рабочих дней.', en: '8 categories, AAA–BB, 5-day report.' },
      href: '/clearview',
    },
    {
      slug: 'offplan-catalog',
      label: { ru: 'Каталог off-plan', en: 'Off-plan catalogue' },
      oneLiner: { ru: '120+ проектов с ценой за м² и сроками сдачи.', en: '120+ projects with price/sqm and delivery dates.' },
      href: '/newbuilds',
    },
    {
      slug: 'yield-calculator',
      label: { ru: 'Калькулятор доходности', en: 'Yield calculator' },
      oneLiner: { ru: 'Net yield с учётом 30% управляющему и налогов.', en: 'Net yield including 30% PM fee and taxes.' },
      href: '/invest/calculator',
    },
    {
      slug: 'legal-structuring',
      label: { ru: 'Юридическая структура', en: 'Legal structure' },
      oneLiner: { ru: 'Freehold vs leasehold vs Thai company.', en: 'Freehold vs leasehold vs Thai company.' },
      href: '/legal',
    },
    {
      slug: 'inspection',
      label: { ru: 'Независимый осмотр', en: 'Independent inspection' },
      oneLiner: { ru: 'Инженер на сдаче и приёмке, отчёт с фото.', en: 'Engineer at handover, photo report.' },
      href: '/services/property/inspection',
    },
  ],
  faq: [
    {
      q: { ru: 'Может ли иностранец купить квартиру?', en: 'Can a foreigner buy a condo?' },
      a: {
        ru: 'Да, в кондоминиумах — freehold до 49% площадей здания. Земля — только через тайскую компанию или leasehold на 30+30+30 лет.',
        en: 'Yes — condos freehold up to 49% of the building. Land — only via a Thai company or 30+30+30-year leasehold.',
      },
    },
    {
      q: { ru: 'Какая средняя доходность сдачи?', en: 'What’s the average rental yield?' },
      a: {
        ru: 'Брутто 6–9% годовых, net после расходов и налогов — 4–6% в популярных районах.',
        en: 'Gross 6–9% p.a., net of costs and tax — 4–6% in popular areas.',
      },
    },
    {
      q: { ru: 'Какие налоги при покупке?', en: 'What taxes apply on purchase?' },
      a: {
        ru: 'Transfer fee 2%, stamp duty 0.5% или Specific Business Tax 3.3%, withholding tax. По договорённости — 50/50 с продавцом.',
        en: 'Transfer fee 2%, stamp duty 0.5% or SBT 3.3%, withholding tax. Often split 50/50 with the seller.',
      },
    },
    {
      q: { ru: 'Дают ли застройщики рассрочку?', en: 'Do developers offer instalments?' },
      a: {
        ru: 'Да, типовая схема 30/70: 30% во время строительства, 70% при передаче ключей. У премиум-проектов — гибкие графики.',
        en: 'Yes, the typical 30/70 schedule: 30% during construction, 70% at key handover. Premium projects have flexible plans.',
      },
    },
    {
      q: { ru: 'Что входит в ClearView™ отчёт?', en: 'What’s in the ClearView™ report?' },
      a: {
        ru: '8 категорий: финансы застройщика, юридический статус земли, история сдач, эскроу, локация, продукт, управление, выход. Шкала AAA–BB.',
        en: '8 categories: developer finance, land legal status, delivery history, escrow, location, product, management, exit. Scale AAA–BB.',
      },
    },
    {
      q: { ru: 'Можно ли провести сделку удалённо?', en: 'Can the transaction be done remotely?' },
      a: {
        ru: 'Да, через PoA (доверенность) у тайского нотариуса и банковский эскроу. Юрист сопровождает все этапы.',
        en: 'Yes — via PoA notarised in Thailand and a bank escrow. The lawyer handles every stage.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Заказать ClearView-отчёт', en: 'Order a ClearView report' },
    href: '/clearview',
    subtitle: { ru: 'Готов за 5 рабочих дней.', en: 'Ready in 5 working days.' },
  },
  secondaryCta: {
    label: { ru: 'Открыть каталог off-plan', en: 'Browse off-plan catalogue' },
    href: '/newbuilds',
  },
  relatedPersonas: ['P2', 'P5', 'P6', 'P8', 'P9', 'P11', 'P12'],
  seo: {
    metaTitle: {
      ru: 'Покупка недвижимости на Пхукете: ClearView™ — myUNO',
      en: 'Buying property on Phuket: ClearView™ rating — myUNO',
    },
    metaDescription: {
      ru: 'Сравнение районов, рейтинг застройщика, юридическая структура и калькулятор доходности. Без давления продавца.',
      en: 'Area comparison, developer rating, legal structure and yield calculator. No sales pressure.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/investment',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/investment?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/investment?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: F — Ownership & Operations
// ──────────────────────────────────────────────────────────────────────

const F_OPERATIONS: ClusterLanding = {
  clusterCode: 'F',
  slug: 'operations',
  status: 'live',
  h1: {
    ru: 'Управление недвижимостью на Пхукете',
    en: 'Managing your Phuket property',
  },
  subtitle: {
    ru: 'Сдача, эксплуатация, отчётность и налоги. Прозрачные расходы в THB, ежемесячный отчёт владельцу.',
    en: 'Rental, maintenance, reporting and tax. Transparent THB costs, monthly owner statement.',
  },
  jobs: [
    { ru: 'Загрузить календарь и синхронизировать каналы продажи.', en: 'Load the calendar and sync sales channels.' },
    { ru: 'Получать предсказуемый доход после комиссии управляющего.', en: 'Earn a predictable income net of the PM fee.' },
    { ru: 'Знать состояние объекта удалённо — фото после каждого выезда.', en: 'Know the property status remotely — photos after every checkout.' },
    { ru: 'Планировать ТО кондиционеров, насосов и электрики.', en: 'Schedule maintenance for AC, pumps and electrical.' },
    { ru: 'Получить отчёт для подачи налоговой декларации.', en: 'Receive a report ready for tax filing.' },
    { ru: 'Покрыть форс-мажор — страховка и юрист в чате.', en: 'Cover force majeure — insurance and lawyer in chat.' },
  ],
  services: [
    {
      slug: 'pms',
      label: { ru: 'PMS подписка', en: 'PMS subscription' },
      oneLiner: { ru: 'От $25/мес за объект, синхронизация Booking/Airbnb/Agoda.', en: 'From $25/mo per unit, Booking/Airbnb/Agoda sync.' },
      href: '/owner/pms',
    },
    {
      slug: 'rental-management',
      label: { ru: 'Управление сдачей', en: 'Rental management' },
      oneLiner: { ru: 'Комиссия 25–30%, оплата только с фактического дохода.', en: '25–30% fee, charged only on realised revenue.' },
      href: '/owner/rental',
    },
    {
      slug: 'maintenance',
      label: { ru: 'Эксплуатация и ТО', en: 'Maintenance & upkeep' },
      oneLiner: { ru: 'Чек-листы по сезонам, прозрачная закупка запчастей.', en: 'Seasonal checklists, transparent parts procurement.' },
      href: '/owner/maintenance',
    },
    {
      slug: 'monthly-report',
      label: { ru: 'Ежемесячный отчёт', en: 'Monthly statement' },
      oneLiner: { ru: 'Доходы, расходы, остаток к выплате — одной таблицей.', en: 'Income, costs, payout balance — in one statement.' },
      href: '/owner/reports',
    },
    {
      slug: 'tax-filing',
      label: { ru: 'Подготовка налоговой', en: 'Tax filing prep' },
      oneLiner: { ru: 'Withholding tax, House and Land tax, годовая декларация.', en: 'Withholding tax, House & Land tax, annual return.' },
      href: '/legal/tax',
    },
    {
      slug: 'insurance',
      label: { ru: 'Страхование объекта', en: 'Property insurance' },
      oneLiner: { ru: 'От 0.15% от стоимости в год, выплата в THB.', en: 'From 0.15% of value per year, payouts in THB.' },
      href: '/services/finance/insurance',
    },
  ],
  faq: [
    {
      q: { ru: 'Какая средняя загрузка виллы / кондо?', en: 'What’s the average occupancy of a villa / condo?' },
      a: {
        ru: 'Высокий сезон (ноябрь–апрель) — 75–90%, низкий — 35–55%. Средняя по году 55–65% при правильном ценообразовании.',
        en: 'High season (Nov–Apr) — 75–90%, low season — 35–55%. Annual average 55–65% with proper pricing.',
      },
    },
    {
      q: { ru: 'Когда я получаю выплату?', en: 'When do I get paid?' },
      a: {
        ru: 'Раз в месяц до 10 числа за предыдущий месяц. Перевод в THB на тайский счёт или в USD/EUR на ваш банк.',
        en: 'Once a month, by the 10th, for the prior month. THB to a Thai account or USD/EUR to your bank.',
      },
    },
    {
      q: { ru: 'Что входит в комиссию управляющего?', en: 'What’s included in the PM fee?' },
      a: {
        ru: 'Маркетинг на каналах, communication c гостями, заселение/выселение, уборка после, репорт. Не входит: ремонт, замена техники, налоги.',
        en: 'Channel marketing, guest comms, check-in/out, post-stay cleaning, reporting. Not included: repairs, appliance replacement, taxes.',
      },
    },
    {
      q: { ru: 'Кто платит за поломки?', en: 'Who pays for repairs?' },
      a: {
        ru: 'Профилактика — за счёт фонда обслуживания (1–2% от дохода). Капитальные — отдельной сметой с согласованием.',
        en: 'Routine — from the maintenance fund (1–2% of revenue). Capital — separately quoted and approved.',
      },
    },
    {
      q: { ru: 'Какие налоги платит владелец?', en: 'What taxes does the owner pay?' },
      a: {
        ru: 'House and Land tax 0.02–0.1% от оценочной стоимости. Withholding tax 5% c аренды нерезиденту. Подача — раз в год.',
        en: 'House & Land tax 0.02–0.1% of assessed value. 5% withholding on non-resident rent. Filed annually.',
      },
    },
    {
      q: { ru: 'Можно ли сменить управляющего?', en: 'Can I switch property manager?' },
      a: {
        ru: 'Да, договор расторгается с уведомлением за 30 дней. Передача объекта — по чек-листу с фото и инвентарём.',
        en: 'Yes, with 30 days’ notice. Handover follows a checklist with photos and inventory.',
      },
    },
  ],
  primaryCta: {
    label: { ru: 'Подключить PMS', en: 'Activate PMS' },
    href: '/owner/pms',
    subtitle: { ru: 'От $25 в месяц за объект.', en: 'From $25/month per unit.' },
  },
  secondaryCta: {
    label: { ru: 'Заказать аудит объекта', en: 'Request a property audit' },
    href: '/owner/audit',
  },
  relatedPersonas: ['P8', 'P9', 'P10'],
  seo: {
    metaTitle: {
      ru: 'Управление недвижимостью на Пхукете: PMS — myUNO',
      en: 'Phuket property management: PMS, rentals, reporting — myUNO',
    },
    metaDescription: {
      ru: 'Сдача, эксплуатация и налоги для владельцев. PMS от $25/мес, ежемесячный отчёт в THB, прозрачные расходы.',
      en: 'Rental, maintenance and tax for owners. PMS from $25/mo, monthly THB statement, transparent costs.',
    },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/operations',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/operations?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/operations?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: G — Compliance & Legal
// ──────────────────────────────────────────────────────────────────────

const G_COMPLIANCE: ClusterLanding = {
  clusterCode: 'G',
  slug: 'compliance',
  status: 'live',
  h1: {
    ru: 'Налоги, право и compliance на Пхукете',
    en: 'Tax, legal and compliance on Phuket',
  },
  subtitle: {
    ru: 'Tax residency, налоги от аренды, контракты, due diligence и работа с тайскими нотариусами — без сюрпризов в апреле.',
    en: 'Tax residency, rental tax, contracts, due diligence and Thai notary work — with no April surprises.',
  },
  jobs: [
    { ru: 'Понять, когда вы становитесь tax resident Таиланда.', en: 'Understand when you become a Thai tax resident.' },
    { ru: 'Подать декларацию о доходах от аренды.', en: 'File a rental income declaration.' },
    { ru: 'Проверить договор перед подписанием.', en: 'Review a contract before signing.' },
    { ru: 'Провести due diligence земли или застройщика.', en: 'Run due diligence on land or developer.' },
    { ru: 'Открыть тайскую компанию для владения землёй.', en: 'Open a Thai company to hold land.' },
    { ru: 'Сделать PoA для удалённой сделки.', en: 'Issue a PoA for a remote transaction.' },
  ],
  services: [
    { slug: 'tax-advisor', label: { ru: 'Tax Advisor', en: 'Tax Advisor' }, oneLiner: { ru: 'Расчёт обязательств: 180-day rule, foreign income.', en: '180-day rule and foreign-income tax planning.' }, href: '/tax' },
    { slug: 'rental-tax', label: { ru: 'Налог с аренды', en: 'Rental tax' }, oneLiner: { ru: '5% withholding + House&Land 12.5%, что декларировать.', en: '5% WHT + 12.5% House&Land, what to declare.' }, href: '/legal' },
    { slug: 'contract-analysis', label: { ru: 'Анализ контракта AI', en: 'AI contract review' }, oneLiner: { ru: 'Проверка sale/lease/PMS-договора за 24 часа.', en: 'Sale, lease and PMS contract review in 24 hours.' }, href: '/legal/contract-analysis' },
    { slug: 'due-diligence', label: { ru: 'Due Diligence', en: 'Due diligence' }, oneLiner: { ru: 'Title deed, encumbrances, land use, EIA.', en: 'Title deed, encumbrances, land use, EIA.' }, href: '/property/due-diligence' },
    { slug: 'thai-company', label: { ru: 'Тайская компания', en: 'Thai company setup' }, oneLiner: { ru: 'Регистрация LLC для владения землёй, structure 51/49.', en: 'LLC setup for land ownership, 51/49 structure.' }, href: '/legal/company' },
    { slug: 'visa-quiz', label: { ru: 'Подбор визы', en: 'Visa picker' }, oneLiner: { ru: 'DTV, LTR, Elite, Retirement — что подходит вам.', en: 'DTV, LTR, Elite, Retirement — pick yours.' }, href: '/visa/quiz' },
  ],
  faq: [
    { q: { ru: 'Когда я становлюсь tax resident Таиланда?', en: 'When do I become a Thai tax resident?' }, a: { ru: 'При пребывании 180+ дней в календарном году. Tax resident декларирует worldwide income, ввезённый в Таиланд в том же году.', en: 'After 180+ days in a calendar year. Residents declare worldwide income remitted to Thailand in the same year.' } },
    { q: { ru: 'Какие налоги платит владелец сдающейся виллы?', en: 'What taxes does a renting villa owner pay?' }, a: { ru: 'Withholding tax 5% (нерезидент) или PIT по прогрессии (резидент). House & Land tax 12.5% от annual rent — обычно платит арендатор по договору.', en: 'WHT 5% (non-resident) or progressive PIT (resident). House & Land 12.5% on annual rent — typically paid by tenant per contract.' } },
    { q: { ru: 'Что проверяет Due Diligence?', en: 'What does due diligence cover?' }, a: { ru: 'Чанот (title deed), обременения, land use zone, environmental compliance, корпоративная структура продавца, история переходов прав.', en: 'Title deed (chanote), encumbrances, land-use zone, environmental compliance, seller corporate structure, ownership history.' } },
    { q: { ru: 'Можно ли владеть землёй через тайскую компанию?', en: 'Can foreigners hold land via a Thai company?' }, a: { ru: 'Да: 51% тайских акционеров, 49% иностранных. Нужны реальные тайские партнёры, не nominee — иначе риск признания структуры nominee и конфискации.', en: 'Yes: 51% Thai shareholders, 49% foreign. Real Thai partners required, not nominees — otherwise the structure may be voided and the asset seized.' } },
    { q: { ru: 'Сколько стоит контракт-чек?', en: 'How much does a contract review cost?' }, a: { ru: 'AI-анализ — ฿2 500 за документ. Юрист с заключением — ฿8 000–15 000. Сложные M&A или joint venture — по факту времени.', en: 'AI review — ฿2,500/doc. Lawyer opinion — ฿8,000–15,000. Complex M&A or JV — billed by time.' } },
    { q: { ru: 'Как работает PoA для удалённой сделки?', en: 'How does a PoA work for remote deals?' }, a: { ru: 'Доверенность нотариально заверяется в стране резидентства, апостилируется, переводится на тайский, регистрируется в Land Office. Срок — 2–3 недели.', en: 'PoA notarised in your home country, apostilled, translated to Thai, filed at the Land Office. Timeline — 2–3 weeks.' } },
  ],
  primaryCta: {
    label: { ru: 'Получить консультацию', en: 'Get a consultation' },
    href: '/tax',
    subtitle: { ru: 'Первая 15-минутная — бесплатно.', en: 'First 15 minutes — free.' },
  },
  secondaryCta: {
    label: { ru: 'Подобрать визу', en: 'Pick a visa' },
    href: '/visa/quiz',
  },
  relatedPersonas: ['P6', 'P7', 'P8', 'P9', 'P10', 'P20', 'P23'],
  seo: {
    metaTitle: { ru: 'Налоги и право для иностранцев на Пхукете — myUNO', en: 'Tax & legal for foreigners on Phuket — myUNO' },
    metaDescription: { ru: 'Tax residency, налог с аренды, контракты, due diligence, тайская компания. Цены в THB, юрист по-русски.', en: 'Tax residency, rental tax, contracts, due diligence, Thai company. THB pricing, English-speaking lawyer.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/compliance',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/compliance?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/compliance?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: H — Emergency
// ──────────────────────────────────────────────────────────────────────

const H_EMERGENCY: ClusterLanding = {
  clusterCode: 'H',
  slug: 'emergency',
  status: 'live',
  h1: {
    ru: 'Экстренная помощь на Пхукете',
    en: 'Emergency support on Phuket',
  },
  subtitle: {
    ru: 'Один номер, один чат, чек-листы по ситуациям: ДТП, госпитализация, потеря документов, юридический инцидент. Помогаем по-русски и по-английски 24/7.',
    en: 'One number, one chat, checklists for accidents, hospital admission, lost documents and legal incidents. Russian and English support 24/7.',
  },
  jobs: [
    { ru: 'Вызвать скорую и попасть в правильную клинику.', en: 'Call an ambulance and reach the right hospital.' },
    { ru: 'Восстановить паспорт или визу.', en: 'Recover a passport or visa.' },
    { ru: 'Оформить полицейский протокол после ДТП или кражи.', en: 'File a police report after an accident or theft.' },
    { ru: 'Связаться со страховой и получить cashless approval.', en: 'Reach the insurer and get cashless approval.' },
    { ru: 'Найти срочного юриста для задержания или штрафа.', en: 'Find an urgent lawyer for detention or a fine.' },
    { ru: 'Получить помощь с эвакуацией питомца или ребёнка.', en: 'Arrange evacuation help for a pet or child.' },
  ],
  services: [
    { slug: 'sos-button', label: { ru: 'SOS-чат myUNO', en: 'myUNO SOS chat' }, oneLiner: { ru: 'Ответ дежурного за 10 минут, 24/7.', en: 'Duty agent reply in 10 minutes, 24/7.' }, href: '/concierge?topic=emergency' },
    { slug: 'hospitals', label: { ru: 'Карта клиник', en: 'Hospital map' }, oneLiner: { ru: 'Bangkok Hospital, BIH, Mission, Vachira — с прямыми телефонами.', en: 'Bangkok Hospital, BIH, Mission, Vachira — direct phone numbers.' }, href: '/services/health/hospitals' },
    { slug: 'police-help', label: { ru: 'Помощь с полицией', en: 'Police support' }, oneLiner: { ru: 'Туристическая полиция 1155, перевод и сопровождение.', en: 'Tourist police 1155, translation and escort.' }, href: '/concierge?topic=police' },
    { slug: 'document-recovery', label: { ru: 'Восстановление документов', en: 'Document recovery' }, oneLiner: { ru: 'Паспорт, виза, права — пошаговый чек-лист.', en: 'Passport, visa, licence — step-by-step checklist.' }, href: '/legal/lost-documents' },
    { slug: 'insurance-help', label: { ru: 'Связь со страховой', en: 'Insurance liaison' }, oneLiner: { ru: 'Гарантийное письмо в клинику, работа с ассистансом.', en: 'Hospital guarantee letter, assistance coordination.' }, href: '/concierge?topic=insurance' },
    { slug: 'urgent-lawyer', label: { ru: 'Срочный юрист', en: 'On-call lawyer' }, oneLiner: { ru: 'Задержание, штраф, ДТП — выезд в течение 2 часов.', en: 'Detention, fines, accidents — on-site within 2 hours.' }, href: '/legal' },
  ],
  faq: [
    { q: { ru: 'Какие номера экстренных служб?', en: 'What are the emergency numbers?' }, a: { ru: 'Скорая 1669, полиция 191, туристическая полиция 1155 (английский), пожарная 199. SOS-чат myUNO дублирует все вызовы и помогает с переводом.', en: 'Ambulance 1669, police 191, tourist police 1155 (English), fire 199. The myUNO SOS chat backs up every call and assists with translation.' } },
    { q: { ru: 'Куда везти при серьёзной травме?', en: 'Where to go with a serious injury?' }, a: { ru: 'Bangkok Hospital Phuket (Phuket Town) и BIH — best equipped для иностранцев. Mission Hospital — бюджетнее. Vachira — государственный, для критических случаев ближе всех.', en: 'Bangkok Hospital Phuket and BIH — best equipped for foreigners. Mission Hospital — more budget. Vachira — public, often the closest for critical cases.' } },
    { q: { ru: 'Что делать при потере паспорта?', en: 'What if I lose my passport?' }, a: { ru: '1) Полицейский протокол в туристической полиции (1155). 2) Заявление в консульство. 3) При выезде — Certificate of Identity или emergency travel document. Срок — 3–10 дней.', en: '1) Tourist police report (1155). 2) Consular application. 3) For departure — Certificate of Identity or emergency travel document. Timeline — 3–10 days.' } },
    { q: { ru: 'Покрывает ли страховка лечение в частной клинике?', en: 'Does insurance cover private hospitals?' }, a: { ru: 'Большинство международных полисов — да, через cashless approval (гарантийное письмо). Российские полисы часто требуют оплату на месте с последующим возмещением. Чек-листы и шаблоны — в SOS-чате.', en: 'Most international policies — yes, via cashless approval (guarantee letter). Russian policies often require pay-and-claim. Checklists and templates in the SOS chat.' } },
    { q: { ru: 'Что делать после ДТП на байке?', en: 'What to do after a scooter accident?' }, a: { ru: 'Не двигать байк до приезда полиции. Вызвать 191 или 1155. Сделать фото места и документов. Без прав категории A — штраф 500–2 000 THB и страховка может отказать.', en: 'Do not move the scooter until police arrive. Call 191 or 1155. Photograph the scene and documents. Without a cat. A licence — a 500–2,000 THB fine, and insurance may decline.' } },
    { q: { ru: 'Куда обращаться, если задержали в полиции?', en: 'Where to turn if detained by police?' }, a: { ru: 'Право на звонок и переводчика. Сразу пишите в myUNO SOS — мы найдём дежурного юриста и свяжемся с консульством. Не подписывайте документы на тайском без перевода.', en: 'You have the right to a call and an interpreter. Message myUNO SOS immediately — we will find an on-call lawyer and contact the consulate. Never sign documents in Thai without translation.' } },
  ],
  primaryCta: {
    label: { ru: 'Открыть SOS-чат', en: 'Open SOS chat' },
    href: '/concierge?topic=emergency',
    subtitle: { ru: 'Дежурный отвечает за 10 минут.', en: 'Duty agent replies in 10 minutes.' },
  },
  secondaryCta: {
    label: { ru: 'Карта клиник', en: 'Hospital map' },
    href: '/services/health/hospitals',
  },
  relatedPersonas: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P13', 'P14', 'P19', 'P20', 'P25'],
  seo: {
    metaTitle: { ru: 'Экстренная помощь на Пхукете 24/7 — myUNO', en: 'Emergency support on Phuket 24/7 — myUNO' },
    metaDescription: { ru: 'Скорая, полиция, потеря документов, ДТП, страховая. Чек-листы по-русски и SOS-чат с ответом за 10 минут.', en: 'Ambulance, police, lost documents, accidents, insurance. Checklists and SOS chat with 10-minute response.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/emergency',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/emergency?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/emergency?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: B — Extension & Transition
// ──────────────────────────────────────────────────────────────────────

const B_EXTENSION: ClusterLanding = {
  clusterCode: 'B',
  slug: 'extension',
  status: 'live',
  h1: {
    ru: 'Продление визы и переход к долгому пребыванию',
    en: 'Extending your stay and going long-term',
  },
  subtitle: {
    ru: 'Visa run, продление в иммиграции, переход на DTV/Education/Retirement и long-stay аренда — без штрафов overstay и нервов в последний день.',
    en: 'Visa run, in-country extension, switching to DTV/Education/Retirement and long-stay rentals — no overstay fines, no last-day panic.',
  },
  jobs: [
    { ru: 'Продлить туристическую визу на 30 дней через иммиграцию.', en: 'Extend a tourist visa by 30 days at immigration.' },
    { ru: 'Сделать visa run в Малайзию или Камбоджу.', en: 'Run a border visa run to Malaysia or Cambodia.' },
    { ru: 'Перейти с туристической на DTV или Education визу.', en: 'Switch from tourist to DTV or Education visa.' },
    { ru: 'Подобрать long-stay condo от 1 месяца с фиксированной ценой.', en: 'Pick a long-stay condo from 1 month with fixed pricing.' },
    { ru: 'Не получить штраф за overstay (500 THB/день, до 20 000).', en: 'Avoid overstay fines (500 THB/day, up to 20,000).' },
    { ru: 'Сделать TM30 / TM47 правильно с первой попытки.', en: 'File TM30 / TM47 correctly the first time.' },
  ],
  services: [
    { slug: 'visa-extension', label: { ru: 'Продление визы', en: 'Visa extension' }, oneLiner: { ru: '30 дней через иммиграцию Пхукета, ฿1 900.', en: '30-day extension at Phuket immigration, ฿1,900.' }, href: '/legal/visa-extension' },
    { slug: 'visa-run', label: { ru: 'Visa Run сервис', en: 'Visa Run service' }, oneLiner: { ru: 'Малайзия / Камбоджа за 1 день, от ฿4 500.', en: 'Malaysia / Cambodia in 1 day, from ฿4,500.' }, href: '/legal/visa-run' },
    { slug: 'visa-transition', label: { ru: 'Переход на DTV/Education', en: 'Switch to DTV / Education' }, oneLiner: { ru: 'Подбор и подача документов под ваш профиль.', en: 'Picking and filing the right visa for your profile.' }, href: '/visa/quiz' },
    { slug: 'long-stay-rental', label: { ru: 'Long-stay аренда', en: 'Long-stay rentals' }, oneLiner: { ru: 'Condo от 1 месяца, фикс цена, без депозита под застройщика.', en: 'Condos from 1 month, fixed price, no developer deposit.' }, href: '/property?staytype=long' },
    { slug: 'tm30-tm47', label: { ru: 'TM30 / TM47 сопровождение', en: 'TM30 / TM47 filing' }, oneLiner: { ru: 'Регистрация по адресу и 90-day report.', en: 'Address registration and 90-day report.' }, href: '/legal/tm30' },
    { slug: 'overstay-help', label: { ru: 'Помощь при overstay', en: 'Overstay support' }, oneLiner: { ru: 'Сопровождение в иммиграцию, минимизация штрафа и blacklist.', en: 'Immigration escort, fine and blacklist minimisation.' }, href: '/concierge?topic=overstay' },
  ],
  faq: [
    { q: { ru: 'Как продлить туристическую визу?', en: 'How do I extend a tourist visa?' }, a: { ru: 'Иммиграция Пхукета (Phuket Immigration Office, Soi Saen Sabai) даёт +30 дней. Госпошлина ฿1 900, нужны: паспорт, фото 4×6, копия штампа въезда, TM30 от арендодателя.', en: 'Phuket Immigration Office (Soi Saen Sabai) grants +30 days. Fee ฿1,900. Required: passport, 4×6 photo, entry-stamp copy, TM30 from your landlord.' } },
    { q: { ru: 'Что выгоднее — продление или visa run?', en: 'Extension or visa run — what is cheaper?' }, a: { ru: 'Продление: ฿1 900 + полдня. Visa run: ฿4 500–6 500 + день, но даёт новый штамп на 60 дней. Если нужно >30 дней — visa run выгоднее по времени.', en: 'Extension: ฿1,900 + half a day. Visa run: ฿4,500–6,500 + a full day but resets the stamp for 60 days. For >30 days the visa run is faster overall.' } },
    { q: { ru: 'Сколько штраф за overstay?', en: 'How much is the overstay fine?' }, a: { ru: '500 THB за день, максимум ฿20 000. Свыше 90 дней — задержание и blacklist 1–10 лет. До явки в полицию overstay >90 дней — фактически невыездной.', en: '500 THB per day, capped at ฿20,000. Over 90 days — detention plus 1–10 years blacklist. Until you turn yourself in, overstay >90 days effectively traps you.' } },
    { q: { ru: 'Можно ли с туристической визы перейти на DTV в Таиланде?', en: 'Can I switch to DTV from inside Thailand?' }, a: { ru: 'Нет, DTV оформляется только в консульстве за пределами Таиланда (популярно: KL, Phnom Penh, Vientiane). Срок выдачи 5–15 рабочих дней.', en: 'No, DTV is only issued at consulates outside Thailand (popular: KL, Phnom Penh, Vientiane). Processing 5–15 business days.' } },
    { q: { ru: 'Какой минимальный срок аренды для long-stay?', en: 'Minimum lease term for long-stay?' }, a: { ru: 'От 1 месяца цена обычно −40% к туристической суточной. От 6 месяцев — −60%. Депозит 1–2 месяца, оплата помесячно или поквартально.', en: 'From 1 month rates drop ~40% vs nightly. From 6 months — ~60% off. Deposit 1–2 months, paid monthly or quarterly.' } },
    { q: { ru: 'Что такое TM30 и кто её подаёт?', en: 'What is TM30 and who files it?' }, a: { ru: 'Регистрация иностранца по адресу. Подаёт собственник в течение 24 часов после заселения. Без TM30 не примут продление визы и 90-day report.', en: 'Foreigner address registration filed by the landlord within 24 hours of check-in. Without TM30 immigration refuses extensions and the 90-day report.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать визу', en: 'Pick a visa' },
    href: '/visa/quiz',
    subtitle: { ru: '4 вопроса, бесплатно.', en: '4 questions, free.' },
  },
  secondaryCta: {
    label: { ru: 'Заказать visa run', en: 'Book a visa run' },
    href: '/legal/visa-run',
  },
  relatedPersonas: ['P3', 'P4', 'P5', 'P6', 'P7', 'P25'],
  seo: {
    metaTitle: { ru: 'Продление визы и long-stay на Пхукете — myUNO', en: 'Visa extension & long-stay on Phuket — myUNO' },
    metaDescription: { ru: 'Продление туристической визы, visa run, переход на DTV и long-stay аренда. Без штрафов overstay и без посредников.', en: 'Tourist visa extension, visa run, DTV transition and long-stay rentals. No overstay fines, no shady middlemen.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/extension',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/extension?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/extension?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: C — Settlement
// ──────────────────────────────────────────────────────────────────────

const C_SETTLEMENT: ClusterLanding = {
  clusterCode: 'C',
  slug: 'settlement',
  status: 'live',
  h1: {
    ru: 'Обустройство жизни на Пхукете',
    en: 'Settling in on Phuket',
  },
  subtitle: {
    ru: 'Банк, права, школа, мебель, машина, интернет, страховка — собрали логистику переезда в один поток с понятными сроками и ценами в THB.',
    en: 'Bank, licence, school, furniture, car, internet, insurance — moving logistics in one flow with clear timelines and THB prices.',
  },
  jobs: [
    { ru: 'Открыть тайский банковский счёт без агентства за 100 000 ฿.', en: 'Open a Thai bank account without paying an agency 100,000 ฿.' },
    { ru: 'Получить тайские права (car / motorbike).', en: 'Get a Thai car / motorbike licence.' },
    { ru: 'Записать ребёнка в международную школу.', en: 'Enroll a child in an international school.' },
    { ru: 'Купить или арендовать машину/байк официально.', en: 'Buy or rent a car / scooter legally.' },
    { ru: 'Подключить fiber-интернет 500 Mbps в condo или виллу.', en: 'Set up 500 Mbps fibre in a condo or villa.' },
    { ru: 'Оформить международную медицинскую страховку.', en: 'Take out international health insurance.' },
  ],
  services: [
    { slug: 'bank-account', label: { ru: 'Открытие банковского счёта', en: 'Bank account opening' }, oneLiner: { ru: 'Bangkok Bank, Kasikorn, SCB — сопровождение от ฿15 000.', en: 'Bangkok Bank, Kasikorn, SCB — assistance from ฿15,000.' }, href: '/services/finance/bank-account' },
    { slug: 'thai-license', label: { ru: 'Тайские права', en: 'Thai driving licence' }, oneLiner: { ru: 'Сдача в DLT, перевод документов, медсправка.', en: 'DLT exam, document translation, medical certificate.' }, href: '/legal/driving-license' },
    { slug: 'school-finder-c', label: { ru: 'School Finder', en: 'School Finder' }, oneLiner: { ru: '15 школ, фильтр по программе и району.', en: '15 schools filtered by curriculum and area.' }, href: '/school-finder' },
    { slug: 'car-rent-buy', label: { ru: 'Аренда и покупка авто', en: 'Car rent or buy' }, oneLiner: { ru: 'От ฿15 000/мес аренда, проверка VIN при покупке.', en: 'From ฿15,000/mo rental, VIN check on purchase.' }, href: '/services/transport' },
    { slug: 'home-internet', label: { ru: 'Подключение интернета', en: 'Home internet' }, oneLiner: { ru: 'AIS / 3BB / True 500 Mbps fiber, ฿700–1 200/мес.', en: 'AIS / 3BB / True 500 Mbps fibre, ฿700–1,200/mo.' }, href: '/services/utilities/internet' },
    { slug: 'health-insurance', label: { ru: 'Медицинская страховка', en: 'Health insurance' }, oneLiner: { ru: 'Cigna, April, Pacific Cross — расчёт под бюджет.', en: 'Cigna, April, Pacific Cross — quoted to budget.' }, href: '/services/insurance' },
  ],
  faq: [
    { q: { ru: 'Можно ли открыть тайский счёт на туристической визе?', en: 'Can I open a Thai account on a tourist visa?' }, a: { ru: 'Да, в Bangkok Bank и Kasikorn — через сопровождение и условия минимального депозита от ฿20 000. Без сопровождения чаще всего отказывают.', en: 'Yes, at Bangkok Bank and Kasikorn — with assistance and a min deposit of ฿20,000. Walking in without help is usually rejected.' } },
    { q: { ru: 'Как получить тайские права?', en: 'How do I get a Thai driving licence?' }, a: { ru: '1) Перевод национальных прав, 2) медсправка (฿200), 3) теория и практика в DLT (1 день), 4) права на 2 года (потом — на 5). Без них штраф ฿500–1 000 + страховка не работает.', en: '1) Translate your home licence, 2) medical certificate (฿200), 3) theory + practice at DLT (1 day), 4) 2-year licence (then 5). Without it: ฿500–1,000 fine + invalid insurance.' } },
    { q: { ru: 'Когда подавать в школу?', en: 'When to apply to school?' }, a: { ru: 'Учебный год август–июнь. Топ-школы (UWC, BISP) — лист ожидания 6–12 месяцев. Средний сегмент (KIS, Berda Claude) — 1–3 месяца. HeadStart и BCIS принимают round-the-year.', en: 'School year Aug–Jun. Top schools (UWC, BISP) — 6–12-month wait list. Mid-tier (KIS, Berda Claude) — 1–3 months. HeadStart and BCIS take year-round.' } },
    { q: { ru: 'Покупать машину или арендовать на год?', en: 'Buy a car or lease for a year?' }, a: { ru: 'Аренда выгоднее до 18 месяцев: нет налога 7%, нет потери на перепродаже, страховка включена. Покупка имеет смысл при 2+ года и наличии тайской компании или прав.', en: 'Renting is cheaper up to ~18 months: no 7% tax, no resale loss, insurance bundled. Buying makes sense for 2+ years if you have a Thai company or licence.' } },
    { q: { ru: 'Сколько стоит интернет в condo?', en: 'How much is condo internet?' }, a: { ru: 'AIS / 3BB / True: ฿590 (300 Mbps), ฿790 (500 Mbps), ฿990 (1 Gbps). Контракт обычно 12 месяцев. В большинстве condo подключение бесплатное.', en: 'AIS / 3BB / True: ฿590 (300 Mbps), ฿790 (500 Mbps), ฿990 (1 Gbps). Usually a 12-month contract. Most condos provide free installation.' } },
    { q: { ru: 'Какая страховка покрывает Bangkok Hospital?', en: 'Which insurance covers Bangkok Hospital?' }, a: { ru: 'Cigna Global, April International, Pacific Cross Thailand — все работают cashless. Премия от $1 200/год за outpatient + inpatient + evacuation.', en: 'Cigna Global, April International, Pacific Cross Thailand — all cashless. Premium from $1,200/year for outpatient + inpatient + evacuation.' } },
  ],
  primaryCta: {
    label: { ru: 'Заказать пакет переезда', en: 'Order the relocation pack' },
    href: '/relocate',
    subtitle: { ru: 'Банк + права + школа + страховка под ключ.', en: 'Bank + licence + school + insurance, end to end.' },
  },
  secondaryCta: {
    label: { ru: 'Подобрать школу', en: 'Find a school' },
    href: '/school-finder',
  },
  relatedPersonas: ['P5', 'P6', 'P7', 'P10', 'P13', 'P20'],
  seo: {
    metaTitle: { ru: 'Переезд на Пхукет: банк, школа, права, авто — myUNO', en: 'Relocating to Phuket: bank, school, licence, car — myUNO' },
    metaDescription: { ru: 'Логистика переезда: банковский счёт, тайские права, школа, мебель, страховка и интернет. Цены в THB, без агентских.', en: 'Relocation logistics: bank account, driving licence, schools, furniture, insurance and internet. THB pricing, no agency markup.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/settlement',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/settlement?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/settlement?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: E — Transaction (buying & selling property)
// ──────────────────────────────────────────────────────────────────────

const E_TRANSACTION: ClusterLanding = {
  clusterCode: 'E',
  slug: 'transaction',
  status: 'live',
  h1: {
    ru: 'Сделка с недвижимостью на Пхукете',
    en: 'Property transactions on Phuket',
  },
  subtitle: {
    ru: 'От задатка до Land Office: due diligence, эскроу, перевод средств, налоги и регистрация. Сопровождение юристом по-русски на каждом шаге.',
    en: 'From deposit to Land Office: due diligence, escrow, FX transfer, taxes and registration. Russian-speaking lawyer at every step.',
  },
  jobs: [
    { ru: 'Подписать reservation agreement и внести задаток без рисков.', en: 'Sign a reservation agreement and pay the deposit safely.' },
    { ru: 'Провести юридический due diligence объекта.', en: 'Run legal due diligence on the property.' },
    { ru: 'Перевести средства из РФ/ЕС с FET для регистрации freehold.', en: 'Wire funds from Russia/EU with FET for freehold registration.' },
    { ru: 'Подписать SPA и зарегистрировать сделку в Land Office.', en: 'Sign the SPA and register at the Land Office.' },
    { ru: 'Поделить налоги transfer/SBT/WHT с продавцом 50/50.', en: 'Split transfer / SBT / WHT taxes 50/50 with the seller.' },
    { ru: 'Продать актив через 3–5 лет с минимальным WHT.', en: 'Resell in 3–5 years with minimal withholding tax.' },
  ],
  services: [
    { slug: 'reservation', label: { ru: 'Reservation agreement', en: 'Reservation agreement' }, oneLiner: { ru: 'Шаблон договора и проверка пунктов о возврате.', en: 'Contract template and refund-clause review.' }, href: '/property/reservation' },
    { slug: 'due-diligence-e', label: { ru: 'Due Diligence', en: 'Due diligence' }, oneLiner: { ru: 'Чанот, обременения, EIA, корпоративная структура продавца.', en: 'Chanote, encumbrances, EIA, seller corporate structure.' }, href: '/property/due-diligence' },
    { slug: 'fet-transfer', label: { ru: 'Перевод средств с FET', en: 'FX transfer with FET' }, oneLiner: { ru: 'Foreign Exchange Transaction для регистрации freehold.', en: 'Foreign Exchange Transaction for freehold registration.' }, href: '/services/finance/fet' },
    { slug: 'spa-signing', label: { ru: 'SPA и Land Office', en: 'SPA & Land Office' }, oneLiner: { ru: 'Подписание, регистрация, получение чанота за 1 день.', en: 'Signing, registration, chanote handover in one day.' }, href: '/legal/spa' },
    { slug: 'tax-split', label: { ru: 'Расчёт налогов сделки', en: 'Transaction tax calculator' }, oneLiner: { ru: 'Transfer 2% + SBT 3.3% + WHT — кто платит что.', en: 'Transfer 2% + SBT 3.3% + WHT — who pays what.' }, href: '/property/tax-calculator' },
    { slug: 'resale', label: { ru: 'Продажа актива', en: 'Selling your asset' }, oneLiner: { ru: 'Размещение в каталог resale, экспозиция, документы.', en: 'Listing in the resale catalogue, exposure, paperwork.' }, href: '/property/resale' },
  ],
  faq: [
    { q: { ru: 'Какой задаток для бронирования?', en: 'What is the typical reservation deposit?' }, a: { ru: 'Резервационный депозит ฿100 000–200 000 на 14–30 дней. В договоре должны быть условия возврата при отказе по due diligence — иначе деньги сгорят.', en: 'Reservation deposit ฿100,000–200,000 for 14–30 days. The contract must include due-diligence refund terms — otherwise the money is lost.' } },
    { q: { ru: 'Сколько занимает сделка от задатка до ключей?', en: 'How long from deposit to keys?' }, a: { ru: 'Готовое жильё (resale): 30–45 дней. Off-plan на стадии строительства: по графику застройщика, обычно 30/70 платежи. Регистрация в Land Office — 1 день.', en: 'Ready property (resale): 30–45 days. Off-plan: per developer schedule, typically 30/70 payments. Land Office registration — 1 day.' } },
    { q: { ru: 'Зачем нужен FET (Foreign Exchange Transaction)?', en: 'Why do I need an FET?' }, a: { ru: 'Для регистрации freehold на иностранца Land Office требует подтверждение, что деньги пришли из-за рубежа в иностранной валюте. FET выдаёт тайский банк при поступлении ≥$50 000.', en: 'For foreign freehold registration the Land Office requires proof funds came from abroad in foreign currency. The Thai bank issues an FET on incoming wires ≥$50,000.' } },
    { q: { ru: 'Какие налоги делятся между сторонами?', en: 'Which taxes are split between parties?' }, a: { ru: 'Стандарт: Transfer fee 2% — 50/50. SBT 3.3% или Stamp duty 0.5% — продавец. WHT — продавец. На рынке часто продавец сваливает всё на покупателя — фиксируйте в SPA.', en: 'Standard: 2% transfer fee — 50/50. SBT 3.3% or 0.5% stamp duty — seller. WHT — seller. Sellers often push everything onto the buyer — lock it in the SPA.' } },
    { q: { ru: 'Что делать, если объект не сдан вовремя?', en: 'What if the project is delayed?' }, a: { ru: 'В договоре off-plan должны быть штрафы за просрочку сдачи (типично 0.01% в день от уплаченной суммы). Право на расторжение и возврат — при просрочке ≥6 месяцев.', en: 'Off-plan contracts must include delay penalties (typically 0.01%/day on amounts paid). Right to cancel and refund — usually after ≥6 months delay.' } },
    { q: { ru: 'Можно ли провести сделку удалённо?', en: 'Can I close remotely?' }, a: { ru: 'Да: PoA нотариально + апостиль + перевод + регистрация в Land Office. Срок подготовки 2–3 недели. Сама регистрация — представителем с PoA в Land Office.', en: 'Yes: notarised PoA + apostille + Thai translation + Land Office registration. Prep takes 2–3 weeks. Registration itself — by a PoA holder at the Land Office.' } },
  ],
  primaryCta: {
    label: { ru: 'Заказать Due Diligence', en: 'Order due diligence' },
    href: '/property/due-diligence',
    subtitle: { ru: 'Отчёт за 7 рабочих дней.', en: 'Report in 7 working days.' },
  },
  secondaryCta: {
    label: { ru: 'Калькулятор налогов сделки', en: 'Transaction tax calculator' },
    href: '/property/tax-calculator',
  },
  relatedPersonas: ['P2', 'P8', 'P9', 'P11', 'P12'],
  seo: {
    metaTitle: { ru: 'Сделка с недвижимостью на Пхукете: due diligence — myUNO', en: 'Phuket property transactions: due diligence to closing — myUNO' },
    metaDescription: { ru: 'Reservation, due diligence, FET, SPA и Land Office, налоги. Сопровождение юристом по-русски от задатка до ключей.', en: 'Reservation, due diligence, FET, SPA, Land Office and taxes. Russian-speaking lawyer from deposit to keys.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/transaction',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/transaction?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/transaction?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  LIVE: I — Lifestyle & Experiences
// ──────────────────────────────────────────────────────────────────────

const I_LIFESTYLE: ClusterLanding = {
  clusterCode: 'I',
  slug: 'lifestyle',
  status: 'live',
  h1: {
    ru: 'Стиль жизни и впечатления на Пхукете',
    en: 'Lifestyle and experiences on Phuket',
  },
  subtitle: {
    ru: 'Wellness, рестораны, яхты, fight camps, события и комьюнити — собрали лучшее на острове, чтобы вы тратили время на впечатления, а не на поиск.',
    en: 'Wellness, dining, yachts, fight camps, events and community — the best of the island in one place so you spend time on the experience, not the search.',
  },
  jobs: [
    { ru: 'Забронировать ужин в топ-ресторане без переписки в Instagram.', en: 'Book a top restaurant without DMing them on Instagram.' },
    { ru: 'Арендовать яхту или катер на день / на закат.', en: 'Charter a yacht or speedboat for a day or sunset cruise.' },
    { ru: 'Подобрать spa, массаж, fitness club или Muay Thai зал.', en: 'Find a spa, massage, fitness club or Muay Thai gym.' },
    { ru: 'Узнать про события, фестивали и закрытые вечеринки.', en: 'Stay on top of events, festivals and private parties.' },
    { ru: 'Найти комьюнити по интересам — нетворк, спорт, искусство.', en: 'Find a community by interest — networking, sports, arts.' },
    { ru: 'Заказать опыт под повод: предложение, юбилей, корпоратив.', en: 'Curate an experience for a proposal, anniversary or corporate event.' },
  ],
  services: [
    { slug: 'restaurants', label: { ru: 'Рестораны и брони', en: 'Restaurants & reservations' }, oneLiner: { ru: 'PRU, Suay, Mia, Black Ginger — стол к нужному часу.', en: 'PRU, Suay, Mia, Black Ginger — table at the right time.' }, href: '/dining' },
    { slug: 'yacht-charter', label: { ru: 'Аренда яхт', en: 'Yacht charter' }, oneLiner: { ru: 'Катамараны, моторные яхты, sunset cruise — от ฿18 000.', en: 'Catamarans, motor yachts, sunset cruise — from ฿18,000.' }, href: '/yachts' },
    { slug: 'wellness', label: { ru: 'Wellness и spa', en: 'Wellness & spa' }, oneLiner: { ru: 'Six Senses, Anantara, COMO Shambhala — программы детокса.', en: 'Six Senses, Anantara, COMO Shambhala — detox programs.' }, href: '/wellness' },
    { slug: 'fight-camps', label: { ru: 'Muay Thai и fight camps', en: 'Muay Thai & fight camps' }, oneLiner: { ru: 'Tiger, Sinbi, Phuket Top Team — пробное занятие.', en: 'Tiger, Sinbi, Phuket Top Team — trial session.' }, href: '/fitness/muay-thai' },
    { slug: 'events', label: { ru: 'События и фестивали', en: 'Events & festivals' }, oneLiner: { ru: 'Афиша концертов, маркетов, гонок и закрытых вечеринок.', en: 'Concerts, markets, races and private parties listings.' }, href: '/events' },
    { slug: 'private-experiences', label: { ru: 'Приватные опыты', en: 'Private experiences' }, oneLiner: { ru: 'Шеф на дом, фотосессия, helicopter tour, квест.', en: 'Private chef, photoshoot, helicopter tour, custom quest.' }, href: '/experiences/private' },
  ],
  faq: [
    { q: { ru: 'Какие рестораны лучше бронировать заранее?', en: 'Which restaurants need advance booking?' }, a: { ru: 'PRU (Michelin) — за 2–4 недели. Suay, Mia, Black Ginger — за 3–7 дней. В high season (декабрь–февраль) — заранее всё.', en: 'PRU (Michelin) — 2–4 weeks ahead. Suay, Mia, Black Ginger — 3–7 days. In high season (Dec–Feb) book everything in advance.' } },
    { q: { ru: 'Сколько стоит аренда катамарана на день?', en: 'How much is a day catamaran charter?' }, a: { ru: 'Sunset cruise (3–4 часа): ฿18 000–35 000 за лодку. Целый день к Phi Phi/Racha: ฿45 000–90 000. Премиум катамараны Lagoon 50 — от ฿120 000.', en: 'Sunset cruise (3–4h): ฿18,000–35,000 per boat. Full-day Phi Phi/Racha: ฿45,000–90,000. Premium Lagoon 50: from ฿120,000.' } },
    { q: { ru: 'Где лучшие spa-программы детокса?', en: 'Where are the best detox spa programs?' }, a: { ru: 'COMO Shambhala (Phuket) — 3/5/7-дневные с диетологом. Six Senses Yao Noi — wellness retreats. Atmanjai (Patong) — топ по цене/качеству детокса.', en: 'COMO Shambhala — 3/5/7-day programs with nutritionist. Six Senses Yao Noi — wellness retreats. Atmanjai (Patong) — best detox price/quality.' } },
    { q: { ru: 'С чего начать тренировки Muay Thai?', en: 'How to start Muay Thai?' }, a: { ru: 'Пробное занятие ฿400–500 в Tiger или Sinbi. Недельный пакет ฿2 500–4 000. Месяц с проживанием в кэмпе — ฿15 000–35 000. Без опыта — детская/новички группа.', en: 'Trial class ฿400–500 at Tiger or Sinbi. Weekly pack ฿2,500–4,000. Month with on-site accommodation: ฿15,000–35,000. No experience — start in the beginners group.' } },
    { q: { ru: 'Где найти афишу events на острове?', en: 'Where to find the events agenda?' }, a: { ru: 'Главные источники — myUNO Events, Phuket News, Trip.com Local Experiences. Закрытые вечеринки и нетворк — в Telegram-группе myUNO Lifestyle (1 800+ участников).', en: 'Main sources — myUNO Events, Phuket News, Trip.com Local Experiences. Private parties and networking — myUNO Lifestyle Telegram group (1,800+ members).' } },
    { q: { ru: 'Можно ли заказать шефа на виллу?', en: 'Can I book a private chef at the villa?' }, a: { ru: 'Да: тайский chef ฿3 500/вечер на 6 человек, европейский — ฿6 000–12 000. Премиум (Michelin alumni) — от ฿25 000. Продукты обычно отдельно.', en: 'Yes: Thai chef ฿3,500/evening for 6, European ฿6,000–12,000. Premium (ex-Michelin) — from ฿25,000. Groceries usually billed separately.' } },
  ],
  primaryCta: {
    label: { ru: 'Открыть афишу опытов', en: 'Browse experiences' },
    href: '/experiences',
    subtitle: { ru: 'От ฿1 500 за человека.', en: 'From ฿1,500 per person.' },
  },
  secondaryCta: {
    label: { ru: 'Забронировать яхту', en: 'Book a yacht' },
    href: '/yachts',
  },
  relatedPersonas: ['P1', 'P3', 'P4', 'P5', 'P6', 'P7', 'P14', 'P15', 'P16', 'P17', 'P18', 'P19', 'P24'],
  seo: {
    metaTitle: { ru: 'Стиль жизни на Пхукете: рестораны, яхты, wellness — myUNO', en: 'Phuket lifestyle: dining, yachts, wellness — myUNO' },
    metaDescription: { ru: 'Wellness, ресторанные брони, аренда яхт, Muay Thai, события и приватные опыты. Лучшее на острове в одном месте.', en: 'Wellness, restaurant bookings, yacht charters, Muay Thai, events and private experiences. The best of the island in one place.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/lifestyle',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/lifestyle?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/lifestyle?lang=en' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────────────
//  Canonical list (A..J)
// ──────────────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────────────
//  LIVE: J — Exit & re-entry (Sprint 3)
// ──────────────────────────────────────────────────────────────────────

const J_EXIT: ClusterLanding = {
  clusterCode: 'J',
  slug: 'exit',
  status: 'live',
  h1: {
    ru: 'Выход из актива на Пхукете и репатриация капитала',
    en: 'Exiting your Phuket asset and repatriating capital',
  },
  subtitle: {
    ru: 'Продажа кондо/виллы, передача договоров, закрытие тайской компании, репатриация THB → EUR/USD без потерь.',
    en: 'Sell condo/villa, transfer contracts, close Thai company and repatriate THB → EUR/USD without losses.',
  },
  jobs: [
    { ru: 'Оценить рыночную цену актива (broker pricing).', en: 'Get broker pricing for the asset.' },
    { ru: 'Подготовить пакет к продаже: title deed, due diligence, налоги.', en: 'Prepare the sale pack: title deed, due diligence, taxes.' },
    { ru: 'Найти покупателя через нашу базу инвесторов.', en: 'Find a buyer via our investor base.' },
    { ru: 'Закрыть компанию (Co. Ltd.) или передать долю.', en: 'Close the Thai company or transfer shares.' },
    { ru: 'Перевести деньги в EUR/USD/AED через лицензированного брокера.', en: 'Wire funds to EUR/USD/AED via a licensed broker.' },
    { ru: 'Снять иммигрантский статус и закрыть TM30.', en: 'Cancel immigration status and close TM30.' },
  ],
  services: [
    { slug: 'asset-valuation', label: { ru: 'Оценка актива', en: 'Asset valuation' }, oneLiner: { ru: 'Comparative market analysis за 48 часов.', en: 'Comparative market analysis in 48 hours.' }, href: '/property/sell' },
    { slug: 'sale-listing', label: { ru: 'Resale-листинг', en: 'Resale listing' }, oneLiner: { ru: 'Каталог + рассылка по 1 200 инвесторам.', en: 'Catalog + outreach to 1,200 investors.' }, href: '/property/resale' },
    { slug: 'company-closure', label: { ru: 'Закрытие компании', en: 'Company closure' }, oneLiner: { ru: 'Юристы по тайскому корпоративному праву.', en: 'Thai corporate lawyers.' }, href: '/cluster/compliance' },
    { slug: 'repatriation', label: { ru: 'Репатриация капитала', en: 'Capital repatriation' }, oneLiner: { ru: 'THB → EUR/USD/AED через лицензированных брокеров.', en: 'THB → EUR/USD/AED via licensed brokers.' }, href: '/contact' },
    { slug: 'tax-clearance', label: { ru: 'Tax clearance', en: 'Tax clearance' }, oneLiner: { ru: 'Capital gains, Specific Business Tax, RD-сертификат.', en: 'Capital gains, Specific Business Tax, RD certificate.' }, href: '/cluster/compliance' },
  ],
  faq: [
    { q: { ru: 'Какие налоги при продаже кондо?', en: 'What taxes on selling a condo?' }, a: { ru: 'Withholding (1%), Specific Business Tax (3.3% при <5 лет), Transfer Fee (2%). Точная смета — после проверки title deed.', en: 'Withholding (1%), Specific Business Tax (3.3% if <5 years), Transfer Fee (2%). Exact quote after title deed check.' } },
    { q: { ru: 'Сколько занимает продажа?', en: 'How long does a sale take?' }, a: { ru: '3–9 месяцев в зависимости от сегмента. Premium кондо в Bang Tao продаются быстрее, чем villa в Layan.', en: '3–9 months depending on segment. Premium condos in Bang Tao move faster than villas in Layan.' } },
    { q: { ru: 'Можно ли вывести деньги в Россию?', en: 'Can I wire funds to Russia?' }, a: { ru: 'Прямой SWIFT в РФ ограничен. Используем транзит через ОАЭ/Казахстан или Wise/Revolut в долларах.', en: 'Direct SWIFT to Russia is restricted. We route via UAE/Kazakhstan or Wise/Revolut in USD.' } },
    { q: { ru: 'Нужно ли закрывать тайскую компанию после продажи?', en: 'Do I need to close my Thai company after the sale?' }, a: { ru: 'Если компания держала виллу — да, ликвидация занимает 6–9 месяцев. Без закрытия — ежегодные отчёты и налоги продолжают начисляться.', en: 'If the company held the villa — yes, liquidation takes 6–9 months. Without it, annual filings and taxes keep accruing.' } },
  ],
  primaryCta: { label: { ru: 'Оценить актив', en: 'Get asset valuation' }, href: '/property/sell' },
  secondaryCta: { label: { ru: 'Связаться с advisor', en: 'Talk to an advisor' }, href: '/contact' },
  relatedPersonas: ['P8', 'P9', 'P10', 'P20'],
  seo: {
    metaTitle: { ru: 'Выход из актива на Пхукете: продажа и репатриация', en: 'Exiting your Phuket asset: sale, taxes, repatriation — myUNO' },
    metaDescription: { ru: 'Продажа кондо или виллы на Пхукете под ключ: оценка, листинг, налоги, закрытие компании и репатриация THB → EUR/USD.', en: 'Turnkey condo or villa sale on Phuket: valuation, listing, taxes, company closure and THB → EUR/USD repatriation.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/exit',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/exit?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/exit?lang=en' },
    ],
  },
};

export const CLUSTER_LANDINGS: readonly ClusterLanding[] = [
  A_ARRIVAL,
  B_EXTENSION,
  C_SETTLEMENT,
  D_INVESTMENT,
  E_TRANSACTION,
  F_OPERATIONS,
  G_COMPLIANCE,
  H_EMERGENCY,
  I_LIFESTYLE,
  J_EXIT,
] as const;

export const LIVE_CLUSTER_SLUGS: readonly string[] = [
  'arrival',     // A
  'extension',   // B  — Sprint 2
  'settlement',  // C  — Sprint 2
  'investment',  // D
  'transaction', // E  — Sprint 3
  'operations',  // F
  'compliance',  // G  — Sprint 1
  'emergency',   // H  — Sprint 1
  'lifestyle',   // I  — Sprint 2
  'exit',        // J  — Sprint 3
] as const;
