

# Платформенная CRM в Админ-панели

## Проблема сейчас

Инструменты привлечения разбросаны по 3+ местам:
- **Vendor Prospects** (`/admin/vendor-prospects`) — привлечение поставщиков (B2B), Kanban + таблица
- **MCC Lead Hub** (`/admin/marketing`) — привлечение пользователей (B2C), спрятан внутри Marketing
- **Owner Prospects** — таблица есть в базе, но UI не реализован
- **MC CRM** (`/mc/*`) — полноценная CRM, но привязана к конкретной Управляющей Компании

Нет единого места, где видно: "сколько всего лидов, кто с кем работает, какая конверсия".

## Решение: Admin CRM Hub (`/admin/crm`)

Единая страница с табами, объединяющая все потоки привлечения:

```text
/admin/crm
  |-- Dashboard (сводная аналитика по всем потокам)
  |-- Vendors   (переиспользует VendorProspects pipeline)
  |-- Users     (B2C лиды из mcc_leads + consultation_requests)
  |-- Owners    (привлечение собственников)
  |-- Activity  (единый таймлайн всех действий)
```

### Таб 1: Dashboard
- Общие KPI-карточки: всего лидов, конверсия, активных в работе
- Разбивка по каналам (Vendors / Users / Owners)
- Воронка конверсии (визуализация через Recharts)
- Топ-5 горячих лидов из всех потоков

### Таб 2: Vendors (B2B)
- Переиспользует существующий `VendorProspectsPipeline`, `VendorProspectsTable`, `VendorProspectsStats`
- Без дублирования кода — просто импорт компонентов

### Таб 3: Users (B2C)
- Переиспользует `MCCLeadsTab` из Marketing
- Данные из `mcc_leads` + `consultation_requests`

### Таб 4: Owners
- Новый компонент для работы с `owner_prospects`
- Простая таблица + статусы (new, contacted, interested, converted, lost)

### Таб 5: Activity Log
- Единый таймлайн действий по всем типам лидов
- Фильтр по типу (vendor/user/owner)

## Навигация

- Добавить `/admin/crm` в сайдбар в группу **BUSINESS** (между Contracts и Vendor Prospects)
- `/admin/vendor-prospects` остается рабочим как прямой доступ
- Command Palette обновляется с ключевыми словами "crm", "leads", "acquisition"

## Технический план

### Новые файлы
1. **`src/pages/admin/AdminCRM.tsx`** — главная страница с табами (Dashboard, Vendors, Users, Owners, Activity)
2. **`src/components/admin/crm/AdminCrmDashboard.tsx`** — сводные KPI и воронка
3. **`src/components/admin/crm/AdminOwnerProspects.tsx`** — таблица для owner_prospects
4. **`src/components/admin/crm/AdminCrmActivityLog.tsx`** — единый таймлайн
5. **`src/hooks/useOwnerProspects.ts`** — CRUD-хук для owner_prospects (заменяет untypedTables)
6. **`src/hooks/useAdminCrmStats.ts`** — агрегированная статистика по всем потокам

### Изменения в существующих файлах
7. **`AnimatedRoutes.tsx`** — добавить Route `/admin/crm`
8. **`AdminSidebar.tsx`** — добавить пункт "CRM" в группу Business
9. **`AdminCommandPalette.tsx`** — добавить команду CRM
10. **`AdminMobileBottomNav.tsx`** — добавить CRM в "More" drawer

### База данных
- Новых таблиц **не нужно** — `vendor_prospects`, `mcc_leads`, `consultation_requests`, `owner_prospects` уже существуют
- Возможно потребуется миграция для добавления недостающих колонок в `owner_prospects` (проверим при реализации)

### Переиспользование кода
- `VendorProspectsPipeline` / `VendorProspectsTable` / `VendorProspectsStats` — импортируются напрямую
- `MCCLeadsTab` — импортируется напрямую
- `useLeadHub` / `useVendorAcquisition` — используются как есть

