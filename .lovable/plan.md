

# Аудит блока «Управление недвижимостью» (MC / Owner Workspace)

Аудит проведён по `/mc/*` и `/owner/*` маршрутам, навигационной модели (`OWNER_SIDEBAR`), дашборду, CRM, финансам, бронированиям, календарю и фильтрам списка объектов.

## 1. Карта рабочего пространства — что реально есть

**В `routes.ts` зарегистрировано 70+ MC-маршрутов**, в `pages/owner/` — **80+ страниц**, в `pages/mc/` — **8** (большинство «MC-функций» физически живёт в `pages/owner/`). Это уже сигнал: MC и Owner не разделены архитектурно, только URL-префиксом.

В сайдбаре `OWNER_SIDEBAR` 9 групп / 41 пункт:
Control Tower (5) · Insights (3) · Properties (3) · Operations (4) · Distribution (1) · Finance (10) · CRM & Sales (8) · Team (6) · Developer (3).

## 2. Что дублируется (требует слияния)

### 2.1 Финансы — 10 пунктов в одной группе, перекрывают друг друга
| Пункт | Дублирует |
|---|---|
| `MC_FINANCE` (Overview) и `MC_FINANCIALS` (Transactions) | оба показывают KPI + ссылки на транзакции; `FinanceOverview` уже включает `quickLinks → /mc/financials` |
| `MC_REPORTS`, `MC_BUDGET`, `MC_FINANCE_PLANNING` | три отдельных страницы аналитики/планирования при одной БД `property_financials` |
| `MC_INVOICES` и `MC_AR_AGING` | дебиторка = неоплаченные инвойсы — это вкладки одной сущности |
| `MC_OWNER_PAYOUTS` и `MC_STATEMENT_APPROVALS` | оба про owner-statement цикл |

**Действие:** свести в 1 экран `/mc/finance` с табами **Overview · Transactions · Invoices & AR · Owner Payouts · Reports · Planning**. `MC_FINANCIALS`, `MC_AR_AGING`, `MC_STATEMENT_APPROVALS`, `MC_FINANCE_PLANNING` — оставить как deep-link редиректы для совместимости.

### 2.2 CRM — Dashboard уже дублирует 8 нижестоящих пунктов
`CrmDashboardPage` в нижнем блоке «CRM Tools» уже рендерит сетку с Email, Templates, Web Forms, Meetings, Companies, Duplicates, Assignment. Эти же ссылки повторно выведены отдельными пунктами в сайдбаре (`Sequences`, `Quotes`, `Pipelines`, `Sales Pipeline`).

«Pipelines» (`MC_PIPELINES`) и «Sales Pipeline» (`MC_SALES`) — фактически одна Kanban; `CrmDashboardPage` уже встраивает `KanbanBoard` с переключателем pipeline.

**Действие:** в сайдбаре оставить только `CRM Dashboard · Contacts · Owners · Vendor Acquisition`. Tools (sequences, quotes, templates, web forms, meetings, companies, duplicates, assignment) — оставить как сетку внутри CRM Dashboard. `MC_PIPELINES` ⇒ удалить из nav (доступ через переключатель внутри dashboard).

### 2.3 Дашборд — 50 виджетов на одну страницу
`OwnerDashboard.tsx` импортирует **47 виджетов**. В `components/owner/dashboard/index.ts` явно отмечено:

```ts
// Legacy blocks (keeping for backwards compatibility)
export { TodayBlock, MoneyBlock, PropertiesBlock, RisksBlock, ActivityBlock, BookingsSection, MessagesBlock };
// New Airbnb-style sections
export { QuickActionsBar, PropertyHeroCard, OperationsSection, FinancesSummary, CommunicationsSection, PortfolioSection };
// Airbnb-clarity redesign
export { OwnerPropertiesList, OwnerOperationsFlat, OwnerDashboardMenu };
```

Это **3 поколения** виджетов одновременно в кодовой базе. Legacy + Airbnb-style + Airbnb-clarity overlap по функциональности (Today/MorningBriefing/TodayActions/TodayBriefing — четыре виджета одного концепта; Properties/PropertiesBlock/OwnerPropertiesList/PortfolioSection/PortfolioHealth/PropertyPriority — шесть про портфель).

**Действие:** удалить `Legacy blocks` (TodayBlock, MoneyBlock, PropertiesBlock, RisksBlock, ActivityBlock, BookingsSection, MessagesBlock — 7 файлов) и `Airbnb-style sections` (OperationsSection, FinancesSummary, CommunicationsSection, PortfolioSection, PropertyHeroCard — 5 файлов), оставить «Airbnb-clarity redesign» как канон. Дашборд-виджеты для Today слить в один `MorningBriefing` (он самый полный).

### 2.4 Bookings vs Calendar
`MCBookingsPage` (`/mc/bookings-list`, 461 строка) и `OwnerCalendar` (`/mc/calendar`) — две точки входа к одним и тем же `usePropertyBookings`. `MC_BOOKINGS` уже помечен `@deprecated` в `routes.ts`, но активно используется.

