# Navigation Map — myUNO (v1.0)

> Канонический контракт для NavShell, BottomBar, SideRail, TopBar и хлебных крошек.
> Источник истины для дизайна и разработки навигации. Версия: 2026-04-28.
>
> При расхождении кода и этого документа — правится код. При смене бизнес-структуры
> — сначала PR в этот документ, потом изменения в `src/lib/nav/navigationModel.ts`.

---

## 1. Маппинг ролей: бизнес ↔ технические

В коде используется 7 `NavRoleKey`. Сводим к 6 пользовательским ролям:

| Бизнес-роль | NavRoleKey                  | Шелл                          | Кто это                                     |
|-------------|------------------------------|-------------------------------|---------------------------------------------|
| **Guest**   | `guest` (анон)               | Consumer                      | Не залогинен, публичные страницы            |
| **User**    | `guest` (auth) / `investor`  | Consumer                      | Залогинен как покупатель/инвестор/жилец     |
| **Partner** | `vendor`                     | Workspace                     | Поставщик услуг, девелопер, агент           |
| **Owner**   | `owner` + `mc_portal`        | Workspace + Consumer-portal   | Собственник / УК                            |
| **Staff**   | `team`                       | Workspace lite (TeamLayout)   | Сотрудник myUNO (контент, модерация)        |
| **Admin**   | `admin`                      | Workspace                     | Платформенный админ                         |

**Правила переключения:**

- Anon → User: появляются `/me/*`, Wallet, Bookings, Favorites.
- User с `roles_stack` содержит `vendor | owner | admin | team` → в `UserAvatarMenu` появляется switcher «Перейти в рабочее пространство».
- Workspace = другой шелл (SideRail), не подменяет публичный сайт.
- Единственная точка переключения роли — `UserAvatarMenu`. Никаких кнопок «стать продавцом» в обычном меню.

---

## 2. Три уровня навигации (общий контракт)

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

| Слой       | Когда виден                                           | Источник                 |
|------------|-------------------------------------------------------|--------------------------|
| TopBar     | Всегда, кроме fullscreen-роутов                       | `TopBar.tsx`             |
| BottomBar  | Mobile, всегда (кроме fullscreen)                     | `BOTTOM_BAR_BY_ROLE`     |
| Top-pills  | ≥md, consumer роли                                    | `BOTTOM_BAR_BY_ROLE`     |
| SideRail   | ≥md, только workspace роли                            | `SIDEBAR_NAV[role]`      |
| Breadcrumbs| ≥md, depth ≥ 2                                        | `routeMeta` + `APP_ROUTES` |
| BackButton | Mobile, depth ≥ 2 в том же модуле                     | `useNavigationDirection` |

Fullscreen-префиксы (без шелла): `/auth`, `/checkout`, `/cart`, любые wizards.

---

## 3. Карта навигации по ролям

### 3.1 Guest (анонимный)

**BottomBar / Top-pills (5):**

| Слот       | Путь          | Что внутри                                               |
|------------|---------------|----------------------------------------------------------|
| Главная    | `/`           | Hero с 3 дверями (Investor / Relocator / Second-home)    |
| Поиск      | `/search`     | Глобальный ⌘K, выдача по 21+ таблице                    |
| Каталог    | `/discover`   | Surfaces (Arrive/Live/Manage/Invest/Legal/Build)         |
| Избранное  | `/favorites`  | localStorage до логина                                   |
| Войти      | `/auth`       | После выбора `/auth/account-type`                        |

**Header right:** «Войти / Регистрация».
**SideRail:** нет.
**Breadcrumbs:** только на детальных карточках, `Главная › Раздел › Объект`.

---

### 3.2 User (залогинен, потребитель)

**BottomBar (5):**

| Слот     | Путь        | Что внутри                                                         |
|----------|-------------|--------------------------------------------------------------------|
| Главная  | `/`         | Лента + AI Concierge                                               |
| Поиск    | `/search`   | Глобальный ⌘K                                                     |
| Услуги   | `/discover` | Каталог Surfaces                                                   |
| Мой кабинет | `/me`    | Госуслуги-style hub                                                |
| Профиль  | `/profile`  | Личные данные, настройки, выход                                    |

**Header right:** уведомления (`/notifications`), Wallet (значок), аватар с меню.

**`/me` Hub (6 слотов внутри):**

