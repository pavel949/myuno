# myUNO · Design Bible

> **v2.0 · MAY 2026** · полный справочник дизайна, философии, маршрутов, экранов и операций суперappа myUNO.
>
> **Статус:** канонический. Единый источник истины для дизайнеров, инженеров, AI-ассистентов и партнёров. При расхождении с другими документами — правится **код и сопутствующие доки**, не Bible.
>
> **Audience.** Pavel · CTO · дизайнеры · React-инженеры · AI (Claude Code, Cursor, Lovable, v0) · партнёры (PM, developers, providers).
>
> **Companion docs.** При работе **сначала** читай `/PROJECT.md` (стратегия) и `/CLAUDE.md` (инженерные правила). Bible собирает их в дизайн-плоскости. См. также `docs/canonical/05-visual-design-system.md` (визуальная DS), `DESIGN.md` (DS 2.1 runtime), `docs/canonical/architecture/ARCHITECTURE_V2.md`.

---

## Оглавление

**Правила для AI**
- [00 · Правила для AI](#00--правила-для-ai)

**Стратегия**
- [01 · Стратегия](#01--стратегия)
- [02 · Архитектура](#02--архитектура)
- [03 · Сценарии](#03--сценарии)
- [04 · Голос](#04--голос)

**Система**
- [05 · Foundations](#05--foundations)
- [06 · Components](#06--components)
- [07 · Patterns](#07--patterns)
- [08 · States](#08--states)
- [09 · Языки](#09--языки)

**Применение**
- [10 · Применение (введение)](#10--применение-введение)
- [11 · Онбординг](#11--онбординг)
- [12 · Главная](#12--главная)
- [13 · Навигатор](#13--навигатор)
- [14 · Мобильные экраны](#14--мобильные-экраны)
- [15 · Сервисная страница](#15--сервисная-страница)

**Суб-системы**
- [16 · ClearView](#16--clearview)
- [17 · Partner](#17--partner)
- [18 · Owner Timeline](#18--owner-timeline)
- [19 · Messaging](#19--messaging)

**Деньги · Доверие · Формы**
- [20 · Money & Tx](#20--money--tx)
- [21 · Trust & KYC](#21--trust--kyc)
- [22 · Domain forms](#22--domain-forms)
- [23 · Documents · PDF](#23--documents--pdf)
- [24 · Глоссарий](#24--глоссарий)

**Каналы · Визуальный**
- [25 · Уведомления](#25--уведомления)
- [26 · Карты · Geo](#26--карты--geo)
- [27 · Iconography](#27--iconography)
- [28 · Imagery](#28--imagery)
- [29 · Motion](#29--motion)
- [30 · Доступность](#30--доступность)
- [31 · Цена](#31--цена)
- [32 · Legal · Disclaim](#32--legal--disclaim)

**Операции**
- [33 · Admin UI](#33--admin-ui)
- [34 · Analytics](#34--analytics)
- [35 · Brand assets](#35--brand-assets)
- [36 · SEO · Meta](#36--seo--meta)
- [37 · Support · SOS](#37--support--sos)

**Мета**
- [38 · Версии](#38--версии)
- [39 · Decision log](#39--decision-log)
- [40 · Roadmap](#40--roadmap)

---

## 00 · Правила для AI

> AI-агенты (Claude Code, Cursor, Lovable, v0, в т.ч. внутренние myUNO-агенты) **обязаны** читать этот раздел перед любым изменением. Нарушение блокирует merge.

### 00.1 · Источники истины (в порядке приоритета)

1. **`/PROJECT.md`** — стратегия, монетизация, аудитория, 5-тест для фич.
2. **`/CLAUDE.md`** — инженерные правила, hard rules, текущий статус.
3. **`/docs/canonical/`** — операционные документы 00–10 (taxonomy, segmentation, services, tone, protocol, visual, ClearView, IA, AI prompts, schema, semantic core).
4. **`/docs/canonical/architecture/`** — OVERVIEW · ARCHITECTURE_V2 · FEASIBILITY.
5. **`/DESIGN.md`** — runtime tokens (DS 2.1).
6. **`/docs/DESIGN_BIBLE.md` (этот файл)** — связка всего вышеперечисленного в плоскости дизайна и UX.
7. **`src/styles/tokens.css`** — runtime источник истины для color/font/spacing. **`src/design-system/tokens.json` устарел — игнорировать.**

При расхождении документов с кодом — **правится код**.
При расхождении документов между собой — **последний по дате** (см. § 39 Decision log).

### 00.2 · Hard rules (нарушение блокирует merge)

1. **Never add a new top-level route.** Только под `/discover/cluster/:id`, `/app/:cluster/:vertical`, `/operate/*`.
2. **Never create a new shell.** Только `MiniAppLayout` или `Operate shell`.
3. **Never hardcode a hex colour.** Только переменные из `src/styles/tokens.css` (`var(--primary)`, `var(--cluster-legal)` и т.д.).
4. **Never import across cluster boundaries.** L5 кластер может зависеть только от L4 primitives и L3 services.
5. **Never auto-execute money moves from an agent.** Money intents всегда требуют user-confirmed accept.
6. **Audit marker on every money screen.** `tx_id · ledger_entry_id · timestamp` видны на экране.
7. **Feature flag on every new feature.** Ключ `feature_flag:<name>` в `system_settings` до GA.
8. **Bilingual or it doesn't ship.** Каждая user-facing строка — RU + EN. Thai-fallback для Phuket-специфичных компонентов.
9. **Mobile-first or it doesn't ship.** Layout проектируется от 375px и расширяется. Min touch target 44px.
10. **TypeScript strict.** Никакого `any`. Типы из `src/integrations/supabase/types.ts` (auto-generated, не редактировать).

### 00.3 · Decision tree «куда положить новый код?»

```
Новая фича приходит. Спроси по порядку:

1. Это новая вертикаль или микро-приложение?
   → docs/canonical/02 (каталог) + docs/canonical/07 (URL) + Design Bible §15
   → src/pages/<vertical>/, src/lib/verticals.ts, MiniAppLayout

2. Это изменение домена (DB, типы, API)?
   → docs/canonical/09 (схема), audits/M2-M3 (примеры)
   → supabase/migrations/, src/integrations/supabase/types.ts (auto)

3. Это изменение AI-поведения?
   → docs/canonical/08 (промпты) + Design Bible §19
   → supabase/functions/canonical-*

4. Это изменение визуала?
   → Design Bible §05-09 + docs/canonical/05 + DESIGN.md
   → src/styles/tokens.css (НЕ хардкод hex), tailwind.config.ts

5. Это новая роль / cluster / surface / canvas?
   → STOP. Архитектурное решение.
   → ARCHITECTURE_V2.md + Pavel review + ADR

6. Это деньги (checkout, ledger, payout)?
   → CLAUDE.md §4 + Design Bible §20 + Hard rules #5, #6
   → supabase/functions/stripe-webhook + record_ledger_entries

7. Это форма?
   → Design Bible §22 (Domain forms)
   → React Hook Form + Zod, mobile-first

8. Это уведомление?
   → Design Bible §25
   → notification router (single fan-out), не per-feature
```

### 00.4 · 5-тест перед любой новой фичей

Каждая новая фича должна пройти **все 5** вопросов с ответом «да»:

1. **Doverie.** Делает ли это доверие платформе сильнее? (Не «удобнее» — а именно глубже доверие.)
2. **Compatible.** Совпадает ли с тоном `03-tone-of-voice.md` (спокойная уверенность, продаём доверие)?
3. **Recurring.** Создаёт ли это повод вернуться через 7/30/90 дней (не one-shot transaction)?
4. **Defensible.** Сложно ли это скопировать конкуренту за месяц? (Если легко — это feature, не моат.)
5. **Scalable.** Работает ли это на 100, 10 000, 100 000 пользователях без перекройки?

Если хотя бы один «нет» — **возвращаемся к Pavel** перед началом работы.

### 00.5 · Запреты для AI

- ❌ Создавать `console.log` в production коде.
- ❌ Создавать новые Supabase client instances. Использовать `src/integrations/supabase/client.ts`.
- ❌ Хардкодить API keys, email, телефоны. Использовать `_shared/admin-config.ts`.
- ❌ Использовать `supabase.schema('v2')`. Всё в `public`.
- ❌ Использовать `VITE_SIMULATION_MODE` / `VITE_DEMO_MODE`. Не существует.
- ❌ Редактировать `src/integrations/supabase/types.ts` (auto-generated).
- ❌ Создавать MD-документацию **без явной просьбы пользователя** (правило CLAUDE.md).
- ❌ Использовать эмодзи в коде, коммитах, документах **без явного запроса**.
- ❌ Использовать шрифты не из списка § 05.2 (Source Serif 4, Geist, IBM Plex Mono, Cormorant для luxury).
- ❌ Менять цвета кластеров (см. § 05.3) — это «карта города», иначе ломается spatial memory.

### 00.6 · Обязательные паттерны для AI

- ✅ Каждый Supabase query — в `try/catch` с обработкой ошибки и user-facing toast.
- ✅ Каждая async операция — со skeleton/spinner.
- ✅ Каждая user-facing строка — через `useTranslation()` (`src/i18n/`), пара RU + EN.
- ✅ Каждая денежная сумма — через `<Money>` компонент (форматирование, валюта, audit marker).
- ✅ Каждая дата — через `<Date>` компонент (locale-aware, timezone Asia/Bangkok).
- ✅ Каждая новая страница — с `loading` · `empty` · `error` · `success` состояниями (см. § 08).
- ✅ Каждый коммит — на английском в conventional формате (`feat:`, `fix:`, `refactor:`, `chore:`, `design:`, `docs:`).

### 00.7 · Когда AI **обязан** остановиться и спросить Pavel

1. Изменение цвета кластера или добавление 7-го.
2. Добавление новой роли в `roles_stack`.
3. Создание нового субдомена.
4. Изменение `stripe-webhook` или `record_ledger_entries` RPC.
5. Изменение RLS политик на финансовых таблицах (`orders`, `payment_intents`, `ledger_entries`).
6. Удаление или переименование существующего top-level route (ломает SEO / deep links).
7. Изменение `tokens.css` базовых переменных (цвет фона, primary, accent).
8. Любая работа с **реальными** деньгами в production (только тест-моде Stripe до отдельного разрешения).

---

## 01 · Стратегия

### 01.1 · Что такое myUNO одной фразой

> **myUNO** — это операционная система для жизни иностранца на Пхукете: одна учётка, один интерфейс, 40+ микро-приложений (недвижимость, услуги, юридка, лайфстайл, инвестиции), AI-консьерж как тихий маршрутизатор интентов.

### 01.2 · Миссия

Сделать так, чтобы переезд, жизнь и инвестиции иностранца на Пхукете перестали быть путешествием через 47 несвязанных Telegram-чатов и WhatsApp-агентов. Вместо этого — **одна точка входа, в которой видно следующий шаг и понятно, кому верить**.

### 01.3 · Видение (5 лет)

`myuno.app` — это **доменный auth-провайдер** для жизни иностранца в Юго-Восточной Азии. Сначала Пхукет, потом Бангкок · Бали · Дубай · KL. SSO работает между субдоменами и между странами. ClearView становится отраслевым стандартом для off-plan рейтингов (как Standard & Poor's для корпоративных облигаций).

### 01.4 · Аудитория и сегменты

**Первичная аудитория (P0):**
- Русскоязычные экспаты на Пхукете — **80% продуктовых решений ориентированы на них.**
- Подсегменты: туристы (P1), резиденты (P3, P6), собственники недвижимости (P8), HNW-инвесторы (P9), номады (P4), снежные птицы (P5), семьи (P7), операторы PM (P10).

**Вторичная аудитория (P1):**
- Англоговорящие экспаты, китайцы, монголы, бангладешцы — основа международного расширения.
- Полный реестр — `docs/canonical/01-segmentation-framework.md` (25 персон P01–P25).

### 01.5 · Монетизация (4 потока)

1. **Subscriptions** — stays_subscription (per property, Stripe), pm_subscription, ignatev_capital_membership.
2. **Take rate** — 5–20% от каждой транзакции (бронирование, услуга, сделка) через order_items + vendor_payouts.
3. **Leads** — capital advisory заявки на покупку недвижимости, рассылаются в Ignatev Group.
4. **Data / Insights** — ClearView рейтинги (B2B продажа аналитики developers и инвесторам).

### 01.6 · Восемь моатов (defensible advantages)

1. **Cluster IA + spatial memory** — 6 цветных кластеров, юзер учит карту один раз.
2. **Role stack** — не «один человек = одна роль», а weighted stack. Конкурент не реплицирует за месяц.
3. **AI как silent router** — не chatbot, а producer of intents с one-tap accept.
4. **ClearView** — методология AAA–BB для off-plan, 8 категорий. Pavel-owned IP.
5. **Ignatev Capital** — внутренний CRM для HNW-сделок, эксклюзивные mandates.
6. **PM-уровень доступ** — реальные собственники, реальные ставки, реальная аналитика.
7. **Trust-as-UI** — audit markers на каждом money screen, не футер.
8. **Bilingual native** — Cyrillic-first дизайн (Golos legacy / Source Serif Cyrillic), не американский продукт с переводом.

### 01.7 · Философия дизайна (три принципа)

> Эти принципы — фундамент. Любое решение в Bible выводится из них.

**П1 · Информация важнее украшения.**
Каждый пиксель обслуживает информацию или действие. Без декоративных иллюстраций, parallax, glassmorphism, частиц, скевоморфизма.

**П2 · Структура важнее свободы.**
myUNO выглядит как **спроектированный документ**, не «лента впечатлений». Чёткая сетка, выраженные границы блоков, типографская иерархия. Эталоны: Bloomberg Terminal · Financial Times · Apple Developer Docs · GOV.UK.

**П3 · Цвет — сигнал, а не украшение.**
Основная масса интерфейса — почти монохромная (dark bg или paper bg + cluster accent). Цвет появляется когда нужно **обозначить**: категорию, статус, действие. Три цвета на одном экране = ошибка.

### 01.8 · Brand essence

| Атрибут | Значение |
|---|---|
| **Voice** | Спокойная уверенность. Продаём доверие, не транзакцию. |
| **Mood** | Premium but not intimidating. Trusted control center, not startup toy. |
| **Era** | Цифровая инфраструктура государственного класса с человеческим лицом. |
| **Anti-pattern** | Не Booking, не Airbnb, не крипто, не «бирюзовый стартап», не тайский туристический лендинг. |
| **Reference** | GOV.UK · e-Estonia · Apple support · The Economist · Bloomberg · Linear · Stripe Atlas. |

### 01.9 · Что myUNO **не делает** (анти-фичи)

- ❌ Не агрегатор. У нас собственная база собственников, не парсинг.
- ❌ Не маркетплейс с гонкой за минимальной ценой. Кураторская витрина.
- ❌ Не туристический сайт. Mid-to-long term residents — основа.
- ❌ Не chatbot-стартап. AI — silent router, не диалоговый интерфейс.
- ❌ Не социальная сеть. Никаких follows / likes / feeds для развлечения.
- ❌ Не one-shot transactional. Каждая фича создаёт повод вернуться через 7/30/90 дней.

---

## 02 · Архитектура

### 02.1 · Слои системы (L0–L6)

```
L6  Code              src/ · supabase/functions/ · supabase/migrations/
L5  Cluster modules   Arrive · Live · Manage · Invest · Legal · Build
L4  Domain primitives Booking · Listing · Order · Contract · Payment · Document · Message · Ticket · Property · Person · Company
L3  Platform services Auth · Event bus · AI agents · Search · Notifications · Payments · KYC · i18n · Flags
L2  Integrations      Supabase · Odoo · Stripe · Google Maps · UltraMSG · Telegram · Resend · Siam Legal
L1  Runtime           React 18 · Vite · Capacitor · PWA · Supabase Edge (Deno 2.0) · Vercel
L0  Strategy          PROJECT.md · моаты · KPI
```

**Hard rule.** L5 кластер импортирует только из L4 primitives и L3 services. **Никаких** cross-cluster импортов.

### 02.2 · Канвасы (App Shell) — 6 штук

Канвасы — это **долгоживущие shell**, в которые монтируются модули кластеров. Раньше в коде назывались «surfaces» — переименованы, чтобы не путать с content clusters.

| # | Канвас | Маршрут | Аудитория | Назначение |
|---|---|---|---|---|
| 1 | **Home** | `/` | Все роли | Signal stack · quick actions · concierge · feed |
| 2 | **Discover** | `/discover` | Tourist, Resident primary | Каталог, life situations, search, map |
| 3 | **Operate** | `/operate` · `/owner` · `/mc` | Owner, Agent, Dev, Provider, Investor | Pro dashboards (replaces `/mc`, `/owner-portal`, `/developer-portal`, `/vendor`) |
| 4 | **Wallet** | `/wallet` | Все роли | Деньги in/out, statements, payouts, tax |
| 5 | **Me** | `/me` | Все роли | Identity, roles, docs, KYC, consents |
| 6 | **Admin** | `/admin` | Platform staff | KYC review, disputes, agent observability |

### 02.3 · Кластеры контента — 6 штук

Кластеры — это «районы города». Цвет каждого immutable, юзер учит карту один раз.

| Кластер | Token | Hex (dark) | Vertical examples | Кол-во |
|---|---|---|---|---|
| **Arrive** | `--cluster-arrive` | `#00D68F` mint | airport transfer, short stay, SIM, relocation | ~5 |
| **Live** | `--cluster-live` | `#4E7BFF` blue | cleaning, delivery, beauty, fitness, medical, pets | ~14 |
| **Manage** | `--cluster-manage` | `#16BDCA` teal | PM, maintenance, staff, utilities, owner statements | ~9 |
| **Invest** | `--cluster-invest` | `#A78BFA` purple | property search, off-plan, yield calc, viewings | ~7 |
| **Legal** | `--cluster-legal` | `#F59E0B` amber | visa, company, contracts, tax, insurance | ~6 |
| **Build** | `--cluster-build` | `#EF4444` coral | inventory, reservations, campaigns, construction | ~4 |

**Hard rule.** Новая вертикаль присоединяется к существующему кластеру или провоцирует **архитектурное решение** о 7-м кластере. Никаких ad-hoc табов.

### 02.4 · Роли (role stack, 7 ролей)

Один человек = много ролей, multi-select, weighted. У каждого `primary_role` + `secondary` + `tertiary`.

| Роль | Цвет | Default landing |
|---|---|---|
| Tourist | `#4E7BFF` | `/` |
| Resident | `#00D68F` | `/` |
| Owner | `#16BDCA` | `/operate/owner` |
| Agent | `#A78BFA` | `/operate/agent` |
| Developer | `#EF4444` | `/operate/dev` |
| Provider | `#F59E0B` | `/operate/provider` |
| Investor | `#EAB308` | `/operate/invest` |

**Ranking equation** (для home feed, quick actions, notifications):
```
weight = primary·3 + secondary·2 + tertiary·1
```

**Storage:** `profiles.roles_stack jsonb` + `profiles.primary_role app_role`.

### 02.5 · Канвас × Роль матрица

| Роль | Home | Discover | Operate | Wallet | Me | Default landing |
|---|:-:|:-:|:-:|:-:|:-:|---|
| Tourist | ● | ● | — | ○ | ○ | `/` |
| Resident | ● | ○ | — | ● | ● | `/` |
| Owner | ● | ○ | ● | ● | ● | `/operate/owner` |
| Agent | ● | ○ | ● | ● | ● | `/operate/agent` |
| Developer | ● | — | ● | ● | ● | `/operate/dev` |
| Provider | ● | ○ | ● | ● | ● | `/operate/provider` |
| Investor | ● | ● | ● | ● | ● | `/operate/invest` |

`●` primary · `○` secondary

### 02.6 · URL-структура (полное дерево)

```
/                              Home (signal stack для всех ролей)
├─ /discover
│  ├─ /discover/cluster/:id    Arrive | Live | Manage | Invest | Legal | Build
│  ├─ /discover/life/:situation  arrival | settle | invest | leave | emergency …
│  ├─ /discover/search
│  └─ /discover/map
├─ /app/:cluster/:vertical     /app/live/cleaning, /app/legal/visa, /app/invest/offplan
│  ├─ .../search
│  ├─ .../item/:id             карточка услуги / объекта
│  ├─ .../booking/new
│  └─ .../order/:id
├─ /operate
│  ├─ /operate/owner           Owner Timeline · finances · bookings
│  ├─ /operate/mc              PM dashboard · maintenance · staff
│  ├─ /operate/agent           CRM · pipeline · leads
│  ├─ /operate/dev             Developer portal · ClearView submission
│  ├─ /operate/provider        Vendor dashboard · payouts · catalog
│  └─ /operate/invest          Investor dashboard · mandates · DD
├─ /wallet                     Money in/out · statements · cards · tax
├─ /me
│  ├─ /me/roles                Role stack editor
│  ├─ /me/docs                 KYC docs · passports · contracts
│  └─ /me/consents             Privacy · marketing · data sharing
├─ /sos                        Emergency modal (никогда не страница)
└─ /admin                      Отдельный auth boundary
```

### 02.7 · Субдомены

| Субдомен | Назначение | Аудитория | Статус |
|---|---|---|---|
| `myuno.app` | Главная, AI-консьерж, публичные вертикали | Все | P0 ✅ |
| `app.myuno.app` | Личный кабинет | Authenticated residents | P0 |
| `invest.myuno.app` | Инвест-платформа, DD, ClearView | P8, P9, P11 investors | P0 |
| `clearview.myuno.app` | Public dashboard рейтингов AAA–BB | Investors + market | P0 |
| `owner.myuno.app` | Owner portal | P8 owners, P10 operators | P1 |
| `pm.myuno.app` | Property Management Dashboard | P10 operators | P1 |
| `developers.myuno.app` | Developer Portal | P22 developers | P1 |
| `stay.myuno.app` | Booking платформа | Tourists, snowbirds | P1 |
| `capital.myuno.app` | Ignatev Capital CRM | P9 HNW + internal | P2 |
| `pro.myuno.app` | B2B white-label PM tools | Partners | P2 |
| `admin.myuno.app` | Внутренний админ | Team only | P0 |
| `docs.myuno.app` | Публичная документация | Partners, journalists | P2 |

**Cross-domain SSO.** Авторизация на `myuno.app` = автоматически авторизован на всех субдоменах. Реализация через Supabase session + cookie на `.myuno.app`.

### 02.8 · AI-агенты и event bus

Каждый L4 primitive emits typed events (`booking.confirmed`, `visa.expiring`, `payment.failed`). Три подписчика:

1. **UI** — events рендерятся как activity rows, signal cards, badges.
2. **Notifications** — single router, fan-out to push/email/SMS/WhatsApp/Telegram.
3. **AI agents** — produce intents в Home concierge, one-tap accept/later. **Никогда не auto-execute money moves.**

**Agent roster:**

| Agent | Listens | Produces | Surfaces |
|---|---|---|---|
| Visa Guardian | `visa.*`, `document.uploaded` | "Start extension with Siam Legal" | Home, Me |
| Yield Optimiser | `booking.*`, `property.*`, `rate.*` | "Queue rate uplift for high season" | Operate/owner |
| Concierge | `trip.*`, `calendar.*` | "Hold table at Suay Thursday" | Home, Discover |
| Pipeline Nudger | `lead.*`, `viewing.*` | "3 viewings overlap — re-slot?" | Operate/agent |
| Maintenance Triage | `ticket.*`, `property.*` | "Approve AC service ฿1,800" | Operate/mc |
| Payout Reconciler | `payment.*`, `invoice.*` | "Statement ready to sign" | Wallet |

См. `docs/canonical/08-ai-prompts-library.md` для system prompts.

### 02.9 · Канонический data model

```
Person                одна строка на человека
├─ roles_stack: jsonb
├─ primary_role: app_role
├─ kyc_level
├─ consents[]
├─ documents[] → Document
├─ memberships[] → Company   (via company_members)
└─ households[]

Company               юр. лицо
├─ company_type: agent | developer | provider | mc
├─ members[] → Person        (via company_members)
└─ properties[] → Property

Property
├─ owner → Person | Company
├─ managed_by → Company (MC)
├─ listings[] → Listing
└─ bookings[] → Booking

Listing                offer: stay, service, product, property-for-sale
├─ cluster · vertical
├─ provider → Person | Company
└─ items[]

Booking · Order · Contract · Ticket
   inherit: id, actor, counterparty, state, payments[], messages[], events[]

Payment · Document · Message       attachable to any domain object
```

**RLS.** Каждая таблица несёт `person_id` и/или `company_id`. RLS читает session role stack и enforced: persona видит свои строки + строки компаний в которых член + публичные listings. Никакой per-vertical auth логики.

---

## 03 · Сценарии

> Сценарии — это **«дорожки желания»** через продукт. Каждая дорожка пересекает несколько кластеров и канвасов. Дизайн обязан поддержать дорожку end-to-end, не только отдельный экран.

### 03.1 · Десять JTBD-кластеров (Master Taxonomy)

| ID | JTBD Cluster | Описание | Главная роль |
|---|---|---|---|
| A | Arrival & Orientation | «Я только прилетел» | Tourist |
| B | Extension & Transition | «Я остаюсь дольше» | Tourist → Resident |
| C | Settlement | «Я обустраиваюсь надолго» | Resident |
| D | Investment Consideration | «Я думаю инвестировать» | Investor (потенциальный) |
| E | Transaction | «Я покупаю недвижимость» | Investor (активный) |
| F | Operations & Management | «Я управляю активом» | Owner / Operator |
| G | Legal & Compliance | «Мне нужны юр. услуги» | Resident / Investor |
| H | Emergency | «Срочная помощь» | Любая роль |
| I | Lifestyle | «Я живу здесь» | Resident |
| J | Exit & Re-entry | «Я уезжаю / возвращаюсь» | Resident → Tourist |

### 03.2 · Восемь golden-path сценариев

#### S1 · Турист → Резидент (P1 → P3)
**Сюжет.** Антон прилетел на 2 недели, понравилось, остаётся на 3 месяца.
**Маршрут.** `/` (concierge: «продлить пребывание?») → `/discover/life/stay-longer` → `/app/legal/visa` (виза-навигатор) → `/wallet` (оплата) → `/me/docs` (загрузка паспорта) → notification «виза готова через 7 дней».
**KPI.** Time-to-visa-application < 8 min. Conversion туристы → resident lifecycle: 12%.

#### S2 · Owner-онбординг (P8)
**Сюжет.** Елена купила квартиру в Bang Tao, хочет передать в PM и получать ренту.
**Маршрут.** `/onboarding` → role selector (Owner) → `/operate/owner` → «add property» wizard → `/operate/owner/properties/:id/handover` → подписание PM-контракта → first booking → first statement.
**KPI.** Time-to-first-booking < 14 дней. NPS после первого statement > 50.

#### S3 · Investor exploration → mandate (P9)
**Сюжет.** Дмитрий ищет yield 8%+ off-plan, готов вложить $300K.
**Маршрут.** `/discover/cluster/invest` → `/app/invest/offplan` (фильтры ClearView ≥ A) → `/app/invest/item/:id/dd` (Due Diligence pack) → viewing request → /capital lead → Ignatev mandate.
**KPI.** Time-to-mandate < 14 дней. Mandate value > $250K avg.

#### S4 · Service booking (Live кластер)
**Сюжет.** Резидент бронирует cleaning + delivery.
**Маршрут.** `/discover` → cluster Live → `/app/live/cleaning` → выбор слота → `/app/live/cleaning/booking/new` → Stripe checkout → confirmation → review через 24h.
**KPI.** Booking completion rate > 70%. Repeat rate > 30%.

#### S5 · Visa expiring (Visa Guardian agent)
**Сюжет.** За 30 дней до истечения визы — proactive intent.
**Маршрут.** Background: `visa.expiring` event → Visa Guardian produces intent → Home concierge card → user one-tap accept → `/app/legal/visa/extend` → upload docs → Siam Legal handover.
**KPI.** Visa renewal completion 14 дней раньше истечения: 85%.

#### S6 · Maintenance Triage (Owner pain)
**Сюжет.** В квартире сломался кондиционер. Гость пишет жалобу.
**Маршрут.** Guest reports → ticket created → Maintenance Triage agent → Owner получает intent «Approve AC service ฿1,800» → one-tap accept → vendor dispatched → completion photo → ledger entry.
**KPI.** Time-to-resolution < 24h для high priority. Owner intervention < 30 sec (только тап accept).

#### S7 · Capital advisory lead
**Сюжет.** Investor смотрит виллу за $1.2M, хочет персональную консультацию.
**Маршрут.** `/app/invest/item/:id` → CTA «Capital Advisory» → форма (бюджет, цели, KYC) → submit → notification Pavel в Telegram → callback < 2h.
**KPI.** Lead-to-callback < 2h. Lead-to-mandate conversion > 8%.

#### S8 · Emergency / SOS
**Сюжет.** ДТП ночью, нужна англоговорящая клиника.
**Маршрут.** Bottom bar SOS (всегда видна) → modal с 3 вариантами (Medical · Police · Legal) → tap → WhatsApp open с pre-filled message + location share → callback.
**KPI.** Time-from-tap-to-callback < 90 sec. SOS availability uptime 99.9%.

### 03.3 · Lifecycle phases (5 фаз)

```
Discover     →     Arrive     →     Live     →     Manage     →     Leave
   ↓                  ↓               ↓              ↓                ↓
/discover           /onboarding     /        /operate/*         /me/exit
public site         role select     home     pro dashboards     account export
```

**Дизайн-инвариант.** Каждый экран знает, в какой фазе пользователь. Home меняет порядок quick actions: Discover-фаза → catalog cards; Live-фаза → upcoming bookings; Manage-фаза → pending owner approvals.

### 03.4 · Persona × Surface heatmap

Сокращённая версия. Полная — `docs/canonical/01-segmentation-framework.md`.

| Persona | Home | Discover | Operate | Wallet | Me | Главный intent |
|---|:-:|:-:|:-:|:-:|:-:|---|
| P1 Tourist | ●●● | ●●● | — | ●● | ● | Stay · transport · SIM |
| P3 Resident | ●●● | ●● | — | ●●● | ●● | Lifestyle · legal |
| P6 New expat | ●●● | ●●● | — | ●● | ●●● | Onboarding · settle |
| P8 Owner | ●● | ● | ●●● | ●●● | ●● | Income · maintenance |
| P9 HNW Investor | ●● | ● | ●●● | ●● | ●● | DD · mandates |
| P10 Operator | ● | — | ●●● | ●●● | ● | Properties · staff |
| P22 Developer | — | — | ●●● | ●● | ● | ClearView · sales |

### 03.5 · Cross-cluster journeys

Сценарии редко живут в одном кластере. Дизайн обязан показывать **связку**.

**Example: Visa expiring + tax due + rental income drop.**
В одной неделе у Owner-резидента могут совпасть: visa extension (Legal) + tax filing (Legal) + low season booking dip (Manage). Home показывает их в одном «stack» с приоритетом по deadline, а не по типу.

**Дизайн-правило.** Signal cards в Home сортируются по `priority_score = deadline_proximity·3 + financial_impact·2 + role_weight·1`. Не по кластеру.

---

## 04 · Голос

> Голос — это не «слова в кнопках». Это **подразумеваемое отношение к читателю**. Полный гайд: `docs/canonical/03-tone-of-voice.md`. Здесь — операционная выжимка для дизайнеров.

### 04.1 · Brand voice — четыре атрибута

| Атрибут | Что это значит | Что это НЕ значит |
|---|---|---|
| **Calm Authority** | Спокойная уверенность профессионала. «Ваш визовый агент работает над продлением. Срок: 7 рабочих дней.» | Не суровый официоз. Не «обращаем ваше внимание». |
| **Practical Clarity** | Конкретно, без воды. «Договор подписан. Деньги поступят 17 мая.» | Не маркетинговые тизеры. Не «совершите свой первый шаг к…». |
| **Quiet Care** | Тёплое внимание без снисхождения. «Если что-то непонятно — спросите. Это не глупый вопрос.» | Не «дорогой друг». Не эмодзи. Не восклицания. |
| **Earned Confidence** | Уверенность подкреплена цифрами и аудит-маркером. «Объект прошёл DD по 47 критериям. Отчёт в PDF.» | Не «лучший выбор», «топ-1», «эксклюзив». |

### 04.2 · Voice spectrum

```
Formal ←————————————————————————————————→ Casual
           ╳ myUNO                ╳ Booking         ╳ Airbnb

Serious ←———————————————————————————————→ Playful
        ╳ myUNO     ╳ Stripe                 ╳ Slack

Cool ←——————————————————————————————————→ Warm
            ╳ Linear   ╳ myUNO          ╳ Notion
```

### 04.3 · Tone modulation по контексту

Голос — один. Тон — меняется. Шкала:

| Контекст | Тон | Пример |
|---|---|---|
| **Money / financial** | Точность · audit · цифры | «Перевод ฿45,000 проведён. ID транзакции: tx_8x3kQ.» |
| **Legal / compliance** | Конкретика · ссылки на закон · никаких пугалок | «Виза истекает 12 июня. Заявление подаём 21 мая.» |
| **Emergency / SOS** | Короткие фразы · действия · никакой эмпатии | «Полиция: +66 191. Открыть карту места.» |
| **Lifestyle / discovery** | Чуть теплее, но без панибратства | «Suay открыта до 23:00. Стол на 8 свободен.» |
| **Onboarding** | Терпение · explainer · мини-победы | «Готово. Один шаг из четырёх. Дальше — выбор ролей.» |
| **Empty states** | Конкретный next step | «Здесь будут ваши объекты. Добавить первый» (CTA) |
| **Error states** | Что произошло · что делать · кому писать | «Платёж не прошёл. Карта отклонена банком. Попробуйте другую или напишите в поддержку.» |

### 04.4 · Микрокопирование (UI strings)

**Buttons.** Глагол + объект. «Сохранить изменения» / «Save changes». Никогда «OK», «Submit», «Confirm» без контекста.

**Headlines.** Существительное + контекст. «Платежи за май» не «Здесь ваши платежи».

**Placeholders.** Пример, не инструкция. «+66 81 234 5678» не «Введите номер телефона».

**Helper text.** Зачем поле, без обвинений. «Для отправки чека Stripe» не «Обязательное поле».

**Loading.** Глагол + объект. «Загружаем объекты…» не «Подождите…».

**Empty.** Заголовок (что тут будет) + CTA (как добавить).

**Error.** Что · Почему · Что делать.

**Success.** Что произошло + следующий шаг (если есть).

### 04.5 · Запреты в копирайте

- ❌ Эмодзи в UI (исключение: emoji-icons в персональных переписках)
- ❌ Восклицательные знаки в UI chrome (исключение: SOS, emergency)
- ❌ Маркетинговые тизеры («Откройте для себя…», «Совершите первый шаг…»)
- ❌ Извинения перед действием («К сожалению…», «Мы не смогли…»). Только в error states.
- ❌ Капс-лок (исключение: country codes, currency codes)
- ❌ «Дорогой друг», «Уважаемый клиент». Просто имя или ничего.
- ❌ Двойные отрицания. «Это нельзя не сделать» = «Это нужно сделать».
- ❌ Жаргон без объяснения. KYC, RLS, DD — расшифровываем в первом упоминании.

### 04.6 · Bilingual voice (RU / EN parity)

**Принцип.** Английская версия не «перевод», а **параллельный голос**. Та же мысль, идиомы языка.

| RU | EN (так) | EN (НЕ так) |
|---|---|---|
| «Готово. Платёж проведён.» | «Done. Payment processed.» | «Successfully completed!» |
| «Виза истекает через 21 день.» | «Visa expires in 21 days.» | «Your visa will expire soon.» |
| «Объект не найден.» | «Listing not found.» | «We couldn't find this object.» |
| «Добавить объект» | «Add property» | «Create new property» |

**Правило именования.** Используем local English: `property` не `real estate object`, `listing` не `ad`, `booking` не `reservation request`, `villa` не `house`.

### 04.7 · Voice for AI agents

AI-агенты говорят в **третьем лице о себе** или просто факт + intent. Никогда «я думаю», «мне кажется».

| Хорошо | Плохо |
|---|---|
| «Visa Guardian: «Виза истекает 12 июня. Подать заявление?»» | «Я Visa Guardian и я думаю, что вам пора…» |
| «3 viewings overlap on Thursday. Re-slot?» | «I noticed that you have three viewings…» |
| «Statement готов. Подписать?» | «Hello! Your statement is ready for your review!» |

---

## 05 · Foundations

> Источник истины для **всех** визуальных решений — `src/styles/tokens.css` в runtime + `tailwind.config.ts`. Этот раздел — нормализованная выжимка. При расхождении доверяем `tokens.css`.

### 05.1 · Цветовая система

#### Dark theme (default — `:root`)

| Token | HSL | Hex | Назначение |
|---|---|---|---|
| `--background` | `216 60% 7%` | `#08101E` | Page background |
| `--secondary` | `214 47% 12%` | `#0F1C2E` | Panel / nav background |
| `--card` | `213 38% 15%` | `#162236` | Cards, modals |
| `--card-elevated` | `213 38% 19%` | `#1E2D45` | Elevated cards |
| `--primary` | `157 100% 42%` | `#00D68F` | CTAs, links, active states (mint) |
| `--accent` | `224 100% 65%` | `#4E7BFF` | Secondary actions, info (blue) |
| `--gold` | `38 92% 50%` | `#F59E0B` | Legal cluster, premium badges |
| `--foreground` | `222 73% 96%` | `#EDF2FF` | Primary text |
| `--muted-foreground` | `211 17% 64%` | `#8FA3B8` | Secondary text |
| `--border` | `0 0% 100% / 0.07` | rgba 7% | Default dividers |
| `--border-strong` | `0 0% 100% / 0.14` | rgba 14% | Emphasized borders |
| `--success` | `152 58% 42%` | `#2D9966` | Distinct from primary |
| `--warning` | `38 92% 50%` | `#F59E0B` | Caution states |
| `--destructive` | `0 72% 51%` | `#D93535` | Destructive actions |

#### Light theme (`html.light`)

| Token | Hex | Назначение |
|---|---|---|
| `--background` | `#fafaf9` | Warm white page bg |
| `--card` | `#ffffff` | White cards |
| `--primary` | `#0d6e4f` | Emerald CTA |
| `--accent` | navy `#1e3a8a` | Trust accent |
| `--foreground` | `#1a1a19` | Near-black text |
| `--muted-foreground` | `#57534e` | Warm gray secondary |
| `--border` | `#e5e5e4` | Warm gray dividers |
| `--success` | `#16a34a` | Distinct green |
| `--warning` | `#d97706` | Amber |
| `--destructive` | `#dc2626` | Red |

#### Cluster accent system (IMMUTABLE)

| Cluster | Token | Hex (dark) | Vertical |
|---|---|---|---|
| arrive | `--cluster-arrive` | `#00D68F` (=primary) | Relocation, arrival |
| live | `--cluster-live` | `#4E7BFF` (=accent) | Lifestyle, services |
| legal | `--cluster-legal` | `#F59E0B` | Legal, visas, contracts |
| invest | `--cluster-invest` | `#A78BFA` | Property investment |
| manage | `--cluster-manage` | `#16BDCA` | Property management (STAYS) |
| build | `--cluster-build` | `#EF4444` | Developer/offplan (DEALS) |

**Правило использования цвета.**
- `background` + `card` — 80% площади экрана
- `foreground` + `muted-foreground` — текст
- `primary` — 1 главный CTA на экран
- `cluster-*` — категориальная плашка / акцент / activity tag
- `success` · `warning` · `destructive` — только для статусов
- Никогда не миксовать 2 cluster colors на одном экране кроме `/discover` (где они и есть карта)

### 05.2 · Типографика

**Канонические шрифты (matches `tokens.css` + Design Bible v2):**

| Роль | Шрифт | Weight | Tracking | Когда |
|---|---|---|---|---|
| Display / headings | **Source Serif 4** | 400–700 | −0.025em → −0.01em | Hero, page titles, section heads |
| Body / UI | **Geist** | 400–700 | +0.005em | Body text, buttons, labels |
| Numerics / data / mono | **IBM Plex Mono** | 400–500 | tabular-nums | Prices, IDs, coordinates, timestamps |
| Locale fallback RU | Unbounded → Golos Text → Noto Serif / Noto Sans | — | — | Когда Source Serif 4 не загрузился |
| Locale fallback EN | Noto Serif → Noto Sans → Georgia / system-ui | — | — | Когда Source Serif 4 не загрузился |
| Luxury (`/newbuilds`) | **Cormorant Garamond** | 400–700 italic | — | **Только** Dark Luxury theme |

**⛔ НЕ используется в коде:** Syne · DM Sans · Playfair Display · JetBrains Mono · Sarabun. Старые доки могут ссылаться — они stale.

**Type scale.**

| Token | Size | Line height | Weight | Font | Tailwind |
|---|---|---|---|---|---|
| `display-xl` | 3rem (48px) | 1.1 | 700 | Source Serif 4 | `text-5xl font-display font-bold` |
| `display-lg` | 2.5rem (40px) | 1.1 | 700 | Source Serif 4 | `text-4xl font-display font-bold` |
| `display-md` | 2rem (32px) | 1.2 | 600 | Source Serif 4 | `text-3xl font-display font-semibold` |
| `heading-lg` | 1.5rem (24px) | 1.25 | 600 | Source Serif 4 | `text-2xl font-display font-semibold` |
| `heading-md` | 1.25rem (20px) | 1.3 | 600 | Source Serif 4 | `text-xl font-display font-semibold` |
| `heading-sm` | 1.125rem (18px) | 1.4 | 600 | Geist | `text-lg font-sans font-semibold` |
| `body-lg` | 1rem (16px) | 1.5 | 400 | Geist | `text-base font-sans` |
| `body-md` | 0.875rem (14px) | 1.5 | 400 | Geist | `text-sm font-sans` |
| `body-sm` | 0.8125rem (13px) | 1.5 | 400 | Geist | `text-[13px] font-sans` |
| `caption` | 0.75rem (12px) | 1.4 | 500 | Geist | `text-xs font-sans font-medium` |
| `overline` | 0.625rem (10px) | 1.4 | 600 | Geist | `text-[10px] uppercase tracking-wider font-semibold` |
| `mono-lg` | 1rem (16px) | 1.5 | 400 | IBM Plex Mono | `text-base font-mono` |
| `mono-md` | 0.875rem (14px) | 1.5 | 400 | IBM Plex Mono | `text-sm font-mono` |
| `mono-sm` | 0.75rem (12px) | 1.4 | 500 | IBM Plex Mono | `text-xs font-mono font-medium` |

**Tailwind aliases.** `font-display` → Source Serif 4 · `font-sans` → Geist · `font-mono` → IBM Plex Mono · `font-serif` → Cormorant (luxury only).

**Loading.** Google Fonts via `index.html` (preconnect + print-then-all async). CSP allows `fonts.googleapis.com` + `fonts.gstatic.com`.

**Числа.** Всегда `font-mono` + `font-feature-settings: "tnum"` (tabular numerals). Применяется автоматически для `<Money>`, `<Date>`, `<TxId>` компонентов.

### 05.3 · Spacing scale

**Base unit:** 4px. **Density:** Comfortable (real-money UX нужен воздух).

```
0   4   8   12   16   20   24   32   40   48   64   80   96   128
```

| Token | Value | Tailwind | Когда |
|---|---|---|---|
| `space-0` | 0 | `gap-0` | Edge to edge |
| `space-1` | 4px | `gap-1` | Tight (icons in buttons) |
| `space-2` | 8px | `gap-2` | Compact (badges) |
| `space-3` | 12px | `gap-3` | Default form rows |
| `space-4` | 16px | `gap-4` | Card padding default |
| `space-5` | 20px | `gap-5` | Section gap inside card |
| `space-6` | 24px | `gap-6` | Card → card |
| `space-8` | 32px | `gap-8` | Section → section |
| `space-10` | 40px | `gap-10` | Major block separation |
| `space-12` | 48px | `gap-12` | Hero spacing |
| `space-16` | 64px | `gap-16` | Page rhythm |
| `space-20` | 80px | `gap-20` | Marketing page sections |
| `space-24` | 96px | `gap-24` | Landing hero offset |

**Card spec.** `--card-padding: 1rem` (16px) standard · `--card-padding-compact: 0.75rem` for tight lists · `--card-gap: 0.75rem`.

### 05.4 · Layout & breakpoints

**Mobile-first.** Дизайн начинается с 375px и расширяется.

| Name | Width | Когда |
|---|---|---|
| xs | 400px | Маленький мобильный (iPhone SE) |
| sm | 640px | Большой мобильный, landscape |
| md | 768px | Tablet portrait |
| lg | 1024px | Tablet landscape, small laptop |
| xl | 1280px | Desktop |
| 2xl | 1400px | Large desktop |

**Max content width.** 1400px (`container` + `2rem` padding). Внутри — типографская колонка 720–880px для длинных текстов.

**Grid.**
- Mobile: 4 column, 16px gutter, 16px margin
- Tablet: 8 column, 24px gutter, 24px margin
- Desktop: 12 column, 32px gutter, 48px margin

**Touch targets.** Min 44×44px. Spacing между tappable elements ≥ 8px.

### 05.5 · Border radius

App-like, очень закруглённый — подчёркивает «native feel».

| Token | Value | Tailwind | Когда |
|---|---|---|---|
| `--radius-none` | 0 | `rounded-none` | Edge of screen, full-bleed |
| `--radius-sm` | 10px | `rounded-sm` | Buttons, badges, inputs, tags |
| `--radius-md` | 16px | `rounded-md` | Cards, panels, modals |
| `--radius-lg` | 24px | `rounded-lg` | Full-bleed sections, bottom sheets |
| `--radius-xl` | 32px | `rounded-xl` | Hero blocks, big modals |
| `--radius-full` | 9999px | `rounded-full` | Pills, avatars, toggles, FAB |

### 05.6 · Elevation (shadows)

Dark theme — RGBA black для глубины. Light theme — brand-tinted shadows.

| Level | Dark | Когда |
|---|---|---|
| `shadow-0` | none | Flat inline elements |
| `shadow-1` | `0 1px 3px rgba(0,0,0,0.3)` | Resting cards |
| `shadow-2` | `0 4px 24px rgba(0,0,0,0.3)` | Raised cards (`--shadow-card`) |
| `shadow-3` | `0 8px 32px rgba(0,0,0,0.4) + glow 8%` | Active hover |
| `shadow-4` | `0 12px 40px rgba(0,0,0,0.5) + glow 10%` | Modals, drawers |
| `shadow-5` | `0 20px 48px rgba(0,0,0,0.6) + glow 12%` | Floating FAB, tooltips |

Glow — `rgba(0,214,143,0.*)` mint. Привязывает elevation к brand.

### 05.7 · Z-index scale

| Layer | Value | Когда |
|---|---|---|
| `--z-base` | 0 | Default |
| `--z-dropdown` | 10 | Select, tooltip |
| `--z-sticky` | 20 | Sticky header / footer |
| `--z-fixed` | 30 | Fixed nav |
| `--z-overlay` | 40 | Modal backdrop |
| `--z-modal` | 50 | Modal content |
| `--z-popover` | 60 | Popover, dropdown menu |
| `--z-toast` | 70 | Toast notifications |
| `--z-tooltip` | 80 | Tooltip |
| `--z-sos` | 100 | SOS modal (всегда сверху) |

### 05.8 · Motion tokens (см. §29 для полного гайда)

**Easing curves:**
- Standard: `cubic-bezier(0.4, 0, 0.2, 1)` — material default
- Enter: `cubic-bezier(0, 0, 0.2, 1)` — ease-out, fast start
- Exit: `cubic-bezier(0.4, 0, 1, 1)` — ease-in, fast end
- Spring: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` — confirmations

**Duration scale:**
- `motion-instant` — 50ms (micro feedback)
- `motion-fast` — 100ms (hover states)
- `motion-normal` — 150ms (button press, tab switch)
- `motion-slow` — 250ms (panel transitions)
- `motion-entrance` — 300ms (page-level fade-in-up)

### 05.9 · Iconography baseline (см. §27 для полного гайда)

**Базовая библиотека.** `lucide-react`. Доступно ~1500 иконок, единый стиль.

**Sizes.**
- `icon-xs` — 12px (inside text)
- `icon-sm` — 16px (buttons, inline)
- `icon-md` — 20px (default UI)
- `icon-lg` — 24px (navigation, headers)
- `icon-xl` — 32px (empty states, hero)
- `icon-2xl` — 48px (illustrations)

**Stroke.** `1.5px` стандарт. `2px` для navigation/header. `1px` для disabled.

### 05.10 · Опираемся на токены, не на хардкод

```tsx
// ❌ ЗАПРЕЩЕНО
<div style={{ backgroundColor: '#00D68F', color: '#fff' }}>

// ✅ ПРАВИЛЬНО
<div className="bg-primary text-primary-foreground">

// ✅ ПРАВИЛЬНО (inline через токены)
<div style={{ backgroundColor: 'hsl(var(--primary))' }}>
```

---

## 06 · Components

> Полная библиотека — shadcn/ui + Radix UI с myUNO-кастомизацией. Источник: `src/components/ui/`. Здесь — операционный реестр и правила.

### 06.1 · Atomic taxonomy

```
Atoms       Button · Input · Badge · Avatar · Icon · Tag · Spinner · Skeleton · Divider
Molecules   Card · FormField · DataRow · KeyValue · PriceTag · StatusPill · ActivityRow · BreadcrumbItem
Organisms   Header · Footer · Sidebar · ListingCard · BookingCard · FormSection · DataTable · Calendar · Map
Templates   AppLayout · MiniAppLayout · OperateLayout · MarketingLayout · AuthLayout
Surfaces    Home · Discover · Operate · Wallet · Me · Admin canvases
```

### 06.2 · Button

| Variant | Когда | Tailwind classes |
|---|---|---|
| `primary` | Главное действие на экране (1 шт) | `bg-primary text-primary-foreground` |
| `secondary` | Вторичное действие | `bg-card border border-border-strong` |
| `outline` | Action в card / table cell | `bg-transparent border border-border-strong` |
| `ghost` | Action в nav, low emphasis | `bg-transparent hover:bg-card` |
| `destructive` | Удаление, отмена | `bg-destructive text-destructive-foreground` |
| `link` | Inline text action | `text-primary underline-offset-4 hover:underline` |

**Sizes.** `sm` 32px height · `md` 40px (default) · `lg` 48px (mobile main) · `xl` 56px (hero CTA).

**Правила.**
- Min touch target 44×44px на мобиле — поэтому default `md` (40px) + `py-1` padding суммарно ≥ 44px.
- Только **один** `primary` на экран.
- Loading state: spinner + disabled + text «Saving…» / «Сохраняем…».
- Icon-only button: aria-label обязателен.

### 06.3 · Input / Form fields

**Types.** `text` · `email` · `tel` · `number` · `password` · `textarea` · `select` · `combobox` · `date` · `time` · `file`.

**Anatomy.**
```
Label (required *)
[Input field]                    Helper text (optional)
Error text (when invalid)
```

**States.** default · focus · disabled · readonly · invalid · valid · loading.

**Размеры.** Height 44px на mobile (touch), 40px на desktop. Padding 12px horizontal.

**Specialized:**
- `<MoneyInput>` — IBM Plex Mono, tabular nums, currency selector, валидация суммы > 0
- `<PhoneInput>` — country code dropdown (+66 default), формат E.164
- `<PassportInput>` — country flag dropdown, MRZ-like field
- `<AddressInput>` — Google Places autocomplete, Phuket bias

### 06.4 · Card

**Variants.**
- `default` — `bg-card rounded-md p-4 shadow-1`
- `elevated` — `bg-card-elevated rounded-md p-4 shadow-2`
- `interactive` — добавляет `hover:shadow-3 cursor-pointer transition-shadow`
- `outlined` — `bg-transparent border border-border-strong rounded-md p-4`
- `cluster-tinted` — `bg-card` + 4px left border `border-l-cluster-{name}` для категориальной маркировки

**Composition.**
```
<Card>
  <CardHeader>
    <CardTitle>Heading</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>...</CardFooter>
</Card>
```

### 06.5 · Sheet / Modal / Dialog

**Mobile = Sheet (bottom).** Не Dialog. Всегда snap-points: 25% / 50% / 90%.

**Desktop = Dialog.** Centered, max-width 480/640/800/1000px по контексту.

**Drawer (side).** Только desktop, для nav extensions. Никогда на mobile.

**Когда что.**
- Подтверждение (confirm/cancel) → Dialog (mobile: Sheet 25%)
- Длинная форма → Sheet (mobile) / Dialog max-width 640 (desktop)
- Фильтры списка → Sheet bottom 50%
- Carousel detail → Sheet 90% / Dialog full
- SOS → Sheet с `--z-sos`

### 06.6 · Toast / Alert / Banner

| Component | Когда | Lifecycle |
|---|---|---|
| **Toast** | Подтверждение действия, ephemeral | 3 sec auto-dismiss |
| **Alert** | Inline предупреждение в форме / странице | Persistent |
| **Banner** | Системное сообщение в layout | Persistent с dismiss |

**Variants.** `info` · `success` · `warning` · `error`.

**Микрокопирование** — см. §04.4.

### 06.7 · Table / List

**Mobile.** `List` (Card-per-row).
**Desktop.** `Table` (sticky header, sortable, paginated).

**Auto-switch.** Один компонент `<DataView>` → выбирает Table vs List по breakpoint.

**Required UX.**
- Empty state с CTA (см. §08)
- Loading skeleton (matches row structure)
- Error state с retry
- Pagination или infinite scroll (выбор по контексту)
- Sort indicators (mobile через sheet, desktop через header click)
- Filter UI (mobile sheet, desktop sidebar)

### 06.8 · ListingCard (для каталога объектов / услуг)

**Mobile (375px).**
```
┌──────────────────────┐
│ [hero image 16:9]    │
│                      │
├──────────────────────┤
│ Cluster badge        │
│ Title (heading-md)   │
│ Location · Bedrooms  │
│ ฿XX,XXX / month      │
│ ★ 4.8 · ClearView A  │
└──────────────────────┘
```

**Desktop (≥md).** Horizontal: image (40%) + content (60%).

**Required.** Bookmark icon (favourites), share, lazy image, srcset.

### 06.9 · BookingCard (для активных бронирований)

```
[Cluster icon] Service name · provider
Date · time · address
Status pill (pending / confirmed / completed)
[Action buttons: chat · reschedule · cancel]
Audit marker: order_id · timestamp
```

### 06.10 · ActivityRow (Home feed item)

```
[Icon] [Cluster color dot]
Subject (heading-sm)
Description (body-md)
Time (mono-sm)
[Inline action]
```

### 06.11 · KeyValue (для статистики, профиля, settings)

```
Label (caption muted)
Value (heading-sm OR mono-md для чисел)
```

Используется в Wallet, Property details, Owner Timeline, любом read-only data.

### 06.12 · DataTable

Powered by `@tanstack/react-table`. Required:
- Sticky header
- Sortable columns с indicator
- Per-column filter (через popover)
- Bulk actions через checkbox column
- Row actions через `…` menu
- Empty / loading / error states
- Mobile fallback: switch to Card list

### 06.13 · Calendar

**Variants.**
- `MonthCalendar` — Booking availability (Stays)
- `RangePicker` — Date range selection (form input)
- `WeekView` — Schedule (Staff)
- `AgendaView` — Bookings list (Owner Timeline)

Powered by `react-day-picker`. Locale: ru-RU / en-US. First day: Monday (RU norm).

### 06.14 · Map

См. §26 для подробностей. Базовый компонент `<MapView>` — Google Maps wrapper. Required: marker clustering, mobile gesture-friendly, accessibility fallback list.

### 06.15 · PriceTag · Money

```tsx
<Money amount={45000} currency="THB" />
// Renders: "฿45,000" (mono, tabular)

<Money amount={1200000} currency="USD" format="compact" />
// Renders: "$1.2M"

<Money amount={45000} currency="THB" detail showAudit />
// Renders: "฿45,000" + audit marker (tx_id, timestamp)
```

Always `font-mono` + `tabular-nums`. Currency symbols: ฿ THB · $ USD · € EUR · ¥ JPY · ₽ RUB.

### 06.16 · Date

```tsx
<DateText value="2026-05-14T10:30:00+07:00" />
// Renders: "14 May 2026" / "14 мая 2026"

<DateText value="..." format="relative" />
// Renders: "in 2 hours" / "через 2 часа"

<DateText value="..." format="full" tz />
// Renders: "Wed 14 May 2026, 10:30 ICT"
```

Timezone default: `Asia/Bangkok` (ICT). Locale: from i18n.

### 06.17 · StatusPill

```tsx
<StatusPill variant="success">Подтверждено</StatusPill>
<StatusPill variant="pending">Ожидает оплаты</StatusPill>
<StatusPill variant="cluster" cluster="legal">Visa</StatusPill>
```

Always rounded-full, font-medium, text-xs, padding 12px horizontal.

### 06.18 · Component anti-patterns

- ❌ Не создавать новый компонент, когда подойдёт shadcn-ui.
- ❌ Не оборачивать `<Button>` в `<a>`. Использовать `<Button asChild><Link>...</Link></Button>`.
- ❌ Не использовать `<Dialog>` на mobile для primary actions. Только `<Sheet>`.
- ❌ Не использовать абсолютные пиксели в стилях. Только `space-*`, `text-*`, `rounded-*` токены.
- ❌ Не использовать `console.log` для отладки UI — есть `Sentry.captureMessage`.

---

## 07 · Patterns

> Паттерны — это **«как мы делаем это здесь»**. Когда вопрос «как реализовать flow X» — ищи паттерн.

### 07.1 · Form pattern

**Стек.** React Hook Form 7 + Zod validation. Каждое поле — `<FormField>` обёртка.

**Mobile-first.**
- Одно поле в строке.
- Stacking: label → input → helper → error.
- Submit button — sticky bottom на mobile (внутри Sheet или footer).

**Validation.**
- На blur (не на каждый keystroke).
- Inline error text под полем.
- Submit blocked при невалидной форме, но без вибрации экрана.

**Длинные формы.**
- Разбиваем на шаги (`<FormStep>` + progress indicator).
- «Save & continue later» опция.
- Draft saved to localStorage + Supabase (для авторизованных).

### 07.2 · Booking pattern

```
1. Browse → Listing detail
2. Select slot (calendar) → confirmation card
3. Add-ons (optional)
4. Personal info (if not logged in) → /auth/signup inline
5. Payment (Stripe) → 3DS если нужно
6. Confirmation screen + audit marker
7. Email + push + Telegram notification
8. Event: `booking.created` → feeds Yield Optimiser, Concierge agents
```

### 07.3 · Checkout pattern

**Универсальный shared handler:** `supabase/functions/_shared/checkout-handler.ts`. Любой новый чекаут — через этот handler.

```
1. Frontend → /api/create-checkout (Edge function)
2. Edge function валидирует cart, создаёт order_draft (status=pending)
3. Stripe Checkout session create → return checkout_url
4. Frontend redirect → Stripe
5. Stripe webhook → /api/stripe-webhook
6. Order confirmed (status=paid)
7. record_ledger_entries RPC → ledger_entries created
8. Notifications fan-out (push, email, WhatsApp, Telegram)
9. Frontend polls /api/order/:id until confirmed → success page
```

### 07.4 · Search pattern

**Mobile.**
- Sticky search input на top.
- Filter chips ниже input (scroll horizontal).
- «Filter» button → opens Sheet bottom 90%.
- Sort → opens Sheet bottom 25%.
- Map toggle (если есть geo).

**Desktop.**
- Search input центрирован.
- Filters в left sidebar (300px width).
- Sort dropdown справа.
- Map split-view справа (50% width).

### 07.5 · Empty state pattern

См. §08.2 для полной механики. Базовый шаблон:

```
[Illustration или icon 48px muted]
Heading (что тут должно быть)
Description (как это получить)
[Primary CTA] [Secondary CTA optional]
```

### 07.6 · Permission gate pattern

```tsx
<RoleGate require="Owner" fallback={<UpgradePrompt />}>
  <OwnerDashboard />
</RoleGate>

<KYCGate require="level_2" fallback={<KYCPrompt />}>
  <MoneyMovement />
</KYCGate>

<FeatureFlagGate flag="clearview_v2" fallback={null}>
  <ClearViewV2Widget />
</FeatureFlagGate>
```

**Правило.** Любая денежная операция → KYC level_2 minimum. Любая роль-специфичная — RoleGate.

### 07.7 · Intent confirmation pattern (AI agent intents)

AI agent создаёт intent → Home concierge card → user has 3 options:

```
[Intent card]
"Visa Guardian: Visa expires June 12. Start extension?"

[Accept]  [Later]  [Dismiss]

✓ Accept → opens /app/legal/visa/extend with prefilled data
○ Later → snooze 7 days, intent stays in /me/intents
✗ Dismiss → permanent dismiss, agent learns
```

**Hard rule.** Никогда auto-execute money moves. Always user-confirmed.

### 07.8 · Trust marker pattern

Любой экран с деньгами / документами / юр. действием показывает:

```
┌──────────────────────────────────────┐
│ Transaction details                  │
│ ...                                  │
│                                      │
│ ─────────────────────────────────── │
│ tx_id: tx_8x3kQ9mF                  │
│ ledger: le_7d2x1                    │
│ recorded: 2026-05-14 10:30:00 ICT   │
│ verified by: Supabase audit log     │
└──────────────────────────────────────┘
```

Стиль: muted-foreground, mono, text-xs. Кликается → opens audit log detail.

### 07.9 · Cluster colour application

**Правило.** Cluster color появляется в:
1. Cluster badge на ListingCard.
2. Left border 4px на cluster-tinted Card.
3. Cluster icon в navigation.
4. Cluster filter chip в `/discover`.
5. Cluster headline на `/discover/cluster/:id`.

**НЕ применяется в:**
- Body text
- Buttons (primary/secondary всегда brand mint/blue)
- Background больших areas (только в `/discover/cluster/:id` hero может быть subtle tint)

### 07.10 · Loading pattern

См. §08.1. Три уровня:

1. **Skeleton** — для known shape (card, table row, list)
2. **Spinner** — для unknown duration (saving, processing)
3. **Progress bar** — для multi-step с known total (upload, multi-step form)

### 07.11 · Optimistic update pattern

Для actions с высокой confidence (like, bookmark, mark-as-read):
1. Update UI immediately
2. Fire request in background
3. On error: rollback + toast «Не удалось. Повторить?»

Для actions с low confidence (payment, contract sign):
1. Loading state
2. Wait for server confirmation
3. Then update UI

### 07.12 · Notification pattern

См. §25. Принципы:
- Single router (one function, fans out)
- Channel selection per user pref (push / email / WhatsApp / Telegram)
- Quiet hours respect (22:00–08:00 ICT default)
- Deep link на конкретный экран
- Throttling (не более 3 push в сутки на user без явного opt-in)

### 07.13 · Deep link pattern

Все URL → deep-linkable. Никакой state в JS memory без URL reflection.

```
/app/invest/item/abc123                  → property detail
/app/invest/item/abc123?tab=dd           → DD tab
/app/invest/item/abc123?tab=dd&pdf=true  → DD PDF preview
/operate/owner/properties/xyz789/income/2026-05 → owner income drill-down
```

### 07.14 · Confirmation pattern (destructive actions)

Для irreversible actions (cancel booking, delete property, terminate contract):

```
[Dialog / Sheet]
"Удалить объект Villa Nai Thon 12?"

Это действие нельзя отменить. Все 47 связанных бронирований
останутся в архиве, но объект больше не появится в каталоге.

[Cancel]  [Delete]  ← destructive variant
```

Required: typed confirmation для high-stakes («Type DELETE to confirm»).

### 07.15 · Multi-step pattern

```
Step 1 of 4
[Progress bar with 25% filled]
─────────────────────────────
[Form content]

[← Back]                  [Continue →]
```

Mobile: sticky bottom bar with prev/next. Each step deep-linkable: `/onboarding?step=2`.

---

## 08 · States

> Каждый экран имеет **минимум 5 состояний.** Если разработчик не нарисовал все — это незаконченный экран.

### 08.1 · Loading state

**Когда.** Запрос в полёте, нет данных в кэше.

**Visual.**
- Известная форма (card, list, table) → Skeleton (`<Skeleton>` shadcn). Pulse animation.
- Неизвестная форма (full screen, async action) → Centred spinner + label «Загружаем объекты…».
- Long-running (upload, generate PDF) → Progress bar + percentage.

**Не используем.** «Loading…» без контекста. Generic spinners без сообщения. Stuck skeleton без timeout (если > 10 sec — переключаем на error).

### 08.2 · Empty state

**Когда.** Запрос успешен, но данных нет.

**Anatomy.**
```
[Icon 48px muted-foreground]
Heading (heading-md): «У вас пока нет объектов»
Description (body-md muted): «Добавьте первый объект, чтобы видеть бронирования и доход.»
[Primary CTA]: «Добавить объект»
[Secondary CTA]: «Импортировать из CSV»
```

**Варианты.**
- First-time empty: онбординг-копирайт + tutorial link
- Filtered empty: «Не нашли по фильтрам. Сбросить?»
- Error-related empty: combine with error state

### 08.3 · Error state

**Anatomy.**
```
[Icon 48px text-destructive]
Heading: «Не удалось загрузить» (body-lg, не дисплей)
Description: что произошло, что делать.
[Retry button]  [Contact support link]
```

**Tone.** Не извиняемся в headline. Конкретика в description.

```
❌ «Упс! Что-то пошло не так. Мы уже работаем над этим.»
✅ «Не удалось загрузить объекты. Проверьте интернет или повторите.»
```

**Logging.** Каждая error state → `Sentry.captureException(error, { tags: { screen: 'owner/properties' } })`.

### 08.4 · Success state

**Когда.** Action завершён, пользователь должен понять что произошло + next step.

**Anatomy.**
```
[Checkmark icon 48px text-success]
Heading: «Платёж проведён»
Description: «฿45,000 списано с карты ···4242. ID: tx_8x3kQ.»
[Next step CTA]: «Открыть бронирование»
[Secondary]: «Вернуться на главную»
```

**Audit marker** — обязательно для money operations (см. §07.8).

### 08.5 · Disabled / Readonly

**Disabled (action недоступен).**
- `opacity-50 cursor-not-allowed`
- Tooltip с причиной: «Доступно после KYC уровня 2»
- Помечаем aria-disabled

**Readonly (значение можно видеть, нельзя редактировать).**
- Same color, no border, no hover
- Иконка `lock` справа от поля
- Tooltip: «Только для чтения после подписания»

### 08.6 · Offline state

myUNO — PWA. Capacitor build offline-aware.

**Banner top.** «Нет интернета. Изменения сохранятся локально и синхронизируются позже.»

**Behaviour.**
- Cached pages работают (TanStack Query staleTime).
- Forms saved to IndexedDB, replay on reconnect.
- Money actions заблокированы offline — обязателен live confirmation.

### 08.7 · Permission denied

```
[Icon 48px muted-foreground]
Heading: «Этот раздел доступен Owner-роли»
Description: «Добавьте Owner в свой профиль или попросите доступ у владельца аккаунта.»
[Add Owner role]  [Contact admin]
```

### 08.8 · KYC required

```
[Icon 48px text-warning]
Heading: «Подтвердите личность для этой операции»
Description: «Загрузите паспорт и сделайте селфи (60 секунд) — это требование SEC для платежей выше ฿100,000.»
[Start verification]  [Why?]
```

### 08.9 · Maintenance state (планируемый downtime)

Banner top с countdown: «Плановое обновление: 14 мая 02:00–04:00 ICT. Возможны перебои.»

### 08.10 · Rate limit

```
[Icon 48px text-warning]
Heading: «Слишком много попыток»
Description: «Подождите 5 минут и повторите. Если ошибка повторяется — напишите в поддержку.»
[Wait 5:00 countdown]  [Support]
```

### 08.11 · Состояния matrix

| Экран | Loading | Empty | Error | Success | Disabled/Readonly | Offline |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Home | Skeleton | First-run | Banner | — | — | Banner |
| Listing list | Skeleton | Filter / first | Retry | — | — | Cached |
| Booking flow | Step spinner | — | Inline | Confirmation | After submit | Block |
| Payment | Spinner+lock | — | Specific msg | Tx detail | Method disabled | Block |
| Owner timeline | Skeleton | First-time | Retry | — | Archived | Cached |
| Forms | Submit spinner | — | Field error | Toast + redirect | Field readonly | Save draft |

---

## 09 · Языки

### 09.1 · Поддерживаемые языки

| Язык | Status | Coverage | Когда |
|---|---|---|---|
| **Russian (ru-RU)** | Primary | 100% | Default для P0 аудитории (русскоязычные экспаты) |
| **English (en-US)** | Primary | 100% | International users, fallback |
| **Thai (th-TH)** | Partial | Phuket-specific (legal terms, place names) | Только в context-зависимых компонентах |
| Chinese (zh) | Planned P2 | — | После M7, китайская аудитория |

### 09.2 · Implementation

**Stack.** `react-i18next`. Source: `src/i18n/locales/{ru,en,th}/`.

**Naming convention.** `nested.key.path: 'string'`.

```typescript
// src/i18n/locales/ru/onboarding.json
{
  "welcome": {
    "title": "Добро пожаловать в myUNO",
    "subtitle": "Один аккаунт. 40+ микро-приложений. Жизнь на Пхукете."
  },
  "roleSelect": {
    "title": "Кто вы?",
    "tourist": "Турист",
    "resident": "Резидент",
    "owner": "Собственник"
  }
}
```

**Usage.**
```tsx
const { t } = useTranslation('onboarding');
<h1>{t('welcome.title')}</h1>
```

### 09.3 · Bilingual parity rule

**Hard rule.** Каждая строка существует в RU **и** EN. PR без обеих версий блокируется.

**Process.**
1. Разработчик пишет ключ + RU.
2. PR-bot или manual translator добавляет EN.
3. CI check: `npm run i18n:check` → fail если ключ есть в одном языке но не в другом.

### 09.4 · Дата, время, числа

| Locale | Дата | Время | Деньги | Числа |
|---|---|---|---|---|
| ru-RU | `14 мая 2026` | `10:30` | `฿45 000` (пробел separator) | `1 234 567,89` |
| en-US | `14 May 2026` | `10:30 AM` | `฿45,000` | `1,234,567.89` |
| th-TH | `14 พ.ค. 2569` (Buddhist year) | `10:30 น.` | `฿45,000` | `1,234,567.89` |

**Timezone.** Default `Asia/Bangkok` (ICT, UTC+7). Никаких локальных tz. User видит ICT всегда (потому что Phuket-centric).

**Implementation.** `Intl.DateTimeFormat`, `Intl.NumberFormat`. Никогда не хардкодим формат.

### 09.5 · Pluralisation

```typescript
// ru-RU имеет 4 формы: zero, one, few, many
"properties": {
  "count_zero": "Нет объектов",
  "count_one": "{{count}} объект",
  "count_few": "{{count}} объекта",
  "count_many": "{{count}} объектов"
}

// en-US — 2 формы
{
  "count_one": "{{count}} property",
  "count_other": "{{count}} properties"
}
```

### 09.6 · Direction (LTR)

Все 4 языка — LTR. RTL не поддерживаем (нет арабской / иврит аудитории на Phuket в значимом объёме).

### 09.7 · Bilingual UX patterns

**Language toggle.** Top-right в header. Persistent (localStorage + profile.preferred_language).

**Auto-detect.** При первом визите — по browser `Accept-Language`. Если ru-* → ru-RU. Иначе en-US.

**Mixed content.** Иногда контент существует только на одном языке (Thai legal docs).
- Если EN/RU отсутствует → fallback на оригинальный язык + badge «Original in Thai»
- Никогда не машинный перевод inline (только опциональный)

### 09.8 · Шрифты для языков

| Язык | Display | Body | Mono |
|---|---|---|---|
| ru-RU | Source Serif 4 (RU support) | Geist (RU) | IBM Plex Mono |
| en-US | Source Serif 4 | Geist | IBM Plex Mono |
| th-TH | Sarabun fallback (Thai script) | Sarabun | IBM Plex Mono |

Все шрифты загружаются с unicode-range subsetting для performance.

### 09.9 · Микрокопирование для языков

**Headlines.** Никогда не дословный перевод. Та же мысль в идиомах языка.

**Buttons.** Глагол + объект на обоих языках.

**Form labels.** Существительное (RU: «Имя») / noun или короткая фраза (EN: «Full name»).

**Errors.** Полное предложение на обоих языках.

**Legal copy.** Юристами утверждено для каждого языка отдельно (не машинный перевод).

### 09.10 · Translation workflow

1. Dev добавляет ключ + RU + EN из коммита (если знает оба).
2. Если EN не уверенный — placeholder `[EN translation needed]` + GitHub issue.
3. Translator (внешний или Pavel) ревьюит.
4. Pre-merge CI: проверка key parity, no placeholders, no html entities в JSON.
5. Production deploy: i18n bundle split per language → lazy load.

---

## 10 · Применение (введение)

> Разделы 11–15 описывают **конкретные экраны и flows**. Каждый экран собран из foundations (§05), компонентов (§06), паттернов (§07) и состояний (§08). Если экран не соответствует — это bug в реализации, не в Bible.

**Структура каждого раздела про экран:**

1. **Назначение и роль** — для кого, для какой задачи
2. **Маршрут и shell** — URL, какой layout
3. **Anatomy** — структура экрана сверху вниз
4. **Mobile (375px)** — wireframe на узком экране
5. **Desktop (≥1024px)** — wireframe на широком
6. **Состояния** — какие из 11 (§08.11) применяются
7. **Edge cases** — что делать в нестандартных ситуациях
8. **Связи с другими экранами** — куда уйти, откуда прийти
9. **Аналитика** — какие события трекаются (см. §34)

---

## 11 · Онбординг

### 11.1 · Назначение

Привести нового пользователя от «никогда не слышал» к «понимаю кто я в системе + что мне доступно» **за 4 шага**, ≤ 90 секунд.

### 11.2 · Маршрут

```
/                       (landing, public)
  ↓ "Начать"
/auth/signup            (email + password ИЛИ Google ИЛИ Telegram)
  ↓ verify email
/onboarding             (4-step flow)
  ├─ ?step=1            language + life situation
  ├─ ?step=2            role stack (multi-select)
  ├─ ?step=3            location + lifecycle phase
  └─ ?step=4            phone (для WhatsApp) + first intent
  ↓ complete
/                       (Home с personalized signal stack)
```

### 11.3 · Step 1 · Language + situation

**Question.** «Что привело вас в Phuket?»
**Options (multi-select, 1–3):**
- Туризм / отпуск
- Долгосрочное проживание
- Удалённая работа (digital nomad)
- Инвестиции в недвижимость
- Бизнес / открытие компании
- Семья / дети
- Лечение
- Свадьба / events

**Almost-invisible.** Language toggle (RU / EN / TH) в top-right.

**Why это важно.** Это primary signal для JTBD cluster mapping (см. §03.1). Влияет на default Home feed.

### 11.4 · Step 2 · Role stack

**Question.** «Кем вы себя видите на Phuket?»

**UI.** Карточки 7 ролей с иконкой + 1-line description + чек. Multi-select. User тянет до 3 (1 primary + 2 secondary).

```
[icon] Tourist        ○ Я путешествую
[icon] Resident       ●  Живу здесь долгосрочно        primary
[icon] Owner          ○ Владею недвижимостью
[icon] Investor       ●  Думаю об инвестициях          secondary
[icon] Agent          ○ Работаю в недвижимости
[icon] Developer      ○ Я разработчик / застройщик
[icon] Provider       ○ Поставщик услуг / товаров
```

**Validation.** Min 1 primary. Max 3 total.

**Storage.** `profiles.roles_stack` jsonb, `profiles.primary_role` enum.

### 11.5 · Step 3 · Location + lifecycle

**Location.**
- «Где сейчас живёте на Phuket?» → Google Places autocomplete с Phuket bias
- Если ещё нет адреса → «Когда планируете приехать?» → date picker

**Lifecycle phase.** Авто-определяется по answers Step 1+2+3. Сохраняется в `profiles.lifecycle_phase`:
- `discover` — изучает
- `arrive` — недавно приехал (≤ 30 дней)
- `live` — резидент (> 30 дней)
- `manage` — управляет активом
- `leave` — планирует уезжать

### 11.6 · Step 4 · Phone + first intent

**Phone.**
- Required для WhatsApp/Telegram notifications
- Country code dropdown (+66 default для Phuket-residents, +1 / +44 / +7 по locale)
- Skippable («Добавить позже»)

**First intent.** На основе persona → проактивное предложение:
- Tourist → «Открыть каталог airport transfer?»
- Resident new → «Запустить чек-лист обустройства?»
- Owner → «Добавить первый объект?»
- Investor → «Посмотреть off-plan ≥ A?»

### 11.7 · UI mobile (375px)

```
┌──────────────────────┐
│ ← Back        RU/EN  │
├──────────────────────┤
│ Step 2 of 4          │
│ ▰▰▱▱  50%            │
│                      │
│ Кем вы себя видите   │
│ на Phuket?           │
│                      │
│ Выберите до 3        │
│ (1 главная)          │
│                      │
│ [Card: Tourist]      │
│ [Card: Resident] ●   │
│ [Card: Owner]        │
│ [Card: Investor]     │
│ ...                  │
│                      │
│ ─────────────────── │
│ [Назад] [Продолжить] │
└──────────────────────┘
```

### 11.8 · UI desktop

Centered max-w-2xl, step indicator слева вертикально. Sticky footer bar.

### 11.9 · States

| State | UX |
|---|---|
| Loading | Skeleton next step |
| Error (Supabase) | Inline alert + retry |
| Skip step | Available на step 4 only (phone) |
| Resume | Step persisted in URL + localStorage, resume on next visit |
| Logout mid-onboarding | Profile saved partial, resume on login |

### 11.10 · Post-onboarding

После step 4 → `/` (Home) с:
- Welcome card top: «Готово. Ваш профиль настроен.»
- Signal stack personalized по primary_role + lifecycle_phase
- First intent shown как `IntentCard` в Home concierge

### 11.11 · Analytics

```
event: onboarding_started
event: onboarding_step_completed { step, role_count, life_situation }
event: onboarding_completed { roles_stack, lifecycle_phase, time_seconds }
event: onboarding_abandoned { last_step, time_seconds }
```

KPI: completion rate > 70%. Median time < 90 sec.

---

## 12 · Главная

### 12.1 · Назначение

Home — **«панель управления жизнью»**. Не landing. Не feed. **Signal stack** — что важно сейчас, отранжированное по role weight + deadline + financial impact.

### 12.2 · Маршрут

`/` — единственная Home для всех ролей. Контент адаптируется по `profiles.roles_stack`.

### 12.3 · Anatomy (mobile, 375px)

```
┌──────────────────────┐
│ [Logo] Hi, Pavel  ⚙  │  ← Header 56px
├──────────────────────┤
│                      │
│ [AI Concierge card]  │  ← Top priority intent
│ "Visa expires Jun 12 │
│ Start extension?"    │
│ [Accept] [Later]     │
│                      │
├──────────────────────┤
│ Signal Stack         │  ← Section heading
│ ─────────────────── │
│ [Activity row 1]     │
│ [Activity row 2]     │
│ [Activity row 3]     │
│ [Show more...]       │
│                      │
├──────────────────────┤
│ Quick Actions        │
│ ─────────────────── │
│ [Grid of 6 actions]  │  ← personalized по primary_role
│  Discover  Wallet    │
│  Operate   Me        │
│  Bookings  Docs      │
│                      │
├──────────────────────┤
│ Clusters             │
│ ─────────────────── │
│ [6 cluster tiles]    │  ← карта города
│                      │
├──────────────────────┤
│ Feed (Discovery)     │
│ ─────────────────── │
│ [3 personalized      │
│  cards: news, deals, │
│  events]             │
│                      │
└──────────────────────┘
[Bottom nav: 4 tabs]   ← Home · Discover · Wallet · Me
                        Pro role → Discover → Operate
```

### 12.4 · Anatomy (desktop ≥1024)

Left sidebar (280px) с full navigation. Main content max-w-1200px с теми же блоками, но в 2-column layout (Signal stack left, Concierge intents right). Floating SOS bottom-right.

### 12.5 · Signal stack ranking

```
priority_score =
  deadline_proximity·3      (визы → 1.0, бронирования → 0.7, etc.)
+ financial_impact·2        (платежи > $1000 → 1.0, иначе scaled)
+ role_weight·1             (primary role weight = 3, secondary = 2, tertiary = 1)
+ intent_freshness·0.5      (новые intents выше)
```

Top 5 показываются в Home. Остальные → `/me/intents` или `/wallet/activity`.

### 12.6 · AI Concierge card

```tsx
<ConciergeCard
  agent="visa_guardian"
  title="Виза истекает 12 июня"
  description="Подадим заявление с Siam Legal. Документы нужно загрузить до 21 мая."
  primaryAction={{ label: "Подать заявление", href: "/app/legal/visa/extend" }}
  secondaryAction={{ label: "Отложить", action: "snooze:7days" }}
  dismissAction={{ action: "dismiss" }}
  audit={{ intent_id: "int_8x3kQ", agent_version: "v2.1" }}
/>
```

Только 1 active concierge intent в Home. Если больше — показывается с дочерним `<IntentBadge count={N}>`.

### 12.7 · Quick Actions Grid

6 cards в 2×3 grid (mobile) / 3×2 (tablet) / 6×1 (desktop).

**Personalization по primary_role.**

| Primary role | Quick actions |
|---|---|
| Tourist | Discover, Stay, Transport, SIM, SOS, Wallet |
| Resident | Discover, Wallet, Docs, Visa, Lifestyle, Me |
| Owner | Operate/Owner, Wallet, Properties, Maintenance, Statements, Tax |
| Investor | Operate/Invest, ClearView, Mandates, DD, Wallet, Capital |
| Agent | Operate/Agent, CRM, Pipeline, Listings, Calendar, Wallet |
| Developer | Operate/Dev, ClearView Submission, Inventory, Buyers, Reports |
| Provider | Operate/Provider, Catalog, Bookings, Payouts, Reviews |

### 12.8 · Cluster grid

```
┌───────────┬───────────┬───────────┐
│ Arrive    │ Live      │ Manage    │
│ ●mint     │ ●blue     │ ●teal     │
├───────────┼───────────┼───────────┤
│ Invest    │ Legal     │ Build     │
│ ●purple   │ ●amber    │ ●coral    │
└───────────┴───────────┴───────────┘
```

Каждая тайл — `cluster-tinted` Card с 4px left border в cluster color, заголовком, count верт-калей внутри, иконкой.

### 12.9 · Feed (Discovery)

3 personalized cards: новости / deals / events. Каждая — `ListingCard` или `ContentCard`. Carousel mobile, grid desktop.

### 12.10 · States

| State | UX |
|---|---|
| Loading | Skeleton всех блоков |
| Empty signal stack | «Здесь будут уведомления о визах, бронированиях, платежах.» |
| No active intents | Concierge card hidden, Quick Actions поднимаются вверх |
| Error (Supabase) | Banner top + cached данные если есть |
| New user (post-onboarding) | Welcome card + tutorial overlay |
| Pro role | Concierge + Operate quick action prominent |

### 12.11 · Edge cases

- **Multiple primary roles.** Только 1 primary в data model. Если user попытается выбрать 2 — Sheet «Какая главная сейчас?»
- **Quiet hours.** Если intent создан 22:00–08:00, держим в backend, показываем только утром.
- **SOS active.** Если активный SOS ticket → красная плашка top сверху всего.

### 12.12 · Связи

- → `/discover` (любой cluster tile)
- → `/operate/*` (quick action для pro)
- → `/wallet` (quick action)
- → `/me` (header avatar)
- → `/app/{cluster}/{vertical}` (через intent)
- → `/sos` (FAB или header)

---

## 13 · Навигатор

> «Навигатор» = `/discover` — публичный каталог + life-situation-driven entry points.

### 13.1 · Назначение

Помочь пользователю **найти то, что ему нужно**, без знания структуры платформы. Три входа:

1. **Search** — «Я знаю что ищу»
2. **Cluster grid** — «Я знаю в каком районе города искать»
3. **Life situations** — «Я знаю свою задачу, не знаю как она называется»

### 13.2 · Маршрут

```
/discover                              Главная страница навигатора
├─ /discover/search?q=visa             Поиск
├─ /discover/cluster/:id               Cluster page (arrive, live, manage, invest, legal, build)
├─ /discover/life/:situation           Life situation (arrival, settle, invest, leave, sos…)
├─ /discover/map                       Map view (geo-located services)
└─ /discover/category/:slug            Service category (legacy, redirects to cluster)
```

### 13.3 · Anatomy `/discover` (mobile)

```
┌──────────────────────┐
│ [< Home]    Search ▾ │
├──────────────────────┤
│ 🔍 [Search input]    │
│ Что ищем?            │
│                      │
├──────────────────────┤
│ Кластеры             │
│ [Grid 2×3]           │
│ Arrive  Live  Manage │
│ Invest  Legal  Build │
│                      │
├──────────────────────┤
│ Жизненные ситуации   │
│ [Chips horizontal    │
│  scroll]             │
│ Прилетел | Остался   │
│ | Покупаю | ...      │
│                      │
├──────────────────────┤
│ Популярное           │
│ ─────────────────── │
│ [Listing cards × 6]  │
│                      │
└──────────────────────┘
```

### 13.4 · Cluster page `/discover/cluster/live`

```
┌──────────────────────┐
│ [< Discover]         │
├──────────────────────┤
│ ●●● Live             │  ← Cluster color hero
│ Lifestyle services   │
│                      │
│ 14 verticals · ฿฿฿฿  │
│                      │
├──────────────────────┤
│ Vertical grid 2×7    │
│ Cleaning  Delivery   │
│ Beauty    Fitness    │
│ Medical   Pets       │
│ ...                  │
│                      │
├──────────────────────┤
│ Featured providers   │
│ [Listing cards]      │
└──────────────────────┘
```

### 13.5 · Life situation page `/discover/life/arrival`

«Я только прилетел» — куратор-стиль страница.

```
┌──────────────────────┐
│ Я только прилетел    │  ← Hero
│ Чек-лист на 72 часа  │
├──────────────────────┤
│ ☐ Связь · SIM        │
│   → eSIM в аэропорту │
│ ☐ Транспорт          │
│   → Aiport transfer  │
│ ☐ Жильё на ночь      │
│   → Short stay       │
│ ☐ Деньги (банкомат)  │
│   → Wallet setup     │
│ ☐ Виза statement     │
│   → /app/legal/visa  │
│                      │
└──────────────────────┘
```

Каждый чек-action ведёт в `/app/{cluster}/{vertical}` или внешнюю инструкцию.

### 13.6 · Search

**Full-text search.** Supabase pg_trgm на `listings.title`, `listings.description`, `verticals.name`. Powered by `useSearch()` хук.

**UI.**
- Sticky input top
- Recent searches (localStorage)
- Trending searches (admin-curated)
- Result types: listings, verticals, articles, places
- Faceted: filter by cluster, price range, rating, distance

### 13.7 · Map view

См. §26 для подробностей. Default zoom level — Phuket (10), bias Bang Tao / Patong / Rawai.

### 13.8 · States

| State | UX |
|---|---|
| Loading clusters | Skeleton grid |
| No search results | «Ничего не найдено. Попробуйте: visa, cleaning, villa» |
| Empty cluster | «Скоро здесь появятся услуги. Подписаться на запуск?» |
| Geo permission denied | Map fallback to list view |

### 13.9 · Analytics

```
event: discover_viewed { source }
event: discover_cluster_clicked { cluster_id }
event: discover_search_executed { query, result_count }
event: discover_life_situation_clicked { situation }
event: discover_map_used { actions }
```

---

## 14 · Мобильные экраны

### 14.1 · Общие правила mobile

- Все экраны проектируются от **375px** (iPhone SE / 13 mini).
- Touch target ≥ 44×44px.
- Bottom nav 4 таба (см. §12), всегда видна (исключения: full-screen flow, payment).
- Sheet bottom вместо Dialog для primary actions.
- Sticky header 56px высота, contains: back · title · 1-2 action icons.
- Sticky footer для form submit / primary action.

### 14.2 · Bottom navigation

```
┌──────┬──────┬──────┬──────┐
│ Home │ Disc │ Wall │  Me  │
│  ●   │  ○   │  ○   │  ○   │
└──────┴──────┴──────┴──────┘
```

**Tabs:**
- **Tourist / Resident:** Home · Discover · Wallet · Me
- **Pro roles (Owner/Agent/Developer/Provider/Investor):** Home · **Operate** · Wallet · Me

**Swap rule.** Если у user primary role = pro → Discover → Operate. Discover доступен через Home или search button.

**Spec.**
- Height 64px (включая safe area)
- Each tab: icon 24px + label 10px
- Active state: cluster-aware tint (primary role color) + filled icon
- SOS FAB слева от центра (52×52px), внешний слой

### 14.3 · Header patterns

**Standard.**
```
┌──────────────────────┐
│ ← Title         ⋯ ⚙ │
└──────────────────────┘
```

**With breadcrumb (deeper levels).**
```
┌──────────────────────┐
│ ← /discover/live/    │
│   cleaning           │
└──────────────────────┘
```

**Hero (cluster page, property detail).** Image background + transparent overlay. Title overlaid white.

**Search-first (`/discover`).** Persistent search bar в header.

### 14.4 · Touch interactions

| Interaction | Использование |
|---|---|
| Tap | Primary navigation, select |
| Long press | Context menu (на cards в lists) |
| Swipe left/right | Carousel, dismiss notification, mark as read |
| Swipe up | Open Sheet, pull-to-refresh |
| Swipe down | Close Sheet, dismiss modal |
| Pinch | Map zoom, image zoom |
| Double tap | Не используем (избегаем confusion) |

### 14.5 · Pull-to-refresh

Доступен на: Home, list views, owner timeline. Trigger event → invalidate TanStack Query cache → refetch.

### 14.6 · Infinite scroll vs pagination

| Use case | Pattern |
|---|---|
| Discover listings | Infinite scroll (immersive) |
| Owner timeline | Pagination (chronological, audit-able) |
| Wallet activity | Pagination |
| Search results | Infinite scroll до 100, потом pagination |

### 14.7 · Bottom sheets

**Snap points.** 25% / 50% / 90% / full.

**Use cases.**
- Filter UI: 50%
- Sort: 25%
- Form (1 поле): 50%
- Form (multi-field): 90%
- Detail view: 90%
- Confirmation: 25%
- SOS: 90% с red top border

### 14.8 · Keyboard handling

- Field focus → keyboard up → scroll input into view
- Submit button — sticky above keyboard (не behind)
- Form long → выводим «Готово» / «Done» в keyboard toolbar
- Numeric inputs → `inputMode="decimal"` для денежных полей

### 14.9 · Common mobile screens

| Screen | Pattern |
|---|---|
| Home | См. §12.3 |
| Discover | См. §13.3 |
| Listing detail | Hero image carousel + sticky CTA bottom |
| Booking flow | Multi-step Sheet или full-screen |
| Wallet | List + segmented filter (income/expense/all) |
| Me / profile | List of sections (KYC, docs, consents, roles) |
| Login | Center card, max width 360 |
| Maps | Full bleed, bottom sheet с list |

### 14.10 · Platform-specific (Capacitor)

iOS:
- Use safe area insets (notch + home indicator)
- Status bar style adapts to theme
- Back swipe gesture (native)

Android:
- Material ripple on tap
- Back button → router back
- Permission requests follow Android norms

### 14.11 · Performance budget mobile

- LCP < 2.5s on 4G
- TTI < 4s
- Total JS bundle < 250KB gzipped per route (lazy loaded)
- Image lazy load with placeholder blur
- Skeleton states < 100ms перед content

---

## 15 · Сервисная страница

> Шаблон для **любой страницы внутри `/app/:cluster/:vertical`** — будь то cleaning, visa, off-plan listing, capital advisory mandate.

### 15.1 · Универсальная структура

```
┌──────────────────────┐
│ Header                │
│ ← Cluster name · breadcrumb │
├──────────────────────┤
│ Hero / Cover         │
│ (image, video, или   │
│  brand cluster color)│
├──────────────────────┤
│ Title + Trust signals│
│ Provider · ★ rating  │
│ ClearView grade (RE) │
├──────────────────────┤
│ Quick facts grid     │
│ (price, time, lang)  │
├──────────────────────┤
│ Tabs (если нужны)    │
│ Overview · Details · │
│ Reviews · DD · FAQ   │
├──────────────────────┤
│ Tab content          │
│                      │
├──────────────────────┤
│ Related listings     │
├──────────────────────┤
│ Sticky CTA           │
│ [Book / Contact]     │
└──────────────────────┘
```

### 15.2 · Anatomy блоков

**Hero.**
- Image carousel (16:9 mobile, 21:9 desktop). Min 3 photos.
- Video player (опционально), autoplay muted.
- Favourites + Share icons top-right.
- Cluster badge top-left.

**Title block.**
- H1 (display-md) — название
- Subtitle (body-lg muted) — provider + категория
- Trust row: rating, reviews count, ClearView grade (если RE), audit verified badge

**Quick facts.** 4–6 KeyValue pairs. Иконки + label + value.

```
[icon] Price        [icon] Duration
฿1,500/visit       2 hours

[icon] Language     [icon] Distance
EN, RU             2.4 km
```

**Tabs.** Зависят от вертикали:
- **Stay/Property:** Overview · Photos · Amenities · Reviews · Location · DD · Booking
- **Service:** Overview · What's included · Pricing · Reviews · Provider · FAQ
- **Legal:** Overview · Process · Documents · Pricing · Lawyer · FAQ
- **Off-plan:** Overview · ClearView · Floor plans · Payment plan · Developer · DD

**Tab content.** Markdown-rendered или structured. Long content scrollable in tab.

**Related listings.** Carousel 3 cards (mobile) / grid 4 cards (desktop). По cluster + vertical + price range.

**Sticky CTA.** Bottom of viewport.
```
┌──────────────────────┐
│ ฿1,500 / visit       │
│ [Забронировать →]    │
└──────────────────────┘
```

### 15.3 · CTA variants по vertical

| Vertical | Primary CTA | Secondary |
|---|---|---|
| Stay (booking) | «Забронировать» | «Связаться с хостом» |
| Service | «Заказать услугу» | «Спросить провайдера» |
| Legal | «Подать заявление» | «Скачать спецификации» |
| Off-plan | «Запросить DD» | «Записаться на просмотр» |
| Property (resale) | «Записаться на просмотр» | «Capital Advisory» |
| Mandate (HNW) | «Связаться с Ignatev» | «Скачать deck» |

### 15.4 · ClearView block (RE only)

См. §16. Inline в Overview tab:

```
┌──────────────────────────┐
│ ClearView A+             │
│ ▰▰▰▰▰▰▰▰▱▱  82/100      │
│                          │
│ Legal · Construction ·   │
│ Financial · 5 more       │
│                          │
│ [Open full report →]     │
└──────────────────────────┘
```

### 15.5 · Reviews block

- Average rating + count
- Distribution bar (5★ ···)
- Sort: most recent / highest / lowest / verified-only
- Each review: avatar · name · date · rating · text · helpful count
- «Show more reviews» → opens Sheet / Dialog с полным списком
- «Write a review» → доступен только после completion booking

### 15.6 · States

| State | UX |
|---|---|
| Loading | Skeleton hero + content shape |
| Not found | 404 + cluster suggestions |
| Removed by provider | «Этот объект больше не доступен» + similar |
| Out of stock / booked | CTA disabled + waitlist option |
| Provider not verified | Banner: «Этот провайдер ещё не прошёл KYC. Будьте осторожны.» |
| Price changed | Inline alert на CTA: «Цена изменилась ฿1,200 → ฿1,500» |

### 15.7 · SEO / sharing

Каждая страница имеет:
- `<title>` — «{Title} · {Vertical} · myUNO»
- `<meta description>` — first 160 chars description
- `og:image` — hero image
- JSON-LD schema markup (Product, Place, Service)
- Canonical URL

См. §36 для полных SEO правил.

### 15.8 · Analytics

```
event: listing_viewed { listing_id, cluster, vertical, source }
event: listing_cta_clicked { listing_id, cta_type }
event: listing_tab_switched { listing_id, tab }
event: listing_share_clicked { listing_id, channel }
event: listing_bookmarked { listing_id }
event: listing_clearview_expanded { listing_id, grade }
```

---

## 16 · ClearView

> ClearView — методология рейтингов off-plan недвижимости от myUNO. Эталон: Standard & Poor's для корпоративных облигаций.
> Полный канон: `docs/canonical/06-clearview-methodology.md`. Здесь — операционный гайд для UI.

### 16.1 · Назначение

Дать инвестору **одну страницу** с числовым ответом на вопрос «насколько это безопасно?». Off-plan = высокий риск (developer может не достроить). ClearView оценивает 8 категорий и выдаёт grade AAA → BB.

### 16.2 · Grades

| Grade | Range | Семантика | Цвет |
|---|---|---|---|
| AAA | 90–100 | Гарантированное завершение, premium developer | `#10B981` (emerald-500) |
| AA | 80–89 | Очень низкий риск | `#34D399` (emerald-400) |
| A | 70–79 | Низкий риск, рекомендуем | `#FBBF24` (amber-400) |
| BBB | 60–69 | Средний риск, требует DD | `#F59E0B` (amber-500) |
| BB | < 60 | Высокий риск, не рекомендуем без mandate | `#EF4444` (coral) |

**Не путать с системными цветами.** ClearView grade colors — отдельный набор (gradient green → amber → coral). Используются только в ClearView UI.

### 16.3 · 8 категорий оценки

1. **Legal** — права на землю, разрешения, EIA
2. **Construction** — статус строительства, репутация подрядчика
3. **Financial** — escrow, ставка финансирования, ликвидность developer
4. **Developer** — track record, completed projects, complaints
5. **Location** — инфраструктура, доступность, ZONE классификация
6. **Design** — архитектор, materials, layout efficiency
7. **Marketability** — secondary market, экспорт liquidity, rental demand
8. **Payment plan** — schedule, milestones, refund policy

Каждая категория — 0–100 баллов. Total = weighted average.

### 16.4 · ClearView Card

**Compact (на ListingCard):**
```
[Badge: A+ 82]
```

**Inline (на сервисной странице, см. §15.4):**
```
ClearView A+
▰▰▰▰▰▰▰▰▱▱  82/100
Legal · Construction · Financial · 5 more
[Open full report →]
```

**Full report (subpage):**
```
┌────────────────────────────┐
│ ClearView Report           │
│ The Estate Bang Tao        │
├────────────────────────────┤
│ Overall: A+ 82/100         │
│ ▰▰▰▰▰▰▰▰▱▱                │
│ Updated: 12 May 2026       │
├────────────────────────────┤
│ Categories                 │
│ ─────────────────────────  │
│ Legal           A   75 ▰▰▰▰│
│ Construction    A+  85 ▰▰▰▰│
│ Financial       AA  88 ▰▰▰▰│
│ Developer       A   78 ▰▰▰ │
│ Location        AAA 95 ▰▰▰▰│
│ Design          A   80 ▰▰▰▰│
│ Marketability   A   75 ▰▰▰▰│
│ Payment plan    A+  82 ▰▰▰▰│
│                            │
│ [Methodology] [PDF report] │
└────────────────────────────┘
```

### 16.5 · Comparison table

Для investor сравнить 2–4 объекта:

```
                  Project A | Project B | Project C
ClearView         A+ 82    | A 75      | BBB 65
Legal             A 75     | A+ 80     | BBB 60
Construction      A+ 85    | A 75      | A 70
Financial         AA 88    | A 75      | BBB 65
...
ROI estimate      8.5%     | 7.2%      | 6.0%
Payment terms     30/70    | 50/50     | 100% pre
```

UI: `<DataTable>` sticky первая колонка (categories), columns scrollable horizontal на mobile.

### 16.6 · Public dashboard `clearview.myuno.app`

Marketing-grade страница со списком всех rated projects.

**Filter UI:**
- Grade slider (AAA → BB)
- Cluster filter (off-plan zones: Bang Tao, Patong, Rawai, Kamala, Surin, Mai Khao)
- Price range
- Payment plan type
- Completion date

**Cards.** Mini-ListingCard с большим grade badge сверху.

### 16.7 · Developer submission flow

Developers подают свои projects на ClearView через `developers.myuno.app`.

**Steps:**
1. Company profile + KYB
2. Project meta (name, location, photos)
3. Upload 8 categories' documents
4. Self-assessment scorecard (developer заявляет ожидаемый grade)
5. Review pending (3–7 days)
6. Final grade published

**UI Operate/Dev:**
```
/operate/dev/clearview
├─ /projects           List of submitted
├─ /projects/new       Submission wizard
└─ /projects/:id       Status + grade
```

### 16.8 · States

| State | UX |
|---|---|
| Not rated yet | «Этот объект не прошёл ClearView оценку. Запросить?» |
| Rating pending | «Оценка в процессе. Готово через 3–7 дней.» |
| Rating expired (> 6 мес) | «Оценка устарела. Запросить обновление?» + last grade muted |
| Withdrawn | «Этот проект снят с rated списка.» (cause: developer request, found fraud) |

### 16.9 · Trust signals в Bible §07.8

Любая страница с ClearView grade показывает audit marker:
```
Rated by ClearView v2.1
Last updated: 12 May 2026
Methodology: clearview.myuno.app/methodology
Auditor: Pavel · CV ID: cv_8x3kQ
```

### 16.10 · Design constraints

- ClearView grade — **никогда** не показывается без linked methodology
- Никогда auto-generated. Human-in-the-loop required.
- AI может помочь с draft (см. `docs/canonical/08-ai-prompts-library.md` § ClearView Draft), но финал — Pavel review.

---

## 17 · Partner

> Partner subsystem = `pro.myuno.app` + Partner-roles внутри Operate canvas. Это интерфейс для **provider / agent / developer / operator** — людей, которые **зарабатывают** через платформу.

### 17.1 · Аудитория

| Partner type | Описание | Доход для myUNO |
|---|---|---|
| **Provider** | Поставщик услуг / товаров (cleaning, beauty, delivery) | Take rate 10–20% |
| **Agent** | Real-estate агент | Lead fees + commission split |
| **Developer** | Off-plan застройщик | ClearView listing fee + sales commission |
| **Operator (PM)** | Property management компания | Subscription per property + admin take |
| **White-label** | Partner agencies использующие наш PM tools | Monthly platform fee |

### 17.2 · Partner Operate shell

`/operate/{role}` shell с consistent layout для всех partner ролей:

```
┌──────────────────────┐
│ [Logo] Operate · Role│
│                      │
│ KPI bar              │
│ Income · Bookings ·  │
│ Open tickets         │
├──────────────────────┤
│ [Main dashboard      │
│  content per role]   │
│                      │
├──────────────────────┤
│ Quick actions        │
│ - Add listing        │
│ - Withdraw payout    │
│ - Reply to messages  │
└──────────────────────┘
[Sidebar/tabs: per role]
```

### 17.3 · `/operate/provider` (типовой)

**Top KPI bar:**
- Active bookings (last 30 days)
- Revenue ฿ (last 30 days)
- Pending payouts ฿
- Average rating

**Sidebar tabs:**
- Dashboard
- Catalog (мой список услуг)
- Bookings (incoming)
- Calendar / availability
- Reviews
- Payouts
- Profile / KYC
- Settings

**Anti-pattern.** Не дублируем Wallet функционал. Payouts → wallet/withdrawals. Provider только видит выручку, не payment processing.

### 17.4 · Onboarding for partners

Длиннее, чем consumer onboarding (нужен KYB):

```
Step 1: Account email + verify
Step 2: Company info (name, address, type)
Step 3: Beneficial owner KYC
Step 4: Bank account для payouts (Wise / Thai bank)
Step 5: Tax info (TIN / VAT)
Step 6: Listings setup (опционально, можно позже)
Step 7: Review (1–3 days admin)
Step 8: Approved → /operate/{role}
```

Process tracked в `partner_applications` table. Admin queue в `/admin/partners`.

### 17.5 · Catalog management

UI для создания / редактирования listing:

```
- Title (RU + EN required)
- Description (RU + EN)
- Cluster + vertical (dropdown)
- Pricing model (fixed, hourly, per-unit)
- Currency
- Photos (min 3, max 12)
- Availability (calendar или 24/7)
- Service area (Phuket zones)
- Language(s) of provider
- Insurance / certifications (optional, upload)
- Status: draft / pending review / live / paused
```

### 17.6 · Booking inbox

For provider, чтобы принимать заказы:

```
┌───────────────────────────┐
│ Filter: New | Active | Done│
│                           │
│ ─────────────────────────  │
│ [icon] Anna · Cleaning    │
│ 14 May, 10:00 · ฿1,500    │
│ Address: Villa Nai Thon 12│
│ [Accept]  [Decline]       │
│ ─────────────────────────  │
│ ...                       │
└───────────────────────────┘
```

States: pending (provider must respond < 30 min) → accepted / declined → in_progress → completed.

### 17.7 · Payout flow

См. §20.

### 17.8 · Reviews moderation

Provider видит свои reviews, может ответить **один раз** на каждый. Не может удалить. Disputed → admin review.

### 17.9 · Communication

Provider ↔ Customer через Messaging (§19). Никаких phone numbers exchange до booking confirm.

### 17.10 · Partner-specific design rules

- KPI numbers — всегда mono, large, prominent
- Status pills used heavily (booking lifecycle, payment lifecycle)
- Date-time formatting: ICT всегда, "today/tomorrow" relative для близкого
- Calendar — central UI, mobile horizontal scroll, desktop month grid

---

## 18 · Owner Timeline

> Owner Timeline — главный экран для роли Owner. Не таблица, не dashboard, а **хронологическая лента всего что произошло с объектом** (или портфелем).

### 18.1 · Назначение

Дать собственнику **полное операционное окно** в его недвижимость: бронирования, доходы, расходы, поломки, payouts, договоры — в одной ленте, отсортированной по времени.

Эталон: Linear (issue timeline), Stripe Dashboard (events), Apple Health (timeline).

### 18.2 · Маршрут

```
/operate/owner                        Overall portfolio timeline
└─ /operate/owner/properties/:id      Per-property timeline
   ├─ /bookings                       Filtered: bookings only
   ├─ /income                         Filtered: income only
   ├─ /expenses                       Filtered: expenses only
   ├─ /maintenance                    Filtered: tickets
   └─ /documents                      Filtered: contracts, statements
```

### 18.3 · Anatomy

```
┌──────────────────────────────────┐
│ ← Properties                      │
├──────────────────────────────────┤
│ Villa Nai Thon 12                │
│ Bang Tao · 2BR · ฿65,000/mo     │
├──────────────────────────────────┤
│ [KPI bar]                        │
│ Income MTD: ฿42,500              │
│ Bookings: 3 active / 12 done     │
│ Open tickets: 1                  │
│ Next payout: 17 May              │
├──────────────────────────────────┤
│ [Filter chips]                   │
│ All · Bookings · Income · Tickets│
├──────────────────────────────────┤
│ Today                            │
│ ─────────────────────────────── │
│ 10:30  [Booking] Anna check-in   │
│         3 nights · ฿4,500        │
│         [→ details]              │
│ 09:15  [Maintenance] AC fixed    │
│         ฿1,200 · vendor signed   │
│         [→ ticket]               │
│                                  │
│ Yesterday                        │
│ ─────────────────────────────── │
│ 18:00  [Payout] ฿15,000 → Wise  │
│         tx_8x3kQ                 │
│ 12:00  [Booking] Anna confirmed  │
│         May 17–20                │
│                                  │
│ This week                        │
│ ─────────────────────────────── │
│ ...                              │
└──────────────────────────────────┘
[Sticky bottom: Add booking · Add expense]
```

### 18.4 · Timeline item types

| Type | Icon | Cluster color | Действие |
|---|---|---|---|
| `booking_created` | calendar | manage teal | View booking |
| `booking_confirmed` | check-circle | success | View booking |
| `booking_completed` | check-double | success | Leave review |
| `payment_received` | arrow-down-circle | success | View tx |
| `payout_sent` | arrow-up-circle | accent | View payout |
| `expense_recorded` | minus-circle | warning | View expense |
| `ticket_opened` | alert-circle | warning | View ticket |
| `ticket_resolved` | check-circle | success | View resolution |
| `contract_signed` | file-check | success | Download PDF |
| `statement_ready` | file-text | accent | Sign statement |
| `guest_message` | message-circle | accent | Reply |
| `agent_intent` | sparkles | primary | Review intent |

### 18.5 · Grouping

By date: Today · Yesterday · This week · Last week · {Month name}.

### 18.6 · Filters

Multi-select pills sticky top:
- All
- Bookings
- Income
- Expenses
- Maintenance
- Documents
- AI Intents

URL state: `?filter=bookings,income`.

### 18.7 · Per-item drill-down

Каждый item кликается → opens Sheet (mobile) / Dialog (desktop) с full details + actions.

### 18.8 · Bulk actions

Long-press на item (mobile) или checkbox (desktop) → multi-select mode → bulk actions:
- Export as PDF
- Mark as reviewed
- Archive

### 18.9 · Export

Top action: «Export». Generates:
- PDF report (custom date range, filtered events)
- CSV (для accounting)
- Email digest (subscription option)

### 18.10 · States

| State | UX |
|---|---|
| New property | «Здесь будет вся история. Первое событие появится после первого бронирования.» |
| Empty filter | «Нет событий по фильтру. Сбросить?» |
| Loading | Skeleton timeline items |
| Error | Banner top + retry |
| Long-running export | Toast «Готовим PDF. Отправим email через 2 минуты.» |

### 18.11 · Multi-property portfolio

`/operate/owner` shows aggregated timeline + per-property breakdown:

```
[Portfolio summary]
3 properties · ฿185,000 income MTD · 5 open tickets

[Property selector chips]
All | Villa Nai Thon 12 | Villa Patong 7 | Condo Surin

[Timeline]
...
```

Selecting property chip filters timeline.

### 18.12 · Audit marker

Каждый item имеет:
- Unique event ID
- Timestamp (ISO 8601, ICT)
- Linked ledger entry (если money)
- Linked source (booking_id, ticket_id)

Mouseover / long-press → audit popover.

### 18.13 · Analytics

```
event: owner_timeline_viewed { property_id, filter }
event: owner_timeline_item_opened { item_type, item_id }
event: owner_timeline_exported { format, date_range }
event: owner_intent_accepted { intent_id, agent }
```

---

## 19 · Messaging

### 19.1 · Назначение

Messaging — **внутренняя коммуникация** между всеми участниками платформы:
- Customer ↔ Provider (booking-related)
- Owner ↔ PM (property-related)
- Investor ↔ Capital advisor (mandate)
- Customer ↔ Admin (support)
- AI agent ↔ User (intents — отдельный тип)

### 19.2 · Маршрут

```
/messages                                Inbox
├─ /messages/:thread_id                  Thread detail
└─ /messages/new?to=:user_id&context=:id Start new thread
```

Также **inline** на сервисной странице, в booking detail, в owner timeline — каждый контекст имеет свой thread.

### 19.3 · Anatomy (mobile)

```
┌──────────────────────┐
│ Messages         🔍  │
├──────────────────────┤
│ [Avatar] Anna Smith  │
│ Cleaning · 14 May    │
│ "Can you come at 11?"│
│ 10:30 ·  ●(unread)  │
├──────────────────────┤
│ [Avatar] Siam Legal  │
│ Visa extension       │
│ "Documents received" │
│ Yesterday           │
├──────────────────────┤
│ ...                  │
└──────────────────────┘
```

### 19.4 · Thread detail

```
┌──────────────────────┐
│ ← Anna Smith         │
│   Cleaning · 14 May  │
├──────────────────────┤
│                      │
│        [Message in]  │
│ [Message out]        │
│        [Message in]  │
│ [Attachment]         │
│                      │
├──────────────────────┤
│ [📎] [Type a message]│
│             [Send →] │
└──────────────────────┘
```

### 19.5 · Message types

| Type | Render |
|---|---|
| Text | Bubble с linkified URLs |
| Image | Inline thumbnail, tap → full screen |
| Document (PDF) | Card с filename, size, download |
| Audio | Inline player (record + send в native apps) |
| System message | Centered grey text «Anna joined» / «Booking confirmed» |
| AI intent | Special intent card (см. §07.7) |
| Location | Map preview + open in Maps |

### 19.6 · Encryption / privacy

- All messages stored Supabase, encrypted at rest
- Phone numbers NOT shared in messages (use messaging instead)
- Files scanned for viruses
- 30-day retention default, configurable per thread

### 19.7 · Notifications

- In-app: badge on Messages tab
- Push: «Anna replied» (preview if user allows)
- Email digest: opt-in, daily summary of unread
- WhatsApp/Telegram: NOT for messaging (используется для booking confirmations, alerts)

### 19.8 · States

| State | UX |
|---|---|
| Empty inbox | «Здесь будут разговоры с провайдерами, агентами, экспертами.» |
| Loading thread | Skeleton messages |
| Sending | Spinner на отправляемом сообщении |
| Failed | Inline retry «Не отправлено. Повторить.» |
| Blocked user | «Вы заблокировали этого пользователя. Разблокировать?» |
| Archived thread | Greyed out, «Restore» action |

### 19.9 · Threading rules

- One thread per (user_a, user_b, context_id) combo
- Context can be: booking_id, listing_id, mandate_id, ticket_id
- Threads без context — direct DM
- AI agent threads — separate tab «Concierge»

### 19.10 · Anti-patterns

- ❌ Не «public feed» (нет likes, comments)
- ❌ Не group chats > 5 participants (используем тикеты)
- ❌ Не voice/video calls (используем WhatsApp deep link)
- ❌ Не sticker packs (только emoji в input)

### 19.11 · Admin / moderation

- Admin can read any thread (with `/admin/support` justification log)
- Reported messages queue в `/admin/moderation`
- Auto-flag profanity, leaked phone numbers, scam patterns

---

## 20 · Money & Tx

> Деньги — центральный нерв продукта. Каждая транзакция трассируется, аудитируется, имеет два side (debit/credit). Полный flow: см. `CLAUDE.md §4` и `supabase/functions/_shared/checkout-handler.ts`.

### 20.1 · Принципы

1. **Single source of truth.** Все money flows проходят через `orders` + `ledger_entries`. Никаких side-channels.
2. **Double-entry accounting.** Каждая транзакция = 2 строки в `ledger_entries` (debit + credit).
3. **Idempotency.** Каждый payment intent имеет idempotency_key. Дубли invisible.
4. **Audit-as-UI.** Каждый money screen показывает tx_id + ledger_entry_id + timestamp.
5. **Never auto-execute.** AI agent предлагает intent, юзер confirms.
6. **Stripe is primary.** Cash/bank transfer тоже разрешены, но recorded as manual order_type.

### 20.2 · Money flow (canonical)

```
User clicks "Pay"
   ↓
Frontend → create-checkout edge function
   ↓
Edge fn validates cart, creates order (status=pending)
   ↓
Stripe Checkout session created
   ↓
User redirected to Stripe
   ↓
User completes payment (3DS if required)
   ↓
Stripe webhook → stripe-webhook edge fn
   ↓
order.status = paid
record_ledger_entries RPC:
  - debit:   cash_account     +฿X
  - credit:  customer_account +฿X
  - debit:   customer_account +฿X
  - credit:  vendor_account   +฿(X - fee - mc_comm)
  - credit:  platform_fee     +฿fee
  - credit:  mc_commission    +฿mc_comm (if applicable)
   ↓
Notifications fan-out
Frontend polls /api/order/:id → success
```

### 20.3 · Wallet `/wallet`

**Anatomy:**

```
┌──────────────────────┐
│ Wallet               │
├──────────────────────┤
│ Balance              │
│ ฿45,000 available    │
│ ฿12,000 pending      │
│                      │
│ [Top up] [Withdraw]  │
├──────────────────────┤
│ Filter chips         │
│ All · Income · Out · │
│ Pending · Failed     │
├──────────────────────┤
│ [Activity list]      │
│ ─────────────────── │
│ Date · type · ฿ · status │
│ ─────────────────── │
│ ...                  │
├──────────────────────┤
│ Statements           │
│ - May 2026 (PDF)     │
│ - April 2026 (PDF)   │
└──────────────────────┘
```

### 20.4 · Activity row

```
┌────────────────────────────┐
│ [Icon] 14 May · 10:30      │
│        Booking · Cleaning  │
│        Anna Smith          │
│ ─                         ─│
│ −฿1,500          tx_8x3kQ  │
│ Paid · Stripe ···4242      │
└────────────────────────────┘
```

Tap → opens Sheet с full breakdown: amount, fee, payout, ledger entries, related order.

### 20.5 · Order types

| Type | Описание | Examples |
|---|---|---|
| `service_booking` | Booking сервиса | Cleaning, transport |
| `property_booking` | Booking жилья | Stay, villa |
| `goods_purchase` | Покупка товара | Flowers, gift |
| `subscription` | Recurring | stays_subscription |
| `mandate_fee` | One-time mandate | Capital advisory |
| `legal_service` | Юр услуги | Visa, company setup |
| `manual_cash` | Recorded cash payment | Партнёрские наличные |
| `manual_bank` | Bank transfer outside Stripe | B2B settlements |

### 20.6 · Payment methods

| Method | UI label | Stripe code |
|---|---|---|
| Card (Visa/MC) | Карта | card |
| Apple Pay | Apple Pay | apple_pay |
| Google Pay | Google Pay | google_pay |
| PromptPay (TH QR) | PromptPay | promptpay |
| Bank transfer (TH) | Перевод | bank_transfer (manual) |
| Cash | Наличные | manual_cash |

### 20.7 · Currency support

- **THB** primary (Phuket-local prices)
- **USD** secondary (international)
- **EUR**, **GBP**, **RUB** displayed in user preference, конвертируется по daily rate

**Rule.** Цена хранится в transaction currency (THB обычно). Display конвертируется по `profile.preferred_currency`.

### 20.8 · Audit marker

Каждая money row показывает:
```
tx_id: tx_8x3kQ
ledger: le_7d2x1
recorded: 2026-05-14 10:30:00 ICT
status: paid · stripe · ch_xxx
```

Mono font, muted color, text-xs. Кликается → audit detail.

### 20.9 · Refunds

```
[Activity row]
[Status: paid] [Refund]

→ Modal: "Refund ฿1,500?"
Reason (required dropdown):
- Customer request
- Service not delivered
- Duplicate
- Other
+ Notes
[Confirm refund]

→ Stripe refund API → status: refunded
→ Reverse ledger entries created
→ Email + notification to customer
```

Только Provider / Admin может refund. KYC level 2.

### 20.10 · Payouts (для providers/owners)

Cycle:
- T+1 после booking completion → funds available
- Weekly batch (each Tuesday) → automatic payout if balance ≥ ฿5,000
- Manual on-demand → fee ฿50 если ниже threshold

UI:
```
Pending payout: ฿15,000
Next auto-payout: Tuesday 17 May
[Withdraw now (fee ฿50)]
```

### 20.11 · Subscriptions

`stays_subscription` — per-property Stripe subscription для PM.

UI:
```
[Subscription card]
Villa Nai Thon 12 · Active
฿2,500/month · next charge 14 Jun
[Pause] [Cancel] [Upgrade]
```

Cancel → effective end of period. No prorated refunds.

### 20.12 · Pricing display rules

| Context | Format |
|---|---|
| Listing card price | `฿1,500` или `฿1,500 / visit` |
| Detail page hero | `฿1,500` big mono + «per visit» smaller below |
| Cart summary | Full breakdown: subtotal · fees · tax · total |
| Comparison tables | Mono right-aligned, tabular nums |
| Receipts | Mono, full precision (без округления) |

### 20.13 · KYC gates

| Operation | Min KYC level |
|---|---|
| View prices | 0 (no auth) |
| Create account | 0 |
| Buy < ฿10,000 | 1 (email + phone verified) |
| Buy ฿10,000–100,000 | 2 (passport + selfie) |
| Buy > ฿100,000 | 3 (passport + selfie + address proof) |
| Mandate (Capital) | 3 + AML questionnaire |
| Withdraw payout | 2 |
| Become provider | 2 + KYB |

### 20.14 · Tax handling

- VAT 7% Thai for услуги внутри TH (auto-calculated)
- Display: «฿1,500 (incl. ฿98 VAT)» — inline transparency
- Tax invoice PDF generated post-payment (Thai tax format)
- For non-TH purchases (subscriptions): no VAT
- Year-end tax report для пользователей (опционально)

### 20.15 · Analytics

```
event: checkout_started { cart_value, items_count }
event: payment_method_selected { method }
event: payment_3ds_triggered
event: payment_completed { tx_id, amount, method }
event: payment_failed { reason, amount }
event: refund_requested { tx_id, reason }
event: payout_requested { amount }
```

### 20.16 · Financial reporting

Daily reconciliation alert if `orders` total ≠ `ledger_entries` sum for the day. Stored in `reconciliation_alerts`. Admin acts within 24h.

---

## 21 · Trust & KYC

> Trust — это **UI surface**, не footer. Каждый экран, на котором юзер принимает важное решение, показывает trust signals.

### 21.1 · KYC levels

| Level | Verified | Required доки | Где |
|---|---|---|---|
| 0 | — | — | Browse, view content |
| 1 | Email + phone | Email confirmation + SMS code | Cart < ฿10K |
| 2 | Identity | Passport scan + selfie video (60 sec) | Money operations > ฿10K, become provider |
| 3 | Address + AML | + Utility bill OR bank statement + AML questionnaire | Mandate, big transactions, withdraw > ฿500K |
| 4 (KYB) | Business | + Company registration + UBO + bank docs | Become company partner |

### 21.2 · KYC UI flow

**Trigger.** User attempts operation requiring KYC level > current.

```
[Modal/Sheet]
[Icon shield 48px text-warning]
Подтвердите личность

Для этой операции нужен уровень 2.
Загрузите паспорт и сделайте селфи.
60 секунд. Зашифровано.

[Start verification]  [Why?]
```

**Inline progression:**
```
Step 1 of 3: Passport
[Camera preview / upload area]
Use a good light, all 4 corners visible.

Step 2 of 3: Selfie video
[Camera preview]
Look at camera, slowly turn head left then right.

Step 3 of 3: Review
[Preview of submitted docs]
Submit → 1–3 hours manual review
```

### 21.3 · Identity verification provider

Powered by Jumio или Onfido (TBD). Edge function `kyc-submit` → external API → webhook back → updates `profiles.kyc_level`.

### 21.4 · Trust signals (UI surface)

| Signal | Где | Visual |
|---|---|---|
| Verified badge | User avatar когда KYC ≥ 2 | Small checkmark icon |
| ClearView grade | Off-plan listing | Grade badge (см. §16) |
| Audit marker | Money screens | Mono text-xs, кликаемый |
| Insurance badge | Provider listing | Shield + «Insured by Tokio Marine» |
| Licensed badge | Legal provider | «Licensed by Thai Bar Association» |
| Verified provider | Provider profile | «Verified by myUNO» + date |
| SSL secure | Payment forms | Lock icon + «Stripe secure» |
| Refund policy badge | Booking flow | «100% refund 24h before» |

### 21.5 · Consent management `/me/consents`

```
┌──────────────────────┐
│ Consents             │
├──────────────────────┤
│ Privacy policy       │
│ Accepted 12 May 2026 │
│ v2.3 · [Re-read]     │
├──────────────────────┤
│ Marketing emails     │
│ [Toggle]             │
├──────────────────────┤
│ Data sharing with    │
│ providers            │
│ [Toggle]             │
├──────────────────────┤
│ Third-party analytics│
│ [Toggle]             │
├──────────────────────┤
│ AI agent processing  │
│ [Toggle]             │
└──────────────────────┘
```

Каждый toggle = `consents` table row с timestamp + version.

### 21.6 · GDPR / Thai PDPA

- Right to access → `/me/export` → ZIP с all user data в JSON + PDF
- Right to delete → `/me/account/delete` → 30-day grace period
- Right to rectify → `/me/profile` редактируем
- Data retention: 7 years для financial records (Thai tax law), 2 years для chat, 30 days после delete для backup

### 21.7 · Onboarding consent

При registration — checkbox:
```
☐ Я прочитал и согласен с Privacy Policy и Terms of Service
[Privacy] [Terms]
```

Чекбокс не pre-checked. Без принятия — submit disabled.

### 21.8 · Cookie / tracking consent

EU-style banner на public pages (`myuno.app`, `clearview.myuno.app`):

```
┌──────────────────────┐
│ Privacy notice       │
│ We use cookies for   │
│ analytics. Choose:   │
│                      │
│ [Necessary only]     │
│ [Accept all]         │
│ [Customize]          │
└──────────────────────┘
```

Authenticated users: managed в `/me/consents`.

### 21.9 · Provider trust verification

KYB process для partners (см. §17.4). Verified provider gets badge.

Дополнительно:
- Insurance verification (upload + verify with insurance company)
- Professional license (visa lawyer, doctor)
- Reviews threshold (10+ reviews, average 4.5+)

### 21.10 · Suspicious activity

Auto-flag:
- 3+ failed payment attempts in 1 hour
- VPN-detected login from new country
- Multiple new accounts from same device
- Provider with sudden price spike (> 200% from baseline)

→ `/admin/security` queue.

### 21.11 · Insurance

Tokio Marine partnership для:
- Property insurance (Owner)
- Service liability (Provider)
- Travel insurance (Tourist)

UI: дополнительный flow в booking checkout «Добавить страховку?» или в settings.

### 21.12 · Analytics

```
event: kyc_initiated { from_level, to_level, source_screen }
event: kyc_completed { level, duration_minutes }
event: kyc_failed { level, reason }
event: consent_changed { type, value }
event: trust_signal_viewed { signal_type, screen }
```

---

## 22 · Domain forms

> Forms — самый частый компонент UI. Этот раздел — единый стандарт. Любая форма строится по этой методологии.

### 22.1 · Stack

- **React Hook Form 7** — state management
- **Zod** — validation schema
- **shadcn `<Form>`** — UI wrapper
- **`<FormField>`** — поле компонент

### 22.2 · Anatomy одного поля

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email *</FormLabel>
      <FormControl>
        <Input
          type="email"
          placeholder="name@example.com"
          {...field}
        />
      </FormControl>
      <FormDescription>
        Для подтверждения и квитанций
      </FormDescription>
      <FormMessage /> {/* error */}
    </FormItem>
  )}
/>
```

### 22.3 · Form sections

Длинная форма делится на секции:

```
┌─ Section: Личные данные ──────────────────┐
│ Full name *                               │
│ Email *                                   │
│ Phone *                                   │
└───────────────────────────────────────────┘

┌─ Section: Адрес доставки ─────────────────┐
│ Street *                                  │
│ Building, apt                             │
│ District (Phuket only) *                  │
│ Postal code                               │
└───────────────────────────────────────────┘

┌─ Section: Дополнительно ──────────────────┐
│ ☐ Сохранить как default                   │
│ Special instructions                      │
└───────────────────────────────────────────┘
```

Section heading: `heading-sm muted`, divider strong border above.

### 22.4 · Layout rules

**Mobile.**
- Одно поле в строке
- Stacking vertical
- Submit sticky bottom (within Sheet или page footer)

**Desktop.**
- 2-column для symmetric pairs (street + apt, city + postal)
- Full-width для textarea, file upload
- Submit aligned right, secondary aligned left

### 22.5 · Field types

| Type | Use when | Component |
|---|---|---|
| Text | Free text < 100 chars | `<Input type="text">` |
| Email | Email | `<Input type="email" inputMode="email">` |
| Tel | Phone | `<PhoneInput>` |
| Password | Password | `<Input type="password">` с show/hide toggle |
| Number | Numeric | `<Input type="number" inputMode="decimal">` |
| Money | Currency amount | `<MoneyInput>` |
| Date | Single date | `<DatePicker>` |
| Date range | Date range | `<DateRangePicker>` |
| Time | Time only | `<TimePicker>` |
| Select | < 10 options | `<Select>` (shadcn) |
| Combobox | > 10 options, searchable | `<Combobox>` |
| Multi-select | Multiple choices | `<MultiSelect>` |
| Radio | 2–5 mutually exclusive | `<RadioGroup>` |
| Checkbox | Single boolean | `<Checkbox>` |
| Checkbox group | Multiple booleans | `<CheckboxGroup>` |
| Switch | Toggle setting | `<Switch>` |
| Slider | Range value | `<Slider>` |
| Textarea | Long text | `<Textarea>` autoresize |
| File | Single file | `<FileUpload>` |
| Files | Multiple files | `<MultiFileUpload>` |

### 22.6 · Validation patterns

```typescript
import { z } from 'zod';

const passportSchema = z.object({
  full_name: z.string().min(2, 'Минимум 2 символа').max(100),
  email: z.string().email('Некорректный email'),
  phone: z.string().regex(/^\+\d{10,15}$/, 'Формат: +66 81 234 5678'),
  date_of_birth: z.date().max(new Date(), 'Дата рождения в будущем'),
  passport_number: z.string().regex(/^[A-Z0-9]{6,12}$/, 'Только латиница и цифры'),
});
```

**Display rules.**
- Required fields: ` *` after label
- Optional fields: no marker (defaults to optional)
- Validation triggers: on blur (initial) + on change (after first error)
- Error text: red, below input, мин 1 line gap
- Success: green checkmark icon right of input (после blur)

### 22.7 · Specialized form fields

**MoneyInput.**
- Right-aligned mono number
- Currency selector left (dropdown)
- Mask: thousands separator
- Validation: > 0, max based on field

**PhoneInput.**
- Country code dropdown left (+66 default)
- Number input right
- Formats как user types (per country)
- Final value E.164 format

**AddressInput.**
- Google Places Autocomplete
- Bias to Phuket area
- After selection: fills street, district, postal
- «Edit manually» fallback

**FileUpload.**
- Drag-and-drop area
- Click to select fallback
- Preview thumbnails
- Max size hint
- Allowed types hint
- Progress bar during upload
- Cancel option mid-upload

**DateRangePicker.**
- Single sheet/popover с 2 months side-by-side
- Mobile: full screen
- Touch friendly day cells (44×44px)
- Locale-aware (RU: week starts Monday)

### 22.8 · Submit patterns

**Simple form.**
```
[Submit primary] [Cancel ghost]
```

**Multi-step.**
```
[← Back ghost]      [Continue primary →]
```

**Long form with autosave.**
```
✓ Saved 2 minutes ago        [Submit primary]
```

**Destructive.**
```
[Cancel ghost]       [Delete destructive]
```

### 22.9 · Loading state

```
[Submit disabled] → spinner + «Saving…»
```

### 22.10 · Error state (server-side)

После submit:
- Field-level errors: показываем под полями
- Form-level errors: banner top «Не удалось сохранить. Попробуйте позже.»
- Network errors: toast «Нет интернета»

### 22.11 · Success state

```
1. Toast «Сохранено»
2. Navigate to next screen ИЛИ
3. Inline confirmation card
```

### 22.12 · Autosave (drafts)

Для длинных форм:
- Save to localStorage every 2 sec idle
- Save to Supabase every 10 sec (if authenticated)
- Restore on page reload
- «You have unsaved changes» banner if user navigates away

### 22.13 · Accessibility

- Each field имеет `aria-label` или associated `<label>`
- `aria-required="true"` for required
- `aria-invalid="true"` when error
- `aria-describedby` linking to error message
- Tab order logical (top to bottom, left to right)
- Focus visible always
- Submit on Enter (если последнее поле или single-field form)

### 22.14 · Bilingual labels

Каждая label, placeholder, helper, error — в i18n.

### 22.15 · Anti-patterns

- ❌ Множественные required без визуального маркера
- ❌ Validation on every keystroke (стресс)
- ❌ Hidden errors below fold (scroll to first error)
- ❌ Auto-submit on field blur (только explicit submit)
- ❌ Required без объяснения зачем
- ❌ Long forms без autosave

---

## 23 · Documents · PDF

> Документы — финальный артефакт многих flows: контракты, statements, receipts, KYC docs, ClearView reports.

### 23.1 · Типы документов

| Type | Generated when | Format | Storage |
|---|---|---|---|
| Receipt | После payment | PDF | Supabase storage (public) |
| Tax invoice | После TH payment | PDF (Thai gov format) | Supabase storage (private) |
| Booking confirmation | После booking | PDF | Supabase storage |
| Contract | После agreement | PDF (DocuSign template) | DocuSign + Supabase mirror |
| Statement (Owner) | Monthly | PDF | Generated, supabase storage |
| ClearView report | После rating | PDF | Public |
| KYC docs (passport, selfie) | Upload | Original format | Encrypted private storage |
| Property docs (title deed) | Upload | PDF/JPG | Encrypted private |
| Visa docs | Upload | PDF/JPG | Encrypted private |

### 23.2 · PDF generation

**Stack.** React PDF (server-side в Edge function) → upload to Supabase storage → URL → email/notification link.

**Templates.**
- `receipt.tsx` — single page, Thai tax format
- `statement.tsx` — multi-page, professional layout
- `clearview-report.tsx` — 8-category detail, charts
- `contract.tsx` — legal-grade typography

**Typography в PDF.** Source Serif 4 + Geist + IBM Plex Mono — те же шрифты, что в продукте (визуальная consistency).

**Header / footer:**
- Header: myUNO logo + document type + ID
- Footer: page X of Y + audit marker + URL to verify

### 23.3 · Receipt template

```
┌────────────────────────────────────────┐
│ myUNO                  Receipt #R-8x3kQ │
│                                         │
│ Date: 14 May 2026 10:30 ICT            │
│ Customer: Pavel Ignatev                 │
│ Email: pavel@example.com                │
│                                         │
│ ────────────────────────────────────── │
│                                         │
│ Description                  Amount     │
│ Cleaning service             ฿1,500     │
│ Subtotal                     ฿1,402     │
│ VAT 7%                       ฿98        │
│ Total                        ฿1,500     │
│                                         │
│ ────────────────────────────────────── │
│                                         │
│ Payment method: Visa ···4242            │
│ tx_id: tx_8x3kQ                         │
│ Ledger: le_7d2x1                        │
│                                         │
│ Verify: myuno.app/verify/tx_8x3kQ      │
└────────────────────────────────────────┘
```

### 23.4 · Statement (Owner) template

Multi-page:
- Page 1: Summary (income, expenses, fees, net)
- Page 2: Booking-by-booking breakdown
- Page 3: Expenses detail
- Page 4: Audit log (events, timestamps)
- Page 5+: Receipts attachments

### 23.5 · ClearView report template

См. §16.4 для UI version. PDF — extended, methodology explained, charts (radar chart of 8 categories), comparable rated projects.

### 23.6 · In-product PDF viewer

```tsx
<PDFViewer src="https://...statement.pdf">
  <PDFToolbar>
    [Zoom -] [Zoom +] [Download] [Share] [Print]
  </PDFToolbar>
</PDFViewer>
```

Powered by `react-pdf` (npm). Fallback: native browser viewer.

### 23.7 · Document inbox `/me/docs`

```
┌──────────────────────┐
│ Documents            │
├──────────────────────┤
│ Filter: All · Tax ·  │
│ Receipts · Contracts │
├──────────────────────┤
│ [File card]          │
│ Statement May 2026   │
│ PDF · 245 KB         │
│ [View] [Download]    │
├──────────────────────┤
│ ...                  │
└──────────────────────┘
```

### 23.8 · Upload UX

Drag-and-drop + click to upload:
- Preview thumbnail
- File size, type displayed
- Virus scan badge after upload
- Encryption indicator
- «Delete» action with confirmation

### 23.9 · OCR / extraction

For uploaded passports, utility bills:
- AWS Textract или Google Cloud Vision
- Extracted fields displayed для confirmation
- User can correct before submit

### 23.10 · Sharing

- Public docs (receipts) → URL share
- Private docs (KYC) → never shared
- Statements → emailable, не public link
- ClearView reports → public URL

### 23.11 · Retention

- Receipts: 7 years (Thai tax law)
- Statements: 7 years
- KYC: lifetime + 7 years post-account-deletion
- Chat-attached docs: 2 years
- Drafts: 30 days

### 23.12 · Versioning

Contracts versioned (v1, v2, …). When updated:
- Both parties notified
- New version PDF generated
- Old versions accessible read-only
- Active version marked

### 23.13 · Signing flow

- DocuSign integration для legal contracts
- Embedded signing UI (DocuSign iframe или native)
- After sign → both parties get PDF copy
- Status: draft → out_for_signature → signed → executed

### 23.14 · Search inside docs

- Full-text search in PDF content (для public docs)
- Filter by date range, type, party
- Search UI in `/me/docs`

### 23.15 · Analytics

```
event: doc_viewed { doc_id, type }
event: doc_downloaded { doc_id, type }
event: doc_shared { doc_id, channel }
event: doc_signed { doc_id, parties }
event: doc_uploaded { type, size }
```

---

## 24 · Глоссарий

> Единый словарь терминов. Если термин не здесь — он не используется.

| Термин | Definition | Notes |
|---|---|---|
| **Canvas** | Long-lived app-shell (Home, Discover, Operate, Wallet, Me, Admin). 6 штук. | Previously «Surface». Renamed для разделения с content cluster. |
| **Cluster (content)** | One of 6 content clusters: Arrive, Live, Manage, Invest, Legal, Build. Colour-locked. | Same as «Surface» в Master Taxonomy v1.0. |
| **Surface** | = Cluster (content). Two names, one concept. | Use «Surface» when referring to canonical 05-visual-design-system. |
| **JTBD Cluster** | Functional Jobs-To-Be-Done classifier (A–J, 10 штук). | Different from Surface. Used for tagging, AI routing, SEO. |
| **Persona** | One of 25 user personas (P01–P25). | См. `01-segmentation-framework.md`. |
| **Vertical** | Micro-app inside a cluster. ~45 verticals across 6 clusters. | E.g. cleaning, visa, off-plan, schools. |
| **Role** | One of 7 roles: Tourist, Resident, Owner, Agent, Developer, Provider, Investor. | Stored in `profiles.roles_stack`. |
| **Role stack** | jsonb of user's roles with weights (primary·3 + secondary·2 + tertiary·1). | Multi-select. |
| **Lifecycle phase** | One of 5: discover, arrive, live, manage, leave. | Stored in `profiles.lifecycle_phase`. |
| **Intent** | AI agent output, user-confirmed via one-tap accept/later. | Never auto-execute money moves. |
| **Listing** | Offer: stay, service, product, property-for-sale. | Domain primitive L4. |
| **Booking** | Reservation for stay or service. | Domain primitive L4. |
| **Order** | Transaction record. Contains `order_items`. | Source of truth для всех money flows. |
| **Ledger entry** | Double-entry accounting row. Linked to order. | `ledger_entries` table. |
| **Tx (transaction)** | Stripe payment intent + corresponding order + ledger entries. | Has `tx_id`. |
| **Audit marker** | UI element showing tx_id + ledger_entry_id + timestamp. | Required on money screens. |
| **KYC** | Know Your Customer. Levels 0–4 (4 = KYB). | См. §21. |
| **KYB** | Know Your Business. KYC level 4 for companies. | |
| **ClearView** | myUNO methodology for off-plan property rating. Grades AAA → BB. | См. §16. |
| **Mandate** | Capital advisory engagement for HNW investors. Internal CRM. | Ignatev Capital. |
| **Concierge** | Home canvas widget showing AI agent intents. | UI surface, not chatbot. |
| **Signal stack** | Ranked list of intents/events shown on Home. | См. §12.5. |
| **MC** | Management Company (PM operator). Company entity. | `company_type = 'mc'`. |
| **PM** | Property Management. Same as MC operator. | |
| **DD** | Due Diligence. Investor-facing report on property. | |
| **Off-plan** | Under-construction property. Sold before completion. | High risk → ClearView rating critical. |
| **Resale** | Existing property for sale. | |
| **STAYS** | Internal codename for short-term rental verticals. | `manage` cluster. |
| **DEALS** | Internal codename for property sales verticals. | `invest` + `build` clusters. |
| **PEYLAA** | Phuket Marriott property (legacy code). Migrated to PRIMARY DB. | Не использовать в новом коде. |
| **Operate** | Canvas for partners (Owner, Agent, Developer, Provider, Investor). | `/operate/*` routes. |
| **shell** | Layout wrapper for a canvas. E.g. `MiniAppLayout`. | Never create new shell. |
| **L0–L6** | Architecture layers: Strategy → Code. | См. §02.1. |
| **Hard rules** | Non-negotiable rules. Breaking blocks merge. | См. §00.2. |
| **Feature flag** | `feature_flag:*` in `system_settings`. Gate for new features. | Required pre-GA. |
| **Subdomain** | Per-audience domain: `myuno.app`, `invest.myuno.app`, etc. | См. §02.7. |
| **Cross-domain SSO** | One auth session works across all subdomains. | Cookie on `.myuno.app`. |
| **Ignatev Group** | Pavel's broader business holding. myUNO is one product. | |
| **Ignatev Capital** | Capital advisory arm. HNW investor mandates. | `capital.myuno.app` (planned). |
| **Tone of Voice** | Brand voice: Calm Authority, Practical Clarity, Quiet Care, Earned Confidence. | См. §04. |
| **Cluster color** | Immutable color mapped to one of 6 content clusters. | См. §05.1. |
| **Trust signal** | Visible UI element confirming verification (badge, audit marker, etc.). | См. §21.4. |
| **Lovable** | Lovable.dev — design tool used early in project. | Project ID `dcc2b024-7627-4ad9-a915-a3df3dd839f0`. |
| **Capacitor** | Native wrapper для PWA → iOS/Android. | |
| **Edge function** | Supabase Deno-runtime serverless function. | `supabase/functions/`. |
| **RLS** | Row-Level Security (Postgres). | Required on every public table. |
| **RPC** | Remote Procedure Call (Postgres function). | E.g. `record_ledger_entries`. |
| **EIA** | Environmental Impact Assessment (Thai legal). | Used in ClearView Legal category. |
| **UBO** | Ultimate Beneficial Owner. KYB term. | |
| **AML** | Anti-Money Laundering. KYC level 3 questionnaire. | |
| **TIN** | Tax Identification Number. | |
| **VAT** | Value-Added Tax. 7% in Thailand. | |
| **PDPA** | Thai Personal Data Protection Act. Equivalent to GDPR. | |
| **ICT** | Indochina Time (UTC+7). Phuket timezone. | All timestamps display in ICT. |
| **THB** | Thai Baht. Primary currency. Symbol: ฿. | |
| **PromptPay** | Thai instant payment system (QR-based). | |

---

## 25 · Уведомления

> Notification router — single source of truth для **всех** notifications. Per-feature wiring запрещён (hard rule §11 of ARCHITECTURE_V2 collapse map).

### 25.1 · Каналы

| Channel | Use case | Latency | Cost |
|---|---|---|---|
| **In-app push** | Real-time alerts | Instant | Free |
| **Browser push** | PWA notifications | Instant | Free |
| **Native push** | iOS / Android (Capacitor) | Instant | Free |
| **Email** | Receipts, statements, important alerts | < 1 min | Cheap (Resend) |
| **SMS** | Critical alerts, KYC codes | < 30 sec | Mid (Twilio) |
| **WhatsApp** | Booking confirmations, status | < 1 min | Mid (UltraMSG) |
| **Telegram** | Admin internal alerts | Instant | Free |

### 25.2 · Channel selection

Каждый notification type имеет default channels + user can override в `/me/notifications`.

| Type | Default channels |
|---|---|
| Booking confirmed | In-app + email + WhatsApp |
| Payment received | In-app + email |
| Payment failed | In-app + email + SMS |
| Visa expiring | In-app + email + WhatsApp |
| KYC code | SMS only |
| Owner statement ready | In-app + email |
| New message | In-app + push |
| Maintenance ticket | In-app + email + (Owner) WhatsApp |
| AI intent | In-app only |
| SOS dispatched | In-app + SMS + WhatsApp + Telegram (to admin) |
| Marketing | Email (opt-in only) |

### 25.3 · Quiet hours

Default 22:00–08:00 ICT. User-configurable.

**Behaviour.** Non-critical notifications queued, delivered at 08:00. Critical (SOS, payment failure, security alert) — sent immediately regardless.

### 25.4 · Throttling

- Max 3 push/day per user без explicit opt-in
- Max 1 marketing email/day
- Max 5 transactional emails/day
- Bulk operations → digest email (1 email с list)

### 25.5 · Anatomy push

```
[App icon] myUNO
Anna confirmed your booking for 14 May
[Tap → opens /operate/owner/properties/.../bookings/...]
```

- Title: short, ≤ 50 chars
- Body: descriptive, ≤ 150 chars
- Deep link: required

### 25.6 · Anatomy email

```
From: myUNO <hello@myuno.app>
Subject: Бронирование подтверждено — Villa Nai Thon 12, 14 мая

[myUNO logo header]

Здравствуйте, Pavel.

Бронирование Villa Nai Thon 12 подтверждено.

Заезд: 14 мая 15:00
Выезд: 17 мая 11:00
Гостей: 2
Сумма: ฿4,500

[Открыть бронирование]

Если что-то не так — ответьте на это письмо.

—
myUNO · myuno.app
```

Template: HTML + plain text fallback. Branded header, footer with unsubscribe.

### 25.7 · Anatomy WhatsApp

```
myUNO: Бронирование подтверждено.
Villa Nai Thon 12 · 14 мая, 15:00.
Детали: myuno.app/b/abc123
```

Plain text, deep link. No images (некоторые WhatsApp configs не поддерживают media из API).

### 25.8 · Notification preferences `/me/notifications`

```
┌──────────────────────────────┐
│ Preferences                  │
├──────────────────────────────┤
│ Bookings                     │
│   In-app  Email  WhatsApp    │
│   [✓]     [✓]    [✓]         │
│                              │
│ Payments                     │
│   [✓]     [✓]    [ ]         │
│                              │
│ Marketing                    │
│   [ ]     [ ]    [ ]         │
│                              │
│ Quiet hours                  │
│ 22:00 — 08:00 ICT            │
│ [Edit]                       │
└──────────────────────────────┘
```

### 25.9 · In-app notification center

`/me/notifications/feed` or accessible via bell icon top right:

```
┌──────────────────────────────┐
│ Notifications        Clear   │
├──────────────────────────────┤
│ ●  Anna confirmed booking    │
│    10:30 today               │
│                              │
│ ●  Statement May 2026 ready  │
│    Yesterday                 │
│                              │
│ ○  AC repair completed       │
│    2 days ago                │
└──────────────────────────────┘
```

● unread · ○ read

### 25.10 · Deep linking

Каждая notification → specific deep link.

```
booking.confirmed → /operate/owner/properties/:id/bookings/:bid
payment.failed → /wallet/activity/:tx_id
visa.expiring → /app/legal/visa/extend
message.new → /messages/:thread
```

### 25.11 · Analytics

```
event: notification_sent { type, channel, user_id }
event: notification_opened { type, channel }
event: notification_dismissed { type, channel }
event: notification_unsubscribed { type, channel }
```

KPI: open rate > 30% for transactional, > 5% for marketing.

### 25.12 · Compliance

- All emails have unsubscribe link
- Marketing opt-in tracked в `consents`
- SMS opt-out via «STOP» reply
- WhatsApp opt-out via «STOP» reply
- GDPR / PDPA right to disable all notifications

---

## 26 · Карты · Geo

> Maps powered by **Google Maps** (`@react-google-maps/api`). Mapbox phased out (in migration).

### 26.1 · Use cases

- Property listing location
- Service area для providers
- Booking address selection
- Discovery map view
- Owner property pin
- Emergency / SOS location share

### 26.2 · Base map

**Region.** Phuket. Center ~ `7.8804°N 98.3923°E`. Default zoom 11 (whole island).

**Style.** Light mode → light Google Maps default. Dark mode → custom dark style (subtle, не competing с UI).

**Markers.**
- Property pins: cluster color drop pin
- Service pins: cluster icon в circle
- User location: blue dot pulse
- Selected: enlarged + outline glow

**Clustering.** Auto-cluster pins at zoom < 14 (avoid pin spam).

### 26.3 · Map sizes

| Context | Size |
|---|---|
| Listing detail "Location" tab | Full width, 300px height (mobile) / 400px (desktop) |
| Discover map view | Full-bleed |
| Owner property pin | 200×200 square thumbnail |
| Booking address picker | 100% width, expandable |

### 26.4 · Interactions

| Gesture | Action |
|---|---|
| Tap pin | Show preview card |
| Tap card | Open listing detail |
| Pinch | Zoom in/out |
| Drag | Pan |
| Long press | Drop pin (in address picker mode) |
| Tap "Locate me" | Centre on user GPS |
| Tap "Directions" | Open Google Maps app / website |

### 26.5 · Geocoding / autocomplete

Google Places Autocomplete. Bias to Phuket.

- Search by address, landmark, postal code
- Show 5 suggestions with distance
- Tap → fills address fields

### 26.6 · Reverse geocoding

User pin → address. Used in:
- Booking address (after long-press)
- Owner property add
- SOS location share

### 26.7 · Distance / directions

```tsx
<DistanceTo
  from={{ lat: 7.88, lng: 98.39 }}
  to={{ lat: 7.92, lng: 98.32 }}
  mode="driving"
/>
// Renders: "12 min · 8.2 km"
```

Powered by Google Distance Matrix API.

### 26.8 · Static map images

For email, PDF, OG images:
```
https://maps.googleapis.com/maps/api/staticmap?...
```

Cached в Supabase storage by coordinate key.

### 26.9 · Privacy / location permission

**Permission request UI:**
```
[Dialog]
Разрешить доступ к местоположению?

Это поможет показать ближайшие услуги
и доставку. Можно отключить позже.

[Allow]  [Not now]
```

**Fallback.** Если denied — default to Phuket center. Show «Set my area» manual selector.

### 26.10 · Map accessibility

- All map content also available as list (toggle button)
- Keyboard navigation: zoom (+/-), pan (arrow keys)
- Marker tooltips have aria-label
- Color is not the only indicator (also icon)

### 26.11 · Performance

- Lazy-load Google Maps SDK only on map screens
- Static map images for thumbnails (no SDK)
- Debounce zoom/pan events
- Marker virtualization at high counts

### 26.12 · Zones / Phuket regions

Common reference zones (used in filters, search):

```
North Phuket: Mai Khao, Sirinat, Nai Yang, Nai Thon, Layan
West coast: Bang Tao, Surin, Kamala, Patong, Karon, Kata
South: Naiharn, Rawai, Cape Panwa
East: Phuket Town, Cherngtalay, Koh Sirey
Inland: Chalong, Kathu, Thalang
```

### 26.13 · API key management

- One Google Cloud project с map API + Places API + Distance Matrix
- Key stored в Vercel env vars + Supabase secrets (for edge fns)
- Restrictions: by HTTP referrer (myuno.app + subdomains) + by API
- Quotas monitored, alert at 80% of monthly budget

См. `docs/GOOGLE_MAPS_KEY_SETUP.md` для setup.

---

## 27 · Iconography

> Single library, single style. Никаких custom иконок без явной необходимости.

### 27.1 · Library

**Primary.** `lucide-react`. ~1500 icons. MIT.

Why: clean, consistent stroke, comprehensive, well-maintained.

### 27.2 · Anti-libraries

- ❌ Font Awesome (heavy, dated)
- ❌ Material Icons (Google-feel, не наш voice)
- ❌ Custom SVG sets (kept minimum — только cluster-specific, brand mark)

### 27.3 · Sizes

| Size | Value | Когда |
|---|---|---|
| `icon-xs` | 12px | Inline with body text |
| `icon-sm` | 16px | Buttons, list items |
| `icon-md` | 20px | Default UI, nav |
| `icon-lg` | 24px | Headers, bottom nav |
| `icon-xl` | 32px | Empty states |
| `icon-2xl` | 48px | Illustrations, error states |

### 27.4 · Stroke weight

- `1.5px` — standard (most contexts)
- `2px` — emphasized (nav active, primary buttons)
- `1px` — disabled / muted

### 27.5 · Color

Inherit from text color by default. Use `currentColor`.

```tsx
<Icon className="text-muted-foreground" />     // muted
<Icon className="text-primary" />              // brand
<Icon className="text-cluster-legal" />        // cluster
<Icon className="text-destructive" />          // danger
```

### 27.6 · Icon mapping (по category)

**Navigation.** home · compass · briefcase · wallet · user
**Action.** plus · edit · trash · share · download · upload
**State.** check · x · alert-circle · info · clock · loader
**Money.** wallet · credit-card · banknote · arrow-down-circle · arrow-up-circle
**Time.** calendar · clock · alarm-clock
**Doc.** file · file-text · file-image · clipboard
**Communication.** mail · message-circle · phone · bell
**Trust.** shield · check-circle · star · award
**Location.** map · map-pin · navigation · globe
**Media.** image · video · camera · mic
**Cluster.** plane (arrive) · home (live) · key (manage) · trending-up (invest) · scale (legal) · hammer (build)

### 27.7 · Icon-only buttons

Always require aria-label:
```tsx
<Button size="icon" aria-label="Поделиться">
  <Share2 className="h-4 w-4" />
</Button>
```

### 27.8 · Composite icons

Combine 2 icons для compound meaning:
```
[message-circle + sparkles] = AI message
[shield + check] = verified
[home + plus] = add property
```

Use sparingly. Default to single icon.

### 27.9 · Brand mark

- Primary logo: «myUNO» wordmark (Source Serif 4)
- Symbol: «m» monogram (для favicon, native app icon)
- Variants: dark / light backgrounds
- Min size: 24px (symbol), 80px (wordmark)
- Don't: stretch, rotate, recolor, add effects

См. §35 (Brand assets).

### 27.10 · Cluster icons

Each cluster has primary icon (см. §27.6). Used:
- Cluster grid tiles в Home
- Cluster filter chips
- Cluster badge on cards
- Bottom nav (Pro-role: Operate icon contextual)

---

## 28 · Imagery

### 28.1 · Photography style

**Approach.** Документальный, реальный, не stock. Эталоны: Apple product photography, Architectural Digest, FT photography.

**Anti-pattern.** Никаких стоковых: laughing-couple-holding-coffee, generic-skyline, blurred-people-in-coworking.

### 28.2 · Use cases

| Context | Style |
|---|---|
| Property listing | Real photos. Min 5, max 12. Wide-angle, daylight, no people. |
| Service listing | Action shots. Provider in context. Hands at work, not posed faces. |
| Provider profile | Headshot. Neutral background. Professional but human. |
| Editorial / blog | Photojournalism. Real Phuket scenes. |
| Marketing pages | Custom-shot if possible. Otherwise carefully selected stock. |

### 28.3 · Aspect ratios

| Use | Ratio | Min size |
|---|---|---|
| Hero (mobile) | 16:9 | 750×422 |
| Hero (desktop) | 21:9 | 1920×823 |
| Card thumbnail | 4:3 | 600×450 |
| Avatar (rect) | 1:1 | 200×200 |
| Avatar (circle) | 1:1 | 200×200 |
| OG image | 1.91:1 | 1200×630 |
| Story (vertical) | 9:16 | 1080×1920 |

### 28.4 · Image specifications

- **Format.** AVIF primary, WebP fallback, JPEG legacy. PNG только для logos/icons.
- **Compression.** Lossy 80% quality. Bigger files for hero, smaller for thumbnails.
- **Responsive.** `srcset` + `sizes` attribute. Min 3 sizes (mobile 1x, mobile 2x, desktop).
- **Lazy load.** Above-the-fold eager. Below — lazy.
- **Blur placeholder.** Plaiceholder library, base64 inline.

```tsx
<Image
  src="/properties/villa-nai-thon-12.avif"
  alt="Villa Nai Thon 12 living room with ocean view"
  width={1920}
  height={1080}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 28.5 · Alt text rules

**Always provide.** Каждое <img> imeет meaningful alt.

```
❌ alt="image"
❌ alt="property"
✅ alt="Villa Nai Thon 12 living room with ocean view"
```

**Decorative images.** `alt=""` (empty), aria-hidden.

### 28.6 · Avatar

```tsx
<Avatar>
  <AvatarImage src={user.avatar_url} alt={user.full_name} />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>
```

**Fallback.** Initials on muted background (color generated from user_id hash).

### 28.7 · Image storage

- Supabase Storage buckets
- CDN: Vercel + Cloudflare
- Compression: server-side on upload (Sharp via edge fn)
- Variants: original + 3 resized
- URL pattern: `https://cdn.myuno.app/{bucket}/{type}/{id}/{variant}.avif`

### 28.8 · Image moderation

- Auto-scan for inappropriate content (Google Vision SafeSearch)
- Auto-detect faces in property photos (request to blur / remove if non-owner)
- Manual review queue for flagged

### 28.9 · Illustrations

**Use sparingly.** Только для empty states, onboarding, error pages.

**Style.** Outlined geometric, monochromatic + 1 cluster accent. Никаких иллюстраций «human-like» с лицами.

**Source.** Custom-drawn by Pavel's designer OR carefully-selected line-art (e.g., Streamline icons).

### 28.10 · Icons vs imagery

| Use icon when | Use image when |
|---|---|
| Compact, recognizable | Communicating real thing |
| < 48px size | > 100px size |
| Action / state / category | Property, person, place |
| Universal | Specific |

### 28.11 · Brand photography

Pavel commissions periodically:
- Phuket landscapes (4 seasons)
- Real customers (with consent)
- Office / team
- Properties under PM management

Storage: `brand/` bucket. Use rights: 5 years, all platforms.

### 28.12 · Performance budget

- Hero image < 200KB
- Card thumbnail < 80KB
- Avatar < 20KB
- Page total images < 2MB (mobile), < 5MB (desktop)

---

## 29 · Motion

### 29.1 · Принципы

1. **Intentional.** Анимация — для понимания, не декорации.
2. **Fast.** Default 150ms. Никогда > 300ms для UI feedback.
3. **Reduced motion respect.** `prefers-reduced-motion: reduce` → motion disabled.
4. **Spring for confirmations.** Только success states используют overshoot.
5. **No looping.** Никаких infinite loops кроме loading spinners.

### 29.2 · Duration scale

| Token | Value | Когда |
|---|---|---|
| `motion-instant` | 50ms | Micro feedback (button press, tap) |
| `motion-fast` | 100ms | Hover states, focus rings |
| `motion-normal` | 150ms | Tab switch, modal fade, page transitions |
| `motion-slow` | 250ms | Sheet open/close, drawer |
| `motion-entrance` | 300ms | Page-level fade-in-up (only on first load) |

### 29.3 · Easing curves

| Token | Curve | Когда |
|---|---|---|
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enter (fast start) |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit (fast end) |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Success/confirmation |

### 29.4 · Common animations

**Fade in.**
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
animation: fade-in 150ms ease-out;
```

**Fade in up.**
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
animation: fade-in-up 300ms ease-out;
```

**Scale in.**
```css
@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
animation: scale-in 150ms ease-out;
```

**Sheet up.**
```css
@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
animation: sheet-up 250ms ease-out;
```

### 29.5 · Component animations

| Component | Animation |
|---|---|
| Button hover | `scale(1.02)` + shadow elevation, 100ms |
| Button press | `scale(0.98)`, 50ms |
| Modal open | Backdrop fade 150ms + content scale-in 150ms |
| Sheet open | sheet-up 250ms ease-out |
| Toast in | fade-in-up 150ms |
| Toast out | fade-out 100ms |
| Tab switch | Content fade 150ms |
| Accordion | accordion-down/up 200ms |
| Skeleton pulse | 1.5s infinite (loading only) |
| Spinner | 800ms infinite linear |

### 29.6 · Page transitions

Default: no transition (instant page change). Reason: feels native, fast.

Exception: marketing pages → fade-in-up 300ms on first scroll-into-view.

### 29.7 · Success animations

Spring easing для confirmations:
- Payment success: checkmark draws in + scale-in spring 250ms
- Booking confirmed: card slides in spring 300ms
- Form saved: green tick fades in + scale 150ms spring

### 29.8 · Loading animations

| Pattern | Use |
|---|---|
| Skeleton pulse | List/card known shape |
| Spinner | Unknown duration |
| Progress bar | Known total (upload, multi-step) |
| Shimmer | Same as skeleton, alternative |

### 29.9 · Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

All non-essential animations disabled. Loading spinners still rotate (it's their identity).

### 29.10 · Framer Motion usage

For complex animations (drag, gesture, choreographed sequence):
```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.15, ease: "easeOut" }}
>
```

Avoid Framer for simple fade/slide (CSS animations are cheaper).

### 29.11 · Don'ts

- ❌ Parallax (motion sickness, performance)
- ❌ Auto-playing carousels (annoying, accessibility)
- ❌ Bouncing icons (childish)
- ❌ Glow / pulse effects на CTAs (desperate)
- ❌ Animated backgrounds with particles
- ❌ Animation longer than 300ms (feels slow)
- ❌ Animation на каждое появление элемента (overwhelm)

---

## 30 · Доступность

> WCAG 2.1 AA — minimum baseline. Каждый PR должен пройти axe-core check.

### 30.1 · Принципы

1. **Keyboard first.** Каждое действие доступно с клавиатуры.
2. **Screen reader friendly.** Семантическая разметка, aria labels.
3. **Color is not the only signal.** + Icon + label.
4. **Touch target ≥ 44×44px.**
5. **Contrast ratio ≥ 4.5:1** body, ≥ 3:1 large text.
6. **Focus visible always.**

### 30.2 · Семантика

```html
<!-- ✅ -->
<button onClick={handleSave}>Save</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<header>...</header>

<!-- ❌ -->
<div onClick={handleSave}>Save</div>
<div role="navigation">...</div>
```

### 30.3 · ARIA

| Pattern | Когда |
|---|---|
| `aria-label` | Icon-only buttons |
| `aria-labelledby` | Form fields connected to label |
| `aria-describedby` | Helper text, error |
| `aria-required` | Required form fields |
| `aria-invalid` | Form fields with error |
| `aria-expanded` | Accordion, menu, combobox |
| `aria-current` | Current page/tab |
| `aria-live` | Toast, loading state announcements |
| `role="alert"` | Critical errors |
| `role="status"` | Non-critical updates |

### 30.4 · Keyboard navigation

| Key | Action |
|---|---|
| Tab | Next focusable element |
| Shift+Tab | Previous focusable |
| Enter | Activate button / link |
| Space | Activate button / toggle |
| Escape | Close modal / sheet / dropdown |
| Arrow keys | Navigate list / radio / tabs |

### 30.5 · Focus management

- Focus visible: 2px ring brand color, offset 2px
- Modal open → focus moves to first focusable inside
- Modal close → focus returns to trigger
- Skip-to-main link top of page

### 30.6 · Color contrast

| Pair | Ratio min |
|---|---|
| Body text on background | 4.5:1 |
| Large text (≥ 18px or bold ≥ 14px) | 3:1 |
| UI components (buttons, form controls) | 3:1 |
| Focus indicators | 3:1 against adjacent colors |

**Testing.** axe DevTools, Stark plugin.

### 30.7 · Touch targets

- Min 44×44px (Apple HIG) или 48×48dp (Material)
- Spacing between targets ≥ 8px

### 30.8 · Forms

- Each field has visible label
- Error связан с field via aria-describedby
- Validation announced via aria-live
- Submit on Enter работает (если safe)

### 30.9 · Images

- Always alt
- Decorative: alt="" + aria-hidden="true"
- Complex: extended description in aria-describedby

### 30.10 · Tables

- Use real `<table>`, not divs
- `<thead>`, `<tbody>`, `<th scope="col">`
- Caption или aria-label

### 30.11 · Modals / Sheets

- `role="dialog"` + `aria-labelledby`
- Focus trap inside
- Close via Escape
- Backdrop click closes (unless destructive form)

### 30.12 · Localization a11y

- `<html lang="ru">` set correctly
- Numbers / dates formatted per locale
- RTL support not needed (all 4 langs LTR)

### 30.13 · Color blindness

- Don't rely on color alone (status pills use icon + color)
- Test with Sim Daltonism / Stark

### 30.14 · Motion sensitivity

`prefers-reduced-motion` respected (см. §29.9).

### 30.15 · Audio / video

- Captions for videos
- Transcripts for audio
- No autoplay with sound

### 30.16 · Testing

- axe DevTools на каждом PR
- Manual keyboard test
- Manual screen reader test (NVDA / VoiceOver) на critical flows
- Lighthouse a11y score ≥ 95

---

## 31 · Цена

### 31.1 · Где цены показываются

| Surface | Format |
|---|---|
| Listing card | `฿1,500` (or `From ฿1,500`) |
| Listing detail hero | `฿1,500` large + «per visit» small |
| Cart line item | `฿1,500 × 2 = ฿3,000` |
| Cart summary | Subtotal · Fees · VAT · Total |
| Receipt | All amounts, audit precision |
| Owner statement | Net per booking, fees breakdown |

### 31.2 · Formatting rules

- Always mono font (`font-mono`)
- Tabular nums (`font-feature-settings: "tnum"`)
- Currency symbol before amount: `฿1,500`
- Thousands separator: comma (en) / non-breaking space (ru)
- Decimal: dot (en) / comma (ru), but only show if needed
- Round to whole bahts (฿1,500, не ฿1,499.50) for display

### 31.3 · Compact format

For high values:
- ฿1.5M (millions)
- ฿1.5B (billions)
- $1.2M (USD)

Show full value on tooltip / detail.

### 31.4 · Currency conversion

User profile preference (THB / USD / EUR / RUB).

- Primary price always THB
- Secondary display in user currency (smaller, muted)
- Rate refresh daily from currencylayer or similar

```
฿1,500  ~ $42 USD
```

### 31.5 · Price ranges

For variable pricing:
- `From ฿1,500` (lower bound only)
- `฿1,500–3,000` (range)
- `From ฿1,500/night` (with unit)

### 31.6 · Fee disclosure

**Transparent line-by-line.**

```
Service:               ฿1,500
Platform fee (5%):     ฿75
VAT 7%:                ฿110
─────────────────────────────
Total:                 ฿1,685
```

Never hidden fees revealed at checkout (illegal in TH + bad UX).

### 31.7 · «Free» pricing

When applicable:
- `Free` (English UI)
- `Бесплатно` (RU UI)

Use sparingly. Free trials should specify duration.

### 31.8 · Subscription pricing

```
฿2,500 / month
billed monthly · cancel anytime
```

Annual discount displayed:
```
฿24,000 / year
save ฿6,000 vs monthly
```

### 31.9 · Tier pricing tables (`/pricing`)

Standard pattern:
```
[Tier 1]      [Tier 2 ●Recommended]    [Tier 3]
฿2,500/mo     ฿4,500/mo                ฿9,500/mo

- Feature 1   - Everything in T1        - Everything in T2
- Feature 2   - Feature 3                - Feature 4
              - Feature 4                - Custom support

[Choose]      [Choose]                  [Contact us]
```

Highlight middle tier (visual focus, label «Recommended»).

### 31.10 · Negotiation marker

For HNW mandates («Contact us» pricing):
```
$10K+ engagement
Pricing per mandate · contact Capital
```

### 31.11 · Display precision

| Use case | Precision |
|---|---|
| Listing card | Whole bahts (rounded) |
| Cart line | Whole bahts |
| Cart total | Whole bahts |
| Receipt | Whole bahts (Thai standard) |
| Ledger entry | 2 decimal places (precision audit) |
| FX conversion | 2 decimal places |

---

## 32 · Legal · Disclaim

### 32.1 · Где требуются disclaim

| Context | Disclaim |
|---|---|
| ClearView grade | «ClearView ratings are myUNO's internal assessment, not investment advice.» |
| Off-plan listing | «Off-plan property carries construction risk. Past performance is not guarantee.» |
| Capital advisory | «Engagement subject to suitability assessment. We do not guarantee returns.» |
| Tax estimates | «Estimates based on current rates. Consult licensed tax advisor.» |
| Visa info | «Visa rules change. Confirm with Immigration Bureau before relying.» |
| Insurance | «Coverage subject to policy terms. Read full policy.» |
| Foreign ownership | «Thai law restricts foreign land ownership. Structures advised.» |

### 32.2 · Tone

- Brief, не пугающий
- Линк на full disclaimer page
- Not in red unless emergency

```tsx
<DisclaimerBox>
  Off-plan property carries construction risk.
  <Link href="/legal/disclaim/offplan">Read full disclaimer</Link>
</DisclaimerBox>
```

### 32.3 · `/legal/*` pages

```
/legal/privacy             Privacy policy
/legal/terms               Terms of service
/legal/cookies             Cookie policy
/legal/disclaim            All disclaimers
/legal/disclaim/clearview  ClearView specific
/legal/disclaim/offplan    Off-plan specific
/legal/disclaim/capital    Capital advisory specific
```

### 32.4 · Versioning

- Each legal doc versioned (v1.0, v2.3)
- Stored in `legal_documents` table
- Active version flagged
- User consent tracked в `consents` with version reference
- Major version change → user notified, re-consent required

### 32.5 · Licensing & compliance

| License | Authority | Purpose |
|---|---|---|
| TAT license (planned) | Tourism Authority of Thailand | Stays vertical |
| Real estate license | Thai Real Estate Broker Association | Property sales |
| Money transmitter (planned) | Bank of Thailand | Wallet (если P2P money) |
| Insurance broker (planned) | OIC | Insurance partnership |
| Tax advisor partner | Mazars / Big4 | Tax services |

Public: `/about/licenses` page lists all.

### 32.6 · KYC / AML disclaimers

```
We collect this info to comply with Thai SEC AML requirements.
We don't sell or share with third parties without consent.
Encrypted at rest. Read full Privacy Policy.
```

### 32.7 · Marketing claims

**Allowed.** Factual, verifiable: «Active in Phuket since 2024», «43 properties under management», «ClearView rated 17 projects».

**Disallowed.** «Best», «#1», «Guaranteed», «Most trusted» без cite.

### 32.8 · External links

External link → opens in new tab + `rel="noopener noreferrer"`. Disclaimer: «You are leaving myUNO. We don't control external sites.»

### 32.9 · Children

- 18+ для accounts (Thai law)
- 21+ для investments (SEC suitability)
- Onboarding asks DOB, verified at KYC

### 32.10 · Дисклеймеры в PDF

Each generated PDF has footer:
```
This document is generated by myUNO.
Verify authenticity: myuno.app/verify/{doc_id}
For binding agreements, see signed copies.
```

---

## 33 · Admin UI

> Admin canvas `/admin` — отдельная shell, отдельный auth boundary. Только platform staff. Не пытается выглядеть как consumer-facing UI: density max, function over form.

### 33.1 · Доступ

- Subdomain `admin.myuno.app` (или `/admin` route с role check)
- Required role: `app_role = 'admin'` или `'support'`
- 2FA required
- Audit log на каждое действие

### 33.2 · Layout

```
┌──────────────────────────────────────────┐
│ myUNO Admin · pavel@myuno.app · 2FA ●    │
├────────────┬─────────────────────────────┤
│ Sidebar    │ Main                        │
│ ─────────  │                             │
│ Dashboard  │ [Content]                   │
│ Users      │                             │
│ Partners   │                             │
│ Listings   │                             │
│ Orders     │                             │
│ Payments   │                             │
│ Ledger     │                             │
│ KYC queue  │                             │
│ Disputes   │                             │
│ Tickets    │                             │
│ Agents     │                             │
│ Flags      │                             │
│ Audit log  │                             │
│ Settings   │                             │
└────────────┴─────────────────────────────┘
```

### 33.3 · Density

- Table rows: 32px height (vs 48px в consumer)
- Padding: half of consumer
- Fonts: text-xs default
- Mono for IDs, timestamps, amounts

### 33.4 · Sections

**Dashboard.** KPI tiles: users, MAU, GMV, conversion, top issues.

**Users.** Search + filter (role, KYC level, country, signup date). Detail view: full profile, role stack, orders, KYC docs, devices.

**Partners.** Pending KYB applications + active partners. Approve/reject flow.

**Listings.** Moderation queue (new/edited), flagged content, deactivate.

**Orders.** Search by ID, customer, partner, date. Refund, dispute resolution.

**Payments.** Stripe events, failed payments, manual reconciliation.

**Ledger.** Read-only view of all ledger entries. Reconciliation alerts.

**KYC queue.** Submitted KYC docs awaiting review. Approve/reject UI с reasoning required.

**Disputes.** User-reported issues. Chat thread + resolution actions.

**Tickets.** Maintenance/support tickets. Assign, escalate, close.

**Agents.** AI agent observability. Recent intents, accept rate, errors.

**Flags.** `feature_flag:*` management. Toggle on/off per environment.

**Audit log.** Every admin action recorded. Search + export.

**Settings.** `system_settings` key-value editor. Admin emails, WhatsApp numbers, Stripe mode.

### 33.5 · Patterns

- Tables sortable, filterable, paginated
- Bulk actions via checkbox selection
- Confirm dialog для destructive (delete user, refund > $1000, withdraw partner approval)
- Reason / note required on most actions
- Inline edit для simple fields, modal for complex

### 33.6 · KYC review UI

```
┌──────────────────────────────────────┐
│ Pavel Ignatev · KYC L2 review        │
├──────────────────────────────────────┤
│ Submitted: 14 May 2026 09:15         │
│                                      │
│ [Passport scan]   [Selfie video]     │
│ [zoom controls]    [play controls]   │
│                                      │
│ Extracted fields:                    │
│ Name: PAVEL IGNATEV                  │
│ Passport: AB1234567                  │
│ DOB: 1990-01-15                      │
│ Country: RUS                         │
│ Expiry: 2030-05-12                   │
│                                      │
│ Matches profile:  ✓                  │
│ Face match score: 94%                │
│                                      │
│ Decision: [Approve] [Reject] [Hold]  │
│ Note (required): ____________________│
└──────────────────────────────────────┘
```

### 33.7 · Dispute resolution UI

```
Dispute #D-8x3kQ · Open · 2 days ago
Customer: Anna · Provider: Cleaning Co.
Order: O-xyz789 (฿1,500)

[Thread tab]            [Resolution tab]

Anna: «Service not performed. Provider didn't show.»
Provider: «I was there. Customer didn't open.»

[Decision]
[ ] Refund customer (฿1,500)
[ ] Pay provider (฿1,425 after fee)
[ ] Split (50/50)
[ ] Other amount: ____

Reasoning: ____________________________
[Resolve]
```

### 33.8 · Feature flag UI

```
[Search flags]

clearview_v2         [Toggle]  Prod ●●●  Dev ●●●  Staging ●●○
new_onboarding       [Toggle]  Prod ○○○  Dev ●●●  Staging ●○○
investor_chat        [Toggle]  Prod ●●○  Dev ●●●  Staging ●●●

[Add flag]
```

### 33.9 · Audit log

```
Date · Actor · Action · Target · Reason
─────────────────────────────────────────
14 May 10:30  Pavel  Approved KYC  User#123  All checks passed
14 May 09:45  Pavel  Refunded      Order#456 Customer dispute
...
```

Searchable, exportable.

### 33.10 · Performance

Admin canvas is heavy by nature. Pagination required (50 rows default). Lazy load tabs. No real-time updates by default (manual refresh).

### 33.11 · Theme

Light mode default для admin (long sessions, document-like). Dark mode toggle available.

---

## 34 · Analytics

### 34.1 · Stack

- **Product analytics:** PostHog (self-hosted or cloud, TBD)
- **Error monitoring:** Sentry
- **Performance:** Sentry + Vercel Analytics
- **Server logs:** Supabase logs + structured logging

### 34.2 · Event taxonomy

Single naming convention: `{noun}_{verb}_{modifier?}` snake_case.

```
user_signed_up
user_logged_in
onboarding_completed
listing_viewed
listing_bookmarked
booking_started
booking_completed
payment_completed
payment_failed
notification_sent
notification_opened
intent_accepted
intent_dismissed
search_executed
filter_applied
share_initiated
```

### 34.3 · Event properties

Every event includes:
```
{
  user_id,
  session_id,
  device_type,    // mobile, tablet, desktop
  platform,       // web, ios, android
  app_version,
  locale,
  country,
  ts              // ISO 8601
}
```

Plus event-specific properties.

### 34.4 · KPIs to track

**Acquisition.**
- Signups / day
- Source attribution (organic, referral, paid)
- Onboarding completion rate
- Time-to-first-value

**Activation.**
- Time to first booking
- Time to first payment
- Onboarding step drop-off

**Retention.**
- DAU / WAU / MAU
- D1, D7, D30 retention
- Churn rate

**Revenue.**
- GMV (gross merchandise value)
- Take rate
- Subscription MRR
- LTV / CAC

**Engagement.**
- Sessions per user / week
- Screens per session
- Feature adoption (% users using each cluster)

**Trust.**
- KYC completion rate
- Support ticket volume
- NPS

### 34.5 · Funnels

Key funnels tracked:
- Signup → Onboarding complete → First booking
- Listing view → Booking start → Payment success
- KYC L1 → L2 → L3
- Visa expiring intent → Accepted → Completed
- Capital lead → Mandate signed

### 34.6 · Cohorts

By:
- Signup month
- Primary role
- Country
- Persona
- Acquisition source

### 34.7 · Dashboards

Internal admin canvas section (см. §33.4). Public partner-facing dashboards в Operate.

**Owner dashboard:**
- Income / month
- Occupancy rate
- Average booking value
- Top channels (direct, OTA, etc.)

**Provider dashboard:**
- Bookings completed
- Revenue
- Average rating
- Acceptance rate

**Investor dashboard:**
- Properties under consideration
- Mandate status
- ROI estimates

### 34.8 · Privacy

- No PII в analytics events (use user_id hash)
- Consent-gated (opt-out respected)
- GDPR / PDPA compliant
- Data retention: 24 months in PostHog, longer in DW

### 34.9 · A/B testing

PostHog feature flags + experiments. Pre-registered hypotheses. Min sample size enforced. Pavel approves any production experiment.

### 34.10 · Logging conventions

**Client-side.**
```typescript
analytics.track('booking_completed', {
  booking_id,
  amount_thb: 1500,
  cluster: 'live',
  vertical: 'cleaning',
});
```

**Server-side (Edge functions).**
```typescript
console.info('booking_completed', { booking_id, amount, ... });
// Picked up by Supabase logs → forwarded to analytics
```

### 34.11 · Anti-patterns

- ❌ Logging PII (email, phone, passport)
- ❌ Mass event spam (track every micro-interaction)
- ❌ Inconsistent naming (`view_booking` vs `booking_viewed`)
- ❌ Untyped properties (TypeScript event schemas required)

---

## 35 · Brand assets

### 35.1 · Logo

**Wordmark.** «myUNO» в Source Serif 4 Bold. Variants:
- Full color (primary)
- Mono dark (on light bg)
- Mono light (on dark bg)
- Cluster-tinted (per cluster page header)

**Symbol.** «m» monogram. Geometric, derives from wordmark «m». Used for:
- Favicon
- App icon (iOS, Android)
- Loading states
- Avatar fallback (myUNO official account)

### 35.2 · Variants

```
Full color
[m]yUNO   с primary mint dot on «m»

Mono
[m]yUNO   black or white

Compact
[m]      symbol only

Long
myUNO · Phuket SuperApp
```

### 35.3 · Clearspace

Min clearspace = height of «m» character.

```
       ━ X ━
       
  myUNO

       ━ X ━
```

### 35.4 · Min sizes

- Full wordmark: 80px wide
- Symbol: 24px
- Favicon: 16px (special bitmap version)

### 35.5 · Don'ts

- Don't stretch
- Don't rotate
- Don't add effects (shadow, glow, outline)
- Don't recolor outside palette
- Don't place on busy background (use mono variant)

### 35.6 · Asset library

Stored in:
- `/public/brand/` для product use
- `https://brand.myuno.app/` (planned) для partners / press

**Files:**
- `logo-color.svg`
- `logo-mono-dark.svg`
- `logo-mono-light.svg`
- `symbol-color.svg`
- `symbol-mono.svg`
- `favicon-16.png` (legacy)
- `favicon.svg` (modern)
- `apple-touch-icon-180.png`
- `og-default.jpg` (1200×630)

### 35.7 · Press kit

`/press` page (planned) с:
- Logo files (SVG, PNG)
- Brand colors palette
- Typography spec
- Pavel founder photo
- Boilerplate description (RU + EN)
- Recent press coverage
- Contact: press@myuno.app

### 35.8 · Email signatures

```
Pavel Ignatev
Founder, myUNO
+66 81 234 5678 · pavel@myuno.app
myuno.app · Phuket, Thailand
```

### 35.9 · Social media

| Channel | Handle | Use |
|---|---|---|
| Telegram | @myuno_app | Community, news |
| LinkedIn | myUNO Phuket | Partnerships, hiring |
| Instagram | @myuno.app | Visual stories, listings |
| YouTube | myUNO Phuket | Onboarding videos, ClearView reports |
| Twitter / X | — | Not active |
| Facebook | — | Not active |
| TikTok | — | Not active |

### 35.10 · Cobranding

When partnering (Siam Legal, Tokio Marine, hotels):
- Equal size logos с divider
- Не sub-brand (myUNO остаётся primary)
- Approval required from Pavel

---

## 36 · SEO · Meta

### 36.1 · SEO targets

Primary keywords (RU):
- «Пхукет недвижимость»
- «купить квартиру Пхукет»
- «виза Таиланд»
- «property management Phuket»
- «аренда Пхукет долгосрочно»

Primary keywords (EN):
- «Phuket property»
- «buy condo Phuket»
- «Thailand visa»
- «Phuket property management»
- «relocate to Phuket»

### 36.2 · URL hygiene

**Принципы.**
1. URL = задача пользователя, не product name.
2. Lowercase, kebab-case.
3. Short. Max 60 chars.
4. No tracking params в canonical URL.
5. Stable. Don't rename existing URLs.

```
✅ /buy/condo/bang-tao
✅ /guides/visa/non-immigrant-b
✅ /for/investors

❌ /api/v2/listings?type=condo&loc=bangtao
❌ /BuyCondo/BangTao
❌ /property-investment-information-page
```

### 36.3 · Sitemap

`sitemap.xml` auto-generated, updated every 24h. Includes:
- All `/for/[persona]` pages
- All `/services/*` pages
- All `/guides/*` articles
- Active listings
- ClearView rated projects

Excludes:
- `/auth/*`
- `/operate/*` (authed)
- `/admin/*`
- Drafts

Submitted to Google Search Console + Bing Webmaster.

### 36.4 · Meta tags

Each page:
```html
<title>{Page title} · myUNO</title>
<meta name="description" content="..." />
<meta name="keywords" content="..." />
<link rel="canonical" href="https://myuno.app/..." />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="..." />
<meta property="og:url" content="..." />
<meta property="og:type" content="..." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="..." />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
<meta name="robots" content="index,follow" />
<html lang="ru-RU" />  <!-- or en-US per locale -->
```

### 36.5 · Структурированные данные (JSON-LD)

Каждая страница имеет schema markup:

**Listing (property):**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "...",
  "description": "...",
  "image": [...],
  "offers": {
    "@type": "Offer",
    "priceCurrency": "THB",
    "price": "1500"
  }
}
```

**Service:**
```json
{
  "@type": "Service",
  "name": "...",
  "provider": { ... }
}
```

**Article:**
```json
{
  "@type": "Article",
  "headline": "...",
  "datePublished": "...",
  "author": { ... }
}
```

### 36.6 · Multilingual

`hreflang` annotations:
```html
<link rel="alternate" hreflang="ru-RU" href="https://myuno.app/..." />
<link rel="alternate" hreflang="en-US" href="https://myuno.app/en/..." />
<link rel="alternate" hreflang="x-default" href="https://myuno.app/..." />
```

URL pattern: `/en/...` for English, default for Russian.

### 36.7 · Robots.txt

```
User-agent: *
Disallow: /auth/
Disallow: /operate/
Disallow: /admin/
Disallow: /api/

Sitemap: https://myuno.app/sitemap.xml
```

### 36.8 · Performance for SEO

- LCP < 2.5s (Core Web Vitals)
- CLS < 0.1
- INP < 200ms
- Mobile-first indexing — perfect mobile UX

### 36.9 · Content strategy

Knowledge Hub `/guides`:
- 16 categories × 5–15 articles each = ~150 articles target
- Original content, not copy-paste
- Author byline (real people)
- Update dates
- Internal linking strategy

### 36.10 · Sharing

OG image template (1200×630):
```
[myUNO logo top-left]
[Title — large Source Serif 4]
[Subtitle — Geist muted]
[Cluster color bar bottom]
```

Auto-generated per page based on title + cluster.

---

## 37 · Support · SOS

### 37.1 · Support tiers

| Tier | Channel | Response time | Use |
|---|---|---|---|
| **Self-service** | `/help` (Knowledge Hub guides) | Instant | FAQs, how-to |
| **Chat support** | In-app messaging → support thread | < 4h business hours | Account, billing, technical |
| **Email** | hello@myuno.app | < 24h | Detailed issues |
| **Phone** | +66 81 234 5678 | Business hours | Emergencies, mandates |
| **SOS** | `/sos` modal → WhatsApp + SMS | < 90 sec | Emergencies only |
| **Capital advisory** | dedicated thread | < 2h | HNW mandates |

### 37.2 · `/help` Knowledge Hub

См. §36.9. Structured guides:
- Search
- Categories (visas, taxes, property, payments, accounts)
- Article template (problem → solution → next steps)
- «Was this helpful?» feedback
- «Still need help?» → Chat support

### 37.3 · In-app chat support

```
[Avatar] myUNO support
─────────────────────────
[Customer message]

       [Support reply]
[Customer reply]
       [Support reply]

[Type message...]
[Send]
```

Thread context: linked to user account, recent orders, current screen. Support agent sees these in admin canvas.

### 37.4 · SOS — Emergency

**Trigger.** SOS FAB visible always (bottom nav row или persistent FAB).

**Modal `/sos`:**
```
┌──────────────────────────┐
│ SOS                  ✕   │
├──────────────────────────┤
│ ⚠ Critical situation?    │
│                          │
│ [🚑 Medical]              │
│ Bangkok Hospital ER       │
│ +66 76 254 425           │
│ [Call now]                │
│                          │
│ [👮 Police]               │
│ Tourist Police 1155       │
│ [Call now]                │
│                          │
│ [⚖ Legal emergency]      │
│ Siam Legal partner        │
│ [Call now]                │
│                          │
│ [📍 Share location]       │
│ WhatsApp Pavel            │
└──────────────────────────┘
```

**Mechanics:**
- Tap «Call» → native phone app opens
- Tap «Share location» → WhatsApp deep link с pre-filled message + location
- Audit logged
- Admin Telegram notified (Pavel + on-call)

### 37.5 · SOS workflow (admin)

When SOS triggered:
1. Telegram alert to admin group instantly
2. Admin acks within 2 min
3. Admin opens user context in /admin
4. Admin may call user directly
5. Resolution logged

### 37.6 · Support metrics

- First response time (target < 4h for chat)
- Resolution time (target < 24h for tier 2)
- CSAT score (post-resolution survey)
- Ticket volume by category
- Self-service deflection rate

### 37.7 · After-hours

Outside business hours (Phuket 9:00–18:00 ICT):
- Email queue (response next day)
- Chat auto-responder
- SOS always-on (Pavel + 1 on-call)

### 37.8 · Escalation

```
Chat agent → Senior support → Pavel
         ↓
     Capital → Pavel directly
         ↓
     SOS → Pavel + on-call immediate
```

### 37.9 · Disclaimers

Support не предоставляет:
- Юридические советы (направляем к licensed lawyer)
- Tax советы (направляем к Mazars / Big4)
- Medical советы (только emergency contacts)
- Investment советы (направляем к Capital advisory)

### 37.10 · Voice

Support voice = brand voice (см. §04) с акцентом на Quiet Care. Empathetic, конкретный, не извиняющийся pre-emptively.

```
✅ «Понял проблему. Проверяю платёж. Отвечу в течение часа.»
❌ «К сожалению, мы должны выразить сожаление по поводу проблемы…»
```

### 37.11 · Support templates

Stored in admin tool. RU + EN. Updated quarterly. Common ones:
- Payment failed
- Booking cancellation
- KYC rejected
- Provider unresponsive
- Refund processed
- Account locked

---

## 38 · Версии

### 38.1 · Семвер для Design Bible

```
v{MAJOR}.{MINOR}.{PATCH}

MAJOR — breaking changes (color tokens removed, foundation overhaul)
MINOR — new sections, new patterns, new components
PATCH — clarifications, examples added, typos
```

### 38.2 · История версий

| Version | Date | Author | Summary |
|---|---|---|---|
| **v2.0** | 2026-05-14 | Claude (под Pavel) | Полная reorganization в 40 разделов. Связка с PROJECT.md + ARCHITECTURE_V2 + DESIGN.md. Single source of truth для UI/UX. |
| v1.5 | 2026-04-22 | Pavel + CTO | Architecture Overview added (canonical/architecture/OVERVIEW.md). |
| v1.4 | 2026-04-18 | Pavel + Claude | DESIGN.md formalized DS 2.1. Golos → Source Serif 4 transition. |
| v1.3 | 2026-04-17 | Team configurator | AI Team Configuration added в CLAUDE.md. |
| v1.2 | 2026-04 | Pavel | Master Taxonomy v1.0 (10 JTBD clusters, 25 personas). |
| v1.1 | 2026-03 | Pavel | Cluster system locked (6 colour-locked clusters). |
| v1.0 | 2026-02 | Pavel | First canonical 05-visual-design-system.md. |

### 38.3 · App version

Текущая app version: **3.55.3** (`src/lib/appVersion.ts`).

App version tracked в:
- `src/lib/appVersion.ts`
- `<meta name="version">` в HTML
- `public/version.json`
- Cache busting автоматический

App version изменяется при release. Design Bible — независимо.

### 38.4 · DS токен версии

| Token spec | Version | Status |
|---|---|---|
| `src/styles/tokens.css` (runtime) | DS 2.1 | ✅ Active source of truth |
| `src/design-system/tokens.json` | DS 2.0 Navy Premium | ⛔ Deprecated, not implemented |
| `DESIGN.md` | DS 2.1 doc | ✅ Active spec |
| `docs/canonical/05-visual-design-system.md` | v1.0 | ⚠️ Older spec (cream/navy/orange paradigm) — historical |

При расхождении доверяем `tokens.css`.

### 38.5 · Когда bump-ить Design Bible

| Изменение | Bump |
|---|---|
| Typo, мелкая правка | PATCH |
| Новый раздел добавлен | MINOR |
| Новый паттерн в Patterns | MINOR |
| Новый компонент описан | MINOR |
| Цвет cluster изменён | MAJOR |
| Шрифт canonical заменён | MAJOR |
| Token система реорганизована | MAJOR |
| Структура разделов изменена | MAJOR |

### 38.6 · Migration notes

**v1.x → v2.0:**
- Структура разделов реорганизована в 40-section format.
- Объединили DESIGN.md, canonical/05-visual-design-system.md, canonical/architecture/* в одну точку входа.
- Шрифты обновлены: Golos / DM Sans / Playfair → Source Serif 4 / Geist / IBM Plex Mono / Cormorant.
- Cluster colors остались immutable.
- Cream/navy/orange paradigm из canonical/05 — переведена в legacy. Runtime токены `tokens.css` — source of truth.

### 38.7 · Compatibility window

Когда DS bump-ится MAJOR:
1. Pavel approves в Pavel review.
2. New version published в Bible.
3. Old version archived в `docs/archive/DESIGN_BIBLE-v{X}.md`.
4. Migration guide published (как часть Bible).
5. Code migration window: 30 days (хардкоды старых токенов помечаются deprecated).
6. После 30 days — lint fails на старые токены.

---

## 39 · Decision log

> ADRs (Architecture Decision Records) в кратком формате. Каждое решение — необратимое и нужно вспомнить «почему?».

### Format

```
## ADR-{N} · {Title}
**Date:** YYYY-MM-DD
**Status:** Active | Superseded | Deprecated
**Context:** что породило вопрос
**Decision:** что решили
**Consequences:** что это влечёт
**Alternatives:** что отвергли и почему
```

### ADR-001 · Dark mode is default
**Date:** 2026-04-18
**Status:** Active
**Context:** В фин-приложениях с большими сессиями (Owner timeline, Wallet, Investor DD) длительная работа на белом фоне утомляет. Категория (fintech, dashboards) ожидает dark.
**Decision:** Dark mode default. Light mode опционален (`html.light`). Background `#08101E`, primary mint `#00D68F`.
**Consequences:** Все компоненты проектируются dark-first. Light mode требует тестирования на каждом PR. Email шаблоны remain light (стандарт email).
**Alternatives:** Light default (отвергли — категория и аудитория).

### ADR-002 · Source Serif 4 replaces Golos as display
**Date:** 2026-05-01 (Bible v2.0)
**Status:** Active
**Context:** Golos Text был выбран ради Cyrillic distinction, но в DS 2.1 нужен шрифт с лучшим cross-language consistency, выраженным serif character (anti-startup signal), и subtle warmth. Source Serif 4 — Adobe-open, отличные Cyrillic + Latin glyphs, optical sizing.
**Decision:** Source Serif 4 для display/headings. Geist для body/UI (was DM Sans). IBM Plex Mono для numerics (was JetBrains Mono).
**Consequences:** Production update в `tokens.css` + `tailwind.config.ts` + `index.html` preconnect. Old fonts not removed from Google Fonts immediately (legacy users).
**Alternatives:** Stick with Golos (was good but less «editorial»). Inter (too startup-default).

### ADR-003 · 6 cluster colors immutable
**Date:** 2026-04-18
**Status:** Active
**Context:** 40+ микро-приложений — без визуальной системы «карты города» юзер не запомнит структуру.
**Decision:** 6 colour-locked clusters. Каждый цвет immutable. Никаких 7-х кластеров без архитектурного review.
**Consequences:** Spatial memory works. Дисциплина в коде (нельзя contaminating). Limit для новых вертикалей — должны вписаться в один из 6.
**Alternatives:** Один brand color (отвергли — нет spatial differentiation). Free cluster colors (отвергли — chaos).

### ADR-004 · No top-level routes
**Date:** 2026-04-22
**Status:** Active
**Context:** Lovable/Claude добавляли `/stays`, `/peylaa`, `/nomad`, `/expat` — ad-hoc top-level routes без системы.
**Decision:** All new routes must go under `/discover/cluster/:id`, `/app/:cluster/:vertical`, `/operate/*`. Hard rule.
**Consequences:** Cleaner URL structure. Better SEO (predictable). Legacy routes redirect to new structure.
**Alternatives:** Free routing (отвергли — chaos).

### ADR-005 · Single shell — MiniAppLayout + Operate
**Date:** 2026-04-22
**Status:** Active
**Context:** 11+ shells в коде (AppLayout, MiniAppLayout, mc/*, owner-portal, developer-portal, guest, nomad, expat, peylaa, landing/*). Maintenance hell.
**Decision:** Collapse в 1 consumer shell (MiniAppLayout) + 1 partner shell (Operate). Variant prop для контекста.
**Consequences:** Reduced complexity. Easier theme work. Need migration of existing shells.
**Alternatives:** Per-vertical shells (отвергли — duplication).

### ADR-006 · AI agents produce intents, never auto-execute money
**Date:** 2026-04-22
**Status:** Active
**Context:** AI должен быть active partner, не пассивный chat. Но money — high stakes.
**Decision:** AI agents emit intents → user one-tap accept/later. Никогда auto-execute money moves.
**Consequences:** User stays в control. Trust preserved. AI value capped (но это правильно).
**Alternatives:** Full automation (отвергли — trust risk).

### ADR-007 · Trust is UI, not footer
**Date:** 2026-04-18
**Status:** Active
**Context:** Trust signals часто хоронили в footer disclaimers. Users не видят.
**Decision:** Audit markers (tx_id, ledger_id, timestamp) inline on money screens. Verified badges inline на providers. ClearView grade prominent.
**Consequences:** Every money screen carries audit marker visible. Visual noise tax — accept.
**Alternatives:** Footer disclaimers (отвергли — invisible).

### ADR-008 · Bilingual native, not translated
**Date:** 2026-04-18
**Status:** Active
**Context:** Russian-speaking primary audience. English secondary. Тайский для context.
**Decision:** RU + EN equal status. Parity rule (every string must exist in both). Translations — параллельный голос, не word-for-word.
**Consequences:** Translation overhead на каждом PR. CI check. Worth it: feels native, not foreign.
**Alternatives:** EN-only with translation layer (отвергли — feels foreign for primary audience).

### ADR-009 · Mobile-first, не desktop-then-shrink
**Date:** 2026-04-18
**Status:** Active
**Context:** 80% использования на мобиле. Phuket — mobile-first market.
**Decision:** Все экраны проектируются от 375px. Desktop — progressive enhancement.
**Consequences:** Sometimes desktop feels under-utilized. Acceptable trade-off.
**Alternatives:** Desktop-first responsive (отвергли — mobile UX страдает).

### ADR-010 · Capacitor for native, не React Native
**Date:** 2026-03
**Status:** Active
**Context:** Need iOS + Android apps. Decide native stack.
**Decision:** Capacitor (PWA wrapper). Same React codebase.
**Consequences:** Easier maintenance (one codebase). Some native perf trade-offs. Acceptable for SuperApp use case.
**Alternatives:** React Native (отвергли — 2 codebases, perf gain не worth maintenance).

### ADR-011 · Supabase as primary backend
**Date:** 2026-02
**Status:** Active
**Context:** Need full backend: auth + DB + storage + functions.
**Decision:** Supabase. PostgreSQL + Edge Functions (Deno 2.0) + Storage + Auth + Realtime.
**Consequences:** Vendor lock-in. Cost scales with usage. Benefit: rapid dev.
**Alternatives:** Custom (отвергли — слишком медленно). Firebase (отвергли — NoSQL не fits domain).

### ADR-012 · Stripe is primary payments
**Date:** 2026-02
**Status:** Active
**Context:** Need card payments, subscriptions, marketplace splits.
**Decision:** Stripe (Checkout + Connect + Subscriptions). PromptPay через Stripe.
**Consequences:** 2.9% + fixed fee. Excellent DX. Some Thai-specific gaps (e.g., true local rails).
**Alternatives:** Omise (тайский, отвергли — слабее DX). Custom (отвергли).

### ADR-013 · Single notification router
**Date:** 2026-04-22
**Status:** Active
**Context:** Per-feature notifications wiring был fragmented.
**Decision:** Single notification router subscribed to event bus. Fan-out to channels.
**Consequences:** Cleaner code, easier per-user prefs. Edge fn `notify` handles all.
**Alternatives:** Per-feature (отвергли — fragmented).

### ADR-014 · ClearView grades stay AAA → BB
**Date:** 2026-03
**Status:** Active
**Context:** Need rating scale for off-plan.
**Decision:** AAA, AA, A, BBB, BB (5 grades). Inspired by S&P/Moody's.
**Consequences:** Familiar to investors. Disciplined methodology (8 categories).
**Alternatives:** 1–5 stars (отвергли — feels consumer, not financial). Custom scale (отвергли — confusion).

### ADR-015 · 7 roles in stack, weighted
**Date:** 2026-04-22
**Status:** Active
**Context:** One person ≠ one role. Owner can also be Investor, Tourist seasonally.
**Decision:** Roles stack jsonb. Multi-select. Weighted ranking equation.
**Consequences:** Home feed personalized. Operate shell context-aware.
**Alternatives:** Single role (отвергли — too rigid).

### ADR-016 · Russian primary, английский parity
**Date:** 2026-02
**Status:** Active
**Context:** Audience primary RU, but international expansion planned.
**Decision:** RU + EN both first-class. RU default for ru-* browsers.
**Consequences:** Translation overhead. Better international reach later.
**Alternatives:** RU-only (отвергли — caps audience).

### ADR-017 · `public` schema only — no v2 schema
**Date:** 2026-04
**Status:** Active
**Context:** Старая дока упоминала `v2` schema. Не существует.
**Decision:** All tables в `public`. Никаких `supabase.schema('v2')`.
**Consequences:** Clarity. RLS rules consistent.
**Alternatives:** v2 schema (отвергли — never implemented).

### ADR-018 · Feature flags на каждой новой фиче
**Date:** 2026-04-22
**Status:** Active
**Context:** Release управление, A/B testing.
**Decision:** Each new feature gated `feature_flag:*` в `system_settings`. Until GA.
**Consequences:** Slower initial rollout. Safer launches.
**Alternatives:** Direct release (отвергли — risk).

### ADR-019 · Source Serif 4 + Geist + IBM Plex Mono finalized
**Date:** 2026-05-01
**Status:** Active
**Context:** Multiple font specs drifted между tokens.json (Syne), tokens.css (Golos), legacy docs.
**Decision:** Source Serif 4 (display), Geist (body/UI), IBM Plex Mono (numerics), Cormorant Garamond (luxury only).
**Consequences:** Legacy refs to Golos/DM Sans/Playfair/JetBrains marked stale. Code update single-PR.
**Alternatives:** Keep Golos legacy (отвергли — superseded).

### ADR-020 · Design Bible v2.0 as single entry point
**Date:** 2026-05-14
**Status:** Active
**Context:** Design знание разбросано по DESIGN.md, canonical/05, architecture/*, CLAUDE.md.
**Decision:** Design Bible v2.0 в `docs/DESIGN_BIBLE.md` — единая точка входа. Связывает все sources.
**Consequences:** New section structure (40 sections). Other docs become detail references. AI agents read Bible first.
**Alternatives:** Multiple docs (statu quo, отвергли — fragmented).

---

## 40 · Roadmap

### 40.1 · Short-term (Q2 2026)

**Дизайн.**
- [ ] Полная migration шрифтов на Source Serif 4 + Geist + IBM Plex Mono
- [ ] Component library audit — все компоненты в DS 2.1
- [ ] Dark mode A11y audit (contrast ratios)
- [ ] Empty / loading / error states audit (каждый screen)

**Архитектура.**
- [ ] M5 — UX-обвязка detection (preview/apply UI для AI agents)
- [ ] Operate consolidation (collapse `/mc`, `/owner-portal`, `/developer-portal` → `/operate/*`)
- [ ] `/discover` redesign (cluster-first, не category-first)

**Фичи.**
- [ ] ClearView v2 (расширенные методология, public dashboard)
- [ ] Visa Guardian agent → production
- [ ] Maintenance Triage agent → production
- [ ] Owner Timeline в production (currently MVP)

### 40.2 · Mid-term (Q3 2026)

**Дизайн.**
- [ ] Design tokens DS 3.0 candidate review
- [ ] Brand photography session (Pavel + designer)
- [ ] Custom illustrations для empty states
- [ ] Print/PDF templates v2 (statements, contracts)

**Архитектура.**
- [ ] M6 — Cross-domain SSO + субдомены
- [ ] M7 — Production hardening
- [ ] Capital advisory CRM (`capital.myuno.app`) launch
- [ ] Developer Portal v2 (`developers.myuno.app`)

**Фичи.**
- [ ] Capital mandate flow end-to-end
- [ ] Investor DD pack auto-generation
- [ ] Yield Optimiser agent
- [ ] Pipeline Nudger agent

### 40.3 · Long-term (Q4 2026 — Q1 2027)

**Расширение.**
- [ ] Chinese language support (zh-CN)
- [ ] Bangkok geography expansion
- [ ] B2B white-label (`pro.myuno.app`)
- [ ] Press kit (`brand.myuno.app`)
- [ ] Public docs API (`docs.myuno.app`)

**Дизайн.**
- [ ] Native iOS app design pass (Capacitor)
- [ ] Native Android app design pass
- [ ] Tablet-optimized layouts
- [ ] Email design system v2 (transactional + marketing)

### 40.4 · Open questions для Pavel

1. ❓ Когда переходить с test Stripe → live Stripe? (currently test)
2. ❓ Сохранить ли DM Sans в fallback или удалить полностью?
3. ❓ Когда планируется TAT license submission?
4. ❓ Public ClearView v1 launch date — целевая?
5. ❓ White-label pricing model (`pro.myuno.app`)?

### 40.5 · Backlog (no commitment)

- AR property tour (Capacitor + native plugin)
- Voice search в `/discover` (whisper API)
- Telegram mini-app version
- WhatsApp business chatbot deep integration
- Crypto payment option (TBD on regulatory)
- Co-living matching service
- Marketplace для used furniture (`/app/live/secondhand`)
- Pet adoption directory (`/app/live/pets/adopt`)

### 40.6 · Не делаем (заведомо)

- ❌ Social network features (follows, likes, public feeds)
- ❌ Free tier для providers (always take rate)
- ❌ Direct competition с Booking/Airbnb (мы дополняем)
- ❌ Generic chatbot replacing humans
- ❌ Crypto / NFT property tokenization (no regulatory clarity)
- ❌ В обход Stripe (gray-market processors)

---

## Conclusion

> **myUNO Design Bible v2.0** — это контракт между всеми, кто работает над продуктом. Дизайнерами, инженерами, AI-ассистентами, партнёрами, основателем.
>
> **При расхождении кода с Bible — правится код.**
> **При устаревании Bible — отдельный PR в Bible с ADR.**
> **При вопросе «как делать?» — ответ здесь, либо ADR требуется.**
>
> Этот документ — живой. Каждый месяц минимум 1 PR с уточнениями. Каждый release со значимыми UI changes — minor bump.
>
> Уважение к этому документу = уважение к пользователям, которые в три часа ночи в Bang Tao доверяют myUNO продлить визу или провести ฿2M через wallet.

---

**v2.0 · MAY 2026 · Pavel Ignatev**
**Maintained by:** Pavel + Design Bible AI team
**Last sync:** 2026-05-14
**Source:** `docs/DESIGN_BIBLE.md`
**License:** Internal — myUNO / Ignatev Group only.








