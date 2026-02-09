

# Консолидация Tours в Experiences — удаление дублирования

## Проблема

Таблица `tours` содержит 0 активных записей. Все реальные данные (88 активных туров) хранятся в `experiences` с `experience_type = 'tour'`. При этом ~9 файлов и ~15 запросов продолжают обращаться к мёртвой таблице `tours`, создавая путаницу в Admin/Vendor панелях и ложные нули в статистике.

## План

### Шаг 1: Перенаправить Admin и Vendor экраны

**AdminTours.tsx** — переписать на использование `useAdminExperiences({ experienceType: 'tour' })` вместо `useAdminTours()`. Форма останется та же, но данные будут из `experiences`.

**VendorTours.tsx** — переписать на использование `useVendorExperiences(providerId, 'tour')` вместо `useVendorTours()`.

### Шаг 2: Очистить хуки-запросы к `tours`

Удалить/переключить обращения к `from('tours')` в:
- `useCategoryCounts.ts` — заменить на `from('experiences').eq('experience_type', 'tour')`
- `useHomePageData.ts` — заменить на `from('experiences').eq('experience_type', 'tour')`
- `usePrefetch.ts` — удалить/заменить два запроса к tours
- `useTodayEvents.ts` — заменить на experiences
- `useRecommendations.ts` — заменить на experiences
- `routePrefetch.ts` — заменить на experiences
- `useAdminDashboardStats.ts` — заменить на experiences с фильтром

### Шаг 3: Пометить legacy-файлы как deprecated

Файлы, которые станут неиспользуемыми после шагов 1-2:
- `src/hooks/useTours.ts` — удалить (полностью заменён `useExperiences`)
- `src/hooks/useVendorTours.ts` — удалить (заменён `useVendorExperiences`)
- `src/hooks/useAdminContent.ts` (`useAdminTours` функция) — удалить функцию

### Шаг 4: Консолидировать роуты

- `/admin/tours` — редирект на `/admin/experiences?type=tour`
- `/vendor/tours` — редирект на `/vendor/experiences?type=tour`
- Убрать `AdminTours` и `VendorTours` из pageRegistry (или оставить как редиректы)

### Шаг 5: Домашняя страница

`ToursSection.tsx` — уже использует `useExperiences`, но само название файла вводит в заблуждение. Переименовать не обязательно (косметика), но можно объединить с `ExperiencesSection.tsx` в будущем.

### Шаг 6: Обновить E2E тесты

`tour-booking.spec.ts` — убедиться, что навигация идёт на `/experiences?type=tour`, а не на `/tours`.

## Что НЕ меняется

- Таблица `tours` в БД остаётся (не удаляем, чтобы не ломать миграции)
- Публичные роуты `/tours` уже редиректят на `/experiences?type=tour` (это уже сделано)
- UI карточек и фильтров
- Таблица `experiences` и её структура

## Технические детали

### Файлы для изменения (~10 файлов):

| Файл | Действие |
|------|----------|
| `src/pages/admin/AdminTours.tsx` | Переписать на `useAdminExperiences` |
| `src/pages/vendor/VendorTours.tsx` | Переписать на `useVendorExperiences` |
| `src/hooks/useCategoryCounts.ts` | Заменить `from('tours')` на `from('experiences')` |
| `src/hooks/useHomePageData.ts` | Заменить запрос |
| `src/hooks/usePrefetch.ts` | Заменить 2 запроса |
| `src/hooks/useTodayEvents.ts` | Заменить запрос |
| `src/hooks/useRecommendations.ts` | Заменить запрос |
| `src/lib/routePrefetch.ts` | Заменить запрос |
| `src/hooks/useAdminDashboardStats.ts` | Заменить 2 запроса |
| `src/components/layout/AnimatedRoutes.tsx` | Добавить редиректы admin/vendor tours |

### Файлы для удаления (3 файла):

- `src/hooks/useTours.ts`
- `src/hooks/useVendorTours.ts`
- Функция `useAdminTours` из `src/hooks/useAdminContent.ts`

