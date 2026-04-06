

# Аудит навигации myUNO + Security Fix

## Обнаруженные проблемы

### 1. КРИТИЧЕСКИЙ БАГ: Двойные лейблы в AdaptiveBottomNav
В `AdaptiveBottomNav.tsx` (строки 167-176 и 223-232) каждый активный элемент рендерит **два одинаковых `<span>`** с названием. Это дублирует текст "Главная", "Маркет" и т.д. под иконкой.

### 2. Дублирование AdaptiveBottomNav в страницах
`ProjectDetail.tsx` и `ProjectsIndex.tsx` **импортируют и рендерят `AdaptiveBottomNav` вручную**, хотя он уже рендерится глобально в `AnimatedRoutes.tsx` (строка 717). Это создаёт **двойной bottom nav** на этих страницах.

### 3. Hardcoded маршруты в 214 файлах (~2068 вхождений)
Несмотря на `APP_ROUTES` константы, огромное количество `navigate('/...')` вызовов используют строковые литералы. Примеры:
- `navigate('/auth')` вместо `navigate(APP_ROUTES.AUTH)`
- `navigate('/market')` вместо `navigate(APP_ROUTES.MARKET)`
- `navigate('/bookings')` вместо `navigate(APP_ROUTES.BOOKINGS)`

Полная миграция 214 файлов — отдельная задача. В этом раунде исправим **самые критичные** (навигационные компоненты и guard-компоненты).

### 4. Несогласованные навигационные элементы в bottom nav
- `adminNavItems` содержит `/admin/crm` и `/admin/moderation` — но `/admin/moderation` **редиректит** на `/admin/operations?tab=moderation` (строка 499 AnimatedRoutes). Мёртвая ссылка в навигации.
- `vendorNavItems` содержит `/vendor/payouts` как hardcoded строку вместо `APP_ROUTES`.
- `ownerNavItems` ссылается на `MC_MESSAGES` — корректно.

### 5. `shouldHideBottomNav` — неполный и aggressивный
- Скрывает nav для `/property/` — но PropertyHub Index (`/property`) должен показывать nav
- Не скрывает для `/developer-portal`, `/newbuilds/projects/`, booking wizard pages
- Использует `pathname.includes(route)` что может давать false positives

### 6. Security: vite-plugin-pwa version
`package.json` показывает `"vite-plugin-pwa": "0.19.8"` — это уже актуальная версия, но scanner указывает `^1.2.0`. Несовпадение. Проверю и обновлю до latest если нужно.

---

## План исправлений

### Phase 1: Критические баги (3 файла)

**AdaptiveBottomNav.tsx** — удалить дублирующиеся `<span>` элементы (строки 172-176 и 228-232), оставив по одному. Исправить hardcoded пути на `APP_ROUTES`. Исправить `/admin/moderation` → `/admin/operations`.

**ProjectDetail.tsx** и **ProjectsIndex.tsx** — удалить ручной `<AdaptiveBottomNav />` (уже есть глобально).

### Phase 2: shouldHideBottomNav рефакторинг (1 файл)

Переписать логику скрытия nav:
- `/property` (exact) → показывать
- `/property/*` (sub-pages) → скрывать
- Добавить `/developer-portal` в `layoutsWithOwnNav`
- Упростить `routesWithOwnBottomBar` проверку (точные prefix-match вместо `includes`)

### Phase 3: BackButton consistency (audit-only)

`BackButton` всегда использует `fallbackPath` и никогда `history.back()` — это **правильно** для SPA. Но некоторые страницы (BookingDetail, StoreDetail) используют кастомные back-кнопки с `navigate('/...')` вместо `BackButton`. Заменить на `BackButton` для согласованности.

### Phase 4: Security — обновить vite-plugin-pwa

Обновить до latest stable (0.21.x) для устранения уязвимостей.

### Порядок реализации

| Phase | Файлов | Impact |
|-------|--------|--------|
| 1. Критические баги навигации | 3 | Critical — двойные лейблы и двойной nav |
| 2. shouldHideBottomNav | 1 | High — правильная видимость nav |
| 3. BackButton consistency | ~5 | Medium — UX consistency |
| 4. Security update | 1 | High — vulnerability fix |

