/**
 * Bundled relocation guides for Phuket (RU/EN).
 * Supabase `relocation_articles` overrides these when rows exist (CMS path).
 */
export type RelocationArticleCategory =
  | 'visa'
  | 'housing'
  | 'schools'
  | 'banking'
  | 'legal'
  | 'health'
  | 'transport'
  | 'logistics'
  | 'tax'
  | 'pets';

export interface RelocationArticleRecord {
  slug: string;
  category: RelocationArticleCategory;
  title_en: string;
  title_ru: string;
  summary_en: string;
  summary_ru: string;
  content_en: string;
  content_ru: string;
  related_route?: string;
  sort_order: number;
}

export const RELOCATION_ARTICLE_CATEGORIES: {
  id: RelocationArticleCategory;
  label_en: string;
  label_ru: string;
}[] = [
  { id: 'visa', label_en: 'Visas & stay', label_ru: 'Визы и легальный статус' },
  { id: 'housing', label_en: 'Housing', label_ru: 'Жильё' },
  { id: 'schools', label_en: 'Schools & kids', label_ru: 'Школы и дети' },
  { id: 'banking', label_en: 'Banking', label_ru: 'Банки' },
  { id: 'legal', label_en: 'Legal & admin', label_ru: 'Право и админ' },
  { id: 'health', label_en: 'Health & insurance', label_ru: 'Медицина и страховка' },
  { id: 'transport', label_en: 'Transport', label_ru: 'Транспорт' },
  { id: 'logistics', label_en: 'Moving & shipping', label_ru: 'Переезд вещей и логистика' },
  { id: 'tax', label_en: 'Tax', label_ru: 'Налоги' },
  { id: 'pets', label_en: 'Pets', label_ru: 'Питомцы' },
];

const visaOverviewEn = `## Who this is for

Anyone planning to stay in Thailand beyond a short holiday on Phuket.

## Common routes

- **Tourist exemption / visa exemption** — short visits; not a relocation visa.
- **Education (ED)** — language or full-time study; requires a real school.
- **DTV (Destination Thailand Visa)** — remote workers; proof of remote income and employer abroad.
- **Non-Immigrant B (work)** — tied to a Thai employer and work permit.
- **LTR / retirement / Elite** — longer-term or premium options with specific capital or age rules.

## What to do next

- Compare options with our [visa decision tool](/visa/compare).
- Book a consultation through **Legal & Visa** in the app if your case is non-standard.

## Disclaimer

Rules change. Always confirm with an immigration lawyer before booking flights or signing leases.`;

const visaOverviewRu = `## Для кого этот материал

Для тех, кто планирует жить в Таиланде дольше обычного отпуска на Пхукете.

## Частые маршруты

- **Безвизовый / visa exemption** — короткие визиты; не статус для переезда.
- **ED (учебная)** — язык или очное обучение; нужна реальная школа/университет.
- **DTV** — удалёнщики; подтверждение дохода и работодателя за рубежом.
- **Non-B (работа)** — тайский работодатель и work permit.
- **LTR / пенсионная / Elite** — долгосрок или премиум-визы с отдельными условиями.

## Следующий шаг

- Сравните варианты в [инструменте выбора визы](/visa/compare).
- Закажите консультацию в разделе **Визы** в приложении, если кейс нестандартный.

## Дисклеймер

Правила меняются. Перед бронированием билетов и подписанием договоров аренды сверьтесь с иммиграционным юристом.`;

const tm30En = `## What is TM30?

Landlords (or hotels) must report foreign guests staying on their property to immigration. As a tenant, you should ensure your address is reported.

## 90-day reporting

Most long-stay visas require reporting to immigration every 90 days if you remain in Thailand. Missing the window can mean fines.

## Practical tips

- Keep copies of your lease and landlord ID.
- Set a calendar reminder 85 days after each stamp.
- Use the in-app **Legal** vertical for help filing if you are unsure.

## Typical fines (indicative)

Fines for late TM30 or 90-day reporting are often in the **800–2,000 THB** range — confirm current amounts with immigration or counsel.`;

const tm30Ru = `## Что такое TM30?

Владелец жилья (или отель) обязан сообщать о проживании иностранца в иммиграционную службу. Как арендатор, убедитесь, что адрес подан.

## 90-дневный отчёт

Большинство долгосрочных виз требуют отчёт в иммиграцию каждые 90 дней пребывания в стране. Пропуск срока — штрафы.

## Практика

- Храните копии договора аренды и документов арендодателя.
- Поставьте напоминание на 85-й день после штампа.
- Раздел **Юристы / визы** в приложении — если нужна помощь с подачей.

## Штрафы (ориентир)

За просрочку TM30 или 90-дневного отчёта часто **800–2,000 THB** — уточняйте актуальные суммы в иммиграции или у юриста.`;

