
## Цель

Единая, читаемая карта навигации под 6 пользовательских ролей. Документ становится контрактом для NavShell, BottomBar, SideRail, TopBar и хлебных крошек. Никакой код в этом плане не правится — это спецификация. После approve можно отдельными задачами приводить `navigationModel.ts` и компоненты в соответствие.

## 1. Маппинг ролей: бизнес ↔ технические

В коде сейчас 7 `NavRoleKey`. Сводим к 6 пользовательским ролям:

| Бизнес-роль | NavRoleKey (код)            | Шелл           | Кто это                                  |
|-------------|------------------------------|----------------|------------------------------------------|
| Guest       | `guest` (анон)               | Consumer       | Не залогинен, публичные страницы         |
| User        | `guest` (auth) / `investor`  | Consumer       | Залогинен как покупатель/инвестор/жилец  |
| Partner     | `vendor`                     | Workspace      | Поставщик услуг, девелопер, агент        |
| Owner       | `owner` + `mc_portal`        | Workspace + Consumer-portal | Собственник / УК           |
| Staff       | `team`                       | Workspace lite | Сотрудник myUNO (контент, модерация)     |
| Admin       | `admin`                      | Workspace      | Платформенный админ                      |

Правила переключения:
- Anon → User: появляются `/me/*`, Wallet, Bookings, Favorites.
- User с `roles_stack` содержит `vendor|owner|admin|team` → в `UserAvatarMenu` появляется switcher «Перейти в рабочее пространство».
- Workspace = другой шелл (SideRail), не подменяет публичный сайт.

## 2. Три уровня навигации (для всех ролей одинаково)

```text
┌──────────────────────────────────────────────────────────┐
│ TopBar: лого · breadcrumbs · ⌘K поиск · уведомления · 👤 │
├──────────────────────────────────────────────────────────┤
│ SideRail (только workspace) │  Контент                   │
│  · группы по доменам        │  · H1 + breadcrumbs        │
│  · бейджи (tasks/messages)  │  · экран                   │
├──────────────────────────────────────────────────────────┤
│ BottomBar: 5 слотов под роль (мобайл) / Top-pills (≥md)  │
└──────────────────────────────────────────────────────────┘
```

- **TopBar**: всегда виден. Лого слева, breadcrumbs (только ≥md), ⌘K поиск (центр), bell + аватар (право).
- **BottomBar/Top-pills**: ровно 5 слотов на роль. Источник — `BOTTOM_BAR_BY_ROLE`.
- **SideRail**: только workspace роли (Partner/Owner/Staff/Admin). Сворачивается в иконки.
- **Breadcrumbs**: `Surface › Раздел › Подраздел › Сущность`. Кликабельны до текущего узла.
- **BackButton**: только на детальных страницах (depth ≥ 2 в том же модуле). Логика — `useNavigationDirection`.

## 3. Карта навигации по ролям

### 3.1 GUEST (анон)

**BottomBar / Top-pills (5):** Главная · Поиск · Каталог · Избранное · Войти

**Header right:** «Войти / Регистрация».

**Куда ведут:**
- Главная `/` — hero с 3 дверями (Investor / Relocator / Second-home), полосы по JTBD.
- Поиск `/search` — глобальный ⌘K, выдача по 21+ таблице.
- Каталог: единая точка входа в Surfaces (Arrive/Live/Manage/Invest/Legal/Build).
- Избранное `/favorites` — локально (localStorage) до логина.
- Войти `/auth` → после `/auth/account-type` (выбор сегмента).

**SideRail:** нет.
**Breadcrumbs:** только на детальных карточках, `Главная › Раздел › Объект`.

### 3.2 USER (залогинен, потребитель)

**BottomBar (5):** Главная · Поиск · Услуги · `/me` · Профиль

**Header right:** уведомления, Wallet (значок), аватар.

