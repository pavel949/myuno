

# Аудит платформы myUNO — архитектура, маршруты, дублирования

## Что проверено
- 90 директорий страниц, ~498 page-компонентов, ~1055 компонентов
- Главный роутер `AnimatedRoutes.tsx` — **590 `<Route>` и 89 `<Navigate>` редиректов** в одном файле (927 строк)
- Реестр маршрутов `src/lib/config/routes.ts` (648 строк)
- Админка (`src/pages/admin` — 73 страницы), MC-воркспейс (`src/pages/owner` — 84 страницы), Capital CRM, Vendor, Team, Staff, Developer Portal, Owner Portal
- Hub-страницы: `Index`, `Discover`, `/me`, `/account`, `/property`

---

## 1. Архитектура «по-человечески»

Платформа — **большой React SPA-монолит** на Vite + Supabase, организованный по **вертикалям** (40+ ниш: транспорт, рестораны, ютехи, недвижимость, юристы, цветы, фитнес, образование и т.п.). Каждая вертикаль = папка в `src/pages/<vertical>/` + index/detail/booking страницы + админ-страница.

Поверх вертикалей — **6 «оболочек» (shells)**, каждая со своим layout и guard:

| Shell | Аудитория | Базовый путь | Layout |
|---|---|---|---|
| Consumer (без shell) | Турист / Резидент / Инвестор | `/`, `/discover`, `/me`, всё B2C | `AppLayout` |
| Guest | Гость на заселении | `/my-stay`, `/guest/*` | `GuestLayout` |
| Vendor | Поставщик услуг | `/vendor/*` | `VendorLayout` |
| MC (Management Company) | Управляющая компания | `/mc/*` | `MCLayout` |
| Owner Portal | Собственник объекта (read-only) | `/my-property/*` | inline |
| Capital CRM | Внутр. отдел продаж недвижимости | `/capital/*` | `CapitalLayout` |
| Admin | Платформа | `/admin/*` | `AdminLayout` |
| Team / Staff | Сотрудники UNO | `/team/*`, `/staff/*` | `TeamLayout` / `StaffLayout` |
| Developer Portal | Девелоперы новостроек | `/developer-portal/*` | свой |

**Маховик платформы (по PROJECT.md):** ТУРИСТ → АРЕНДАТОР → ПОКУПАТЕЛЬ → СОБСТВЕННИК → РЕФЕРРЕР. Главный денежный KPI — GMV сделок с недвижимостью; остальные вертикали — прогрев.

**Логика навигации:**
- Гость попадает на `WelcomeLanding` (маркетинг), авторизованный — на `Index` (task-first home с persona-aware блоками)
- `/discover` — визуальный «Life Hub» с 17 жизненными ситуациями (`/life/:code`)
- Таксономия объединена в `src/lib/catalog/taxonomy.ts` (6 кластеров × 16 категорий) — это уже хорошо
- CRM — **в каждой MC-компании свой** (под `/mc/*`), **+ глобальный admin-CRM** (`/admin/crm`), **+ Capital CRM** (`/capital/*`) для отдела недвижимости

---

## 2. Что сейчас работает хорошо

- ✅ Канонический реестр маршрутов `APP_ROUTES` — все ключевые пути типизированы
- ✅ Property Hub унифицирован под `/property/*` (legacy `/offplan`, `/developers`, `/complexes` редиректят)
- ✅ Catalog SSOT (`taxonomy.ts`) — единый источник для cluster→category→service
- ✅ Lazy-loading через `pageRegistry.ts`
- ✅ Multi-role система с гардами (`AdminGuard`, `MCGuard`, `VendorGuard`, `MCPortalGuard`, `CapitalGuard`, `TeamGuard`, `StaffGuard`)
- ✅ MC-воркспейс глубокий: PMS, календарь, CRM, финансы, документы, команда — единая «Founder Mode»

---

## 3. Дублирования и нарушения логики (критика)

### 3.1. **Три параллельных «личных кабинета» пользователя**
- `/profile` (+ `/profile/edit`, `/profile/settings`, `/profile/personal-details`, `/profile/notifications`, `/profile/referral`)
- `/account` (`UserAccountDashboard`)
- `/me` (`/me`, `/me/services`, `/me/documents`, `/me/payments`, `/me/requests`, `/me/profile`)

Три разных хаба для одного и того же пользователя. Никакой UX-логики «в каком случае куда» — пользователь и команда путаются.

### 3.2. **CRM растащен на три места**
- `/admin/crm` — глобальный CRM (вендоры, юзеры, собственники, аутрич)
- `/mc/contacts`, `/mc/sales`, `/mc/crm-dashboard`, `/mc/sequences`, `/mc/quotes`, `/mc/automations` — полный CRM внутри MC (это де-факто дубль HubSpot/Bitrix внутри воркспейса УК)
- `/capital/contacts`, `/capital/pipeline`, `/capital/outreach`, `/capital/templates` — CRM Capital для сделок недвижимости

`AdminCRM` и `Capital*` пересекаются по сущностям (контакты, аутрич, кампании). Внутри MC — ещё один полноценный CRM. Логика: **кто реально владеет «золотым» контактом — не определено в коде**.