| Слот               | Путь              | Что внутри                                            |
|--------------------|-------------------|-------------------------------------------------------|
| Лента              | `/me`             | Активные задачи, рекомендации AI                      |
| Мои услуги         | `/me/services`    | Подписки, активные брони, ClearView отчёты            |
| Документы          | `/me/documents`   | Визы, договоры, инвойсы, паспорта семьи               |
| Платежи            | `/me/payments`    | Wallet, история, карты, рефанды                       |
| Заявки             | `/me/requests`    | Viewing requests, leads, support tickets              |
| Бронирования       | `/me/bookings`    | Все брони (тур, авто, ресторан, апартаменты)          |

**Куда ведут разделы каталога (Surfaces):**

| Surface  | Путь          | Содержимое                                              |
|----------|---------------|---------------------------------------------------------|
| Arrive   | `/arrive`     | Transfer, SIM, Exchange, Visa-on-arrival                |
| Live     | `/discover`   | Restaurants, Beauty, Fitness, Medical, Pets, Education  |
| Invest   | `/invest`     | Investment Hub + Real Estate (Buy/Rent/Newbuilds)       |
| Legal    | `/stay-legal` | Visa, Tax, Contracts, Insurance                         |
| Manage   | `/property`   | История заездов, договор аренды (для арендаторов)       |
| Build    | `/newbuilds`  | Каталог новостроек, ClearView, девелоперы               |

**SideRail:** нет.
**Breadcrumbs:** `Главная › Каталог › Beauty › Salon "X"` или `/me › Документы › Виза 2026`.

---

### 3.3 Partner (vendor / agent / developer)

**Шелл:** Workspace (`/vendor/*`).

**BottomBar (5):** Dashboard · Bookings · Services · Payouts · Profile.

**SideRail (3 группы):**

| Группа       | Пункты                                                            |
|--------------|-------------------------------------------------------------------|
| Main         | Dashboard `/vendor` · Bookings · Services · Products · Locations  |
| Performance  | Analytics · Payouts · Messages                                    |
| Settings     | Settings                                                          |

**Onboarding (без шелла, fullscreen-фуннел):**
`/vendor/join` → `/vendor/onboarding` → `/vendor` (после approve).

**Куда ведут ключевые экраны:**

| Экран       | Что показывает                                                  |
|-------------|------------------------------------------------------------------|
| Dashboard   | KPI (revenue 30d, conversion, rating), Top 5 Now                 |
| Bookings    | Kanban (new/confirmed/done/disputed) + детальная сделка          |
| Services    | Каталог листингов, редактор (3 фото, RU+EN, THB)                 |
| Products    | Товары для маркета                                               |
| Locations   | Точки оказания услуг на карте                                    |
| Analytics   | Воронка, retention, источники трафика                            |
| Payouts     | Расчёты, Stripe Connect, ledger marker                           |
| Messages    | Чат с клиентами + AI moderation                                  |

**Breadcrumbs:** `Vendor › Bookings › #ORD-123 › Refund`.

---

### 3.4 Owner (собственник / УК)

Две подроли — два шелла. Switcher в `UserAvatarMenu`: «Director Mode» ↔ «Owner Portal».

#### 3.4.a MC Director (`owner` NavRoleKey, Workspace, `/mc/*`)

**BottomBar (5):** Dashboard · Properties · Calendar · Finance · Messages.

**SideRail (6 групп):**

| Группа              | Пункты                                                                                  |
|---------------------|-----------------------------------------------------------------------------------------|
| Control Tower       | Dashboard `/mc` · Bookings · Calendar · Tasks · Messages                                |
| Properties          | Properties · Performance · Reviews                                                      |
| Operations          | Rates & Channels · Inventory · Insurance & Docs · Templates                             |
| Finance             | Finance Hub · Invoices & AR · Management Terms                                          |
| CRM & Sales         | CRM Dashboard · Contacts · Owners · Vendor Acquisition                                  |
| Team & Settings     | Staff & Access · Settings · Help Center                                                 |

**Persona-фильтр** (`getOwnerSidebarForRole`):

- `general` + ≤1 объект → нет CRM/Operations(полная)/Staff/Approvals.
- `sales_agent` → нет Operations и Finance.
- `service_provider` → нет CRM & Sales и Finance.
- `property_manager`/`director` → видит всё.

**Breadcrumbs:** `MC › Properties › "Villa A" › Calendar`.

#### 3.4.b Property Owner Portal (`mc_portal`, Consumer-portal, `/my-property/*`)

Read-only портал для собственников, чьи объекты ведёт MC.

**BottomBar (5):** My Properties · Statements · Documents · Messages · Me.
**SideRail:** нет.
**Breadcrumbs:** `/my-property › Statements › Q1 2026`.

---

### 3.5 Staff (`team`, сотрудники myUNO)

**Шелл:** Workspace lite (TeamLayout + TeamSidebar, без глобального SideRail).