**Главные «дома» (через `/me` Hub, как Госуслуги):**
| Слот /me        | Что внутри                                                   |
|-----------------|--------------------------------------------------------------|
| `/me`           | Лента: активные задачи, рекомендации AI Concierge            |
| `/me/services`  | Мои подписки/услуги, активные брони, ClearView отчёты        |
| `/me/documents` | Визы, договоры, инвойсы, паспорта семьи                      |
| `/me/payments`  | Wallet, история, карты, рефанды                              |
| `/me/requests`  | Заявки в CRM (viewing requests, leads, support tickets)      |
| `/me/bookings`  | Все бронирования (тур, авто, ресторан, апартаменты)          |

**Куда ведут разделы каталога (Surfaces):**
- Arrive (`/arrive`) → Transfer, SIM, Exchange, Visa-on-arrival.
- Live (`/discover`) → Restaurants, Beauty, Fitness, Medical, Pets, Education, Services.
- Invest (`/invest`) → Investment Hub + Real Estate (Buy/Rent/Newbuilds).
- Legal (`/stay-legal`) → Visa, Tax, Contracts, Insurance.
- Manage (`/property` для арендаторов) → история заездов, договор аренды.
- Build (`/newbuilds`) → каталог новостроек, ClearView, devs.

**SideRail:** нет.

**Breadcrumbs пример:**
`Главная › Каталог › Beauty › Salon "X"` или `/me › Документы › Виза 2026`.

### 3.3 PARTNER (vendor / agent / developer)

**Шелл:** Workspace (`/vendor/*`).
**BottomBar (5):** Dashboard · Bookings · Services · Payouts · Profile.

**SideRail (3 группы):**
- **Main**: Dashboard `/vendor` · Bookings · Services · Products · Locations.
- **Performance**: Analytics · Payouts · Messages.
- **Settings**: Settings.

**Onboarding-фуннел (отдельный, без шелла):**
`/vendor/join` → `/vendor/onboarding` → `/vendor` (после approve).

**Breadcrumbs:** `Vendor › Bookings › #ORD-123 › Refund`.

**Куда ведут ключевые экраны:**
- Dashboard — KPI (revenue 30d, conversion, rating), Top 5 Now.
- Bookings — Kanban (new/confirmed/done/disputed) + детальная сделка.
- Services/Products — каталог + редактор листинга (3 фото, RU+EN, THB).
- Payouts — расчёты, Stripe Connect, ledger marker.
- Messages — чат с клиентами + AI moderation.

### 3.4 OWNER (собственник / УК)

Две подроли — два шелла:

**(a) MC Director (`owner` NavRoleKey, шелл Workspace, `/mc/*`):**

BottomBar (5): Dashboard · Properties · Calendar · Finance · Messages.

SideRail (6 групп, как в `OWNER_SIDEBAR`):
- **Control Tower**: Dashboard · Bookings · Calendar · Tasks · Messages.
- **Properties**: Properties · Performance · Reviews.
- **Operations**: Rates & Channels · Inventory · Insurance · Templates.
- **Finance**: Finance Hub · Invoices · Management Terms.
- **CRM & Sales**: CRM Dashboard · Contacts · Owners · Vendor Acquisition.
- **Team & Settings**: Staff · Settings · Help.

Persona-фильтр (см. `getOwnerSidebarForRole`): single-property owner видит обрезанный набор без CRM/Staff.

**(b) Property Owner Portal (`mc_portal`, шелл Consumer, `/my-property/*`):**

BottomBar (5): My Properties · Statements · Documents · Messages · Me.

Это read-only портал для собственников, чьи объекты ведёт MC. Никакого SideRail.

**Switcher:** в `UserAvatarMenu` пункты «Director Mode» ↔ «Owner Portal» при наличии обеих ролей.

**Breadcrumbs:** `MC › Properties › "Villa A" › Calendar` или `/my-property › Statements › Q1 2026`.

### 3.5 STAFF (`team`, сотрудники myUNO)

**Шелл:** Workspace lite (TeamLayout + TeamSidebar, без глобального SideRail).
**BottomBar (5):** Dashboard · Content · Moderation · CRM · Profile.

**Группы в TeamSidebar:**
- **Work**: Dashboard `/team` · Content `/team/content` · Leaderboard.
- **Comms**: Team Chat.
- **Moderation**: очередь Catalog & Reviews.