### 3.3. **Лишние/мёртвые страницы**
- `StartOnboarding` **+** `StartOnboardingV2` (V2 параллельно — V1 не выпилен)
- `Discover` **+** `PlatformCatalog` **+** `/categories` (редирект на discover) — три точки доступа к каталогу
- `LifeFlowPage` доступен через `/life-flow/:code` **и** `/life/:code` — два пути для одного компонента
- `OwnerDashboard` используется как `/mc/` index **и** как лэндинг-плейсхолдер
- `MarketCheckout`, `FlowersOrder`, `EventBooking`, `TableReservation`, `TransportBooking` — 5 разных чекаутов, хотя в RE-Audit зафиксировано: «Order-First pattern» обязателен (см. memory `architecture/booking-engine-unification`)
- `Bookings`, `Cart`, `Wallet`, `MePayments`, `Wallet/history` — оплата/история в 4 местах
- 4 «лэндинга»: `RelocateLandingPage`, `WeddingLandingPage`, `KidsLandingPage`, `NomadGuidePage` — статичные одиночки без общей системы (vs. `landings/PersonaLandingPage` + `ClusterLandingPage`, которые уже шаблонизированы)

### 3.4. **Маршрутные сбои**
- `AnimatedRoutes.tsx` = **927 строк, 590 Route, 89 Navigate** — это уже не роутер, это блобище. Сломать сортировку → catch-all `/property/:id` съест соседние пути (уже есть комментарий «must be last»)
- **Runtime-ошибка прямо сейчас:** «Failed to fetch dynamically imported module: PropertyIndex.tsx, RestaurantsIndex.tsx, ExperiencesIndex.tsx, BeautySpaIndex.tsx» — `prefetchRoutes()` импортирует страницы при idle, и для невалидного кеша падает (баг сборки/HMR, мешает навигации с `/property/browse`)
- `/airport-transfer`, `/transport/airport`, `/airport`, `/transfers` → 4 пути ведут на одну страницу
- `/peylaa/unit/:unitNo` всегда редиректит на `/peylaa` — мёртвая глубокая ссылка
- `/admin/pitch-deck`, `/admin/investor-demo`, `/admin/leads`, `/admin/moderation`, `/admin/marketplace/*` — 7 admin-путей редиректят, потому что страницы удалили, но из навигации не везде убрали
- `/owner/*` целиком редиректит на `/mc/*`, но в коде ещё много мест ссылается на `/owner/*` (legacy ссылки в письмах, старых компонентах)
- `INVEST_QUIZ` редиректит на `/invest`, но всё ещё экспортируется в APP_ROUTES — в нав. ссылках кладёт «мёртвый» пункт

### 3.5. **Каких пользовательских страниц явно НЕ хватает**
- **`/me/bookings`** — единый список заказов/бронирований по всем вертикалям (сейчас `Bookings` есть, но не интегрирован в `/me`-shell, ломает паттерн «госуслуги»)
- **Public Owner Profile** (`/owner/:id` для гостя) — гость не может посмотреть, кто хост
- **Public MC Profile** есть (`/company/:slug`), но нет агрегации «все объекты этой УК на витрине»
- **Persona Switcher** в шапке — данные о роли есть (`useUserPersonas`), но переключателя для пользователя с несколькими ролями (Турист+Собственник) нет
- **«Мои документы» edge-cases**: `/me/documents` есть, но связки «виза + страховка + договор аренды + договор купли-продажи» в одном месте — нет
- **Order Tracking** есть только `/orders/:id/tracking`, но нет `/orders` (общего списка)
- **Public ClearView Reports** — `/property/clearview` лэндинг есть, но нет публичной библиотеки выпущенных ClearView-сертификатов (моат №8 по PROJECT.md, должен быть «витриной»)
- **Investor Onboarding flow** — `/invest/quiz` редиректит на `/invest`, реального квиза нет, хотя инвестор — самый ценный сегмент
- **«Моя недвижимость для гостя»** — единый dashboard «вы остановились здесь, вот гид + чат + сервисы» — частично есть в `/my-stay`, но не связан с Welcome Flow
- **Lifecycle e-mail/web статусы** — пользователю не показывается «вы получили рассылку → ответ → след. шаг» (есть только в админ-stack)
- **Settings privacy/cookies/data export (GDPR)** — не нашёл единой точки

### 3.6. **Админ — overgrown (73 страницы под `/admin/*`)**
Каждая вертикаль имеет свою админку: `AdminYachts`, `AdminBabysitters`, `AdminPets`, `AdminGyms`, `AdminFlowers`, `AdminPharmacies`, `AdminStores`, `AdminCleaning`, `AdminEducation`, `AdminEvents`, `AdminExperiences`, `AdminLegal`, `AdminInsurance`, `AdminTransfers`, `AdminVehicles`, `AdminWaterActivities`, `AdminClinics`, `AdminSalons`, `AdminRestaurants`, `AdminProperties`, `AdminProjects`, `AdminInvestments`, `AdminDevelopers`, `AdminNewbuilds`, `AdminPMCompanies`, `AdminMCDashboard`...