const housingEn = `## Rent first

Most relocators rent 6–12 months before buying. Use filters for **long-term rent** and district (Rawai, Bangtao, Phuket Town, etc.).

## Budget bands (2025–2026, indicative)

- Studio / small condo: **฿8k–25k/mo** depending on area and season.
- 2BR condo: **฿25k–60k/mo**.
- Pool villa: **฿60k+**.

## Contract tips

- Read deposit and utility clauses.
- Ask who files TM30.
- Prefer metered water/electricity over flat bundles if you can.

## Next step

Open **Property search** with long-term mode and save favourites.`;

const housingRu = `## Сначала аренда

Большинство сначала снимает 6–12 месяцев, прежде чем покупать. Используйте фильтры **долгосрочной аренды** и района (Раваи, Бангтао, Пхукет-таун и т.д.).

## Бюджеты (ориентир 2025–2026)

- Студия / небольшое кондо: **฿8k–25k/мес** в зависимости от района и сезона.
- 2BR кондо: **฿25k–60k/мес**.
- Вилла с бассейном: **฿60k+**.

## Договор

- Читайте залог и коммуналку.
- Уточните, кто подаёт TM30.
- По возможности счётчики вместо фикс-пакета.

## Дальше

Откройте **поиск недвижимости** в режиме долгосрочной аренды и сохраняйте избранное.`;

const schoolsEn = `## International schools on Phuket

There are **10+** international programmes (British, American, IB, Russian streams). Fees often range **฿200k–800k/year** depending on age and campus.

## How to choose

- Language of instruction vs home language.
- Commute from your target neighbourhood.
- Waiting lists — apply early if you move mid-year.

## Next step

Use **School finder** in the app and book visits before you sign a lease far from campus.`;

const schoolsRu = `## Международные школы на Пхукете

**10+** программ (British, American, IB, русские потоки). Обычно **฿200k–800k/год** в зависимости от возраста и кампуса.

## Как выбрать

- Язык обучения vs родной язык.
- Дорога из района, где планируете жить.
- Листы ожидания — подавайте заранее при переезде в середине года.

## Дальше

**Подбор школ** в приложении и визиты до подписания договора аренды далеко от школы.`;

const bankingEn = `## Can foreigners open accounts?

Yes, with the right visa and address proof. Policies vary by branch — Patong branches are often stricter than Chalong or Phuket Town.

## Typical documents

- Passport + visa
- Lease or TM30 / landlord letter
- Sometimes a reference from your embassy or employer

## Banks often used

Bangkok Bank, Kasikorn, SCB — compare fees for international transfers.

## Next step

Open the **Banking** vertical and book an appointment slot where available.`;

const bankingRu = `## Могут ли иностранцы открыть счёт?

Да, при подходящей визе и подтверждении адреса. Политика зависит от отделения — в Патонге часто строже, чем в Чалонге или Пхукет-тауне.

## Документы

- Паспорт + виза
- Договор аренды или TM30 / письмо арендодателя
- Иногда справка с работы или от посольства

## Банки

Bangkok Bank, Kasikorn, SCB — сравните комиссии за международные переводы.

## Дальше

Раздел **Банки** в приложении — запись, где доступно.`;

const healthEn = `## Insurance first

Travel insurance is not enough for long stays. Look for inpatient coverage in Thailand and evacuation if you need regional care.

## Clinics

Phuket has international hospitals and Russian-speaking coordinators in major clinics.

## Next step

Use **Medical** and **Insurance** in the app for quotes and bookings.`;

const healthRu = `## Сначала страховка

Туристской страховки мало для долгого проживания. Нужны стационар в Таиланде и эвакуация при необходимости.

## Клиники

Международные госпитали и русскоговорящие координаторы в крупных клиниках.

## Дальше

Разделы **Медицина** и **Страховка** в приложении.`;

const licenseEn = `## Motorbike

Many expats ride scooters. Legally you need a Thai licence or valid international driving permit that covers motorcycles — police checks are common.

## Car

International + home licence may work short term; long term plan for a Thai licence conversion at the land transport office.

## Next step

Use **Transport** for rentals; ask a legal provider for licence conversion packages.`;

const licenseRu = `## Мотобайк

Многие ездят на скутере. По закону нужны тайские права или МВУ с категорией мото — полиция часто останавливает.

## Авто

Международные + национальные права на короткий срок; на долгосрок — конвертация в тайские в отделении транспорта.

## Дальше

**Транспорт** для аренды; юрист — пакеты конвертации прав.`;

