# Детальный аудит блока УК (Management Company / MC)

**Дата:** 2026-03-04

## 1. Архитектура и границы

- **Вход:** `MCGuard` — проверяет авторизацию, наличие хотя бы одной УК у пользователя; при отсутствии редирект на `/mc/onboarding`.
- **Лейаут:** `MCLayout` (сайдбар `MCSidebar`, шапка `MCHeader`, мобильное меню `MCMobileNav`).
- **Контекст:** `ActiveCompanyProvider` — выбор активной УК, хранение в localStorage, инвалидация кэша React Query при смене компании.
- **Маршруты:** вложенные под `<Route path="/mc">` в `AnimatedRoutes.tsx`; все страницы подгружаются через `pageRegistry` (lazy).

---

## 2. Маршруты и ссылки

### 2.1 Соответствие сайдбара и роутов

Все пункты меню `MCSidebar` имеют соответствующий `Route` в `AnimatedRoutes`:

| Сайдбар path | Route | Страница |
|--------------|--------|----------|
| `/mc` | index | OwnerDashboard |
| `/mc/modules` | modules | OwnerModulesPage |
| `/mc/properties` | properties | OwnerProperties |
| `/mc/calendar` | calendar | OwnerCalendar |
| `/mc/messages` | messages | OwnerMessages |
| `/mc/guide` | guide | OwnerGuidePage |
| `/mc/crm-dashboard` | crm-dashboard | CrmDashboardPage |
| `/mc/owners` | owners | OwnerOwnersPage |
| `/mc/contacts` | contacts | ContactsList |
| `/mc/sales` | sales | SalesPipeline |
| `/mc/sequences` | sequences | CrmSequencesPage |
| `/mc/quotes` | quotes | CrmQuotesPage |
| `/mc/reviews-management` | reviews-management | ReviewsManagementPage |
| `/mc/marketing` | marketing | MarketingHubPage |
| `/mc/tasks` | tasks | CrmTasksPage |
| `/mc/rates` | rates | RateManagementPage |
| `/mc/channels` | channels | ChannelManager |
| `/mc/inventory` | inventory | InventoryPage |
| `/mc/vendors` | vendors | VendorDirectoryPage |
| `/mc/insurance` | insurance | DocumentsInsurancePage |
| `/mc/documents` | documents | DocumentTemplatesPage |
| `/mc/finance` | finance | FinanceOverview |
| `/mc/management-terms` | management-terms | ManagementPortfolio |
| `/mc/financials` | financials | OwnerFinancials |
| `/mc/reports` | reports | ReportsPage |
| `/mc/budget` | budget | BudgetPage |
| `/mc/invoices` | invoices | InvoicesPage |
| `/mc/staff` | staff | StaffPage |
| `/mc/subscription` | subscription | MCSubscriptionPage |
| `/mc/help` | help | MCHelpPage |
| `/mc/settings` | settings | MCSettingsPage |

**Битых ссылок в сайдбаре не обнаружено.**

### 2.2 Редиректы

- `/mc/bookings` → `/mc/calendar`
- `/mc/team` → `/mc/staff`
- `/mc/sales/settings` → `/mc/settings?tab=crm`
- `/owner/*` → соответствующие `/mc/*` (обратная совместимость)

### 2.3 Расхождение с `routes.ts`

В `src/lib/config/routes.ts` для УК заданы не все пути, которые реально используются в MC (нет, например, `MC_GUIDE`, `MC_SETUP`, `MC_QUOTES`, `MC_SEQUENCES`, `MC_RATES`, `MC_MODULES`, `MC_DOCUMENTS`, `MC_REVIEWS_MANAGEMENT`). На работу приложения это не влияет, но для единообразия и избежания опечаток стоит добавить недостающие константы и использовать их в сайдбаре и хедерах.

---

## 3. Исправленные баги

### 3.1 Настройки УК и параметр `?tab=crm`

**Проблема:** Редирект с «Настроек воронки» (`/mc/sales/settings`) ведёт на `/mc/settings?tab=crm`, но страница `MCSettingsPage` не читала `tab` из URL, поэтому блок CRM в аккордеоне не открывался.

