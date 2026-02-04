
# Подробный аудит кодовой базы myUNO

## Резюме
Обнаружено **47+ критических проблем** в категориях: битые ссылки, мёртвый код, хардкод данных, дублирование дизайна, React-ошибки и архитектурные несоответствия.

---

## 🔴 КРИТИЧЕСКИЕ БАГИ (ведут к 404)

### Мёртвые ссылки в UI
| Компонент | Путь | Статус |
|-----------|------|--------|
| `QuickStatsRibbon.tsx` | `/exchange` | ❌ 404 |
| `QuickStatsRibbon.tsx` | `/beaches` | ❌ 404 |
| `QuickStatsRibbon.tsx` | `/taxi` | ❌ 404 (должен → `/transport/taxi`) |
| `ThematicSection.tsx` | `/accounting` | ❌ 404 |
| `DashboardQuickServices.tsx` | `/taxi` | ❌ 404 |
| `DashboardQuickServices.tsx` | `/tours` | ⚠️ Редирект на `/experiences` |
| `Cart.tsx` | `/tours/checkout` | ❌ 404 |
| `Cart.tsx` | `/yachts/checkout` | ❌ 404 |
| `Cart.tsx` | `/activities/checkout` | ❌ 404 |
| `Profile.tsx` | `/admin/users` | ❌ 404 (должен → `/admin/user-analytics`) |
| `Profile.tsx` | `/profile/documents` | ❌ 404 |
| `VendorCommandPalette.tsx` | `/vendor/customers` | ❌ 404 |
| `VendorCommandPalette.tsx` | `/vendor/services/new` | ❌ 404 |
| `PetTransport.tsx` | `/pets/transport/quote` | ❌ 404 |

### Лишние редиректы (глюк "Airport Transfer")
- `QuickActionsGrid.tsx:470` → `/transport/airport` → редирект на `/transport/airport-transfer`
- `MiniAppsFAB.tsx:18` → `/transport/airport` → редирект
- **Решение**: Заменить все `/transport/airport` на `/transport/airport-transfer`

---

## 🟠 МЁРТВЫЙ КОД (увеличивает бандл)

### Неиспользуемые компоненты
| Файл | Причина |
|------|---------|
| `src/components/layout/BottomNav.tsx` | Дублирует `AdaptiveBottomNav.tsx`, нигде не рендерится |
| `src/components/home/HeroBanner.tsx` | Дублирует `HeroBlock.tsx`, не импортируется |
| `src/pages/tours/ToursIndex.tsx` | Роут `/tours` всегда редиректит на `/experiences` |
| `src/pages/tours/TourDetail.tsx` | То же |
| `src/pages/tours/TourBooking.tsx` | То же |
| `src/pages/water/WaterActivitiesIndex.tsx` | Роут `/water` редиректит на `/experiences` |

---

## 🟡 ХАРДКОД ДАННЫХ (не обновляется из БД)

### Статичные счётчики
| Файл | Проблема |
|------|----------|
| `ThematicSection.tsx:153-184` | Хардкод `count: 45`, `count: 1200` и т.д. |
| `TopAppsGrid.tsx:30-70` | Хардкод `countLabel: '1,200+'` |
| `QuickStatsRibbon.tsx:26-60` | Хардкод курса `฿34.5`, статуса пляжа `✓ Safe`, такси `~10 min` |

### Мок-данные вместо БД
| Файл | Проблема |
|------|----------|
| `restaurantsData.ts` (500+ строк) | Полный каталог ресторанов — статичный массив |
| `TransportBooking.tsx:26` | `TODO: Replace with DB query` — транспорт не из БД |
| `CleaningDetail.tsx:11` | `TODO: Replace with DB query` |

---

## 🟣 ДУБЛИРОВАНИЕ ДИЗАЙНА

### Карточки товаров
- `ProductCard.tsx` vs `ProfessionalProductCard.tsx` — два разных дизайна для одной функции

### Навигация
- `BottomNav.tsx` vs `AdaptiveBottomNav.tsx` — два разных набора иконок и логики

### Property Cards
- `PropertyCard.tsx`, `PropertyListItem.tsx`, `PropertyPreviewCard.tsx` — 3 варианта (частично консолидированы)

---

## ⚠️ REACT ОШИБКИ

### Console Warning (активный)
```
Warning: Function components cannot be given refs.
Check the render method of `QuickStatsRibbon`.
```
**Причина**: Компонент `QuickStatChip` обёрнут в `memo()`, но используется без `forwardRef`

### Проблема с PullToRefresh
`Index.tsx:127` — использует `key={refreshKey}`, что уничтожает весь DOM при обновлении, вызывая "моргание" экрана

---

## 🔧 TODO/FIXME в коде (незавершённые функции)

| Файл | Строка | Проблема |
|------|--------|----------|
| `VendorDashboard.tsx` | 326 | `TODO: Implement bulk import` |
| `TransportBooking.tsx` | 26 | `TODO: Replace with DB query` |
| `TeamSupportPage.tsx` | 19 | `TODO: Replace with DB query` |
| `StaffDashboard.tsx` | 77 | `TODO: Open modal for completion` |
| `RestaurantMap.tsx` | 14 | `TODO: Replace with DB query` |
| `MyApplicationsWidget.tsx` | 101 | `TODO: Navigate to application detail` |

---

## 🔧 ПЛАН ИСПРАВЛЕНИЯ

### Фаза 1: Критические баги (404)
1. Удалить или перенаправить `/exchange`, `/beaches`, `/accounting`
2. Заменить все `/taxi` → `/transport/taxi`
3. Заменить все `/transport/airport` → `/transport/airport-transfer`
4. Добавить checkout-роуты: `/yachts/checkout`, `/experiences/checkout`
5. Исправить `/admin/users` → `/admin/user-analytics`

### Фаза 2: Очистка мёртвого кода
1. Удалить `BottomNav.tsx`
2. Удалить `HeroBanner.tsx`
3. Удалить legacy pages: `tours/*.tsx`, `water/WaterActivitiesIndex.tsx`

### Фаза 3: Исправление React-ошибок
1. Добавить `forwardRef` в `QuickStatChip`
2. Убрать `key={refreshKey}` из Index.tsx — использовать мягкое обновление

### Фаза 4: Замена хардкода
1. Использовать `useCategoryCounts()` в ThematicSection и TopAppsGrid
2. Перенести `restaurantsData.ts` в БД
3. Создать API для QuickStats (курс, погода)

### Фаза 5: Консолидация дизайна
1. Объединить ProductCard + ProfessionalProductCard
2. Удалить дублирующий BottomNav

---

## Технические детали

**Файлы для удаления:**
- `src/components/layout/BottomNav.tsx`
- `src/components/home/HeroBanner.tsx`

**Файлы для рефакторинга:**
- `src/components/home/QuickStatsRibbon.tsx` (forwardRef + динамические данные)
- `src/pages/Cart.tsx` (checkout роуты)
- `src/components/discover/ThematicSection.tsx` (убрать хардкод)
- `src/components/discover/TopAppsGrid.tsx` (убрать хардкод)
- `src/components/account/DashboardQuickServices.tsx` (исправить пути)
- `src/components/fab/MiniAppsFAB.tsx` (исправить `/transport/airport`)
- `src/components/home/QuickActionsGrid.tsx` (исправить `/transport/airport`)

**Оценка объёма:** ~15-20 файлов требуют изменений
