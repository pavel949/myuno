
# Повторный технический аудит myUNO (v2)

## Резюме
После первого раунда исправлений осталось **28 проблем**. Критические баги уменьшились с 47 до 28.

---

## 🔴 КРИТИЧЕСКИЕ БАГИ (ведут к 404)

### Оставшиеся мёртвые роуты
| Компонент | Путь | Статус |
|-----------|------|--------|
| `Cart.tsx:103,111` | `/experiences/checkout` | ❌ 404 (роут не существует) |
| `Cart.tsx:107` | `/yachts/checkout` | ❌ 404 (роут не существует) |
| `AnimatedRoutes.tsx:658-659` | `/water/:id`, `/water/:id/book` | ⚠️ Legacy - не редиректит на `/experiences` |

### ✅ ИСПРАВЛЕНО (первый раунд)
- `/taxi` → `/transport/taxi` ✓
- `/transport/airport` → `/transport/airport-transfer` ✓
- `/exchange` → `/services?category=finance` ✓
- `/admin/users` → `/admin/user-analytics` ✓
- `/accounting` → `/services?category=business` ✓

---

## 🟠 МЁРТВЫЙ КОД (ещё не удалён)

### Legacy страницы (должны быть удалены)
| Файл | Причина |
|------|---------|
| `src/pages/tours/TourDetail.tsx` | Роут `/tours/:id` редиректит через `TourRedirect`, но файл остался |
| `src/pages/tours/TourBooking.tsx` | То же |
| `src/pages/water/WaterActivityDetail.tsx` | Роут `/water/:id` ещё использует этот компонент |
| `src/pages/water/WaterActivityBooking.tsx` | То же |

### ✅ УДАЛЕНО (первый раунд)
- `src/components/layout/BottomNav.tsx` ✓
- `src/components/home/HeroBanner.tsx` ✓
- `src/pages/tours/ToursIndex.tsx` ✓
- `src/pages/water/WaterActivitiesIndex.tsx` ✓
- `src/pages/vendor/VendorOrders.tsx` ✓

---

## 🟡 ХАРДКОД ДАННЫХ (не исправлено)

### Статичные данные
| Файл | Проблема |
|------|----------|
| `QuickStatsRibbon.tsx:26,36,56` | Хардкод `฿34.5`, `150+`, `~10 min` |
| `TopAppsGrid.tsx:30,42,54,66` | Хардкод badges `'Top'`, `'Hot'`, `'New'` |
| `restaurantsData.ts` (480 строк) | Статичный массив ресторанов |
| `investorData.ts` | Статичные данные для инвесторов |
| `searchData.ts` (82 items) | Статичный поиск |
| `properties.json` (1195 строк) | Demo данные |

---

## ⚠️ REACT ОШИБКИ

### ✅ ИСПРАВЛЕНО
- `QuickStatChip` теперь использует `forwardRef` ✓
- `Index.tsx` - `key={refreshKey}` перемещён на `PullToRefresh` ✓

---

## 🔧 TODO/FIXME (всё ещё в коде)

| Файл | Строка | Проблема |
|------|--------|----------|
| `VendorDashboard.tsx:326` | `TODO: Implement bulk import` |
| `TransportBooking.tsx:26` | `TODO: Replace with DB query` |
| `TeamSupportPage.tsx:19` | `TODO: Replace with DB query` |
| `TeamModerationPage.tsx:18` | `TODO: Replace with DB query` |
| `TeamInboxPage.tsx:19` | `TODO: Replace with DB query` |
| `StaffDashboard.tsx:77` | `TODO: Open modal for completion` |
| `RestaurantMap.tsx:14` | `TODO: Replace with DB query` |
| `CleaningDetail.tsx:11` | `TODO: Replace with DB query` |
| `contentAdapters.ts:268` | `TODO: Add languages field` |
| `MyApplicationsWidget.tsx:101` | `TODO: Navigate to application detail` |

---

## 🔧 ПЛАН ИСПРАВЛЕНИЯ (v2)

### Фаза 1: Роуты (срочно)
1. Добавить `/experiences/checkout` роут → редирект на `/checkout`
2. Добавить `/yachts/checkout` роут → редирект на `/checkout`
3. Исправить `/water/:id` и `/water/:id/book` → редирект на `/experiences/:id`

### Фаза 2: Удаление legacy файлов
1. Удалить `src/pages/tours/TourDetail.tsx`
2. Удалить `src/pages/tours/TourBooking.tsx`
3. Удалить `src/pages/water/WaterActivityDetail.tsx`
4. Удалить `src/pages/water/WaterActivityBooking.tsx`
5. Удалить импорты в AnimatedRoutes.tsx

### Фаза 3: Хардкод (низкий приоритет)
1. Создать edge function для QuickStats (курс, погода)
2. Переместить restaurantsData в БД
3. Использовать `useCategoryCounts()` для badges

---

## Технические детали

**Файлы для удаления:**
- `src/pages/tours/TourDetail.tsx`
- `src/pages/tours/TourBooking.tsx`
- `src/pages/water/WaterActivityDetail.tsx`
- `src/pages/water/WaterActivityBooking.tsx`

**Файлы для рефакторинга:**
- `src/components/layout/AnimatedRoutes.tsx` (добавить checkout роуты, исправить /water редиректы)

**Оценка объёма:** ~5-6 файлов