**Действие:** Calendar = таб «Calendar» внутри Bookings; bookings-list = таб «List». Один URL `/mc/bookings` с `?view=list|calendar|timeline`.

### 2.5 Settings разрезаны по 4 местам
`MCSettingsPage` (accordion с 6 секциями) + `MCSubscriptionPage` (`/mc/subscription`) + `OwnerAccountSettings` (`/mc/account-settings`) + `OwnerPortalSettingsPage` (`/mc/properties/:id/portal-settings`).

**Действие:** Subscription и Account Settings — секции в `MCSettingsPage`. Portal Settings остаётся per-property (правильно).

### 2.6 Контакты — Owners vs Contacts vs Companies
`MC_CONTACTS` (`ContactsList`), `MC_OWNERS` (`OwnerOwnersPage`), `MC_VENDORS` (`VendorDirectoryPage`), `/mc/companies` (`CrmCompaniesPage`) — все хранятся в `crm_contacts` с разным `contact_type`. Это уже отражено в `canonicalModel.ts` (`InventoryChainRole` vs `TransactionPartyRole`).

**Действие:** один экран `/mc/contacts` с табами **All · Owners · Buyers/Tenants · Vendors · Companies** + сохранёнными фильтрами. Не плодить 4 разных страницы с одинаковой сеткой `ContactCard`.

## 3. Что избыточно (можно сократить без потерь)

| Удалить / схлопнуть | Обоснование |
|---|---|
| `Distribution` группа из 1 пункта (`Channel Manager`) | Перенести в Operations |
| `Developer` группа в сайдбаре | API Keys / Webhooks — это Settings → Developer tab, не топ-уровень |
| `MC_PROJECTS` (отдельный пункт) + `MC_COMPLEXES` отсутствует в сайдбаре | Объединить как «Properties → Structure» (комплексы и проекты как иерархия) |
| `OwnerSetupWizard` (отдельная страница) и `MC_ONBOARDING_WIZARD` | Один онбординг-флоу, не два |
| `MessageTemplates` (`/owner/...`) и `CrmTemplatesPage` (`/mc/crm-templates`) | Шаблоны = одна сущность; раздельные экраны для CRM/PMS-шаблонов нужны как табы, не как страницы |
| `OwnerRevenueDashboard`, `OwnerPerformance`, `OwnerTrendsAndTips`, `OwnerTransparencyDashboard`, `SalesAnalytics` | 5 «аналитических» страниц при одном источнике данных. Слить в `MC_PERFORMANCE` с подвкладками |
| `OwnerFinancialForm`, `QuickIncome`, `QuickExpense`, `OwnerFinancials` | 4 точки ввода транзакций — оставить QuickIncome/QuickExpense как Sheet-модалы, открываемые из `OwnerFinancials` |

## 4. Что не работает / подозрительно

1. **`/mc/automations`** — кнопка из `CrmDashboardPage` (line 282) ведёт на маршрут, которого нет в `routes.ts` → 404. Должно быть `/mc/settings?tab=automation` (где живёт `AutomationRulesBuilder`).
2. **`/mc/forms`** (Web Forms, line 284) — нет в `APP_ROUTES`, но есть `CrmWebFormsPage`. Хардкод пути в обход `APP_ROUTES.*` — нарушение Core rule «zero-hardcoded routes».
3. **`MC_BOOKINGS` помечен deprecated**, но в навигации используется `MC_BOOKINGS_LIST` — ссылка `/mc/bookings` после редиректа в адресной строке остаётся `/mc/bookings-list`, что ломает active-state в bottom-nav.
4. **`OwnerProperties` фильтры** — `selectedAssetClass` фильтр читает поле `asset_class` через `(p as { asset_class?: string })`, при этом `useMyProperties` (UnifiedProperty) этот столбец не выбирает. Фильтр всегда падает в `'residential'` дефолт → реально не фильтрует.
5. **`OwnerProperties` map view** — в режиме `map` рендерятся только `activeProperties`, но bulk-actions (`Select all`) и `inactiveProperties` секция исчезают без объяснения.
6. **`OwnerProperties` чипы фильтров типа** — `propertyTypes` это сырые строки из БД (`apartment`, `villa` и т.д.), без локализации. RU-юзер видит английские технические значения.
7. **`OwnerProperties` сложные кнопки** — комментарий на line 364 «full-width primary on small screens — avoids flex-1 + nowrap clipping» намекает на исторический баг; четыре кнопки в строке (Add/Import/Select/View toggle) на 384px не помещаются нормально.
8. **`OwnerCalendar`** — `useState` инициализируется через `window.innerWidth` без guard для SSR/первого рендера → может быть несинхрон с реальным viewport (мобильный → desktop переход).
9. **`MCBookingsPage`** не использует `PageContainer` / `PageHeader` (в отличие от `OwnerProperties`, `FinanceOverview`) → разный chrome на соседних страницах.
10. **`CrmDashboardPage`** — `agentFilter` хардкодит дефолт `'all'`, но `DealSearchBar` принимает `dealVipFilter`, `contactVipFilter`, `activePreset` пустыми no-op коллбеками — мёртвые элементы UI.
11. **MCGuard** требует `activeCompany`, но `CapitalGuard` не делает ничего, кроме проверки `user`. CRM-страницы лежат под MCGuard → owner без company не видит CRM, хотя сайдбар-пункт «CRM Dashboard» виден из NavShell.

