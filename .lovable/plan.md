

# Аудит: Оптимизация размера и сложности приложения

## Текущее состояние

| Метрика | Значение |
|---------|----------|
| Исходные файлы | 1,939 (.ts/.tsx) |
| Строк кода | 425,106 |
| Страницы | 431 |
| Компоненты | 930 |
| Хуки | 356 |
| Контексты | 12 |
| Lazy-импорты (pageRegistry) | 416 |
| Маршруты (AnimatedRoutes) | ~518 |
| Main bundle (gzip) | 364 KB |
| Dist total | 30 MB |
| Precache entries (SW) | 2,157 (14 MB) |

---

## Категория 1: Тяжёлые зависимости в бандле (~25% экономии бандла)

### 1A. ExcelJS (918 KB / 270 KB gzip) — в main bundle
Используется в 10 файлах (admin import, export, AI insights). Не нужна при загрузке приложения.
**Действие:** Вынести все `import exceljs` в `await import('exceljs')` внутри обработчиков кнопок. Экономия ~270 KB gzip из начальной загрузки.

### 1B. jsPDF (380 KB) + html2canvas (198 KB)
Используются в 7 файлах (PDF brochures, invoices, reports). Уже частично вынесены.
**Действие:** Убедиться, что все импорты динамические. Если нет — перевести на `await import()`.

### 1C. Recharts/charts vendor chunk (424 KB)
Графики нужны только в Dashboard и Admin.
**Действие:** Проверить, не попадает ли в eager chunk. Если да — изолировать.

---

## Категория 2: Дублирование кода (~1,200 строк vendor hooks)

### 2A. 19 vendor hooks-обёрток
`useVendorFlowers`, `useVendorSalons`, `useVendorYachts`... — все делают одно и то же: вызывают `useVerticalCRUD` с типом + переименовывают `items → shops/salons/yachts`. 1,209 строк.

Уже есть **`useVerticalCRUD`** — универсальный хук. Обёртки добавляют только интерфейс типа.

**Действие:** Перенести интерфейсы в `src/types/verticals/`, удалить 19 обёрток, использовать `useVerticalCRUD<VendorSalon>('beauty')` напрямую. Экономия: 19 файлов, ~1,000 строк.

### 2B. Дублирование Notification-компонентов
7 хуков уведомлений + 2 страницы настроек (`NotificationSettings` + `NotificationSettingsEnhanced`) — вероятно одна из них устарела.

**Действие:** Проверить, используется ли `NotificationSettings.tsx` (не Enhanced). Если нет — удалить.

---

## Категория 3: Раздутые конфиг-файлы (~3,000 строк)

### 3A. filterRegistry.ts (1,760 строк)
Начинается с пустых массивов (`propertyTypeOptions: FilterOption[] = []`) — legacy заглушки для 20 фильтров, которые теперь грузятся динамически.

**Действие:** Удалить пустые legacy-экспорты, оставить только `getXxxFilterConfig()` функции. Экономия: ~800 строк.

### 3B. verticalCategorySchemas.ts (1,319 строк)
Большая статическая схема категорий. Возможно частично дублирует `taxonomies/`.

**Действие:** Проверить пересечение с taxonomy hub. Если данные одинаковые — консолидировать.

### 3C. homeServiceFunctions.ts (827 строк)
Статический конфиг функций домашних услуг.

**Действие:** Проверить, используется ли напрямую или через taxonomy. Если через taxonomy — удалить.

---

## Категория 4: Структурная сложность

### 4A. 72 admin-страницы + 83 owner-страницы
Многие — тонкие обёртки вокруг одного CRUD-паттерна (таблица + фильтры + модал создания). Например: `AdminBabysitters`, `AdminCleaning`, `AdminClinics`, `AdminEducation`, `AdminEvents`, `AdminExperiences`, `AdminFlowers`, `AdminGyms` — все делают одно и то же для разных вертикалей.

**Действие (фаза 2):** Создать `AdminVerticalPage` — generic страницу, которая принимает `verticalId` и рендерит таблицу + CRUD. Заменит ~15-20 admin-страниц. Это крупная задача, но самая большая экономия (~5,000-8,000 строк).

### 4B. 12 контекстов в корне
`LifeSituationContext`, `StorefrontContext`, `PWAInstallContext` — используются в узких сценариях, но загружаются для всех.

**Действие:** Перенести редко используемые провайдеры (`StorefrontContext`, `LifeSituationContext`) внутрь маршрутов, где они нужны.

### 4C. Service Worker precache: 2,157 записей (14 MB)
Огромный precache замедляет первую установку PWA.

**Действие:** Добавить `globIgnores` в workbox config для admin/owner/vendor chunks — они не нужны офлайн.

---

## Категория 5: Мёртвый/устаревший код

### 5A. Redirect-хелперы в AnimatedRoutes
6 компонентов-редиректов (`TransportIdRedirect`, `TourRedirect`, etc.) — legacy маршруты. Если миграция завершена, можно удалить.

### 5B. Двойные страницы настроек
`NotificationSettings` vs `NotificationSettingsEnhanced`, `OwnerAccountSettings` vs `OwnerPortalSettingsPage` — возможное дублирование.

---

## Приоритизированный план действий

| # | Действие | Экономия | Риск | Сложность |
|---|----------|----------|------|-----------|
| 1 | Динамический import ExcelJS | 270 KB gzip | Нулевой | Низкая |
| 2 | Удалить 19 vendor hook-обёрток | 19 файлов, 1,200 строк | Низкий | Средняя |
| 3 | Очистить filterRegistry legacy | ~800 строк | Низкий | Низкая |
| 4 | Сократить SW precache (globIgnores) | 8+ MB precache | Нулевой | Низкая |
| 5 | Удалить дубли Settings/Notifications | 2-3 файла | Низкий | Низкая |
| 6 | Lazy-загрузка StorefrontContext | Меньше JS на старте | Низкий | Средняя |
| 7 | Generic AdminVerticalPage (фаза 2) | 15-20 страниц, ~6,000 строк | Средний | Высокая |

**Рекомендация:** Начать с пунктов 1-5 (безопасные, быстрые, ~30% снижения нагрузки на бандл и кодовую базу). Пункты 6-7 — второй этап.

Подтвердите, и я начну с пунктов 1-5.

