
# Реструктуризация Admin Panel myUNO -- 7 разделов

## Текущее состояние

Сейчас сайдбар имеет 5 групп (Core, Business, Content, AI, System) с ~25 пунктами. Отдельные вертикали (Yachts, Salons, Properties...) доступны как 30+ отдельных роутов, но не видны в сайдбаре (только через Unified Catalog или прямые ссылки). Control Center объединяет пользователей, роли, аналитику, финансы, аудит и логи в одной вкладочной странице. CRM и MC Dashboard находятся в сайдбаре админки.

## Новая структура сайдбара -- 7 разделов

```text
1. Dashboard          -- /admin
2. Users & Access     -- /admin/users (NEW route)
3. Catalog & Content  -- /admin/catalog (existing)
4. LifeOS             -- /admin/life-situations (existing)
5. Finance            -- /admin/finance (NEW route)
6. Partners           -- /admin/providers (existing, расширенный)
7. System Settings    -- /admin/settings (NEW route)
```

## Детали по каждому разделу

### 1. Dashboard (/admin)
Сокращаем до 6 KPI: Active Users, New Registrations, Active Listings, Platform Revenue, Pending Approvals (кликабельный бейдж), System Health. Плюс Activity Feed за 24 часа. Убираем AllVerticalsGrid и QuickActionsGrid (перегрузка). Pending Approvals -- кликабельная карточка, ведущая к /admin/catalog?status=pending.

**Файлы:** `AdminDashboard.tsx`, `AdminKPIGrid.tsx` (рефакторинг), удаление `AdminAllVerticalsGrid.tsx`, `AdminQuickActionsGrid.tsx` из дашборда.

### 2. Users & Access (/admin/users -- NEW)
Выносим ControlUsersTab и ControlRolesTab из Control Center в отдельную страницу. Табы: Users List (поиск, фильтры по роли/статусу/дате/персоне), User Card (профиль, активность, бронирования, платежи, документы -- вкладки внутри карточки), Roles & RBAC, Staff & Permissions.

**Файлы:** Новая страница `AdminUsersAccess.tsx`, переиспользует `ControlUsersTab` и `ControlRolesTab`.

### 3. Catalog & Content (/admin/catalog)
Уже существует Unified Catalog. Добавляем:
- Фильтр по entity type (Properties, Yachts, Restaurants...)
- Колонки: название, тип, статус (active/pending/draft), верификация, дата
- Модерация: approval queue с pending-бейджем
- Подразделы через табы: Listings, Categories & Tags, Locations, Moderation Queue

**Файлы:** Расширение `AdminUnifiedCatalog.tsx` -- добавить таб "Moderation" и approval-бейдж.

### 4. LifeOS (/admin/life-situations)
Уже существует. Без изменений.

### 5. Finance (/admin/finance -- NEW)
Сейчас /admin/finance редиректит на /admin/control. Создаем отдельную страницу:
- Транзакции платформы (Stripe)
- Комиссии и payouts
- Подписки (кто на каком плане)
- Revenue по вертикалям
Переиспользуем `ControlFinanceTab` + `ControlAnalyticsTab`.

**Файлы:** Новая страница `AdminFinance.tsx`.

### 6. Partners & Providers (/admin/providers)
Расширяем существующую страницу:
- Approval queue (заявки на верификацию) -- вкладка
- Верифицированные партнеры -- вкладка
- Листинги, рейтинги, жалобы
- Комиссионные ставки

**Файлы:** Расширение `AdminProviders.tsx` -- добавить табы.

### 7. System Settings (/admin/settings -- NEW)
Объединяем всё из бывшего "System" + часть Control Center:
- Regions (Cities)
- Localization (Translations)
- Integrations (API keys, Stripe, Mapbox)
- SEO
- Feature Flags
- Logs & Audit (из ControlLogsTab + ControlAuditTab)
- Taxonomy
- Data Import

**Файлы:** Новая страница `AdminSystemSettings.tsx` с табами/аккордеонами.

## Что убираем из сайдбара

- CRM (/admin/crm) -- отдельный workspace, не админка
- MC Dashboard (/admin/mc-dashboard) -- отдельный workspace /mc
- Marketing, Contracts, Vendor Prospects -- доступны через Cmd+K и через Partners/Operations
- Все отдельные вертикали (yachts, salons...) -- внутри Catalog
- Control Center -- разнесен по Users, Finance, System
- AI & Automation -- переносим в System Settings как подраздел
- Trash, Intake, Operations -- через Quick Actions на Dashboard или Cmd+K

Старые роуты сохраняются (Navigate redirects), ничего не ломается.

## Бейджи на сайдбаре

Pending Approvals badge на "Catalog & Content" (из `pendingContent` stat).
Unverified Partners badge на "Partners" (из `pendingProviders` stat).

## Изменяемые файлы

| Файл | Действие |
|------|----------|
| `src/components/admin/AdminSidebar.tsx` | Полная перестройка: 7 flat items вместо 5 групп |
| `src/components/admin/AdminMobileBottomNav.tsx` | Обновить: 5 main items из 7 |
| `src/components/admin/AdminCommandPalette.tsx` | Обновить группировку |
| `src/components/admin/AdminHeader.tsx` | Обновить routeLabels |
| `src/pages/admin/AdminDashboard.tsx` | Упростить: 6 KPI + alerts + activity |
| `src/components/admin/dashboard/AdminKPIGrid.tsx` | 6 KPI вместо 4 |
| `src/pages/admin/AdminUsersAccess.tsx` | NEW -- Users & Access page |
| `src/pages/admin/AdminFinance.tsx` | NEW -- Finance page |
| `src/pages/admin/AdminSystemSettings.tsx` | NEW -- System Settings page |
| `src/components/layout/AnimatedRoutes.tsx` | Новые роуты + redirects старых |

## Принципы

- Approval queue с badge-счетчиком на sidebar
- Cmd+K (уже работает) -- обновить группировку
- Bulk actions на таблицах (уже частично есть)
- Activity log на каждой сущности (уже реализован property_activity_log)
- Максимум 2 клика до любого действия
- CRM и MC -- через workspace switcher в хедере (RoleContextSwitcher уже есть)
