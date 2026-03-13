

# План исправления MC блока — приоритизированные задачи

## Фаза 1: Критический баг — скопинг данных по `owner_id` вместо `company_id`

**Проблема**: 4 запроса в `useDashboardMetrics.ts` (строки 119-136) фильтруют по `owner_id = user.id` вместо property-based или company-based скопинга. Для сотрудников MC, которые не являются владельцами, KPI показывают «0».

**Что делать**: Заменить `.eq('owner_id', user.id)` на `.in('property_id', filteredPropertyIds)` для:
- `staff_members` → добавить фильтр по `company_id` вместо `owner_id`
- `property_service_requests` → `.in('property_id', filteredPropertyIds)`
- `property_inventory_items` → `.in('property_id', filteredPropertyIds)`
- `property_financials` (pending invoices) → `.in('property_id', filteredPropertyIds)`

Аналогичная проблема в **18 других хуках** (`useExternalCalendars`, `useChannelHealth`, `useSyncLogs`, `useBookingMessageRules`, `useDayBriefing`, `useDepositStats`, `useMessageTemplates`, `useOwnerVault`, `useSuperhostStatus` и др.) — все используют `owner_id = user.id`. Каждый нужно проверить: если хук используется в MC контексте — добавить company/property-based фильтрацию.

---

## Фаза 2: `useMyProperties` — удаление `as any`

**Проблема**: Строка 83 — `(p as any).management_company_id` — `useOwnerProperties` не возвращает `management_company_id` в select, поэтому фильтр всегда false, и owned properties в MC mode пустые.

**Что делать**: Добавить `management_company_id` в select запроса `useOwnerProperties` (или `usePropertyCare`), чтобы фильтрация работала без `as any`.

---

## Фаза 3: Сайдбар — дубликаты и хардкод

**Проблема**: 
- «Tasks» дублируется в «Control Tower» (строка 51) и «Operations» (строка 70) — ведут на один путь
- 7 путей захардкожены: `/mc/rates`, `/mc/insurance`, `/mc/documents`, `/mc/sequences`, `/mc/quotes`, `/mc/reviews-management`, `/mc/help`, `/mc/management-terms`

**Что делать**:
1. Удалить «Task Inbox» из группы Operations (дубликат)
2. Добавить недостающие маршруты в `APP_ROUTES` и заменить хардкод

---

## Фаза 4: MCHeader — хардкод breadcrumbs

**Проблема**: 34-строчный `routeLabels` словарь с хардкод-путями (строки 27-60).

**Что делать**: Перенести labels в `navigationGroups` (уже содержат title/titleRu) и генерировать breadcrumbs из единого источника, добавив fallback для параметризованных путей (`/mc/properties/:id` → «Details»).

---

## Фаза 5: MCGuard — проверка конкретной компании

**Проблема**: Guard проверяет `companies.length === 0`, но не проверяет, что пользователь является членом именно активной компании.

**Что делать**: Добавить проверку `activeCompany !== null` из `useActiveCompany()` — если `companies.length > 0`, но `activeCompany` не найден среди членств, редиректить на выбор компании.

---

## Порядок реализации

| # | Задача | Файлы | Риск |
|---|--------|-------|------|
| 1 | Fix `useDashboardMetrics` scoping | 1 файл | Критический — данные показывают 0 |
| 2 | Fix `useMyProperties` as any + select | 2 файла | Высокий — пустые списки |
| 3 | Clean sidebar duplicates + hardcoded paths | 2 файла | Средний — UX |
| 4 | MCHeader breadcrumbs from config | 1 файл | Низкий — косметика |
| 5 | MCGuard active company check | 1 файл | Средний — безопасность |

Фазы 1-2 — критические баги, видимые пользователям. Фазы 3-5 — техдолг и UX.

