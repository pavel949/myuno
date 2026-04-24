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
    ru: 'Продлить пребывание на Пхукете',
    en: 'Extending your stay on Phuket',
  },
  subtitle: {
    ru: 'Продление визы, visa run, переход на DTV или Education, оформление long-stay аренды — без ночей у иммиграции.',
    en: 'Visa extensions, visa runs, transition to DTV or Education, long-stay rentals — without nights at immigration.',
  },
  jobs: [
    { ru: 'Продлить туристическую визу на 30 дней.', en: 'Extend a tourist visa by 30 days.' },
    { ru: 'Сделать visa run в соседнюю страну.', en: 'Run a visa border bounce to a neighbour country.' },
    { ru: 'Перейти с туристической визы на DTV / Education / LTR.', en: 'Switch from tourist to DTV / Education / LTR.' },
    { ru: 'Открыть тайский счёт для долгого проживания.', en: 'Open a Thai bank account for long stays.' },
    { ru: 'Найти long-stay квартиру с скидкой за 3+ месяца.', en: 'Find a long-stay condo with a 3+ month discount.' },
    { ru: 'Получить тайские права для байка / авто.', en: 'Get a Thai driving licence for scooter or car.' },
  ],
  services: [
    { slug: 'visa-extension', label: { ru: 'Продление визы', en: 'Visa extension' }, oneLiner: { ru: '+30 дней в иммиграции Phuket за 1 900 THB.', en: '+30 days at Phuket immigration for 1,900 THB.' }, href: '/visa/extension' },
    { slug: 'visa-run', label: { ru: 'Visa run', en: 'Visa run' }, oneLiner: { ru: 'Малайзия / Камбоджа / Лаос — пакет под ключ.', en: 'Malaysia / Cambodia / Laos — turnkey trip.' }, href: '/visa/run' },
    { slug: 'visa-quiz', label: { ru: 'Подбор долгой визы', en: 'Long-stay visa picker' }, oneLiner: { ru: 'DTV, Education, LTR, Elite — 4 вопроса.', en: 'DTV, Education, LTR, Elite — 4 questions.' }, href: '/visa/quiz' },
    { slug: 'long-stay-condo', label: { ru: 'Long-stay condo', en: 'Long-stay condo' }, oneLiner: { ru: 'Скидка 20–35% за 3+ месяца, договор на тайском.', en: '20–35% discount for 3+ months, Thai contract.' }, href: '/property?staytype=long' },
    { slug: 'thai-bank', label: { ru: 'Тайский банк', en: 'Thai bank account' }, oneLiner: { ru: 'Bangkok Bank, Kasikorn — пакет документов и сопровождение.', en: 'Bangkok Bank, Kasikorn — documents and escort.' }, href: '/services/finance/bank-account' },
    { slug: 'thai-licence', label: { ru: 'Тайские права', en: 'Thai driving licence' }, oneLiner: { ru: 'Конвертация иноправ за 1 день в DLT.', en: 'Foreign-licence conversion in 1 day at DLT.' }, href: '/services/transport/licence' },
  ],
  faq: [
    { q: { ru: 'Сколько раз можно продлевать туристическую визу?', en: 'How many times can a tourist visa be extended?' }, a: { ru: 'Visa exempt (60 дней) → +30 дней в иммиграции = 90 дней. Дальше — visa run или переход на долгую визу. Подряд более 2 раз могут отказать.', en: 'Visa exempt (60 days) → +30 days at immigration = 90 days. Beyond that — visa run or transition to a long-term visa. Consecutive runs may be refused after the second.' } },
    { q: { ru: 'Сколько стоит visa run?', en: 'How much does a visa run cost?' }, a: { ru: 'Малайзия (Penang) — от 4 500 THB за 2 дня (автобус). Камбоджа (Phnom Penh) — от 8 000 THB (перелёт). Лаос (Vientiane) — от 12 000 THB (включая получение новой визы).', en: 'Malaysia (Penang) — from 4,500 THB for 2 days (bus). Cambodia (Phnom Penh) — from 8,000 THB (flight). Laos (Vientiane) — from 12,000 THB (incl. new visa).' } },
    { q: { ru: 'Можно ли открыть тайский банковский счёт без долгой визы?', en: 'Can I open a Thai bank account without a long-stay visa?' }, a: { ru: 'Без долгой визы — только с residence certificate (5 дней оформления, 500 THB) или через open-account-package в банке-партнёре. Bangkok Bank наиболее лояльный.', en: 'Without a long-stay visa — only with a residence certificate (5 days, 500 THB) or via a partner bank package. Bangkok Bank is the most permissive.' } },
    { q: { ru: 'Что выгоднее: продлевать туристическую или сразу DTV?', en: 'Better to extend tourist visa or go DTV?' }, a: { ru: 'При плане жить >6 месяцев — DTV дешевле и легче. Продление + visa run обходится в 25–40K THB за 6 месяцев. DTV — 10K THB на 5 лет (180 дней за раз).', en: 'For 6+ months — DTV is cheaper and simpler. Extension + visa run costs 25–40K THB per 6 months. DTV — 10K THB for 5 years (180 days per stay).' } },
    { q: { ru: 'Какая скидка на long-stay аренду?', en: 'What discount on long-stay rentals?' }, a: { ru: '3 месяца — 20%, 6 месяцев — 30%, 12 месяцев — 35–40% относительно nightly rate. В low season (май–октябрь) можно torговаться ещё на 10–15%.', en: '3 months — 20%, 6 months — 30%, 12 months — 35–40% off nightly rates. In low season (May–October) negotiate another 10–15% off.' } },
    { q: { ru: 'Нужны ли международные права?', en: 'Do I need an international driving permit?' }, a: { ru: 'Для проката байка — да (категория A). Для авто — категория B. Альтернатива — конвертация в тайские права за 1 день, действуют 2 года.', en: 'For scooter rental — yes (cat. A). For car — cat. B. Alternative — convert to a Thai licence in 1 day, valid 2 years.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать визу', en: 'Pick a visa' },
    href: '/visa/quiz',
    subtitle: { ru: '4 вопроса, бесплатно.', en: '4 questions, free.' },
  },
  secondaryCta: {
    label: { ru: 'Long-stay condo', en: 'Long-stay condo' },
    href: '/property?staytype=long',
  },
  relatedPersonas: ['P3', 'P4', 'P5', 'P6', 'P7', 'P25'],
  seo: {
    metaTitle: { ru: 'Продление визы и долгое пребывание на Пхукете — myUNO', en: 'Visa extension & long-stay on Phuket — myUNO' },
    metaDescription: { ru: 'Продление визы, visa run, переход на DTV/LTR, long-stay condo, тайский банк и права. Цены в THB, помощь по-русски.', en: 'Visa extension, visa run, DTV/LTR transition, long-stay condo, Thai bank and licence. THB pricing, English support.' },
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
    ru: 'Снять долгосрочное жильё, перевезти вещи, открыть банк, купить мебель, найти школу, врача и стоматолога — без 6 месяцев на адаптацию.',
    en: 'Long-stay rental, shipping, bank account, furniture, school, doctor and dentist — without 6 months of adaptation.',
  },
  jobs: [
    { ru: 'Снять виллу или condo на 6+ месяцев с правильным договором.', en: 'Sign a 6+ month villa or condo lease with the right contract.' },
    { ru: 'Привезти вещи из дома (контейнер / cargo).', en: 'Ship belongings from home (container / cargo).' },
    { ru: 'Купить мебель, технику, постель — где не переплатить.', en: 'Buy furniture, appliances and bedding without overpaying.' },
    { ru: 'Найти семейного врача и стоматолога.', en: 'Find a family doctor and dentist.' },
    { ru: 'Подключить интернет, мусор и коммунальные.', en: 'Set up internet, garbage and utilities.' },
    { ru: 'Подобрать школу или садик ребёнку.', en: 'Pick a school or kindergarten.' },
  ],
  services: [
    { slug: 'long-rental', label: { ru: 'Долгосрочная аренда', en: 'Long-term rental' }, oneLiner: { ru: 'Виллы и condo от 6 мес, проверенный договор.', en: 'Villas and condos from 6 months, verified contract.' }, href: '/property?staytype=long' },
    { slug: 'relocation', label: { ru: 'Перевозка вещей', en: 'Shipping & relocation' }, oneLiner: { ru: 'Air / sea cargo, customs, доставка до двери.', en: 'Air or sea cargo, customs, door-to-door.' }, href: '/relocate' },
    { slug: 'furniture', label: { ru: 'Мебель и техника', en: 'Furniture & appliances' }, oneLiner: { ru: 'IKEA, Index, SB, локальные мастерские — карта и цены.', en: 'IKEA, Index, SB, local workshops — map and prices.' }, href: '/services/home/furniture' },
    { slug: 'family-doctor', label: { ru: 'Семейный врач', en: 'Family doctor' }, oneLiner: { ru: 'GP по-русски / по-английски, годовой контракт.', en: 'Russian or English-speaking GP, annual plan.' }, href: '/services/health/family-doctor' },
    { slug: 'school-finder', label: { ru: 'Поиск школы', en: 'School Finder' }, oneLiner: { ru: '15 школ, фильтр по программе и бюджету.', en: '15 schools filtered by curriculum and budget.' }, href: '/school-finder' },
    { slug: 'utilities', label: { ru: 'Коммуналка и интернет', en: 'Utilities & internet' }, oneLiner: { ru: 'AIS / True / 3BB, мусор, вода — оформление за вас.', en: 'AIS / True / 3BB, garbage, water — set up for you.' }, href: '/services/home/utilities' },
  ],
  faq: [
    { q: { ru: 'Сколько стоит снять виллу на год?', en: 'How much for a yearly villa rental?' }, a: { ru: '2-bed villa с бассейном — от ฿55 000/мес (Раваи, Чалонг), ฿80 000–150 000 (Камала, Сурин), от ฿200 000 (Бангтао, Лагуна). Депозит 2–3 месяца.', en: '2-bed villa with pool — from ฿55,000/mo (Rawai, Chalong), ฿80,000–150,000 (Kamala, Surin), from ฿200,000 (Bang Tao, Laguna). Deposit 2–3 months.' } },
    { q: { ru: 'Что должно быть в договоре аренды?', en: 'What to include in a rental contract?' }, a: { ru: 'Срок, депозит, условия возврата, кто платит коммуналку, условия расторжения, inventory list с фото. Без inventory — депозит часто не возвращают.', en: 'Term, deposit, refund rules, who pays utilities, termination clause, inventory list with photos. Without inventory, deposits are often withheld.' } },
    { q: { ru: 'Сколько стоит перевезти контейнер из России / ЕС?', en: 'Cost of a container from Russia / EU?' }, a: { ru: '20-foot container Москва → Пхукет — $4 500–7 000 (60–80 дней по морю). Air cargo до 100 кг — от $800. Растаможка — отдельно, ~10–15% стоимости содержимого.', en: '20-foot container Moscow → Phuket — $4,500–7,000 (60–80 days by sea). Air cargo up to 100 kg — from $800. Customs separately, ~10–15% of content value.' } },
    { q: { ru: 'Где быстро купить мебель?', en: 'Where to buy furniture quickly?' }, a: { ru: 'IKEA Phuket (Central Floresta) — крупная мебель, доставка 3–7 дней. Index Living Mall — баланс цены и стиля. SB Furniture — недорого. Локальные мастерские в Чалонге — кастом за 2–3 недели.', en: 'IKEA Phuket (Central Floresta) — large items, 3–7 day delivery. Index Living Mall — balanced. SB Furniture — budget. Local workshops in Chalong — custom in 2–3 weeks.' } },
    { q: { ru: 'Сколько стоит интернет?', en: 'What does internet cost?' }, a: { ru: 'Fiber 200 Mbps — ฿590/мес (AIS, True), 500 Mbps — ฿890/мес. Подключение 2–5 дней, нужен адрес и паспорт. Mobile-роутер 100 GB — ฿700/мес как backup.', en: 'Fibre 200 Mbps — ฿590/mo (AIS, True), 500 Mbps — ฿890/mo. Setup in 2–5 days, address and passport required. Mobile router 100 GB — ฿700/mo as backup.' } },
    { q: { ru: 'Какой стоматолог по-русски?', en: 'Which dentist speaks Russian?' }, a: { ru: 'Phuket Dental Signature и Sea Smile — топ-уровень, есть переводчик. BIDH — для имплантов и сложной хирургии. Чек-ап и чистка — ฿1 500–3 000.', en: 'Phuket Dental Signature and Sea Smile — top tier with translation. BIDH — for implants and complex surgery. Check-up and cleaning — ฿1,500–3,000.' } },
  ],
  primaryCta: {
    label: { ru: 'Подобрать жильё', en: 'Find housing' },
    href: '/property?staytype=long',
    subtitle: { ru: 'Виллы и condo от 6 мес.', en: 'Villas and condos from 6 months.' },
  },
  secondaryCta: {
    label: { ru: 'Перевезти вещи', en: 'Ship your stuff' },
    href: '/relocate',
  },
  relatedPersonas: ['P5', 'P6', 'P7', 'P10', 'P13', 'P20'],
  seo: {
    metaTitle: { ru: 'Обустройство жизни на Пхукете: жильё, банк, школа — myUNO', en: 'Settling on Phuket: housing, bank, school — myUNO' },
    metaDescription: { ru: 'Долгосрочная аренда, перевозка вещей, мебель, врач, школа и интернет. Чек-листы и цены в THB для resident на Пхукете.', en: 'Long-term rental, shipping, furniture, doctor, school and internet. Checklists and THB prices for Phuket residents.' },
    ogImage: OG_DEFAULT,
    canonicalPath: '/cluster/settlement',
    hreflangAlternates: [
      { lang: 'ru', href: 'https://myuno.app/cluster/settlement?lang=ru' },
      { lang: 'en', href: 'https://myuno.app/cluster/settlement?lang=en' },
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
    ru: 'Стиль жизни на Пхукете: что делать каждый день',
    en: 'Lifestyle on Phuket: what to do every day',
  },
  subtitle: {
    ru: 'Wellness, рестораны, спорт, события, beach clubs и яхты — отобранные места и сценарии без зазывал.',
    en: 'Wellness, dining, sport, events, beach clubs and yachts — curated places and scenarios with no street touts.',
  },
  jobs: [
    { ru: 'Найти ресторан под повод и компанию.', en: 'Find a restaurant by occasion and company.' },
    { ru: 'Заняться спортом: тренажёрный зал, теннис, гольф, Muay Thai.', en: 'Stay active: gym, tennis, golf, Muay Thai.' },
    { ru: 'Сходить на массаж и spa уровня выше базового.', en: 'Get a massage or spa above the basic tier.' },
    { ru: 'Снять яхту на день или закат.', en: 'Charter a yacht for a day or a sunset.' },
    { ru: 'Узнать о ближайших событиях: party, gallery, фестиваль.', en: 'Learn about upcoming parties, galleries and festivals.' },
    { ru: 'Забронировать beach club или sky bar для группы.', en: 'Book a beach club or sky bar for a group.' },
  ],
  services: [
    { slug: 'restaurants', label: { ru: 'Рестораны', en: 'Restaurants' }, oneLiner: { ru: 'Гид по 200+ местам с фильтром по поводу.', en: 'Guide to 200+ places filtered by occasion.' }, href: '/dining' },
    { slug: 'spa-wellness', label: { ru: 'Spa и wellness', en: 'Spa & wellness' }, oneLiner: { ru: 'Banyan Tree, Anantara, Cool Spa — топовый список.', en: 'Banyan Tree, Anantara, Cool Spa — top tier.' }, href: '/services/wellness/spa' },
    { slug: 'fitness', label: { ru: 'Фитнес и спорт', en: 'Fitness & sport' }, oneLiner: { ru: 'Залы, теннис, гольф, Muay Thai — карта и подписки.', en: 'Gyms, tennis, golf, Muay Thai — map and memberships.' }, href: '/fitness' },
    { slug: 'yacht-charter', label: { ru: 'Аренда яхты', en: 'Yacht charter' }, oneLiner: { ru: 'Sunset cruise от ฿3 500/чел, day trip до Phi Phi.', en: 'Sunset cruise from ฿3,500/pax, day trip to Phi Phi.' }, href: '/yachts' },
    { slug: 'events', label: { ru: 'События и party', en: 'Events & parties' }, oneLiner: { ru: 'Афиша на неделю с прямыми билетами.', en: 'Weekly listings with direct ticketing.' }, href: '/events' },
    { slug: 'beach-clubs', label: { ru: 'Beach clubs и sky bars', en: 'Beach clubs & sky bars' }, oneLiner: { ru: 'Catch, Café del Mar, Baba Nest — резервация и minimum spend.', en: 'Catch, Café del Mar, Baba Nest — booking and minimum spend.' }, href: '/services/dining/beach-clubs' },
  ],
  faq: [
    { q: { ru: 'Где лучшие закаты на Пхукете?', en: 'Where are the best sunsets on Phuket?' }, a: { ru: 'Promthep Cape — классика, бесплатно. Café del Mar (Камала) — beach club. Baba Nest (Шри Панва) — sky bar по бронированию. Ya Nui Beach — без толпы.', en: 'Promthep Cape — classic, free. Café del Mar (Kamala) — beach club. Baba Nest (Sri Panwa) — sky bar by reservation. Ya Nui Beach — uncrowded.' } },
    { q: { ru: 'Сколько стоит абонемент в хороший зал?', en: 'How much for a good gym membership?' }, a: { ru: 'Premium (Unit27, Movement, Tiger Muay Thai) — ฿3 500–6 000/мес. Mid (Total Fitness) — ฿1 800/мес. Гостиничные — daily ฿500–1 200.', en: 'Premium (Unit27, Movement, Tiger Muay Thai) — ฿3,500–6,000/mo. Mid (Total Fitness) — ฿1,800/mo. Hotel-attached — daily ฿500–1,200.' } },
    { q: { ru: 'Можно ли арендовать яхту на пол-дня?', en: 'Can I charter a yacht for half a day?' }, a: { ru: 'Да, sunset cruise 4 часа на 8–12 человек — от ฿35 000 за лодку с капитаном и snacks. Day trip 8 часов с остановкой на островах — от ฿80 000.', en: 'Yes, a 4-hour sunset cruise for 8–12 — from ฿35,000 with captain and snacks. 8-hour day trip with island stops — from ฿80,000.' } },
    { q: { ru: 'Какие spa уровня выше "массаж на пляже"?', en: 'Which spas are above beach massage tier?' }, a: { ru: 'Banyan Tree Spa, Anantara Spa, Cool Spa (Шри Панва), The Spa at Trisara — premium с собственными signature ритуалами. От ฿3 500 за процедуру.', en: 'Banyan Tree Spa, Anantara Spa, Cool Spa (Sri Panwa), The Spa at Trisara — premium with signature rituals. From ฿3,500 per treatment.' } },
    { q: { ru: 'Где играть в гольф?', en: 'Where to play golf?' }, a: { ru: 'Blue Canyon (PGA), Laguna Phuket, Red Mountain — top-3. Green fee — ฿4 500–7 500 в high season, ฿2 800–5 000 в low. Caddy и cart обычно включены.', en: 'Blue Canyon (PGA), Laguna Phuket, Red Mountain — top 3. Green fee — ฿4,500–7,500 high season, ฿2,800–5,000 low. Caddy and cart usually included.' } },
    { q: { ru: 'Какие события не пропустить?', en: 'Which events not to miss?' }, a: { ru: 'Songkran (13–15 апреля), Vegetarian Festival (октябрь), Phuket King’s Cup Regatta (декабрь), Loy Krathong (ноябрь). Афиша обновляется в /events еженедельно.', en: 'Songkran (April 13–15), Vegetarian Festival (October), Phuket King’s Cup Regatta (December), Loy Krathong (November). /events updates weekly.' } },
  ],
  primaryCta: {
    label: { ru: 'Открыть афишу', en: 'Open the calendar' },
    href: '/events',
    subtitle: { ru: 'Обновляется каждую неделю.', en: 'Updated every week.' },
  },
  secondaryCta: {
    label: { ru: 'Снять яхту', en: 'Charter a yacht' },
    href: '/yachts',
  },
  relatedPersonas: ['P1', 'P3', 'P4', 'P5', 'P6', 'P7', 'P15', 'P16', 'P18', 'P24'],
  seo: {
    metaTitle: { ru: 'Стиль жизни на Пхукете: рестораны, спорт, яхты — myUNO', en: 'Lifestyle on Phuket: dining, sport, yachts — myUNO' },
    metaDescription: { ru: 'Wellness, рестораны, beach clubs, яхты, события и спорт. Curated подборка без зазывал, цены в THB.', en: 'Wellness, dining, beach clubs, yachts, events and sport. Curated picks without street touts, THB pricing.' },
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

export const CLUSTER_LANDINGS: readonly ClusterLanding[] = [
  A_ARRIVAL,
  B_EXTENSION,
  C_SETTLEMENT,
  D_INVESTMENT,
  draftCluster('E', 'transaction', { ru: 'Покупка и продажа недвижимости', en: 'Buying & selling property' }, ['P2', 'P8', 'P9', 'P11', 'P12']),
  F_OPERATIONS,
  G_COMPLIANCE,
  H_EMERGENCY,
  I_LIFESTYLE,
  draftCluster('J', 'exit', { ru: 'Выход из актива и возврат', en: 'Exit & re-entry' }, ['P8', 'P9', 'P10', 'P20']),
] as const;

export const LIVE_CLUSTER_SLUGS: readonly string[] = [
  'arrival',     // A
  'extension',   // B  — Sprint 2
  'settlement',  // C  — Sprint 2
  'investment',  // D
  'operations',  // F
  'compliance',  // G  — Sprint 1
  'emergency',   // H  — Sprint 1
  'lifestyle',   // I  — Sprint 2
] as const;