**BottomBar (5):** Dashboard · Content · Moderation · CRM · Profile.

**Группы в TeamSidebar:**

| Группа     | Пункты                                                            |
|------------|-------------------------------------------------------------------|
| Work       | Dashboard `/team` · Content `/team/content` · Leaderboard         |
| Comms      | Team Chat                                                         |
| Moderation | Очередь Catalog & Reviews                                         |

**Куда ведут:**

| Экран       | Что показывает                                                       |
|-------------|----------------------------------------------------------------------|
| Content Hub | Статьи Knowledge, переводы RU/EN, semantic-валидация                 |
| Moderation  | Pending listings/reviews/vendors, бейдж `pendingContent`             |
| CRM         | Read-only доступ к контактам и сделкам (без денежных операций)       |
| Leaderboard | KPI команды, скорость публикаций                                     |

**Breadcrumbs:** `Team › Content › Pillar "Visa" › Article`.

---

### 3.6 Admin

**Шелл:** Workspace (`/admin/*`).

**BottomBar (5):** Dashboard · CRM · Tickets · Moderation · Profile.

**SideRail (3 группы):**

| Группа              | Пункты                                                                 |
|---------------------|------------------------------------------------------------------------|
| Platform            | Add · Dashboard · Catalog & Content · Operations · CRM · Partners      |
| Finance & Analytics | Finance · Analytics                                                    |
| System              | LifeOS · New Developments · Users & Access · System Settings           |

**Куда ведут:**

| Экран             | Что показывает                                          |
|-------------------|---------------------------------------------------------|
| `/admin/add`      | Универсальная точка добавления сущностей                |
| Operations        | Заказы, рефанды, споры                                  |
| Finance           | Ledger, reconciliation alerts, payouts                  |
| Analytics         | Платформенные KPI                                       |
| Users & Access    | RBAC, role assignments                                  |
| Newbuilds         | Модерация ClearView, девелоперов, проектов              |
| LifeOS            | Конфиг рекомендательного движка                         |
| System Settings   | Feature flags, system_settings, admin contacts          |

**Breadcrumbs:** `Admin › Catalog › Vendors › "Acme" › Verification`.

---

## 4. Хлебные крошки — универсальные правила

1. На L1 (Surface root) — крошек нет, только H1.
2. На L2+ — `Surface › Раздел › ... › Текущий` (текущий не кликается).
3. Workspace роли: первый узел = роль (`MC` / `Vendor` / `Admin` / `Team`).
4. На детальных модальных шагах (checkout, wizard) — крошки скрыты, показан `StepByStepNav`.
5. Локализация — `i18n/uiStrings.ts`, ключи `nav.crumb.*`.

---

## 5. Видимость навигации

| Контекст                          | TopBar | BottomBar | SideRail |
|-----------------------------------|:------:|:---------:|:--------:|
| `/auth/*`, `/checkout`, `/cart`   |   −    |     −     |    −     |
| Wizards (`/onboarding`, `/sell`)  |  лого  |     −     |    −     |
| Workspace operational routes      |   ✓    |     ✓     |    ✓     |
| Consumer routes                   |   ✓    |     ✓     |    −     |

Зашито в `NavShell` через `FULLSCREEN_PREFIXES` и `hasSidebar()`.

---

## 6. Текущее состояние и gap-list

**Уже реализовано:**

- 7 NavRoleKey, `BOTTOM_BAR_BY_ROLE`, OWNER/ADMIN/VENDOR sidebars.
- `NavShell` с двумя режимами (consumer/workspace).
- `useNavigationDirection`, `BackButton`, `UserAvatarMenu` switcher.
- `APP_ROUTES` SSOT, `routeMeta.ts` (customer vs workspace).
- Persona-фильтр для Owner sidebar.

**Gap (отдельные задачи):**

1. **Breadcrumbs** — нет единого компонента. → ввести `<Breadcrumbs source="route-meta" />` в TopBar.
2. **Top-pills (≥md) для consumer ролей** — сейчас только bottom-bar. → добавить `<TopPills />` в TopBar.
3. **`/me` Hub** — есть, но 6 слотов не унифицированы под общий BottomBar контракт.
4. **User vs Guest BottomBar** — оба используют `GUEST_NAV`. → завести `USER_NAV` со слотом `/me`.
5. **Owner switcher** — есть, но без явных лейблов «Director Mode / Owner Portal».
6. **Smoke-тесты в `src/test/layout/`** — по одному на каждую из 6 ролей.

Каждый шаг — отдельный merge под merge-gate (a) tech debt + (h) Hub page.
