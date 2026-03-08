

## Проблема

Карточки KPI на админ-дашборде показывают неточные цифры и не кликабельны:

1. **«Листинги» (453)** — считает только 9 из ~20 вертикалей. Пропущены: `education`, `pets`, `cleaning`, `babysitters`, `flowers`, `pharmacies`, `stores`, `insurance`, `waterActivities`, `services`.
2. **«На модерации» (253)** — включает unverified providers в подсчет, что раздувает число. Модерация контента = только `pending` properties + `pending` listings.
3. **Клик по карточкам** — только «На модерации» кликабельна (и то условно). Остальные карточки не ведут никуда.

## План исправлений

### 1. Исправить подсчет `activeListings` в `AdminKPIGrid.tsx`

Строки 99-101 — добавить все пропущенные вертикали:
```
const activeListings = (stats?.properties || 0) + (stats?.yachts || 0) + (stats?.tours || 0) + 
  (stats?.restaurants || 0) + (stats?.salons || 0) + (stats?.clinics || 0) + (stats?.gyms || 0) +
  (stats?.events || 0) + (stats?.vehicles || 0) + (stats?.education || 0) + (stats?.pets || 0) +
  (stats?.cleaning || 0) + (stats?.babysitters || 0) + (stats?.flowers || 0) + (stats?.pharmacies || 0) +
  (stats?.stores || 0) + (stats?.insurance || 0) + (stats?.waterActivities || 0) + (stats?.services || 0);
```

### 2. Исправить `pendingContent` в `useAdminDashboardStats.ts`

Убрать `pendingProviders` из подсчета модерации контента (провайдеры — не контент). Оставить:
```
const totalPendingContent = pendingProperties + pendingListings;
```

Если нужно показывать pending providers отдельно, вынести в отдельный KPI или в алерт-панель.

### 3. Сделать все карточки кликабельными

В массиве `kpis` добавить `onClick` с навигацией:

| Карточка | Маршрут |
|---|---|
| Пользователи | `/admin/users` |
| Провайдеры | `/admin/providers` |
| Листинги | `/admin/catalog` |
| Доход | `/admin/finance` |
| На модерации | `/admin/operations?tab=moderation` |
| Здоровье | (без клика) |

### Файлы для изменения

- `src/components/admin/dashboard/AdminKPIGrid.tsx` — формула activeListings + onClick на все карточки
- `src/hooks/useAdminDashboardStats.ts` — исправить pendingContent (убрать providers)