**Исправление:** В `MCSettingsPage` добавлены:
- чтение `tab` из `useSearchParams()`;
- управляемый аккордеон (`value` / `onValueChange`) с синхронизацией открытых секций с URL;
- при открытии/закрытии секции обновляется `?tab=...` (replace), при переходе по ссылке с `?tab=crm` автоматически открывается секция CRM.

---

## 4. Рекомендации и риски

### 4.1 Безопасность и доступ

- **MCGuard:** доступ только при `user` и `companies.length > 0`; админы и `uno_team` пропускаются без проверки компаний. Соответствует задумке.
- **RBAC в сайдбаре:** используется `canAccess()` по ролям; пункты «Settings», «Staff» и др. скрываются при отсутствии прав. Стоит убедиться, что бэкенд (Supabase RLS и API) дублирует те же проверки для всех чувствительных операций.

### 4.2 Данные и хуки

- **useActiveCompany:** запрос к `management_company_members` с `!inner` join по `management_companies` — при корректных данных `management_companies` всегда есть. Для подстраховки при сбоях можно добавить optional chaining (`m.management_companies?.name_en` и т.д.).
- **CompanySwitcher:** при `companies.length <= 1` и `!activeCompany` возвращается `null`. В рамках MCGuard при `companies.length >= 1` `activeCompany` всегда задаётся (fallback на `companies[0]`), сценарий с `null` маловероятен. При желании можно явно обработать `activeCompany == null` в отображении (например, плейсхолдер «—» или «?»).

### 4.3 Навигация и UX

- **Уведомления:** кнопка в `MCHeader` ведёт на `/notifications` (глобальный маршрут). Роут зарегистрирован, 404 нет.
- **QuickActionsBar:** все пути (`/mc/channels`, `/mc/quick-expense`, `/mc/service-request?type=cleaning`, `/mc/calendar`, `/mc/auto-messaging`, `/mc/finance`, `/mc/properties/new`) соответствуют зарегистрированным маршрутам.

### 4.4 Производительность

- Все страницы MC подключаются через `React.lazy` в `pageRegistry` — начальный бандл не перегружен.
- При смене компании в `useActiveCompany` выполняется полная инвалидация кэша React Query (кроме ключей с префиксами из `PRESERVED_KEY_PREFIXES`) — это может вызывать серию повторных запросов; при необходимости можно сузить набор инвалидируемых ключей.

### 4.5 Онбординг УК

- **MCOnboarding** (`/mc/onboarding`): доступен без MCGuard (только с AuthGuard). После создания компании вызывается `setActiveCompanyId(id)` и редирект на `/mc`. Логика согласована с MCGuard.

---

## 5. Чеклист для дальнейшей проверки

- [x] Добавить в `routes.ts` недостающие MC-константы и перейти на них в сайдбаре/хедерах (выполнено).
- [ ] Проверить RLS и API для всех MC-сущностей (сделки, контакты, объекты, финансы) на соответствие ролям из `canAccess`.
- [x] Уточнить типы в `useActiveCompany` (тип `Row`, optional chaining для `management_companies`) (выполнено).
- [ ] E2E: сценарии входа в УК, смены компании, перехода по всем пунктам сайдбара и быстрых действий — см. ниже.

---

## 6. E2E-чеклист для блока УК

Рекомендуемые сценарии для ручной или автоматической проверки:

1. **Вход в УК**
   - Пользователь без УК: редирект на `/mc/onboarding`.
   - После онбординга: редирект на `/mc`, отображается дашборд.

2. **Смена компании**
   - Переключение через CompanySwitcher: данные обновляются, сайдбар и контент соответствуют выбранной УК.

3. **Навигация**
   - Клик по каждому пункту сайдбара (Обзор, Объекты, Календарь, Сообщения, Руководство, CRM, Контакты, Продажи, Задачи, Финансы, Настройки и т.д.): открывается нужная страница, без 404.
   - Быстрые действия на дашборде (Импорт OTA, Расход, Уборка, Календарь, Авто-сообщ., Доходы, Объект): переход по корректному пути.

4. **Настройки**
   - Переход «Настройки воронки» (из раздела Продажи) → открывается `/mc/settings?tab=crm`, секция CRM в аккордеоне открыта.

5. **Редиректы**
   - `/mc/bookings` → `/mc/calendar`.
   - `/mc/team` → `/mc/staff`.
   - `/owner` и `/owner/*` → соответствующие `/mc/*`.