## 5. Чего не хватает (критические gaps)

1. **Единый поиск по workspace** — нет cmd+K на MC-уровне. `MCCommandPalette.tsx` существует, но не подключён к layout.
2. **Inbox / Messages** — `MC_MESSAGES` есть в nav, `OwnerMessages` страница есть, `UnifiedInboxWidget` на дашборде есть, но **нет связи между inquiry чатами, booking чатами и WhatsApp ленd-сообщениями**. Три разных потока, три виджета.
3. **Property Detail** — есть `MC_PROPERTY_DETAIL`, `MC_PROPERTY_EDIT`, `MC_PROPERTY_MANAGE`, `MC_PROPERTY_SETUP`, `MC_PROPERTY_GUIDEBOOK`, `MC_PROPERTY_PORTAL` — **6 разных URL для одного объекта** без единого таб-shell. Юзер теряется при переходах.
4. **Bulk operations доступны только в Properties** — нет в Bookings, Contacts, Financials.
5. **Сохранённые фильтры (Saved Views)** отсутствуют. Каждый раз заново выбирать комплекс/тип/период.
6. **Empty states** не унифицированы — где-то Card с иконкой, где-то текст в `text-muted-foreground`.
7. **Mobile bottom-actions для bulk** — на мобиле в `OwnerProperties` bulk-bar может перекрываться `BottomBar` (60px), хотя `--bottom-nav-h` уже введён, в `OwnerProperties` он не используется.
8. **Owner ↔ MC role split** — `useBusinessRole` и `BusinessRoleSwitcher` есть, но сайдбар (`OWNER_SIDEBAR`) одинаковый для всех ролей. Single owner с 1 объектом видит те же 41 пункт, что MC с 100 объектами.

## 6. Рекомендованный план рефакторинга (атомарные шаги)

1. **Nav consolidation**: ужать `OWNER_SIDEBAR` с 41 → ~20 пунктов согласно §2-3, с redirect-маршрутами для старых URL.
2. **Dashboard cleanup**: удалить Legacy + Airbnb-style блоки (12 файлов), оставить Airbnb-clarity. Свести Today-виджеты в один `MorningBriefing`.
3. **CRM tools fix**: исправить хардкод `/mc/automations`, `/mc/forms`, `/mc/companies` через `APP_ROUTES.*`. Удалить мёртвые props в `DealSearchBar`.
4. **Property filters fix**: либо подтянуть `asset_class` в `useMyProperties` SELECT, либо убрать фильтр. Локализовать `propertyTypes` через таксономии из `src/lib/taxonomies/`.
5. **Bookings unification**: один экран `/mc/bookings` с `view=list|calendar|timeline`. `MCBookingsPage` обернуть в `PageContainer`.
6. **Property workspace shell**: ввести `<PropertyTabsLayout>` поверх 6 sub-маршрутов property — единый header + табы Detail/Editor/Manage/Setup/Guidebook/Portal.
7. **Settings consolidation**: Subscription и Account Settings — секции `MCSettingsPage`.
8. **Role-aware sidebar**: фильтровать `OWNER_SIDEBAR` по `useBusinessRole()` (single-owner / mc-staff / director) аналогично уже сделанному фильтру кластеров.
9. **Подключить `MCCommandPalette`** к `MCLayout` через cmd+K.
10. **Saved Views** для Properties / Bookings / Contacts (отдельная задача после §1-9).

## 7. Технические заметки

- Источники истины уже консолидированы (`properties` SSOT, `crm_contacts`, `property_financials`) — рефакторинг чисто на UI-слое, без миграций БД.
- Все redirect-маршруты делаем через React Router `<Navigate replace>` в `App.tsx`, не через серверные редиректы.
- Удаление виджетов проверять через `git grep` по имени экспорта — некоторые могут импортироваться из неожиданных мест (например, `OverviewSection` использует старые Airbnb-style блоки).
- Тесты: добавить unit-тесты на `OWNER_SIDEBAR` (визибилити по роли) аналогично уже существующим для `clusterCatalog`.

## 8. Приоритетный порядок

**P0 (баги):** §4.1, §4.2, §4.4, §4.7 — ломают навигацию или фильтры.
**P1 (UX-долг):** §2.3 (dashboard cleanup), §2.4 (bookings union), §2.6 (contacts union).
**P2 (структурный):** §2.1 (finance tabs), §6.6 (property shell), §6.8 (role-aware sidebar).
**P3 (фичи):** §5.1, §5.5, §5.7.

Начать с P0 + §6.1 (nav consolidation) — даёт максимальный визуальный эффект для пользователя и расчищает базу для последующих шагов.

