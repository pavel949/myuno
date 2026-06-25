# myUNO — Project Bible

> Единый справочный документ о продукте, бизнес-модели, архитектуре и дизайне.
> Версия: 1.2 · Составлен: 2026-06-24 · Last audit-sync: 2026-06-25 · Ветка: `claude/project-analysis-business-plan-ySqKW`
>
> **v1.1 → v1.2 changelog (2026-06-25, second audit pass):** при попытке закрыть «remaining issues» из §20.2 обнаружено, что часть пунктов уже была сделана в коде, но Bible этого не зафиксировала. Внесены корректировки: (a) **CSP уже в проде** — `index.html:18` с 2026-06-18, открытый пункт переведён в resolved; (b) **vendor-acquisition feature flag уже существует** (`AI_VENDOR_ACQUISITION` в `src/lib/featureFlags.ts:36–41`, restricted to admin/uno_team) — открытым остаётся только cron-schedule; (c) **admin i18n переклассифицирован** — строки в AdminLeadConfigs/Stores/Newbuilds/TicketDetail НЕ хардкод, а bilingual через inline t()-helper или `language === 'ru' ? ... : ...` ternary; это code-style cleanup, не функциональный баг (downgrade Medium → Low). Реально остаются три пункта debt: refresh tokens в localStorage, `as any` mass cleanup, Stripe live-mode flip — все требуют усилий вне рамок одной AI-сессии.
>
> **v1.0 → v1.1 changelog (2026-06-25, first audit pass):** проведён sync Bible против реального состояния `main`. Подтверждено, что PR #23 fixes в проде; CORS пересобран на whitelist (`_shared/cors.ts`) — больше не `*`; `as any` debt снижен с 649 до 495; flowers checkout полностью функционален; auth guards консистентны по тирам; thai_business_layer GA подтверждён. Headline-числа подтянуты к фактическим (566 страниц, 1003 компонента, 172 edge functions, ~540 таблиц, 60 micro-apps). Детали — в §20.
>
> Цель документа — дать новому участнику команды, инвестору или партнёру за 60 минут полное и непротиворечивое представление о том, **что мы строим, зачем, для кого и как этот бизнес зарабатывает деньги**.
>
> Источники истины: `PROJECT.md`, `CLAUDE.md`, `DESIGN.md`, `docs/canonical/*`, `src/lib/appRegistry.ts`, `src/lib/taxonomies/master.ts`, аудит кодовой базы (566 страниц, 1003 компонента, 172 Edge Functions, ~540 таблиц).

---

## 0. TL;DR — пять предложений