**Каждая — почти одинаковый CRUD.** Уже есть `AdminUnifiedCatalog` и `AdminQuickListings` — но 25+ старых страниц не выпилены. На уровне UX админу нужно помнить, в какую из 25 кнопок жать.

Дополнительно в `AdminCRM` параметр `vendorView` (pipeline/table/stats) дублирует то, что уже есть в `AdminVendorProspects`, `VendorProspectsPipeline`, `VendorProspectsTable`, `VendorProspectsStats` — **4 компонента + общая страница для одного use-case**.

### 3.7. **Users & Access — слишком плоско**
`/admin/users` = `AdminUsersAccess` с двумя табами: Users + RBAC. Нет:
- сегментации (Тур/Резидент/Соб/Инв) на уровне списка
- фильтра «активность за 7/30 дней»
- экспорта в CSV
- impersonation-кнопки рядом с юзером (хотя `ImpersonationContext` есть)
- связки «юзер ↔ его CRM-контакт ↔ его сделки»

---

## 4. Что упростить и улучшить (приоритет)

### P0 — Срочно (ломает UX/трафик)
1. **Починить `prefetchRoutes()` в `AnimatedRoutes.tsx`** — runtime-ошибка убивает SPA-навигацию (4 динамических импорта падают, видно прямо сейчас в консоли превью)
2. **Унифицировать «личный кабинет»**: оставить `/me` как канонический, `/profile` и `/account` → редирект на `/me/*`. Один URL = одна страница
3. **Унифицировать чекаут**: один `/checkout/:orderId` через Order-First pattern для всех вертикалей. 5 параллельных flow → 1
4. **Решить судьбу CRM**: либо MC CRM = full-featured (a-la HubSpot для УК), и тогда admin/CRM = только meta-аналитика; либо обратное. **Сейчас три CRM = три источника правды о контакте**

### P1 — Архитектурный долг
5. **Разрезать `AnimatedRoutes.tsx` (927 строк)** на feature-routers: `<PropertyRoutes />`, `<MCRoutes />`, `<AdminRoutes />`, `<InvestRoutes />`, `<UserRoutes />`. Сейчас один файл = bottleneck для merge-конфликтов и багов сортировки роутов
6. **Сократить admin до 6–8 «hub» страниц**: Catalog (всё под одним), Users, Finance, Operations, CRM, Settings, Content, AI. Вертикальные admin-CRUD удалить или вынести как табы внутри Catalog (в Lovable memory `architecture/canonical-catalog-and-card-standard` это уже стандарт)
7. **Удалить `StartOnboardingV2` или `StartOnboarding`** (одна должна остаться)
8. **Удалить дубль маршрутов**: `/life-flow/:code` ИЛИ `/life/:code`, `/airport-transfer` ИЛИ `/transport/airport-transfer`, `/sell` ИЛИ `/classifieds/sell`, `/categories` ИЛИ `/discover`
9. **Снести `INVEST_QUIZ` или сделать реальный квиз** (моат + первая точка для инвестора)

### P2 — Недостающие пользовательские страницы
10. `/me/bookings` — единый список «всё, что я заказывал» (объединить `/bookings` + `/orders` + history по вертикалям)
11. `/orders` — список заказов
12. Persona Switcher в шапке (для multi-role: «вижу как Турист / как Собственник»)
13. `/clearview/library` — публичная витрина ClearView-сертификатов (это моат, его нужно показывать)
14. Real `/invest/quiz` (3 шага: бюджет / горизонт / тип) → результат → калькулятор → лид в Capital CRM
15. `/my-stay` интегрировать в `/me/feed` для гостей с активным бронированием
16. `/me/legal` — единая папка «виза + договор + insurance + tax filings»

### P3 — Улучшения
17. В `/admin/users` добавить: сегмент-фильтр, активность, impersonate-кнопку, ссылку на CRM-контакт
18. Lifecycle/messaging — показать пользователю, какие письма ему ушли (`/me/messages`)
19. Outreach в одном месте: `Capital → outreach`, `Admin → CRM → outreach`, `MC → automations` → один движок, три view
20. Sitemap.xml перегенерить (есть только sitemap-landings.xml + sitemap-pillars.xml, не покрывает 90% реально живых пагин)

---

## 5. Резюме одной фразой

Платформа технически богата (498 страниц, 7 shell-ов, 6 ролей) и стратегически правильно сориентирована на real-estate-маховик, но **структурно перегружена дублями** (3 личных кабинета, 3 CRM, 5 чекаутов, 73 admin-страницы, 1 файл с 590 роутами). Главный риск — не «не хватает фич», а **пользователь не понимает, какой из трёх «своих» URL — настоящий**. Команда не может уверенно сказать, где живёт «золотой» контакт.

**Если выбрать одно действие на следующую неделю** — починить prefetch (P0), удалить `StartOnboardingV2` + дубли роутов (P1, 1 час), и принять решение «один личный кабинет = `/me`» с миграцией `/profile` и `/account` → редирект (P0, полдня). Это снимет 60% UX-непонятности без переписывания.