const petsEn = `## Import rules

Thailand requires microchip, rabies vaccination timeline, and an import permit. Quarantine rules depend on country of origin — start **3–4 months** before travel.

## On island

Vets can help with health certificates and tick prevention.

## Next step

Open **Pets** and **Veterinary** for clinics that handle import paperwork.`;

const petsRu = `## Ввоз правила

Нужны чип, календарь прививок от бешенства и разрешение на ввоз. Карантин зависит от страны — начинайте **за 3–4 месяца**.

## На острове

Ветеринары помогут с сертификатами и защитой от клещей.

## Дальше

Разделы **Питомцы** и **Ветеринария**.`;

const shippingEn = `## Sea vs air

Air freight is fast for essentials; sea container is cheaper for a full household but takes weeks and needs customs clearance in Laem Chabang or Bangkok port.

## Customs

Used personal effects may qualify for duty relief with the right declaration — use a licensed forwarder.

## Next step

Ask **Relocation** concierge for vetted forwarders; compare 2–3 quotes.`;

const shippingRu = `## Море vs авиа

Авиа — быстро для необходимого; контейнер — дешевле для всего дома, но недели и таможня в Лаемчабанге или Бангкоке.

## Таможня

Личные вещи б/у могут получить льготы при правильном оформлении — лицензированный форвардер.

## Дальше

Консьерж **релокации** или **Legal** — сравните 2–3 предложения.`;

const taxEn = `## Thai tax residency

Days-in-country tests and local income may trigger Thai tax filing. Remote foreign salary is a grey area — get individual advice.

## Home country

You may still owe filings (e.g. citizenship-based systems). Keep calendar of days per country.

## Next step

Use **Tax** and **Legal** modules; do not rely on forum posts alone.`;

const taxRu = `## Налоговое резидентство в Таиланде

Количество дней и локальный доход могут влечь подачу декларации. Удалённая зарплата за рубежом — зона риска, нужен разбор.

## Страна гражданства

Могут оставаться обязательства (например, по гражданству). Ведите учёт дней по странам.

## Дальше

Разделы **Налоги** и **Юристы**; не полагайтесь только на форумы.`;

const companyEn = `## BOI vs LTD

Foreign-owned companies have restrictions. BOI promotion can unlock work permits for certain tech roles; classic LTD needs Thai majority in many cases.

## Remote work

Many nomads use DTV instead of opening a Thai entity — cheaper admin if you do not hire locally.

## Next step

Book **Legal** for entity structuring before you lease office space.`;

const companyRu = `## BOI vs LTD

Иностранные компании с ограничениями. BOI может дать work permit в IT; классическое LTD часто требует тайского большинства.

## Удалёнка

Многие номады берут DTV вместо тайской фирмы — меньше админки, если не нанимаете локально.

## Дальше

**Юристы** — структура до аренды офиса.`;

const costEn = `## Use the calculator

Our **Cost of living** tool lets you tune housing, food, transport, kids, and insurance sliders for a monthly total.

## Benchmarks

Add 10–15% buffer for currency moves and visa runs.

## Next step

Open **Cost of living** from the relocate hub and save a screenshot for your bank / landlord conversations.`;

const costRu = `## Калькулятор

Инструмент **Стоимость жизни** — ползунки жильё, еда, транспорт, дети, страховка.

## Запас

Заложите **10–15%** на курс и визовые поездки.

## Дальше

Откройте **Стоимость жизни** из хаба переезда и сохраните итог для банка / арендодателя.`;