1. **myUNO — это AI-first суперапп для иностранцев на Пхукете**, объединяющий 60 микро-приложений (недвижимость, услуги, юриспруденция, lifestyle) под одним аккаунтом, одной БД и единым кошельком.
2. **Главная боль аудитории** — иностранец на Пхукете тратит десятки часов на поиск, перевод, верификацию и оплату базовых вещей: жильё, виза, врач, ремонт, садовник, школа, бронирование яхты, перевод денег. Локальный рынок раздроблен и непрозрачен.
3. **Решение** — единый «control center жизни на Пхукете»: подбор + бронирование + оплата + сопровождение через AI-консьержа, на двух языках (RU/EN), с защитой денег через эскроу и платформенную ответственность.
4. **Бизнес-модель — пять параллельных потоков**: (а) комиссия 10% с услуг, (б) комиссия 5% с продажи недвижимости, (в) подписка PMS $25/слот для управляющих компаний, (г) подписка вендоров, (д) подписка Premium для потребителей с кэшбэком и приоритетной поддержкой. Опционально — финтех (кошелёк, BNPL) на горизонте 18–36 месяцев.
5. **Технологическая база** — монолитный React 18 SPA + Supabase (PostgreSQL, Edge Functions, RLS) + Stripe + Capacitor; ~540 таблиц, 172 edge functions, 20+ AI-агентов на Claude/Gemini. Готовность платформы — около 70% (после PR #23 fixes); ядро (Auth, оплаты, PMS, CRM, мульти-тенант для УК, flowers/restaurants checkout) в проде.

---

## 1. Что мы строим

### 1.1. Концепция продукта

**myUNO — это операционная система жизни на Пхукете для иностранца.**

Это не маркетплейс одной категории и не классический «гид по острову». Это попытка собрать в одном приложении весь жизненный цикл иностранца на острове: от первой брони отеля до покупки виллы, от оформления визы до вызова электрика, от заказа цветов на годовщину до управления портфелем апартаментов в аренду.

Аналогия для понимания:
- **Grab** — для повседневных микро-транзакций (такси, еда, доставка) в ЮВА.
- **WeChat** — суперапп с финтех-ядром и mini-apps в Китае.
- **myUNO** — суперапп с **proptech-ядром** (недвижимость + услуги вокруг неё) для **экспат-аудитории** в Юго-Восточной Азии.

Ключевые различия от классических супераппов:
1. **Аудитория** — не местные жители, а приезжие (туристы, цифровые номады, экспаты, инвесторы). У них специфические pain points: язык, валюта, юридический статус, отсутствие локальных связей.
2. **Якорная вертикаль — недвижимость**, а не такси/доставка. Сделки крупнее (от $50K до нескольких миллионов), цикл длиннее, маржа выше, retention органический (если уже купил виллу — будешь возвращаться).
3. **AI-first с первого дня** — не как фича, а как операционный слой: консьерж, поиск, скоринг лидов, авто-описания, авто-ответы, авто-переводы, оценка качества листингов, динамическое ценообразование.
4. **Билингвальность как обязательство** — каждое слово в RU и EN, тайский на content-уровне для местных артефактов (адреса, юр. документы, чек-ауты).

### 1.2. Что НЕ является myUNO

Чтобы избежать размывания:
- ❌ Это **не туристическое OTA** в духе Booking.com или Agoda. Бронирование жилья — лишь один из 59 модулей, и оптимизируется он не под одноразового туриста, а под повторяющегося пользователя, который живёт на острове.
- ❌ Это **не классический PropTech-портал** в духе DDproperty или Hipflat. У портала плоский каталог и слабая монетизация. У нас — полный цикл: подбор → виртуальная экскурсия → due diligence → сделка → управление в аренду → перепродажа.
- ❌ Это **не российская соцсеть для экспатов**. Сообщество — приятный side-effect, не ядро. Ядро — реальные транзакции и их сопровождение.
- ❌ Это **не «ещё один WhatsApp-чат с реактором»**. Заявки и платежи проходят через платформу, с эскроу, аудитом и SLA.

### 1.3. Five-test для новых фич (из PROJECT.md)

Прежде чем добавлять любую новую функциональность, она должна пройти 5 проверок:

| # | Тест | Вопрос |
|---|------|--------|
| 1 | **Foreigner-pain** | Решает ли эта фича боль именно иностранца на Пхукете (а не местного жителя или туриста-однодневки)? |
| 2 | **Trust-or-money** | Снижает ли она риск потери денег / повышает ли доверие к транзакции? |
| 3 | **Roof-or-roads** | Привязана ли она к недвижимости или к её жизненному циклу? Если нет — рискуем размыть позиционирование. |
| 4 | **Loop-with-platform** | Возвращает ли она пользователя в myUNO через дни/недели, а не одноразово? |
| 5 | **Monetisable** | Понятен ли путь к деньгам в горизонте 12 месяцев? |

Фича, которая не проходит ≥3 теста, не имеет права на существование в дорожной карте.

---

## 2. Проблема, которую мы решаем

### 2.1. Контекст рынка

**Пхукет — крупнейший туристический и экспат-хаб Таиланда:**
- ~10 млн международных туристов в год (2024), средний чек $500–800 на поездку.
- ~80–100 тыс. долгосрочных иностранных резидентов (LTR-визы, Education, Marriage, Retirement).
- ~$2–3 млрд рынка недвижимости (новостройки + вторичка + аренда), из которых ~40% покупают иностранцы.
- ~50–60 тыс. иностранцев в туристический сезон (ноябрь–март), включая большую русскоязычную диаспору (15–25 тыс. постоянных + 80–120 тыс. сезонных).

**Структура текущего опыта иностранца:**

| Задача | Как решается сейчас | Боль |
|--------|---------------------|------|
| Снять виллу на месяц | Чаты в Telegram + агент-посредник | 3–5 «риелторов» с одной и той же базой, 30–50% наценка, фейковые фото |
| Купить квартиру в новостройке | Агент по знакомству | Информационная асимметрия, скрытые комиссии, $5–50K «недополучаешь» на сделке |
| Сдать апартаменты в аренду | Управляющая компания | $30–50% от выручки, непрозрачные отчёты, локально-привязанные системы |
| Открыть банковский счёт | Через агента-помощника | $200–500 за «договорённость», 3–6 недель, нет гарантий |
| Подать на визу | Visa-агентство | Лотерея по качеству, цена в 2–3× реальной стоимости услуг |
| Записать ребёнка в школу | Личные связи + Excel-файлы | Нет единого реестра, репутация по слухам |
| Найти врача | Группы в Facebook | Рекомендации устарели, нет верифицированных отзывов |
| Заказать клининг / сантехника | LINE-группа или соседи | Не приходят, не отвечают, цена «по лицу» |
| Перевести деньги Россия→Таиланд | P2P + крипта | Высокий риск, нет защиты, blocking by banks |
| Заказать цветы / еду / трансфер | 10 разных приложений + Grab | Фрагментация, разные кошельки, разные языки |

**Главный инсайт**: проблема не в отсутствии сервисов. Сервисы есть. Проблема — в их **разрозненности, непрозрачности и языковом барьере**. Иностранец платит «налог на иностранность» в виде времени и переплат, который оценивается в $5–15 тыс. в год для среднего долгосрочного резидента.

### 2.2. Сегментация боли по фазам жизни

myUNO разделяет аудиторию на 4 жизненных фазы (`docs/canonical/01-segmentation-framework.md`):

| Фаза | Длительность | Главная боль | Spend in apps/yr |
|------|--------------|--------------|------------------|
| **ARRIVE** (Прилёт / разведка) | 1–14 дней | «Как тут всё устроено?» | $500–2 000 |
| **LIVE** (Жизнь / семья) | 3–24 месяца | «Как наладить быт без знания тайского?» | $5 000–25 000 |
| **MANAGE** (Владение + аренда) | 2+ лет | «Как извлекать доход из актива?» | $1 000–8 000 (комиссии УК) |
| **INVEST** (Капитал) | по запросу | «Куда положить $100K–$5M?» | $100 000+ единоразово |

Эти 4 фазы и формируют 4 из 6 «surfaces» (контентных кластеров) приложения. Ещё 2 — `LEGAL` (юридическая обёртка для всех 4 фаз) и `BUILD` (для девелоперов и инвесторов в стройку).

### 2.3. Почему именно сейчас

Окно возможностей открыто по трём причинам:

1. **Закрытие России/СНГ для альтернативных юрисдикций** — после 2022 года Пхукет вошёл в топ-3 направлений для русскоязычной эмиграции (с Дубаем и Сербией/Черногорией). Появилась новая массовая аудитория с покупательной способностью.
2. **LTR-визы Таиланда** (Long-Term Resident, 10 лет) — запущены в 2022, упростили долгосрочную жизнь иностранцев. Рынок «обустройства» растёт двузначными темпами.
3. **AI стал commodity** — то, что раньше требовало команды переводчиков и операторов поддержки (24/7 бот, авто-описания, оценка качества листингов, динамическое ценообразование), сейчас закрывается одним AI-агентом за центы за запрос. Это делает экономически жизнеспособной модель, которая 5 лет назад была убыточной.

---

## 3. Кому это нужно — персоны и роли

### 3.1. Двухслойная модель ролей

В myUNO существует разделение между **consumer role-stack** (как пользователь видит себя) и **`app_role`** (что система разрешает делать). Источник истины — `src/types/auth.ts`.

#### 3.1.1. Consumer role-stack (7 ролей, через онбординг)

Пользователь при регистрации выбирает 1–3 роли с весами (primary·3 + secondary·2 + tertiary·1). Это влияет на персонализацию главной, рекомендации, чек-листы.

| Роль | Описание | % аудитории |
|------|----------|-------------|
| **Tourist** | Турист на 1–14 дней | ~35% |
| **Resident** | Долгосрочный житель острова | ~25% |
| **Owner** | Владелец недвижимости (1 объект) | ~12% |
| **Agent** | Посредник: брокер, агент по аренде | ~8% |
| **Developer** | Застройщик (новостройки) | ~3% |
| **Provider** | Сервисный вендор (отель, ресторан, салон, юрист) | ~12% |
| **Investor** | Инвестор в недвижимость / другие активы | ~5% |

#### 3.1.2. `app_role` enum (18 значений — DB-канон)

Это уже не «как я себя позиционирую», а «к каким ресурсам система даёт доступ». Используется в RLS и RoleGate.

```
guest, user, partner, property_owner, property_manager, broker, vendor,
staff, uno_team, admin, ombudsman, finance, support, sales, +еще 4 спец. роли
```

### 3.2. Глубокий портрет 8 ключевых персон

#### Персона 1 — Анна, 34, маркетолог из Москвы, приехала на 3 месяца с ребёнком

- **Фаза**: ARRIVE → LIVE
- **Бюджет**: ~$3–5K/мес на жизнь
- **Боль**: «Я не знаю, какой район выбрать, какая школа подходит дочке, где безопасно гулять, и как объяснить садовнику что делать с этой пальмой».
- **Что даёт myUNO**:
  - Чек-лист первых 7 дней (SIM, банк, eSIM-роуминг, обмен валюты, такси из аэропорта).
  - Подбор виллы по бюджету и району, с фильтром «есть детский бассейн / школа в 10 мин».
  - AI-консьерж отвечает на любой вопрос на русском 24/7.
  - Запись к педиатру с верифицированным отзывом и фотографиями клиники.
  - Заказ клинера/няни с гарантией возврата денег.
- **Монетизация**: 10% комиссии с услуг, ~$30–60/мес органически.

#### Персона 2 — Дмитрий, 42, IT-предприниматель, релоцировался с семьёй на ПМЖ

- **Фаза**: LIVE → MANAGE → INVEST
- **Бюджет**: $15–30K/мес, $300K–1M ликвидности
- **Боль**: «Я переехал, открыл компанию, оформил визу. Теперь хочу купить виллу для семьи + 2 апартамента в аренду. Не понимаю, кому верить, кто реально платит, какая доходность реальная, а какая нарисованная».
- **Что даёт myUNO**:
  - Investor dashboard с фильтром по доходности, девелоперу, локации.
  - **ClearView™** — собственная методология рейтинга off-plan (AAA–CCC, 8 категорий оценки) — единственный объективный source of truth на рынке.
  - Capital advisory — связь с консультантом Павла (CRM на `crm.bymyuno.com`).
  - PMS для управления купленными апартаментами в аренду (после сделки).
  - Реферальная программа: за приведённого инвестора $1–5K кэшбэка.
- **Монетизация**: 5% с продажи новостройки = $15–50K за одну сделку, далее $200–800/мес PMS на 2–3 объекта = $400–2 400/мес recurring.

#### Персона 3 — Светлана, 38, владелец 3 апартаментов под краткосрочную аренду

- **Фаза**: MANAGE
- **Боль**: «Управляющая компания берёт 30% и присылает Excel-отчёт раз в месяц с очевидными приписками. iCal-синхронизация не работает, я регулярно ловлю двойные брони. Хочу контролировать сама».
- **Что даёт myUNO**:
  - PMS-подписка $25/слот: 3 объекта = $75/мес.
  - Channel Manager: синхронизация с Airbnb, Booking, Agoda, Rentals United, Ostrovok, Sutochno (25+ каналов).
  - Real-time двойные брони предотвращаются на DB-уровне (`DOUBLE_BOOKING_SETUP.md`).
  - Прозрачные финансы: каждый платёж и расход в ledger, ежемесячный statement.
  - AI-ответы гостям 24/7 на 5 языках через `ai-guest-autoreply`.
- **Монетизация**: $75/мес × 12 = $900/год; при росте до 10 объектов — $3 000/год; high LTV (>5 лет).

#### Персона 4 — Сергей, 51, девелопер, строит 4 проекта апартаментов

- **Фаза**: BUILD
- **Боль**: «У меня 200 юнитов, маркетинг распылён по 30 агентам, никто не несёт ответственности. Хочу прямой канал продаж с прозрачной воронкой».
- **Что даёт myUNO**:
  - Developer portal — каталог проектов, KYC, Stripe Connect для prepayments.
  - DevMod — booking holds (5–20% депозит), маскированные email-каналы между покупателем и менеджером.
  - Capital CRM — встроенная воронка, lead scoring, аналитика по UTM.
  - SEO-оптимизированный лендинг каждого проекта (бесплатно).
  - ClearView-рейтинг (если согласен на due diligence) — повышает доверие и ROAS.
- **Монетизация**: 1–3% от продаж как platform fee + ежемесячный saas tier $500–5 000.

#### Персона 5 — Юлия, 29, owner салона красоты, делает массажи туристам

- **Фаза**: Provider (LIVE)
- **Боль**: «Я зависима от 2 агентств, которые приводят клиентов и берут 40%. Booking.com не годится для услуг. WhatsApp-чаты теряются».
- **Что даёт myUNO**:
  - Vendor dashboard: листинг, фото, цены, календарь, отзывы.
  - 10% комиссии вместо 40%.
  - Платежи через Stripe → вендорские выплаты раз в неделю.
  - AI-генерация описаний и переводов на 3 языка.
  - Push-уведомления о заказах в Telegram / WhatsApp.
- **Монетизация**: 10% с GMV вендора. При $5 000 GMV/мес вендор приносит $500/мес.

#### Персона 6 — Андрей, 47, юрист с лицензией в Таиланде

- **Фаза**: Provider (LIVE / LEGAL)
- **Боль**: «Мои услуги дорогие ($500–5 000 за пакет), и клиенты сомневаются, не наколют ли. Хочу платформу с эскроу».
- **Что даёт myUNO**:
  - Legal vertical с AI-помощником, который объясняет процесс клиенту.
  - Эскроу: оплата холдится на платформе, разблокируется по подтверждению клиента.
  - Verified-badge после KYC лицензии.
  - Лидогенерация через `ai-legal-assistant` и контент-маркетинг.
- **Монетизация**: 10–15% с услуги + потенциал premium-листинга $200/мес.

#### Персона 7 — Маркетинговое агентство (B2B)

- **Фаза**: вне жизненного цикла
- **Боль**: «Хочу таргетированно достучаться до русскоязычных экспатов на Пхукете».
- **Что даёт myUNO**:
  - Programmatic ad placement внутри приложения (Featured listings, sponsored cards).
  - Доступ к анонимизированной аналитике сегментов через MCC.
- **Монетизация**: $5–50K/мес в перспективе, но это **Phase 3**, не сейчас.

#### Персона 8 — Внутренний пользователь (uno_team / admin / ombudsman)

- **Роль**: операционная команда myUNO.
- **Инструменты**: 71 страница Admin Panel, CRM Capital, Marketing Command Center (MCC), Moderation Hub.
- **KPI**: response time на лиды <2ч, GMV/operator, ratings/dispute resolution.

### 3.3. Матрица «Кто за что платит»

| Персона | Сумма / частота | Канал монетизации | LTV (5-летний горизонт) |
|---------|-----------------|-------------------|--------------------------|
| Anna (Tourist→Resident) | $30–60/мес × 6 мес | 10% комиссия с услуг | $200–500 |
| Dmitry (Investor) | $20–50K единоразово + $400–2 400/мес | 5% RE + PMS | $40–100K |
| Svetlana (Owner) | $75–300/мес | PMS subscription | $5–15K |
| Sergey (Developer) | $500–5 000/мес + 1–3% от продаж | SaaS + platform fee | $200–500K |
| Yulia (Vendor) | 10% × $5 000 GMV = $500/мес | Marketplace commission | $20–50K |
| Andrey (Legal) | 10–15% × $2 000/мес = $200/мес | Marketplace commission | $10–20K |

**Mix expectation** (target 2027): из 100K MAU →
- ~85K consumers (Anna-type) → $200/год LTV → $17M
- ~10K vendors+owners → $1 200/год LTV → $12M
- ~150 developers → $30 000/год LTV → $4.5M
- ~30 крупных investors → $20K/год LTV → $0.6M
- **Total ARR ≈ $34M** при таком масштабе.

---

## 4. Продуктовая карта — 6 surfaces × 14 категорий × 60 апп

### 4.1. Шесть Content Surfaces (контентных кластеров)

Источник: `src/lib/taxonomies/master.ts`. Каждое из 60 микро-приложений принадлежит ровно одному из шести surface'ов. Это формирует визуальную и навигационную ось приложения.

| # | Surface | Семантика | Цветовой акцент (DS 2.1) | Главная боль |
|---|---------|-----------|--------------------------|---------------|
| 1 | **ARRIVE** | «Я только приехал» | navy-muted | Сориентироваться в первые 14 дней |
| 2 | **LIVE** | «Я живу здесь» | orange-muted | Наладить ежедневный быт |
| 3 | **MANAGE** | «Я владею недвижимостью» | stone | Извлечь доход из актива |
| 4 | **INVEST** | «У меня есть капитал» | navy | Найти безопасное вложение |
| 5 | **LEGAL** | «Мне нужны документы» | orange | Виза, договор, налог |
| 6 | **BUILD** | «Я застройщик / инвестор в стройку» | navy-orange | Продавать / покупать off-plan |

### 4.2. Четыре User Modes (потребительские поверхности)

Из `README.md` и `docs/SYSTEM_OVERVIEW.md`:

| Mode | URL | Что это | Аналог |
|------|-----|---------|--------|
| **Life** | `/` | LifeOS — персонализированный home, AI-рекомендации, контекстные ярлыки на основе фазы и роли | Главный экран WeChat |
| **Services** | `/discover` | Discovery hub — situation-first grid из 60 апп (NavigatorPageV3) | Grab Services |
| **Marketplace** | `/market` | Маркетплейс физических товаров (магазины, продукты, цветы, варианты) | Lazada-lite |
| **Me** | `/account` | Профиль, бронирования, кошелёк, настройки | Apple Wallet |

### 4.3. Семь Vertical Groups (для навигации в `/discover`)

Из `src/lib/verticalGroups.ts`:

| # | Группа | Микро-приложения внутри |
|---|--------|--------------------------|
| 1 | 🏠 Home & Living | Property, Cleaning, Babysitter, Pets, Flowers |
| 2 | 🚗 Transport | Transfers, Vehicles, Fast Track (airport) |
| 3 | 🎯 Leisure & Activities | Restaurants, Experiences, Yachts, Water Sports, Events, Food Delivery |
| 4 | 🏥 Health & Wellness | Beauty, Medical, Pharmacy, Fitness, Veterinary, Insurance |
| 5 | 📋 Life Admin | Legal, Education, Banking, Visa/Immigration |
| 6 | 🔧 Home Maintenance | Laundry, Plumbing, Electrical, AC Repair, Gardening, Pest Control, Handyman, Locksmith |
| 7 | 🆘 Help | VIP Concierge, SOS Emergency |

### 4.4. Полный реестр 60 микро-приложений

Канонический источник — `src/lib/appRegistry.ts` (60 entries verified 2026-06-25). По степени готовности (на основе аудита 2026-06):

#### 4.4.1. Зрелые (готовность 70%+) — ядро монетизации

| App | Vertical | Готовность | Главный flow |
|-----|----------|------------|--------------|
| Property (Real Estate) | MANAGE/INVEST | 80% | Browse → inquiry → Pavel в WhatsApp |
| Stays (PMS for owners) | MANAGE | 80% | Subscribe → list → manage → payout |
| Owner Portal | MANAGE | 50% | View statements, occupancy |
| MC Workspace | MANAGE | 80% | Multi-tenant for management companies |
| Capital CRM | INVEST/BUILD | 75% | Lead → nurture → close |
| Newbuilds (Off-plan) | BUILD | 75% | Catalog → ClearView → DevMod KYC → hold |
| Developer Portal | BUILD | 70% | Self-onboard projects + Stripe Connect |
| Admin Panel | OPS | 85% | 71 dashboards across all verticals |
| Auth/Account | CORE | 85% | Login, MFA, role selection, onboarding |
| Marketing Command Center (MCC) | OPS | 70% | Campaigns, leads, funnels, attribution |
| AI Concierge | CORE | 65% | 24/7 chat, multilingual |

#### 4.4.2. Developing (готовность 40–70%) — широкая монетизация

| App | Vertical | Готовность | Заметки |
|-----|----------|------------|---------|
| Restaurants | Leisure | 60% | Бронирование + еда, payment bug в чек-ауте |
| Beauty (Salons) | Health | 60% | Booking, отзывы, отсутствует аналитика |
| Flowers (Bloom) | Home | 60% | ✅ Checkout полностью функционален с anti-price-tampering (PR #23). Не хватает vendor analytics и delivery tracking. |
| Yachts | Leisure | 50% | iCal sync, charter calendar |
| Experiences | Leisure | 50% | Туры, активности, медиа-импорт |
| Events | Leisure | 50% | Ticketing, календарь |
| Legal Services | Legal | 60% | AI-помощник, генерация документов |
| Insurance | Legal | 50% | Quote comparison, нет underwriting |
| Cleaning | Home | 60% | Booking, верифицированные клинеры |
| Babysitter / Kids | Home/Education | 40% | Нет background-check |
| Pets | Home | 30% | Groomers, vets, boarding |
| Wedding | Leisure | 20% | Vendor directory only |
| Wellness | Health | 30% | Yoga, meditation, coaching |
| Fitness | Health | 30% | Gym listings, class booking |
| Medical | Health | 30% | Clinic listings; нет телемедицины |
| Education | Life Admin | 40% | Schools, courses, tutors |
| Classifieds | Marketplace | 30% | Buy/sell used items |
| Transport | Transport | 20% | Driver listings; нет real-time tracking |
| Pharmacy | Health | 20% | Listings; нет рецептов |
| Banking | Life Admin | 20% | Информационный, нет интеграций |

#### 4.4.3. Emerging / Skeleton (готовность <40%) — расширение

| App | Vertical | Готовность | Что есть |
|-----|----------|------------|----------|
| Arrive (SIM, relocation) | Arrive | 20% | Статический контент |
| Nomad (coworking) | Live | 20% | Каталог пространств |
| Tools (COL calc, visa tracker) | Life Admin | 30% | Калькуляторы |
| Knowledge | Life Admin | 30% | KB-статьи |
| Trip Planner | Tourist | 30% | AI-планировщик |
| VIP Concierge | Help | 50% | Премиум-канал поддержки |
| SOS Emergency | Help | 60% | Hotline, geo-pin, страховой партнёр |
| Fast Track (airport) | Transport | 40% | Бронирование trip-ассиста |
| Laundry, Plumbing, AC, Gardening, Pest, Handyman, Locksmith | Home Maintenance | 20–30% | Каталог; bookable=true в БД |
| Veterinary | Health | 20% | Listings |
| Visa & Immigration | Legal | 50% | Чек-листы + лиды юристам |
| Peylaa (single project microsite) | Build | 70% | Marriott Phuket — флагман для DevMod |
| Thai Business Layer (B2B+B2C) | LIVE | GA (2026-06) | Кабинет тайского бизнеса с auto-RU↔TH/EN |
| LifeOS | CORE | 60% | Контекстные сценарии, AI-рекомендации |

### 4.5. B2B-порталы (внутри одного приложения)

Из `docs/SYSTEM_OVERVIEW.md`:

| Портал | Маршрут | Для кого | Страниц |
|--------|---------|----------|---------|
| Admin | `/admin` | Команда платформы | 71 |
| Owner/MC | `/owner` (и `/mc`) | Управляющие компании, портфолио-владельцы | 89 |
| Vendor | `/vendor` | Сервисные провайдеры | 18 |
| Team | `/team` | Внутренние uno_team | 8 |
| Capital CRM | `/capital` (crm.bymyuno.com) | Sales-команда | 9 |
| Guest | `/guest` | Гости арендованных апартаментов | (in-stay) |
| Staff | `/staff` | Linhe-staff УК | (operational) |

---

## 5. Ключевые потоки (Flagship Flows)

### 5.1. STAYS — основной recurring-доход

**Бизнес-смысл**: подписка $25/слот для владельцев и УК. Аналог Guesty / Hostfully / Lodgify, но в 5–10 раз дешевле и оптимизирован под Пхукет.

**Пользовательский путь** (Svetlana persona):
```
Owner signup → Role: "property_manager" / "owner"
  ↓
Property registration (фото, координаты, описание, цены, amenities)
  ↓
Pick subscription tier:
  - Basic ($25/mo, 1 слот)
  - Starter ($125/mo, 5 слотов)
  - Professional ($375/mo, 15 слотов) ← target tier
  - Enterprise ($1 250+/mo, 50+ слотов)
  ↓
Stripe subscription (через create-mc-subscription)
  ↓
PMS dashboard unlocked:
  - 89 страниц функционала
  - Channel Manager (25+ OTA)
  - iCal 2-way sync
  - Calendar с anti-double-booking constraints (DB-level)
  - Financial ledger
  - Guest chat + AI auto-reply
  - Monthly statements (owner-monthly-digest edge function)
  - Task management для уборщиков/обслуживания
  ↓
Each booking:
  - Auto-create order
  - Платёж через Stripe
  - Платформа берёт 0.3% management fee (помимо подписки)
  - Распределение: гость → owner; платформа удерживает fee
  - Запись в double-entry ledger
  - Уведомление + voucher гостю
```

**Юнит-экономика STAYS** (target):
- ARPU: $75–200/мес
- CAC: $200 (через capital advisory + content marketing)
- Payback: 1–3 мес
- Gross margin: 80%+ (нет cost of goods)
- Net retention: 110% (рост портфеля)

### 5.2. DEALS / INVEST — крупные единичные сделки

**Бизнес-смысл**: 5% комиссии с продажи новостройки или вторички. Один deal приносит больше, чем 50 подписок.

**Пользовательский путь** (Dmitry persona):
```
Visitor browses /invest или /newbuilds
  ↓
Лендинг проекта: ClearView рейтинг, локация, доходность, девелопер
  ↓
"Запросить консультацию" → form → CRM (nb_leads table)
  ↓
WhatsApp Павлу (через notify-lead-whatsapp)
  ↓
Pavel / Capital advisor контактирует <2h SLA
  ↓
Cycle (2 недели – 3 месяца):
  - Discovery call → property tour → due diligence (ClearView, юр.проверка)
  - DevMod KYC (ID upload + selfie + Anthropic Vision OCR)
  - Booking hold (5–20%) через devmod-create-booking-checkout
  - Final purchase (через юриста + банк)
  ↓
Закрытие сделки → платформа получает 5% комиссии от продавца (девелопер платит)
  ↓
Cross-sell: Stays PMS для покупателя; LegalServices для договоров
```

**Юнит-экономика DEAL**:
- Средний чек: $200K–$1M
- Комиссия: $10K–$50K за сделку
- Cost per lead (paid): $30–80
- Lead → SQL ratio: 15–25%
- SQL → close ratio: 8–15%
- CAC per closed deal: $1 500–4 000
- Profit per deal: $6 000–48 000

### 5.3. Marketplace checkout — массовая монетизация услуг

**Бизнес-смысл**: 10% комиссии с каждой транзакции. Объёмная модель: 1 000 заказов/мес × $50 средний чек × 10% = $5 000/мес. Масштабируется в десятки тысяч заказов.

**Универсальный flow** (для flowers, beauty, cleaning, restaurants, etc.):
```
User browses /flowers (или beauty, etc.)
  ↓
Selects item → Cart context (persistent в localStorage + DB)
  ↓
/cart → checkout
  ↓
create-*-checkout edge function:
  - Идемпотентность (session_id lookup)
  - calculate_order_totals():
    - baseAmount (вендору)
    - platformFee = baseAmount × 0.10
    - serviceFee (Stripe + VAT)
    - totalCustomerPays
  - Stripe Checkout Session created
  ↓
User on Stripe-hosted page → pays
  ↓
Stripe webhook (stripe-webhook):
  - Verify HMAC
  - Idempotency check
  - INSERT INTO orders (status='confirmed')
  - record_ledger_entries() RPC:
    - Debit user_account
    - Credit vendor_payable
    - Credit platform_revenue
    - Credit stripe_fee_expense
  - notify-vendor-order (WhatsApp / Telegram)
  - notify-admin-order
  - send-order-email (Resend)
  ↓
Vendor fulfills → marks complete
  ↓
post-order-autopilot:
  - Запрос отзыва через 24h
  - Cross-sell похожих услуг
  - Loyalty cashback enrolled
  ↓
Weekly: process_payout() RPC → Stripe Connect transfer to vendor
```

**Известные баги — status update 2026-06-25**:
- ✅ **Flowers/Bloom**: order создаётся; добавлен anti-price-tampering (валидация цен против `bouquets` table) + `enforceLineItemTotal` на Stripe line items. Commits `3cc727f` + `d43adb9` (PR #23).
- ✅ **Restaurant checkout**: edge cases закрыты — amount validation, conditional lineItems для items-based и deposit-based booking flows, явная `booking_type`/`restaurant_id` metadata.
- ✅ **Stripe webhook idempotency**: atomic confirm через conditional `UPDATE ... WHERE status != 'confirmed' RETURNING *` — только один из дублирующих deliveries запускает side-effects.
- ✅ **Wallet refund on order-creation failure**: `useWallet` корректно возвращает деньги при сбое INSERT в `orders` после Stripe success.

### 5.4. AI Concierge — premium-канал и снижение поддержки

**Бизнес-смысл**: единый AI-агент, который понимает контекст пользователя (фаза, роль, история заказов) и отвечает на любой вопрос — от «где ближайший ATM» до «как мне оформить tax residency». Снижает нагрузку на поддержку и создаёт premium-tier upsell.

**Flow**:
```
User opens chat (любая страница) → AI Concierge widget
  ↓
ai-concierge edge function:
  - Загружает user context (профиль, роль, последние 10 заказов, чек-листы фазы)
  - Загружает system_prompt из ai_agents.concierge
  - Загружает knowledge base из ai_agent_knowledge
  - Streaming response (Claude Sonnet / Gemini Flash)
  ↓
Если запрос требует action (book, pay, search):
  - AI вызывает structured tool call
  - Возвращает intent → user confirms → execute (никогда auto-execute money moves!)
  ↓
Логирование в ai_agent_logs (для quality control)
  ↓
Если AI не справился → escalate в Telegram канал uno_team
```

**Future monetization**: $9.99/мес Premium = unlimited concierge + priority support + 5% cashback на всё.

### 5.5. Guest experience (PMS-сторона)

**Бизнес-смысл**: гость, который заселяется в апартаменты под управлением myUNO, получает белый-лейбл-опыт, повышающий retention владельца на платформе.

**Flow**:
```
Booking created (через Airbnb / Booking / прямую бронь)
  ↓
24h before check-in:
  - send-guest-welcome-whatsapp (приветствие, инструкции, гайд-PDF)
  ↓
Day of check-in:
  - Auto check-in code (если smart-lock интегрирован)
  - Открывается /guest dashboard
  ↓
During stay:
  - Чат с хозяином (с AI auto-reply backup)
  - In-app upsell: трансферы, ужины, экскурсии, цветы → платформа берёт 10%
  ↓
Check-out:
  - Inventory check (через staff dashboard)
  - Запрос отзыва (для Airbnb синк)
  - Cross-sell на следующий приезд + loyalty
```

### 5.6. Lead routing → WhatsApp Pavel (текущий приоритет)

Все high-value лиды (deals, viewings, capital advisory) маршрутизируются напрямую в WhatsApp основателю. Это критичный mechanism: AI не может закрывать сделки за $500K, нужен человек. Edge function: `notify-lead-whatsapp` через UltraMSG.

### 5.7. Onboarding — выбор роли и персонализация

**Flow**:
```
First signup → /auth → email + password / Google OAuth
  ↓
/onboarding/role:
  - Pick 1-3 roles (Tourist/Resident/Owner/Investor/...)
  - Pick languages preference (RU/EN)
  - Pick interests (housing/legal/lifestyle)
  ↓
LifeOS personalises home:
  - Анна (tourist+family) видит: «7-day checklist», ближайшие activities, школы
  - Дмитрий (investor+resident) видит: ClearView dashboard, новые deals, news
  ↓
First action triggers nurture:
  - Booking → loyalty enroll
  - Lead → SDR contact
  - Browsing patterns → segment update (update-user-segments daily cron)
```

### 5.8. Referral & cashback — viral loop

```
User gets referral code at signup → useReferral hook
  ↓
Shares code → friend signs up + первый заказ ≥ ฿100
  ↓
Trigger calculate_order_cashback() RPC:
  - Friend: +฿20 cashback в wallet
  - Original user: +฿20 referral bonus в wallet
  ↓
Wallet balance → spent on next order → drives repeat
```

---

## 6. Бизнес-модель

### 6.1. Пять параллельных потоков дохода (текущая модель)

```
┌─────────────────────────────────────────────────────────────────┐
│                       myUNO Revenue Streams                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. MARKETPLACE COMMISSION (10%)        ──── transactional       │
│     · 59 категорий услуг                                         │
│     · сценарий: 5K orders/mo × $40 × 10% = $20K/mo               │
│                                                                  │
│  2. REAL ESTATE COMMISSION (5%)         ──── high-ticket         │
│     · комиссия с продавца / девелопера                           │
│     · 1 deal $300K × 5% = $15K за сделку                         │
│                                                                  │
│  3. PMS SUBSCRIPTION ($25/слот)         ──── recurring SaaS      │
│     · 4 тира: Basic / Starter / Professional / Enterprise        │
│     · sticky продукт, multi-year retention                       │
│                                                                  │
│  4. VENDOR SUBSCRIPTION                 ──── recurring SaaS      │
│     · freemium → professional tier $X/mo                         │
│     · разблокирует analytics, multi-staff, priority placement    │
│                                                                  │
│  5. CONSUMER PREMIUM (Future)           ──── recurring B2C       │
│     · $9.99/mo Premium: unlimited concierge + priority + 5% CB   │
│     · target conversion: 5% активных consumer-users              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Дополнительные потоки (Phase 2–3)**:
- 6. Wallet float (1–2% spread на pre-loaded balance)
- 7. AI services SaaS (Pricing Optimizer для вендоров — $50/mo)
- 8. Featured listings (sponsored placements в Discover)
- 9. Data & analytics B2B (market insights, benchmarking — Phase 3)
- 10. White-label DevMod (1–3% от продаж застройщика + setup fee)
- 11. Cross-border payments (FX margin на международные переводы — Phase 3, требует e-money license)

### 6.2. Стратегия монетизации по фазам аудитории

| Фаза пользователя | Сколько даёт деньги | Когда | Через что |
|-------------------|---------------------|--------|-----------|
| ARRIVE (турист) | $50–200 | в первые 7 дней | Услуги (трансфер, ресторан, экскурсии) |
| LIVE (резидент) | $50–300/мес | каждый месяц | Cleaning, beauty, schools, vet, legal |
| MANAGE (owner) | $75–2 400/мес | каждый месяц | PMS subscription + 0.3% management fee |
| INVEST (investor) | $10K–$50K единоразово, потом recurring | при крупной сделке + retention | RE commission + cross-sell PMS |
| BUILD (developer) | $500–5K/мес + 1–3% от продаж | recurring + одноразовые spikes | SaaS + platform fee |

### 6.3. Self-recommended бизнес-модель: «Якорная вертикаль + расширение»

После анализа структуры кода и рынка, **самая перспективная стратегия** — НЕ распылять усилия по 59 апп, а:

#### Stage 1 (год 1, 2026): «Доказать STAYS + DEALS как ядро»
- 80% продуктовых ресурсов на: Property + Stays + Newbuilds + CRM + Capital advisory.
- 20% на: Concierge + Wallet + 5–7 ключевых услуг (cleaning, beauty, restaurants, transport, legal).
- KPI: 200 active properties under management, 30 RE deals, $400K MRR.

#### Stage 2 (год 2, 2027): «Расширить услуги вокруг недвижимости»
- Запустить «Resident Pack» — подписка $19.99/мес для долгосрочных экспатов: безлимитный консьерж + скидки на услуги + приоритетная поддержка + cashback.
- Активировать Home Maintenance кластер (laundry, plumbing, AC, gardening) — это recurring «утилитарный» доход.
- Лицензировать первого партнёра по trust/escrow для transactions >$10K.
- KPI: 500 properties, 100 deals, $1.5M MRR, NPS 50+.

#### Stage 3 (год 3, 2028): «Финтех + регион»
- Запустить wallet с PromptPay (требует local e-money license через Bank of Thailand).
- Расшириться в Бангкок (другая динамика, меньший фокус на недвижимости, больше на consumer services).
- Запустить B2B layer: data & analytics для девелоперов и УК (анонимизированные benchmark).
- KPI: 2K properties (включая Бангкок), 300 deals/yr, $5M MRR.

### 6.4. Юнит-экономика (target steady-state, год 3)

| Метрика | Значение | Комментарий |
|---------|----------|-------------|
| MAU | 250K | 80% consumers, 15% vendors/owners, 5% admins |
| % paying | 12% | (consumers buying services + all SaaS subscribers) |
| ARPU all-users | $20/mo | смешанный |
| ARPU paying | $167/mo | |
| Blended take rate | 12% | (10% services + 5% RE / blended weights) |
| Gross margin | 78% | (after Stripe + AI + WhatsApp/Telegram costs) |
| CAC (blended) | $25 consumers / $200 SaaS / $2K deals | |
| Payback period | 4 mo SaaS / 1 mo consumer | |
| Net revenue retention | 115% | upsell + cross-sell |
| LTV/CAC | 6× consumers / 12× SaaS | |

### 6.5. Сравнение моделей: pure-marketplace vs SaaS vs hybrid

| Модель | Pros | Cons | Verdict |
|--------|------|------|---------|
| Pure marketplace 10% | Простая, понятная | Зависит от объёма, низкая лояльность вендоров | ❌ единственная — мало |
| SaaS-only | Predictable MRR, sticky | Маленький TAM на Пхукете | ❌ единственная — мало |
| **Hybrid: SaaS ядро (PMS) + marketplace overlay + RE commission** | Diversified, сетевой эффект, разные LTV для разных персон | Сложность управления продуктом | ✅ **рекомендую** |

---

## 7. Архитектура

### 7.1. Высокоуровневая схема

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT (PWA + Native)                    │
│   React 18 SPA · Vite 6 · TypeScript 5.9 · Tailwind + shadcn/ui  │
│   Capacitor (iOS + Android wrappers)                              │
│   Service Worker (offline, push, cache busting)                   │
└────────────────────┬─────────────────────────────────────────────┘
                     │ HTTPS + WSS (Realtime)
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Supabase (Lovable Cloud)                   │
│  ┌───────────────────────┐  ┌────────────────────────────────┐   │
│  │  PostgreSQL (417 tbl) │  │   Auth (JWT, OAuth, MFA, OTP)   │   │
│  │  RLS по всем таблицам │  └────────────────────────────────┘   │
│  │  Realtime: 17 каналов │  ┌────────────────────────────────┐   │
│  │  Storage (image/doc)  │  │ Edge Functions (~170, Deno 2)  │   │
│  └───────────────────────┘  └────────────────────────────────┘   │
└──┬──────────────┬────────┬──────────────┬──────────────┬────────┘
   │              │        │              │              │
   ▼              ▼        ▼              ▼              ▼
┌──────┐    ┌─────────┐ ┌──────┐    ┌──────────┐  ┌───────────┐
│Stripe│    │Resend   │ │UltraM│    │ Google   │  │ Anthropic │
│Pay+  │    │email    │ │SG WA │    │ Maps +   │  │ Claude /  │
│Conn  │    │         │ │TG Bot│    │ Geocode  │  │ Gemini    │
└──────┘    └─────────┘ └──────┘    └──────────┘  └───────────┘

┌──────────────┐  ┌────────────────┐  ┌─────────────────┐
│ Rentals      │  │ Airbnb / iCal  │  │ Firecrawl       │
│ United       │  │ Booking.com    │  │ (web scraping)  │
└──────────────┘  └────────────────┘  └─────────────────┘
```

### 7.2. Стек по слоям

| Слой | Технология | Версия | Назначение |
|------|------------|--------|-----------|
| Build | Vite + SWC | 6.x | Dev server + production bundling |
| UI Framework | React | 18.3 | Component model |
| Language | TypeScript | 5.9 | Type safety |
| Styling | Tailwind CSS + tokens | 3.4 | Utility-first, semantic tokens |
| UI Kit | shadcn/ui + Radix | latest | Headless accessible components |
| Routing | React Router | 6.30 | SPA navigation |
| Data | TanStack Query | 5.83 | Server state cache |
| Forms | React Hook Form + Zod | 7.61 / 3.25 | Validation |
| Animation | Framer Motion | 12.25 | Page transitions |
| Charts | Recharts | 2.15 | Финансовая аналитика |
| Maps | @react-google-maps/api | 2.20 | Google Maps (заменил Mapbox) |
| Auth | Supabase Auth + Lovable Cloud Auth | — | JWT sessions |
| DB | PostgreSQL via Supabase | 15+ | Primary data store |
| Realtime | Supabase Realtime | — | WebSocket subscriptions |
| Edge | Supabase Edge Functions (Deno 2.0) | — | Serverless backend |
| Payments | Stripe + Stripe Connect | latest | Cards, subscriptions, vendor payouts |
| Email | Resend | — | Транзакционные письма |
| Messaging | UltraMSG (WhatsApp) + Telegram Bot | — | Notifications |
| AI | Anthropic Claude + Google Gemini (via Lovable AI Gateway) | — | Concierge, generation, OCR |
| Scraping | Firecrawl | — | Etagi, OTA, Phuket Insider |
| Mobile | Capacitor | — | iOS/Android wrappers |
| PWA | vite-plugin-pwa + workbox | — | Offline, push, install prompts |
| Monitoring | Sentry | 10.48 | Error tracking |
| Testing | Vitest + Testing Library + Playwright | 3.2 / 1.59 | Unit + E2E |

### 7.3. Структура кода

```
src/
├── pages/          # 566 страниц по 42–45 вертикалям (verified 2026-06-25)
├── components/     # 1003 компонента по 73–90 доменным папкам
│   └── layout/
│       ├── pageRegistry.ts    # lazy-imports всех страниц
│       └── AnimatedRoutes.tsx
├── hooks/          # 310–429 custom hooks
├── contexts/       # 12–15 глобальных providers
├── integrations/
│   ├── supabase/client.ts     # единственный экземпляр клиента
│   └── supabase/types.ts      # 1.1MB автогенерированные типы
├── lib/
│   ├── appRegistry.ts         # реестр 60 микро-приложений (~21KB)
│   ├── verticalGroups.ts      # 7 групп
│   ├── config/routes.ts       # 400+ маршрутов
│   ├── taxonomies/master.ts   # 6 surfaces, 25 personas, 10 JTBD clusters
│   ├── taxonomies/            # service categories, amenities, etc.
│   ├── adapters/              # data transformation
│   ├── ai/                    # AI utilities
│   ├── catalog/taxonomy.ts    # 14 категорий / ~69 услуг (static SSOT)
│   ├── filterConfigs/         # catalog filter configs
│   ├── appVersion.ts          # 3.55.5
│   └── calculateOrderTotals.ts # universal pricing engine
├── i18n/           # RU/EN/TH (TH частично)
├── styles/         # vertical CSS + tokens.css (DS 2.1 SoT)
├── design-system/  # компонент-каталог + foundations
├── config/         # CRM types, maintenance schedules
└── types/          # TypeScript definitions + auth.ts (app_role enum, 18 values)

supabase/
├── functions/      # 172 Edge Functions (Deno 2.0) — verified 2026-06-25
│   └── _shared/    # checkout-handler, admin-config, whatsapp, cors (whitelist), etc.
└── migrations/     # 552–757 SQL миграций
```

### 7.4. 12 глобальных Context Providers

Из `src/contexts/`:

| Context | Назначение |
|---------|-----------|
| `AuthContext` | Сессия, JWT refresh, auto-logout |
| `LanguageContext` | RU/EN/TH с DB-overrides и realtime |
| `CurrencyContext` | THB / USD / EUR / RUB |
| `LocationContext` | Геолокация + proximity search |
| `CartContext` | Dual-storage (localStorage + DB), merge при логине |
| `ThemeContext` | Light/dark/system (DS 2.1 — light по умолчанию) |
| `MaintenanceContext` | Feature flags + maintenance mode |
| `PWAInstallContext` | Install prompt |
| `LifeSituationContext` | Контекстные сценарии для LifeOS |
| `StorefrontContext` | Vendor storefront state |
| `GoogleMapsContext` | Maps SDK инициализация |
| `DashboardFilterContext` | Persistent filter state для admin/vendor |

### 7.5. 6 канвасов (Canvas / App Shell)

Это long-lived shells глобальной навигации (отличается от 6 Content Surfaces!):

| Canvas | URL | Назначение |
|--------|-----|-----------|
| Home | `/` | LifeOS personalized hub |
| Discover | `/discover` | Situation-first grid (NavigatorPageV3) |
| Operate | `/owner` `/mc` `/vendor` `/admin` | Все B2B-порталы |
| Wallet | `/wallet` | Финансы пользователя |
| Me | `/account` | Профиль, настройки |
| Admin | `/admin` | Платформенное управление |

### 7.6. Hard rules архитектуры (из `docs/canonical/architecture/ARCHITECTURE_V2.md` §13)

Эти правила должны соблюдаться всеми разработчиками и AI-ассистентами:

1. **Never add a new top-level route.** Только под cluster или `/operate/*`.
2. **Never create a new shell.** Использовать `MiniAppLayout` или существующий Operate shell.
3. **Never hardcode a hex colour.** Только переменные `src/styles/tokens.css`.
4. **Never import across cluster boundaries.** Использовать shared L4 primitives или L3 services.
5. **Never auto-execute money moves from an agent.** Только user-confirmed intent.
6. **Every money-moving screen must show audit marker** (tx_id + ledger_entry_id + timestamp).
7. **Every new feature gated behind `feature_flag:*`** в `system_settings` до GA.

### 7.7. AI-стек

**Шлюз**: Lovable AI Gateway (без внешних ключей в фронт-коде).

**Модели**:
- Anthropic Claude (Sonnet 4.6, Opus 4.7/4.8) — для сложных reasoning задач (ClearView draft, Legal assistant, Concierge)
- Google Gemini 2.5/3.x Flash/Pro — для скорости (translations, descriptions, lead scoring)

**Где хранятся настройки**:
- `ai_agents` — конфигурация (model, temperature, max_tokens, тон)
- `ai_agent_knowledge` — knowledge base, system prompts, версионирование
- `ai_agent_logs` — analytics использования
- `ai_artifacts` — сгенерированный контент с feedback loop

**Канонические system prompts** — `docs/canonical/08-ai-prompts-library.md`.

**20+ AI Edge Functions**:
- `ai-agent`, `ai-concierge`, `ai-chat-moderator`, `ai-orchestrator`
- `ai-smart-search`, `ai-generate-description`, `ai-generate-offer`
- `ai-pricing-optimizer`, `ai-financial-advisor`
- `ai-image-enhance`, `ai-guest-autoreply`, `ai-owner-nurture`
- `ai-cross-sell`, `ai-content-planner`, `ai-legal-assistant`
- `ai-support-chat`, `ai-translate`, `ai-intake-extract`
- `ai-platform-intelligence`, `ai-personalize-home`
- `intake-listing-agent`, `lifeos-ai-analyst`, `listing-quality-analyzer`
- `crm-ai-assistant`, `vendor-outreach-agent`

### 7.8. Финансовый слой и аудит

**Двойная бухгалтерия (double-entry ledger)**:
- `orders` — операционный слой (что видят пользователи и вендоры)
- `ledger_entries` + `ledger_accounts` — аудит-слой (regulatory-grade)
- RPC `record_ledger_entries()` авто-вызывается при `checkout.session.completed`
- Daily `reconciliation_alerts` показывают расхождения

**Атомарные RPCs** (защита от race conditions):
- `create_order_atomic` — создание заказа целостно
- `process_payout` — выплата вендору
- `calculate_order_totals` — единая логика расчёта (base, fee, vendor payout)
- `calculate_order_cashback` — кэшбэк на основе loyalty правил

**Идемпотентность**:
- Все Stripe webhooks проверяют `stripe_session_id` перед записью.
- Все critical write-операции защищены unique constraints.

### 7.9. Безопасность

| Слой | Механизм |
|------|----------|
| RLS | Включён на всех пользовательских таблицах |
| RBAC | `user_roles` table + `has_role()` SECURITY DEFINER function |
| MC-контекст | `resolve_user_context` RPC проверяет `auth.uid()` |
| Edge functions internal | `X-Internal-Secret` header для 21 функции (cron, webhooks) |
| JWT | `verify_jwt = true` по умолчанию |
| Soft delete | `is_active = false` вместо физического удаления |
| Audit | `admin_audit_logs` для всех админ-действий |
| CSP | Headers через Vercel config |
| Secrets | Backend secrets только в Supabase / Vercel env, никогда не в `.env` фронтенда |

**Security posture — verified 2026-06-25**:

| Item | Bible v1.0 claim | Verified state | Action |
|------|-------------------|----------------|--------|
| CORS | «wide open `*` на всех edge functions» | ✅ **RESOLVED** — `_shared/cors.ts` использует whitelist (`myuno.app`, `www.myuno.app`, Lovable hosts, localhost dev). `isLovablePreview()` сужает preview-хосты до конкретного project_id `dcc2b024-...`. Fallback → `https://myuno.app`. | Закрыто |
| Refresh tokens | «localStorage, XSS risk» | 🟡 **STILL AT RISK** — `src/integrations/supabase/client.ts` line 13: `persistSession: true` без custom storage. supabase-js по умолчанию пишет в localStorage. | Open: миграция на httpOnly cookies — добавлено в Q4 2026 roadmap |
| Auth guards | «inconsistent, некоторые routes не обёрнуты» | ✅ **CONSISTENT** — `/admin/*` → `RoleGuard`, `/owner/*` → `MCPortalGuard`, `/investor/*` → `InvestorGuard`. Public routes (`/discover`, `/flowers`, etc.) намеренно не требуют auth — это by design (discovery). | Закрыто — pattern по тирам соблюдён |
| `as any` casts | «649 across 244 files» | 🟡 **IMPROVING** — 495 в `main` (–24% от заявленных). PR #23 закрыл часть в auth contexts и booking flows. | Open: продолжать выпиливать (target <300 к концу Q4 2026) |
| Stripe webhook | (не указывалось в v1.0 как debt) | ✅ **HARDENED** — atomic confirm через conditional UPDATE с `.neq('status', 'confirmed').select()`, защита от дублирующих deliveries. | Закрыто (PR #23) |
| Rate limiting | (не указывалось) | ✅ **HARDENED** — `check_rate_limit` RPC сделан атомарным через per-identifier advisory lock. | Закрыто (PR #23) |
| CSP header | «нет CSP» | ✅ **RESOLVED (v1.2 correction)** — production CSP в `index.html:18` действует с 2026-06-18. `default-src 'self'` + whitelist для Google Maps, Supabase (WSS), Google Fonts. `frame-ancestors` намеренно убран из meta (браузер игнорирует и Lighthouse ругался) — clickjacking-защита через `X-Frame-Options` на HTTP-уровне (Lovable infra ставит автоматически; для custom domains — Vercel header). | Закрыто. Опциональное усиление в будущем: убрать `'unsafe-inline'`/`'unsafe-eval'` через nonce-based CSP (требует переписи inline-скриптов) |

---

## 8. Дизайн (Design System 2.1)

### 8.1. Эстетическое направление

**DS 2.1 (актуальное, апрель 2026)**: civic infrastructure — спокойствие, авторитет, light-first.

Референсы: GOV.UK, e-Estonia, The Economist, Apple support docs.

**Запрещено**:
- ❌ Mint `#00D68F` как primary (был в DS 2.0)
- ❌ 6-color cluster rainbow (mint/blue/gold/purple/teal/red)
- ❌ Glassmorphism, glow effects, decorative gradients
- ❌ Dark-default theme (теперь light по умолчанию, dark — opt-in)
- ❌ Golos Text / DM Sans / JetBrains Mono (DS 2.0 шрифты)
- ❌ Mid-range radius 8–16px (выбор только из 0 / 2 / 9999)

**Обязательно**:
- ✅ Cream `#F7F5F1` background, Ink `#1C1916` foreground
- ✅ Navy `#0A2240` primary, Orange `#D96B1A` accent (≤3% screen)
- ✅ Sharp corners (`--radius: 0`)
- ✅ Source Serif 4 (headings), Geist (body), IBM Plex Mono (numerics с tnum)
- ✅ Min touch target 44×44 на coarse pointer
- ✅ Mobile = Sheet (bottom), не Dialog
- ✅ Semantic tokens (`bg-primary`, `text-accent`), не raw hex

### 8.2. Палитра

**Light theme (default — `:root`)**:

| Token | HEX | Применение |
|-------|-----|------------|
| `--background` | `#F7F5F1` | Page bg (cream) |
| `--foreground` | `#1C1916` | Ink text |
| `--primary` | `#0A2240` | CTAs, brand (navy) |
| `--accent` | `#D96B1A` | Singular accent (orange) |
| `--card` | `#FFFFFF` | Cards, modals |
| `--border` | `#E5E5E4` | Dividers |
| `--success` | `#16A34A` | Success states |
| `--warning` | `#D97706` | Warnings |
| `--destructive` | `#DC2626` | Destructive actions |

**Dark theme (admin/MC opt-in only — `.dark`)**:
- Background: navy-900 `#051428`
- Foreground: cream `#F7F5F1`
- Primary: orange `#D96B1A` (лучше контраст на navy)
- Accent: navy-light

**Cluster accents (DS 2.1 — muted)**:
- arrive · navy-muted
- live · orange-muted
- legal · orange
- invest · navy
- manage · stone
- build · navy-orange

### 8.3. Типографика

| Token | Size | Weight | Font |
|-------|------|--------|------|
| display-lg | 2.5rem | 800 | Source Serif 4 |
| display-md | 2rem | 700 | Source Serif 4 |
| heading-lg | 1.5rem | 600 | Source Serif 4 |
| heading-md | 1.25rem | 600 | Source Serif 4 |
| heading-sm | 1.125rem | 600 | Source Serif 4 |
| body-lg | 1rem | 400 | Geist |
| body-md | 0.875rem | 400 | Geist |
| body-sm | 0.8125rem | 400 | Geist |
| caption | 0.75rem | 500 | Geist |
| numerics | — | — | IBM Plex Mono (`tnum`) |

Locale fallback (RU): Unbounded → Golos Text → Noto Serif/Sans.
Locale fallback (EN): Noto Serif → Noto Sans → Georgia/system-ui.

### 8.4. Spacing & Layout

- **Base unit**: 4px
- **Scale**: 0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 px
- **Card padding**: 16px (default), 12px (compact)
- **Breakpoints**: xs 400 · sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1400
- **Max content**: 1400px container

### 8.5. Motion

- Standard easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Spring (для confirmations): `cubic-bezier(0.175, 0.885, 0.32, 1.275)`
- Duration scale: instant 50ms · fast 100ms · normal 150ms · slow 250ms · entrance 300ms
- Keyframes: `fade-in`, `fade-in-up`, `accordion-down/up`

### 8.6. Voice & Tone (Brand)

Источник: `docs/canonical/03-tone-of-voice.md`.

**Голос**: «спокойная уверенность». Мы продаём не транзакцию, а доверие.

**Правила**:
- Никаких CAPS, восклицательных знаков, «🔥», urgency-tactics.
- Короткие сильные предложения.
- Билингвальность: каждая user-facing строка в RU и EN.
- На английском: international English, без американизмов и без сленга.
- На русском: естественный, без бюрократизмов.
- Не объясняем за пользователя то, что он уже знает.

### 8.7. ClearView™ — визуальный язык рейтингов

Источник: `docs/canonical/06-clearview-methodology.md`.

**ClearView** — собственная методология рейтинга off-plan недвижимости. 7 grades + unrated:
- AAA (выдающийся) → AA → A → BBB → BB → B → CCC (рискованный) → Unrated

8 категорий оценки:
1. Developer track record
2. Location quality
3. Construction progress
4. Financial transparency
5. Legal due diligence
6. Build quality (если есть данные)
7. ROI realism
8. Exit liquidity

Это **моат #8** платформы — единственный объективный рейтинг на рынке Пхукета.

---

## 9. Данные

### 9.1. Схема БД (overview)

~540 определений (таблицы + views + relations) в `public` schema по `src/integrations/supabase/types.ts` (verified 2026-06-25, +120 к v1.0 estimate). Точный счёт чистых таблиц требует доступа к `information_schema`. Категории:

| Категория | Tables | Ключевые |
|-----------|--------|----------|
| Auth & Users | 12 | profiles, user_roles, user_sessions, user_personas, user_achievements |
| Properties (PM) | 45 | properties, property_bookings, property_financials, property_complexes |
| CRM | 32 | crm_contacts, crm_companies, crm_pipelines, crm_tasks, crm_sequences |
| Orders & Cart | 18 | orders, order_items, payment_intents |
| Bookings (multi-vertical) | 15 | bookings, tour_bookings, event_bookings, airport_bookings |
| Vendors & Providers | 20 | providers, vendor_services, vendor_payouts, vendor_subscriptions |
| Management Companies | 8 | management_companies, mc_property_slots, company_storefronts |
| Marketplace | 14 | marketplace_products, marketplace_vendors, marketplace_reviews |
| Restaurants | 7 | restaurants, restaurant_menus |
| Real Estate (Newbuilds) | 7 | developers, development_units, nb_leads, nb_promotions |
| Beauty/Wellness | 6 | salons, salon_services, gyms, clinics, medical_services |
| AI & Automation | 12 | ai_agents, ai_agent_logs, ai_artifacts, ai_intake_sessions |
| Marketing (MCC) | 18 | mcc_campaigns, mcc_leads, mcc_funnels, mcc_ab_tests |
| Finance | 10 | wallets, ledger_accounts, ledger_entries, owner_invoices |
| Analytics & Metrics | 15 | analytics_events, page_views, platform_metrics |
| LifeOS | 10 | life_scenarios, life_situations, life_tasks |
| Yachts | 5 | yachts, yacht_availability, yacht_pricing_rules |
| Notifications & Comms | 8 | notifications, notification_preferences, push_subscriptions |
| Gamification & Loyalty | 8 | achievement_definitions, user_achievements, cashback_settings, referral_codes |
| Legal & Insurance | 6 | legal_documents, insurance_providers, insurance_plans |

### 9.2. Паттерны данных

- **Билингвальность**: `name_en` / `name_ru`, `description_en` / `description_ru`
- **Soft delete**: `is_active boolean default true`
- **Модерация**: `approval_status` (pending → approved/rejected), `reviewed_by`, `reviewed_at`
- **Провайдер**: `provider_id FK → providers`
- **UNO-контент**: `created_by_uno_team`, `uno_team_creator_id`

### 9.3. Realtime каналы (17)

```
booking_messages, notifications, property_bookings,
property_chat_messages, service_orders, orders, order_status_history,
portal_messages, owner_notifications, translations,
support_tickets, ticket_messages, team_messages, chat_message_flags,
property_maintenance_schedules, property_activity_log, realtime_stats,
mcc_landing_events, mcc_ai_recommendations, lifecycle_executions
```

### 9.4. Канонический Data Schema

Источник: `docs/canonical/09-data-schema.md` — single source of truth по таблицам, enums, RLS, FK, naming conventions Supabase. При расхождении кода и canon — правится код, не документ.

---

## 10. Интеграции

| Сервис | Назначение | Статус |
|--------|------------|--------|
| Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions) | Core backend | ✅ Active |
| Stripe + Stripe Connect | Платежи, подписки, выплаты вендорам | ✅ Test → switching to live |
| Google Maps API | Maps, Places, Geocoding | ✅ Active (заменил Mapbox) |
| UltraMSG | WhatsApp incoming/outgoing | ✅ Active |
| Telegram Bot API | Admin notifications, posting | ✅ Active |
| Resend | Транзакционные email | ✅ Active |
| Anthropic Claude API | AI Concierge, ClearView, OCR | ✅ Active |
| Google Gemini (via Lovable AI Gateway) | Fast AI tasks | ✅ Active |
| Firecrawl | Web scraping (Etagi, OTA, content) | ✅ Active |
| Rentals United | Channel manager (25+ OTA) | ✅ Active |
| Airbnb / Booking iCal | Календарная синхронизация | ✅ Active |
| Sentry | Error monitoring | ✅ Production only |
| Capacitor | iOS/Android wrappers | ✅ Active |
| Lovable Cloud Auth | Auth wrapper | ✅ Active |
| PWA (workbox) | Offline + push + install | ✅ Active |

**Не используются** (несмотря на упоминания в старых docs):
- ❌ Mapbox (выпилен)
- ❌ Twilio (WhatsApp через UltraMSG)
- ❌ OpenAI (Anthropic + Gemini)

---

## 11. Go-to-market и экспансия

### 11.1. Фаза 1 (2026): Pavla and core team в Phuket

**Тактика**:
- Контент-маркетинг на русскоязычную аудиторию через YouTube, Telegram-каналы, Instagram-блогеров об эмиграции.
- Capital advisory как личный sales-канал Pavel'а (high-ticket deals).
- Партнёрства с агентствами недвижимости: cross-listing их объектов на myUNO с share of commission.
- Партнёрства с релокационными агентствами: bundled offering.
- SEO: лендинги «Apartments Phuket», «Buy condo Phuket», «Property management Phuket» на 4 языках.

**Channel mix**:
- Content (organic) — 40% leads
- Paid (Meta/Google ads, RU markets) — 30%
- Referral — 20%
- Direct partnerships — 10%

**Target**: 5K MAU, 100 active properties under PMS, 30 closed RE deals.

### 11.2. Фаза 2 (2027): Bangkok + Samui

**Тактика**:
- Открытие сатлайт-офиса в Бангкоке (1 BD + 1 city ops).
- Активация Resident Pack (B2C premium subscription).
- Запуск vendor SaaS как самостоятельного продукта (отдельная воронка).
- Программа vendor-acquisition: AI-агент `vendor-outreach-agent` ищет потенциальных вендоров в Google Maps / Phuket Insider, делает первый contact.

**Target**: 50K MAU, 500 properties, 100 deals, $1.5M MRR.

### 11.3. Фаза 3 (2028): региональная экспансия

**Кандидаты для следующих рынков** (в порядке приоритета):
1. **Бали (Индонезия)** — похожая аудитория (long-stay экспаты + туристы), большая русскоязычная диаспора
2. **Дубай (UAE)** — другая аудитория (преимущественно investors), но overlap по visa/legal/finance
3. **Tbilisi (Грузия)** — низкая стоимость экспансии, активная RU/EN аудитория
4. **Подгорица/Бар (Черногория)** — растущий экспат-хаб

**Что переиспользуется** — 80% кода (multi-tenant на уровне city/region уже спроектирован в `master.ts`).

**Что нужно локализовать**:
- Локальные платежи (DANA в Бали, Mada в UAE, BoG в Грузии)
- Локальные регуляции
- Локальный контент (legal/visa/banking)

### 11.4. Customer Acquisition Cost (CAC) targets

| Сегмент | CAC | Channel mix | Payback |
|---------|-----|-------------|---------|
| Tourist (Anna) | $5–15 | Mostly organic / referral | 1 order |
| Resident (Anna→) | $25–50 | Content + paid | 1 month |
| Owner (Svetlana) | $150–300 | Direct outreach + content | 2–4 months |
| Investor (Dmitry) | $1 500–4 000 | Capital advisory + premium content | 1 deal |
| Vendor (Yulia) | $50–150 | Vendor-acquisition agent + cold | 2 months |
| Developer (Sergey) | $5K–20K | Direct B2B sales | 1 project |

---

## 12. Конкуренция и moat

### 12.1. Конкурентная карта

| Игрок | Категория | Регион | Threat level |
|-------|-----------|--------|--------------|
| **Hipflat / DDproperty / Thailand Property** | RE portal | TH | Low (плоский каталог, нет PMS, нет AI) |
| **Airbnb / Booking / Agoda** | OTA | Global | Low (мы дополняем, не конкурируем) |
| **Guesty / Lodgify / Hostfully** | PMS SaaS | Global | Medium (мы дешевле, локализованы под TH) |
| **Grab / Foodpanda** | Local services | SEA | Low (другой сегмент — местные жители) |
| **LINE MAN / Wongnai** | Local | TH | Low (тайский фокус) |
| **WeChat Pay / Alipay** | FinTech | China | NA (не TH рынок) |
| **Локальные WhatsApp-агенты** | Service brokers | Phuket | Medium (фрагментированы, но укоренены) |
| **Phuket Insider, Phuket Index** | Content | Phuket | Low (media, не платформа) |

### 12.2. 8 источников конкурентного преимущества (moats)

1. **Expat-first позиционирование** — никто из конкурентов не таргетирует exclusively приезжих. Это уникальная ниша.
2. **Билингвальность как core**, а не add-on — каждая user-facing строка переведена через i18n.
3. **AI-first архитектура** — 20+ AI агентов; конкуренты тратят годы на догон.
4. **Property + Services bundle** — комбинация redke; владелец недвижимости имеет более высокий LTV, чем чистый consumer.
5. **Двойная бухгалтерия из коробки** — regulatory-grade audit trail, готовность к лицензиям.
6. **DevMod** — белый-лейбл для девелоперов = эффективный B2B-канал growth.
7. **Multi-tenant с первого дня** — масштабирование на новые города без переписи кода.
8. **ClearView™ методология** — единственный объективный рейтинг off-plan на рынке Пхукета.

### 12.3. Чего нам не хватает (honest assessment)

- **Native mobile app** (сейчас PWA + Capacitor wrappers; для superapp нужен полноценный React Native или Flutter).
- **Локальные платежи Таиланда** (PromptPay, TrueMoney, LINE Pay) — Stripe для тайцев почти бесполезен.
- **E-money license** (Bank of Thailand) — необходимо для запуска полноценного wallet.
- **Logistics layer** (доставка) — для food/flowers/pharmacy нужны курьеры.
- **Большой brand awareness** — мы стартап, конкуренты с инсталл-базами в миллионы.

---

## 13. KPIs и метрики успеха

### 13.1. North Star Metric

**Активные ежемесячные сделки на платформе** (Monthly Transactions Through Platform — MTTP). Считаем любую транзакцию ≥ $10, которая прошла через нашу платёжку или PMS-подписку.

Эта метрика объединяет все 5 потоков дохода и не позволяет одной вертикали «скрыть» провал другой.

### 13.2. Tier 1 KPIs (отслеживаются еженедельно)

| Метрика | Сейчас (Q2 2026) | 12 мес target | 24 мес target | 36 мес target |
|---------|-------------------|---------------|---------------|---------------|
| MAU | <1K | 10K | 50K | 250K |
| Active properties under PMS | 35 | 200 | 1 000 | 5 000 |
| Closed RE deals/quarter | <5 | 30 | 100 | 300 |
| MRR | <$5K | $50K | $400K | $2M |
| GMV/мес | <$50K | $500K | $4M | $25M |
| Take rate (blended) | ~9% | 11% | 12% | 13% |
| NPS (consumer) | n/a | 30+ | 45+ | 55+ |
| Churn (PMS) | n/a | <8%/mo | <5%/mo | <3%/mo |

### 13.3. Tier 2 KPIs (ежемесячные ops)

- Lead → SQL conversion (Capital): 15–25%
- SQL → closed deal: 8–15%
- Time-to-first-booking (новый user): <7 дней
- Concierge response time: <30s (AI), <2h (human escalation)
- Order-to-payout time (vendor): <7 дней
- Reconciliation alerts/day: <5
- Bugs in production (P0/P1): 0 in steady state

### 13.4. Анти-KPIs (то, чего мы НЕ хотим)

- ❌ Не оптимизируем под total registered users (vanity)
- ❌ Не гонимся за number of listings без quality control
- ❌ Не растим vendor pool за счёт снижения SLA
- ❌ Не делаем GMV за счёт low-margin категорий (food delivery с 0% take rate ради «трафика»)

---

## 14. Дорожная карта

### 14.1. Q3 2026 (текущий) — статус после аудита 2026-06-25

**Сделано (verified в `main`)**:
- ✅ PR #23: codebase audit fixes — все заявленные фиксы подтверждены в `main`. Затронутые файлы: `AuthContext.tsx`, `ImpersonationContext.tsx`, `PlatformViewAsContext.tsx`, `useWallet.ts`, `FlowersOrder.tsx`, edge functions (`create-flowers-checkout`, `stripe-webhook`, `cleanup-abandoned-orders`, `refund-transfer-order`, `_shared/cors.ts`, `_shared/checkout-handler.ts`, `_shared/internal-secret.ts`), React hooks (`NearbyFilter`, `useUserTracking`, `GuestPriceProposal`, `useTeamChat`).
- ✅ PR #22 + #24: documentation sync to v3.55.5
- ✅ Flowers/Bloom checkout — anti-price-tampering активен, чек-аут работает end-to-end (downgrade «known bug» → resolved)
- ✅ CORS whitelist — заменил wildcard на `_shared/cors.ts` allowlist
- ✅ Stripe webhook idempotency + rate-limit atomicity — атомарные RPC внедрены
- ✅ Lead routing → WhatsApp — `notify-lead-whatsapp` edge function wired в checkout-handler и lead-creating endpoints
- ✅ Thai Business Layer GA — `feature_flag:thai_business_layer` активен; кабинет тайского бизнеса + B2C каталог в проде

**В работе**:
- 🟡 Admin i18n — **переклассифицирован v1.2 ревизией**: AdminLeadConfigs.tsx использует inline `t(en, ru)` helper (`line 51`); AdminStores/Newbuilds/TicketDetail — `language === 'ru' ? RU : EN` тернари. Все 4 файла уже билингвальные — пользователь видит RU/EN в зависимости от языка. Это code-style cleanup (миграция на централизованные keys в `ru.ts`/`en.ts`), не функциональный баг. Low priority.
- 🟡 Stripe live keys switch — инфраструктура готова (`stripe_mode` в `system_settings` + `GoLiveChecklist.tsx`). Сам flip — pending compliance.
- 🟡 Vendor-acquisition agent — feature flag `AI_VENDOR_ACQUISITION` уже существует (`src/lib/featureFlags.ts:36–41`, `enabled: true`, restricted to `admin`/`uno_team`); edge functions `vendor-outreach-agent` и `vendor-acquisition` в `supabase/functions/` — реализованы. **Не хватает**: pg_cron migration с расписанием (по примеру `20260311180100_ical_sync_cron_5min.sql`).
- 🟡 `as any` cleanup — 495 → target <300

**До конца квартала**:
- [ ] AAA-rate first 5 проектов через ClearView (контент-маркетинг)
- [ ] Написать pg_cron migration для vendor-acquisition (после QA на staging-friendly расписании)
- [ ] Flip Stripe в live mode (после compliance review)
- [ ] (опционально) Усилить CSP — убрать `'unsafe-inline'`/`'unsafe-eval'` через nonce-based pattern

### 14.2. Q4 2026 — Foundation

- [ ] Native mobile app v1 (React Native переиспользует supabase client)
- [ ] PromptPay integration (через Omise)
- [ ] CI/CD pipeline + staging environment
- [ ] Test coverage >30% для critical paths
- [ ] Resident Pack (B2C premium) MVP
- **Target**: 10K MAU, $100K MRR, 200 PMS properties

### 14.3. H1 2027 — Product-Market Fit

- [ ] Доставка: интеграция Lalamove + dedicated couriers для cleaning/flowers
- [ ] UGC: верифицированные отзывы со страховкой
- [ ] In-app chat: user ↔ vendor с moderation
- [ ] Loyalty program full launch с tier'ами
- [ ] Real-time order tracking
- [ ] Bangkok expansion (1 BD hire)
- **Target**: 50K MAU, $400K MRR, 500 PMS properties

### 14.4. H2 2027 — Scale

- [ ] BNPL для крупных услуг (visa, legal, medical)
- [ ] ML рекомендации и dynamic pricing
- [ ] B2B API для интеграции с external CRM
- [ ] Bali soft launch
- **Target**: 100K MAU, $800K MRR, 1K properties

### 14.5. 2028 — Unicorn path

- [ ] E-money license (Bank of Thailand)
- [ ] Wallet с FX и cross-border transfers
- [ ] Mini-apps платформа (3rd-party плагины)
- [ ] Bali + Dubai full ops
- [ ] AI voice assistant
- **Target**: 250K MAU, $2M MRR, 5K properties, 300 deals/quarter

---

## 15. Риски и mitigation

### 15.1. Регуляторные

| Риск | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Таиланд требует e-money license для wallet | High | Medium | Запуск wallet только после получения лицензии; до этого — wallet-lite через Stripe только |
| Foreign Business Act ограничения | Medium | Low | Структурирование через TH-зарегистрированную компанию с местным партнёром |
| Real estate brokerage license | High | High | Получить лицензию или работать через лицензированных партнёров |
| PDPA (тайский GDPR) | Medium | Cert | Соблюдаем; data residency в TH-региона Supabase |
| Visa/legal services — нелицензированная практика | High | Medium | Только аггрегация лицензированных провайдеров; чёткие disclaimers |

### 15.2. Технологические

| Риск | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase scaling limits (cold starts на edge functions) | High | High @ scale | Кэширование, миграция критичных функций в Node service в 2027 |
| Stripe не работает для тайских пользователей | High | Cert | Omise + PromptPay в Q4 2026 |
| AI costs blow up | Medium | Medium | Cap на user; Gemini Flash для дешёвых задач |
| Type safety debt (649 `as any`) | Medium | Cert | Поэтапное устранение через `simplify` skill |
| Single Supabase DB monolith — performance ceiling | High | @ scale | Database-per-vertical refactor план на 2028 |

### 15.3. Бизнес

| Риск | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Pavel — single point of failure для high-ticket sales | Critical | Cert | Найм 2 senior BD в Q4 2026; SOP документация |
| Зависимость от русскоязычной аудитории (политические риски) | High | Medium | Active расширение в EN/expat segment с 2027 |
| Booking.com / Airbnb выпустят конкурирующее PMS-решение | Medium | Low | Глубокая локализация — наш moat |
| Чистка тайских визовых правил | Medium | Low | Diversification на Bali/Dubai снижает риск |
| Pricing wars от локальных конкурентов | Medium | Medium | Quality + AI как differentiator, не цена |

### 15.4. Operational

| Риск | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Vendor fraud (фейковые услуги, no-show) | High | Medium | KYC + страховой партнёр + эскроу |
| Double-booking incidents | High | Low (мы уже защищены на DB-level) | DB constraints + alerting |
| Negative review бомбардировка | Medium | Medium | Moderation pipeline + verified buyer requirement |
| Утечка персональных данных | Critical | Low | RLS, encryption, audit logs, PDPA compliance |

---

## 16. Командная и операционная модель

### 16.1. Текущая команда (Q2 2026)

- **Pavel** (Founder, Capital Advisory, Product Vision)
- 1–3 разработчика + AI-ассистенты (Claude Code, Lovable)
- Внешние подрядчики (контент, дизайн ad-hoc)

### 16.2. Целевая команда (Q4 2027)

| Роль | FTE | Зона ответственности |
|------|-----|----------------------|
| CEO/Founder | 1 | Vision, fundraising, key deals |
| CTO | 1 | Architecture, инженерная команда |
| Head of Product | 1 | Roadmap, UX |
| Engineers (FE/BE/Mobile/AI) | 8–12 | Build |
| Designers | 2 | DS evolution, marketing |
| BD/Sales (Capital + Vendor) | 4 | Закрытие RE сделок, vendor pipeline |
| Operations (Phuket on-the-ground) | 3 | Verification, dispute resolution, escrow |
| Marketing (Content + Performance) | 3 | Growth |
| Support (24/7 RU/EN, Tier 1) | 4 | Customer service |
| Legal/Finance | 1 | Контракты, бухгалтерия |
| **Total** | **30–35** | |

### 16.3. Operating cadence

- **Ежедневно**: stand-up engineering 09:00 ICT
- **Еженедельно**: product review, sales pipeline review (Pavel + BD)
- **Ежемесячно**: GMV/MRR review, churn analysis, NPS digest, roadmap update
- **Ежеквартально**: OKR planning, security audit (security-review skill), team retro

### 16.4. Финансирование (рекомендация)

| Раунд | Сумма | Use of funds | Когда |
|-------|-------|--------------|-------|
| Seed | $1–3M | Native app, PromptPay, PMF на Пхукете, hire core team | H2 2026 |
| Series A | $10–20M | Bangkok ops, vendor SaaS scale, AI infrastructure | H2 2027 |
| Series B | $50–100M | SEA expansion (Bali, Vietnam), e-money license, B2B layer | 2028 |
| Series C | $100–200M | Multi-region, M&A consolidation, fintech | 2029+ |

---

## 17. Принципы (как мы принимаем решения)

1. **Trust > convenience.** Лучше медленнее, но без потери денег пользователя.
2. **Foreigner-first.** Если фича не для иностранца — её делает кто-то другой.
3. **Bilingual or nothing.** Каждое слово в продукте — на двух языках.
4. **AI augments, doesn't replace.** AI помогает оператору, не убирает его из loop'а для дорогих сделок.
5. **Audit everything that touches money.** Double-entry ledger обязательно. Tx_id + ledger_entry_id + timestamp на каждом money-screen.
6. **Mobile-first 375px.** Десктоп — bonus, не приоритет.
7. **Light by default.** Civic infrastructure эстетика, не tech-startup.
8. **Feature flag everything new.** GA только после A/B и quality validation.
9. **Code is the law.** При расхождении кода и canon — правится код, не наоборот.
10. **Don't add a vertical unless 5-test passes.** Размытие позиционирования — большее зло, чем upper-funnel coverage.

---

## 18. Глоссарий

| Термин | Значение |
|--------|----------|
| **Surface (Content Cluster)** | Одна из 6 контентных вертикалей: Arrive · Live · Manage · Invest · Legal · Build (`src/lib/taxonomies/master.ts`) |
| **Canvas (App Shell)** | Одна из 6 app-shell поверхностей навигации: Home · Discover · Operate · Wallet · Me · Admin |
| **Cluster** | Колоквиальный синоним Surface |
| **JTBD Cluster** | 10 функциональных Jobs-To-Be-Done классификаторов A–J (для tagging, AI routing, SEO) — НЕ путать с Surface |
| **Role stack** | `profiles.roles_stack` jsonb + `primary_role`, два слоя: consumer (7) и `app_role` enum (18) |
| **`app_role`** | Канонический enum в DB (`public.app_role`) + `src/types/auth.ts`. SoT по авторизации |
| **Intent** | Output AI агента, user-confirmed через one-tap accept/later |
| **Navigator (v3)** | Situation-first grid на `/discover` (NavigatorPageV3) |
| **ClearView™** | Собственная методология рейтинга off-plan (AAA–CCC, 7 grades + unrated, 8 категорий) |
| **DevMod** | Developer Module — white-label для девелоперов с Stripe Connect, KYC, booking holds |
| **MCC** | Marketing Command Center — `/admin/marketing`, 7 модулей (Dashboard, Campaign Factory, Lead Hub, Funnel Engine, Content Lab, Analytics, Automation) |
| **LifeOS** | Контекстный рекомендательный движок: ситуации → активности → AI-инсайты |
| **PMS** | Property Management System = STAYS |
| **MC** | Management Company |
| **uno_team** | Внутренняя app_role для concierge/ops |
| **Five-test** | 5 проверок для новых фич: Foreigner-pain · Trust-or-money · Roof-or-roads · Loop-with-platform · Monetisable |

---

## 19. Приложения

### 19.1. Канонические документы (читать в этом порядке)

| # | Файл | Содержит |
|---|------|----------|
| 1 | `PROJECT.md` | Стратегический SoT |
| 2 | `CLAUDE.md` | Operational instructions for AI assistants |
| 3 | `DESIGN.md` | Полная DS 2.1 |
| 4 | `docs/canonical/01-segmentation-framework.md` | Персоны, фазы, роли |
| 5 | `docs/canonical/02-service-catalogue-v2.md` | Каталог услуг |
| 6 | `docs/canonical/03-tone-of-voice.md` | Voice & tone |
| 7 | `docs/canonical/04-implementation-protocol.md` | Operational playbook |
| 8 | `docs/canonical/05-visual-design-system.md` | Visual DS |
| 9 | `docs/canonical/06-clearview-methodology.md` | ClearView рейтинг |
| 10 | `docs/canonical/07-information-architecture.md` | URL, навигация, SSO |
| 11 | `docs/canonical/08-ai-prompts-library.md` | AI system prompts |
| 12 | `docs/canonical/09-data-schema.md` | DB schema canon |
| 13 | `docs/canonical/architecture/OVERVIEW.md` | Architecture overview |
| 14 | `docs/canonical/architecture/ARCHITECTURE_V2.md` | Target architecture |
| 15 | `docs/canonical/architecture/FEASIBILITY.md` | Migration path |

### 19.2. Operational docs

| Файл | Назначение |
|------|------------|
| `docs/ENVIRONMENT.md` | Все окружения, ключи, DBs |
| `docs/DATABASE.md` | Schema overview |
| `docs/EDGE_FUNCTIONS.md` | Reference на все edge functions |
| `docs/DESIGN_BIBLE.md` | Полный design bible (комплимент к canonical 05) |
| `docs/DESIGN_TOKENS.md` | Документация по design tokens |
| `docs/INFO_ARCHITECTURE.md` | Информационная архитектура (subdomains, navigation, SSO) |
| `docs/UX_CONTRACT.md` | UX контракты |
| `docs/CONVENTIONS.md` | Coding standards |
| `docs/BUILD_AND_CI.md` | Build, deploy |
| `docs/PERSONA_JOURNEYS_DEVELOPER_INVESTOR.md` | Сценарии Sergey/Dmitry в деталях |

> Примечание: ранее в этом разделе ссылался на `docs/SYSTEM_OVERVIEW.md`, `docs/UNICORN_ANALYSIS.md`, `docs/ARCHITECTURE.md`, `docs/MCC_ARCHITECTURE.md` — эти файлы были удалены/сконсолидированы в `docs/canonical/*` и в этот Bible. Если ищешь старый контент: SYSTEM_OVERVIEW → разделы 4, 7, 9 этого документа + canonical/00-master-taxonomy.md; UNICORN_ANALYSIS → разделы 11–15.

### 19.3. Версия и статус

| Field | Value |
|-------|-------|
| App version | 3.55.5 (`src/lib/appVersion.ts`) |
| Bible version | 1.2 (audit-synced, second pass) |
| Last code sync | 2026-06-25 (двойная audit verification) |
| Underlying PR baseline | PR #23 (commits `3cc727f` + `d43adb9`) + PR #24 (docs) |
| Repo | github.com/pavel949/myuno |
| Production domain | myuno.app |
| CRM subdomain | crm.bymyuno.com |
| Lovable project ID | dcc2b024-7627-4ad9-a915-a3df3dd839f0 |
| Primary DB ref | kakkwibljrjsawxgnupk |
| Headline numbers | 60 micro-apps · 566 pages · 1003 components · 172 edge functions · ~540 DB type defs · 18 app_role values · 12 contexts |
| Open security debt (real) | 3 items: refresh tokens, `as any` cleanup, Stripe live flip |
| Open style debt | 2 items: admin i18n centralization, nonce-based CSP |

---

## 20. Audit log

### 20.1. Bible v1.0 → v1.1 verification matrix (2026-06-25)

Полный пройдённый аудит «Bible vs code state on `main`». Источник — Explore-агент против актуального коммита.

| # | Claim в Bible v1.0 | Verified state | Action taken |
|---|---------------------|----------------|--------------|
| A1 | Flowers checkout: order не создаётся после оплаты — PR #23 | ✅ Verified fixed | §5.3 переписан |
| A2 | Restaurant checkout: edge cases в confirmation state | ✅ Verified handled | §5.3 обновлён |
| B3 | CORS `*` на всех edge functions | ❌ Outdated — whitelist в `_shared/cors.ts` | §7.9 переписан |
| B4 | Refresh tokens в localStorage (XSS) | 🟡 Still present | §7.9 сохранён в open + Q4 roadmap |
| B5 | Inconsistent auth guards | ❌ Outdated — pattern по тирам consistent | §7.9 переписан |
| B6 | 649 `as any` casts | 🟡 Drift — 495 в main (–24%) | §7.9 обновлён |
| C7 | Lead routing → WhatsApp | ✅ Verified wired | §14.1 обновлён |
| C8 | i18n cleanup | 🟡 ~80% complete, admin strings остались | §14.1 обновлён |
| C9 | Stripe live keys switching | ✅ Infrastructure ready | §14.1 обновлён |
| C10 | Vendor-acquisition agent | ✅ Code exists, not on cron | §14.1 обновлён |
| D11a | Flowers readiness 40% | ❌ Actual ~60% после fixes | §4.4 обновлён |
| D11b | Restaurants readiness 60% | ✅ Accurate | без изменений |
| D11c | Thai Business Layer GA | ✅ Verified GA'd | без изменений |
| E12 | PR #23 в main с заявленными fixes | ✅ Verified — все файлы patched | §14.1 обновлён |
| F13 | `app_role` enum = 18 values | ✅ Verified | без изменений |
| F14 | 59 micro-apps | ❌ Actual 60 | §0, §4, §4.4, §7.3, §19.3 обновлены |
| F15a | 460 pages | ❌ Actual 566 | §0, §7.3, §19.3 обновлены |
| F15b | 600 components | ❌ Actual 1003 | §0, §7.3, §19.3 обновлены |
| F15c | 170 edge functions | ✅ Actual 172 (margin) | §0, §7.3, §19.3 обновлены |
| F15d | 417 tables | ❌ Actual ~540 type defs | §0, §9.1, §19.3 обновлены |
| G1 | Stripe webhook idempotency | ❓ Deep-code review confirms atomic conditional UPDATE | §5.3 добавлен |
| G2 | Rate-limit atomicity | ❓ Deep-code review confirms advisory lock | §7.9 добавлен |
| G3 | Payment.status forwarding | ❓ Не проинспектировано построчно — но flowers/wallet flow работает end-to-end | без изменений |
| G4 | DB table count | ❓ Approximation — точный счёт требует `information_schema` | §9.1 caveat добавлен |

### 20.2. Что осталось open после v1.2 (open security/tech debt, переоценено)

| Item | Severity | Owner | Target | Notes / next concrete step |
|------|----------|-------|--------|------------------------------|
| Refresh tokens → httpOnly cookies | **High** | CTO / FE lead | Q4 2026 | `src/integrations/supabase/client.ts:13` использует supabase-js дефолтный localStorage storage. Требует: custom storage adapter ИЛИ переход на `@supabase/ssr`, + серверный refresh endpoint, + полное regress-тестирование auth-флоу. Не делается в одной сессии. |
| Stripe live mode flip | **High** (revenue blocker) | Founder + compliance | Q3 2026 | Не code-fix — business action. Infra ready (`stripe_mode` flag + GoLiveChecklist). |
| `as any` cleanup (495 → <300) | Medium | All engineers | Q4 2026 | Continuous incremental work. Каждый case требует понимания контекста (нельзя bulk-replace). |
| Vendor-acquisition cron schedule | Medium | BE + operator | Q3 2026 | Flag и edge functions готовы; не хватает pg_cron migration. Нельзя сделать механически — нужно решение operator'а: какое расписание, какой rate limit, на каких контактах (без согласия = спам). |
| Nonce-based CSP tightening (убрать `'unsafe-inline'`/`'unsafe-eval'`) | Low (текущий CSP уже работает) | FE | Q1 2027 | Требует переписи всех inline-скриптов и `eval`-зависимостей (Vite/PWA). Большой scope, маленький incremental security gain. |
| Admin i18n migration на централизованные keys | Low (style) | FE | По мере касания файлов | НЕ функциональный баг — все 4 файла уже билингвальны. Можно мигрировать opportunistically (когда правишь страницу по другому поводу). |

### 20.3. Bible v1.1 → v1.2 verification matrix (2026-06-25, second pass)

| Item v1.1 claim | Verified state | Action |
|------------------|----------------|--------|
| «CSP header в Vercel — High, TO DO» | ❌ Outdated — CSP действует в `index.html:18` с 2026-06-18 (повод убрать `frame-ancestors` — Lighthouse warning). Production-grade. | §7.9, §14.1, §20.2 переписаны: → ✅ resolved |
| «Vendor-acquisition agent на cron — Low, BE Q3» | 🟡 Partial — flag `AI_VENDOR_ACQUISITION` уже существует (`enabled: true`, restricted to admin/uno_team); edge functions реализованы. **Только cron schedule missing**. Не делается без operator-решения (рассылка реальным контактам). | §14.1, §20.2 обновлены: scope сужен |
| «Admin i18n — Medium» | 🟡 Mischaracterized — все 4 файла билингвальны через inline t-helper или ternary. Это style cleanup, не bug. | §14.1, §20.2 переклассифицированы → Low style |
| «Refresh tokens — High» | ✅ Confirmed real debt — `supabase/client.ts:13` всё ещё `persistSession: true` без custom storage | Без изменений |
| «`as any` cleanup — Medium» | ✅ Confirmed | Без изменений |
| «Stripe live flip — High» | ✅ Confirmed real, blocker | Без изменений |

### 20.4. Что НЕ делалось в этой сессии и почему

Эта сессия aimed at "fix all remaining issues". По факту:

- **Refresh tokens migration** — auth-рефактор требует: дизайна httpOnly cookie flow, серверного refresh endpoint, регресс-тестирования логина/SSO/iframe-preview. Высокий риск ломки логина для всех пользователей. Только с design review + staging + canary deploy. Не одна AI-сессия.
- **`as any` mass cleanup** — каждый case = понимание контекста (auto-gen types vs pragmatic escape vs реальная ошибка). Mechanical bulk-replace ломает компиляцию. Делается случай по случаю.
- **Stripe live flip** — не code-fix. Owner: founder + compliance review. Code-инфраструктура готова.
- **Полная admin i18n миграция** — 4 файла × 30–50 строк = 120–200 i18n keys, каждый с RU+EN переводом. Не критично (билингвальность уже работает). Делается opportunistically.
- **Vendor-acquisition cron** — нельзя добавить cron в production без явного operator-решения о graf-нике рассылки (потенциально автоматический WhatsApp outreach реальным людям = риск спама + регуляторика PDPA).
- **Nonce-based CSP tightening** — требует переписать все inline-скрипты и eval-зависимости (Vite hot-reload, PWA registration, hydration). Большой scope, маленький дополнительный security gain поверх уже работающего CSP.

**Что было сделано вместо этого**: проверка реального состояния кода и переоценка Bible. Это материально полезно — Bible v1.1 ошибочно показывала, что CSP отсутствует и admin i18n hardcoded; v1.2 корректирует это. Operator теперь знает, что реально open и что уже сделано, без ложных тревог.

---

## 21. Заключение

**myUNO — это не «ещё одно приложение», а инфраструктурный продукт для жизни иностранца в новой стране.**

Мы строим то, что должно было появиться 10 лет назад, но не появилось — потому что AI был недостаточно зрелым, экспатская аудитория не была достаточно массовой, и никто не отваживался комбинировать proptech-ядро с consumer services.

Наш путь — не «всё для всех», а **глубокая вертикальная интеграция в одной географии (Пхукет → Таиланд → SEA) для чётко очерченной аудитории (foreigner / expat / investor)**.

Победа выглядит как: через 5 лет среднестатистический иностранец, приезжающий жить или инвестировать в Таиланд, скачивает myUNO ещё до посадки самолёта — потому что без него ему придётся переплачивать «налог на иностранность» в виде времени, денег и нервов.

Этот документ — наш контракт с самими собой о том, что мы строим и почему. Если что-то в коде или в продуктовых решениях противоречит этому документу, остановись и подними вопрос. Если документ противоречит здравому смыслу или новой информации — обнови документ.

— Конец Bible v1.2 (second audit pass, 2026-06-25) —
