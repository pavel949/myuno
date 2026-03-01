
# Разделение рабочих пространств: myUNO Admin vs УК (Management Company)

## Текущая проблема

Сейчас **все** функции УК (CRM, бронирования, финансы, команда, объекты) и функции индивидуальных собственников живут под одним префиксом `/owner`. Это создает путаницу:

- УК-менеджер и простой собственник видят один и тот же URL `/owner`
- Нет четкой границы между платформой myUNO (`/admin`) и рабочим пространством УК
- Сотрудники УК теоретически могут попасть в admin-интерфейс

## Предлагаемая архитектура

```text
/admin/*          -- myUNO Platform (admin, uno_team ONLY)
/mc/*             -- Management Company workspace (MC members)
/my-property/*    -- Owner Portal (read-only для собственников)
/staff/*          -- Staff dashboard
/vendor/*         -- Vendor portal
```

### Почему `/mc` а не `/mc/:slug`?

Slug в URL добавляет сложность (каждая ссылка должна знать slug). Компания уже определяется через `useActiveCompany` (из membership в БД). Если пользователь состоит в нескольких УК -- он переключается через селектор в хедере, а не через URL. Это проще и безопаснее.

## План реализации (3 фазы)

### Фаза 1: Создание MC Layout и Guard

**Новые файлы:**
- `src/components/mc/MCLayout.tsx` -- Layout для MC workspace (копия OwnerLayout, адаптированная для MC)
- `src/components/mc/MCSidebar.tsx` -- Sidebar с MC-модулями (CRM, Properties, Calendar, Finance, Staff, Operations)
- `src/components/mc/MCHeader.tsx` -- Header с названием компании и company switcher
- `src/components/auth/MCGuard.tsx` -- Guard: проверяет membership в `management_company_members`

**MCGuard логика:**
- Проверяет, что пользователь является участником хотя бы одной `management_company`
- Если нет -- показывает "Access Denied" или редирект на `/owner/setup`
- Не проверяет admin/uno_team роли (они работают через AdminGuard)

### Фаза 2: Перенос маршрутов из /owner в /mc

**Маршруты, переносимые в `/mc`** (PMS-функционал УК):
- `/mc/properties`, `/mc/properties/new`, `/mc/properties/:id/*`
- `/mc/calendar`, `/mc/bookings`
- `/mc/financials`, `/mc/budget`, `/mc/quick-expense`, `/mc/income/quick`
- `/mc/contacts`, `/mc/contacts/:id`, `/mc/contacts/import`
- `/mc/sales`, `/mc/sales/*`
- `/mc/tasks`, `/mc/crm-dashboard`, `/mc/sequences`, `/mc/quotes`
- `/mc/meetings`, `/mc/crm-emails`, `/mc/automations`
- `/mc/staff`, `/mc/team`
- `/mc/operations`, `/mc/maintenance-plan`
- `/mc/channels`, `/mc/rates`, `/mc/reviews-management`
- `/mc/inventory`, `/mc/documents`, `/mc/vault`
- `/mc/vendors`, `/mc/marketing`
- `/mc/invoices`, `/mc/reports`
- `/mc/owners`, `/mc/owners/:id`
- `/mc/subscription`
- `/mc/properties/:id/portal-settings`
- `/mc/messages`, `/mc/auto-messaging`, `/mc/chat/:type/:id`
- `/mc/support-chat`, `/mc/message-templates`
- `/mc/management-terms`, `/mc/insurance`

**Маршруты, остающиеся на `/owner`** (для индивидуальных собственников):
- `/owner` -- Dashboard (Transparency)
- `/owner/setup` -- Wizard настройки
- `/owner/portfolio` -- Портфолио объектов
- `/owner/finance` -- Финансовый обзор (read-only)
- `/owner/superhost` -- Superhost рейтинг
- `/owner/guide` -- Гид
- `/owner/service-request`, `/owner/inspection`, `/owner/full-management`

**Редиректы:** Все старые `/owner/contacts`, `/owner/sales`, `/owner/tasks` и т.д. получат `<Navigate to="/mc/..." replace />` для обратной совместимости.

### Фаза 3: Обновление внутренних ссылок

**87 файлов** содержат hardcoded `/owner/...` пути. Для каждого:
- MC-компоненты (в `src/components/owner/`) -- обновить на `/mc/...`
- Страницы (в `src/pages/owner/`) -- обновить на `/mc/...`
- Утилиты и хуки -- обновить навигацию

**Обновить `APP_ROUTES` в `routes.ts`:**
```text
MC: '/mc'
MC_PROPERTIES: '/mc/properties'
MC_CALENDAR: '/mc/calendar'
MC_CONTACTS: '/mc/contacts'
MC_SALES: '/mc/sales'
MC_TASKS: '/mc/tasks'
MC_FINANCE: '/mc/financials'
MC_STAFF: '/mc/staff'
...
OWNER: '/owner'           -- (для индивидуальных собственников)
OWNER_PORTAL: '/my-property'  -- (read-only портал)
```

## Итоговая матрица доступа

```text
Роль               | /admin | /mc   | /owner | /my-property | /staff
--------------------|--------|-------|--------|--------------|-------
admin               |   OK   |  OK   |   OK   |     OK       |  OK
uno_team            |   OK   |  --   |   --   |     --       |  OK
MC director/manager |   --   |  OK   |   OK   |     --       |  --
MC accountant       |   --   |  OK   |   --   |     --       |  --
Property owner      |   --   |  --   |   OK   |     OK       |  --
staff               |   --   |  --   |   --   |     --       |  OK
vendor              |   --   |  --   |   --   |     --       |  --
```

## Технический объем

| Компонент | Действие | Файлы |
|-----------|----------|-------|
| MCLayout, MCSidebar, MCHeader | Создать | 3 новых |
| MCGuard | Создать | 1 новый |
| AnimatedRoutes.tsx | Разделить /owner на /mc + /owner | 1 |
| routes.ts | Добавить MC_* константы | 1 |
| Внутренние ссылки | Обновить navigate/Link | ~60-80 файлов |
| Redirect-слой | /owner/* -> /mc/* для MC-маршрутов | в AnimatedRoutes |

**Риск:** Большой объем изменений. Рекомендую делать пофазно с тестированием после каждой фазы.