export const RELOCATION_ARTICLE_SEEDS: RelocationArticleRecord[] = [
  {
    slug: 'visa-overview',
    category: 'visa',
    title_en: 'Phuket visas — overview for relocators',
    title_ru: 'Визы на Пхукете — обзор для переезда',
    summary_en: 'Main visa routes: tourist, ED, DTV, work, LTR/retirement/Elite — what to check first.',
    summary_ru: 'Основные типы: туризм, ED, DTV, работа, LTR/пенсионная/Elite — с чего начать.',
    content_en: visaOverviewEn,
    content_ru: visaOverviewRu,
    related_route: '/visa',
    sort_order: 10,
  },
  {
    slug: 'tm30-ninety-day',
    category: 'legal',
    title_en: 'TM30 and 90-day reporting',
    title_ru: 'TM30 и 90-дневный отчёт',
    summary_en: 'Address reporting and immigration check-ins for long-stay visas.',
    summary_ru: 'Регистрация адреса и отчётность для долгосрочных виз.',
    content_en: tm30En,
    content_ru: tm30Ru,
    related_route: '/stay-legal',
    sort_order: 20,
  },
  {
    slug: 'housing-long-term',
    category: 'housing',
    title_en: 'Long-term housing on Phuket',
    title_ru: 'Долгосрочное жильё на Пхукете',
    summary_en: 'Budget bands, contracts, TM30, and how to search safely.',
    summary_ru: 'Бюджеты, договор, TM30 и безопасный поиск.',
    content_en: housingEn,
    content_ru: housingRu,
    related_route: '/property',
    sort_order: 30,
  },
  {
    slug: 'schools-international',
    category: 'schools',
    title_en: 'International schools — how to choose',
    title_ru: 'Международные школы — как выбрать',
    summary_en: 'Fees, languages, commutes, and waiting lists.',
    summary_ru: 'Стоимость, языки, дорога до школы, листы ожидания.',
    content_en: schoolsEn,
    content_ru: schoolsRu,
    related_route: '/school-finder',
    sort_order: 40,
  },
  {
    slug: 'banking-thailand',
    category: 'banking',
    title_en: 'Opening a Thai bank account',
    title_ru: 'Открытие счёта в тайском банке',
    summary_en: 'Documents, branch differences, and realistic expectations.',
    summary_ru: 'Документы, различия отделений, ожидания.',
    content_en: bankingEn,
    content_ru: bankingRu,
    related_route: '/banking',
    sort_order: 50,
  },
  {
    slug: 'healthcare-insurance',
    category: 'health',
    title_en: 'Healthcare and insurance after you move',
    title_ru: 'Медицина и страховка после переезда',
    summary_en: 'Why travel insurance is not enough and how to use clinics.',
    summary_ru: 'Почему туристской страховки мало и как пользоваться клиниками.',
    content_en: healthEn,
    content_ru: healthRu,
    related_route: '/medical',
    sort_order: 60,
  },
  {
    slug: 'drivers-license-thailand',
    category: 'transport',
    title_en: 'Motorbike and car licences',
    title_ru: 'Права на мото и авто',
    summary_en: 'IDP, Thai conversion, and police checks.',
    summary_ru: 'МВУ, конвертация, остановки полиции.',
    content_en: licenseEn,
    content_ru: licenseRu,
    related_route: '/transport',
    sort_order: 70,
  },
  {
    slug: 'pet-import-thailand',
    category: 'pets',
    title_en: 'Bringing pets to Thailand',
    title_ru: 'Ввоз питомцев в Таиланд',
    summary_en: 'Timeline, rabies rules, and island vets.',
    summary_ru: 'Сроки, бешенство, ветеринары на острове.',
    content_en: petsEn,
    content_ru: petsRu,
    related_route: '/pets',
    sort_order: 80,
  },
  {
    slug: 'shipping-belongings',
    category: 'logistics',
    title_en: 'Shipping your belongings',
    title_ru: 'Перевозка вещей',
    summary_en: 'Air vs sea, customs, and choosing a forwarder.',
    summary_ru: 'Авиа и море, таможня, выбор форвардера.',
    content_en: shippingEn,
    content_ru: shippingRu,
    related_route: '/relocate',
    sort_order: 90,
  },
  {
    slug: 'tax-residency-basics',
    category: 'tax',
    title_en: 'Tax residency — Thailand and your home country',
    title_ru: 'Налоговое резидентство — Таиланд и страна гражданства',
    summary_en: 'High-level flags; not personal tax advice.',
    summary_ru: 'Общие ориентиры; не персональная консультация.',
    content_en: taxEn,
    content_ru: taxRu,
    related_route: '/tax',
    sort_order: 100,
  },
  {
    slug: 'company-remote-work',
    category: 'legal',
    title_en: 'Thai company vs remote work visa',
    title_ru: 'Тайская компания vs виза удалёнщика',
    summary_en: 'When BOI/LTD makes sense vs DTV.',
    summary_ru: 'Когда нужна фирма, а когда DTV.',
    content_en: companyEn,
    content_ru: companyRu,
    related_route: '/legal',
    sort_order: 110,
  },
  {
    slug: 'cost-of-living-benchmark',
    category: 'housing',
    title_en: 'Cost of living benchmarks',
    title_ru: 'Ориентиры по стоимости жизни',
    summary_en: 'Use the calculator and add a buffer for FX and visa runs.',
    summary_ru: 'Калькулятор и запас на курс и визы.',
    content_en: costEn,
    content_ru: costRu,
    related_route: '/cost-of-living',
    sort_order: 120,
  },
];