**Куда ведут:**
- Content Hub — статьи (Knowledge), переводы RU/EN, semantic-валидация.
- Moderation — pending listings/reviews/vendors, бейдж `pendingContent`.
- CRM — read-only доступ к контактам и сделкам (без денежных операций).

**Breadcrumbs:** `Team › Content › Pillar "Visa" › Article`.

### 3.6 ADMIN

**Шелл:** Workspace (`/admin/*`).
**BottomBar (5):** Dashboard · CRM · Tickets · Moderation · Profile.

**SideRail (3 группы):**
- **Platform**: Add · Dashboard · Catalog & Content · Operations · CRM · Partners.
- **Finance & Analytics**: Finance · Analytics.
- **System**: LifeOS · New Developments · Users & Access · Settings.

**Куда ведут:**
- `/admin/add` — универсальная точка добавления сущностей.
- `/admin/operations` — заказы, рефанды, споры.
- `/admin/finance` — ledger, reconciliation alerts, payouts.
- `/admin/users` — RBAC, role assignments.
- `/admin/newbuilds` — модерация ClearView, девелоперов, проектов.

**Breadcrumbs:** `Admin › Catalog › Vendors › "Acme" › Verification`.

## 4. Поведение хлебных крошек (универсальные правила)

1. На L1 (Surface root) — крошек нет, только H1.
2. На L2+ — `Surface › Раздел › ... › Текущий` (текущий не кликается).
3. Workspace роли: первый узел = роль (`MC` / `Vendor` / `Admin` / `Team`).
4. На детальных модальных шагах (checkout, wizard) — крошки скрыты, показан StepByStepNav.
5. Локализация — `i18n/uiStrings.ts`, ключи `nav.crumb.*`.

## 5. Где навигация **скрыта**

| Контекст                          | TopBar | BottomBar | SideRail |
|-----------------------------------|:------:|:---------:|:--------:|
| `/auth/*`, `/checkout`, `/cart`   |   −    |     −     |    −     |
| Wizards (`/onboarding`, `/sell`)  |  лого  |     −     |    −     |
| Workspace operational routes      |   ✓    |     ✓     |    ✓     |
| Consumer routes                   |   ✓    |     ✓     |    −     |

Уже зашито в `NavShell` через `FULLSCREEN_PREFIXES` и `hasSidebar()`.

## 6. Что из этого уже есть, а что — gap

**Есть:**
- 7 NavRoleKey, BOTTOM_BAR_BY_ROLE, OWNER/ADMIN/VENDOR sidebars, NavShell с двумя режимами.
- `useNavigationDirection`, `BackButton`, `UserAvatarMenu` switcher.
- `APP_ROUTES` SSOT, `routeMeta.ts` (customer vs workspace).

**Gap (фиксим отдельной задачей после approve):**
1. Нет единого компонента **Breadcrumbs** на уровне NavShell — генерится точечно. → ввести `<Breadcrumbs source="route-meta" />` в TopBar.
2. На consumer routes top-pills (≥md) не показываются — есть только bottom-bar. → добавить `<TopPills />` в TopBar для guest/user.
3. `/me` Hub есть, но 6 слотов не унифицированы как BottomBar — есть отдельный MeShell. → выровнять под общий контракт.
4. Нет визуальной разницы Guest vs User в BottomBar — оба используют `GUEST_NAV`. → User должен получать слот `/me` вместо `/account`.
5. Owner switcher (Director ↔ Owner Portal) в `UserAvatarMenu` есть, но без явных лейблов — добавить.

## 7. Что делать после approve

В режиме build:
1. Документ `docs/NAVIGATION_MAP.md` с таблицами выше (источник истины для дизайнера).
2. Добавить в `navigationModel.ts` константу `USER_NAV` (отдельно от `GUEST_NAV`) и переключение в `resolveNavRole`.
3. Внедрить общий `<Breadcrumbs />` в `TopBar` на основе `routeMeta` + `APP_ROUTES`.
4. Добавить `<TopPills />` (≥md) для consumer ролей.
5. Smoke-тесты в `src/test/layout/` — по одному на каждую из 6 ролей: проверка количества слотов, наличия sidebar, видимости back/breadcrumbs.

Каждый шаг — отдельный merge, под merge-gate (a) tech debt + (h) Hub page.
