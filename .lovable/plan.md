

## Объединение модулей Собственника и Управляющего

### Проблема сейчас

Два отдельных модуля (`/owner` и `/manager`) делают одно и то же, но с разными источниками данных:

- **Owner**: 32 страницы, получает объекты через `owner_id` из таблицы `properties`
- **Manager**: 3 страницы-дубликата, получает объекты через `property_manager_assignments`
- Оба используют одинаковые компоненты: `AirbnbCalendarGrid`, `CalendarTodayTasks`, `PropertyThumbnailSelector`
- Отдельный Layout, Sidebar, MobileNav, Header, Guard — всё продублировано

### Концепция: один модуль `/owner` с адаптивным доступом

Вместо двух модулей — один `/owner`, который автоматически показывает:
- **Свои объекты** (если пользователь — собственник)
- **Назначенные объекты** (если пользователь — управляющий)
- **И те, и другие** (если пользователь и владеет, и управляет чужими)

Бейдж в хедере и над списком объектов показывает контекст: "Мои объекты" / "Под управлением".

### Что изменится

**1. Новый хук `useMyProperties` — единый источник данных**

Объединяет `useOwnerProperties` и `useAssignedProperties` в один хук:

```text
useMyProperties() -> {
  ownedProperties: [...],      // где я owner_id
  managedProperties: [...],    // где я в property_manager_assignments
  allProperties: [...],        // объединённый список
  role: 'owner' | 'manager' | 'both',
}
```

Все компоненты Owner-модуля переключаются на `useMyProperties` вместо `useOwnerProperties`.

**2. Guard — расширить OwnerGuard**

Текущий `OwnerGuard` пропускает только роль `owner`. Расширить: пропускать также `property_manager`. Один Guard вместо двух.

**3. Sidebar и навигация — адаптивная**

Sidebar остаётся от Owner, но:
- Если пользователь — только управляющий (без роли `owner`), скрыть пункты: Financials, Documents, Settings
- Если есть обе роли — показать всё
- Пункт "Моя команда" доступен всем (собственник приглашает управляющего, управляющий видит кому он назначен)

**4. Дашборд — объединённый**

Текущий `OwnerDashboard` показывает `OwnerPropertiesList` (свои объекты). Новый вариант:
- Секция "Мои объекты" (owned) — если есть
- Секция "Под управлением" (managed) — если есть  
- Визуальное разделение с бейджами "Собственник" / "Управляющий"

**5. Удалить модуль Manager**

Все маршруты `/manager/*` перенаправить на `/owner/*`. Удалить:
- `src/pages/manager/` (3 файла)
- `src/components/manager/` (5 файлов)
- `ManagerGuard` из auth
- Маршруты `/manager/*` из `AnimatedRoutes.tsx`
- Роль `property_manager` из навигации оставить, но defaultPath сменить на `/owner`

### Технические детали

| Файл | Действие |
|---|---|
| `src/hooks/useMyProperties.ts` | Новый хук: объединяет `useOwnerProperties` + `useAssignedProperties`, возвращает `ownedProperties`, `managedProperties`, `allProperties`, `accessRole` |
| `src/components/auth/RoleGuard.tsx` | Расширить `OwnerGuard`: пропускать `owner` ИЛИ `property_manager` |
| `src/components/owner/OwnerSidebar.tsx` | Адаптивное меню: скрывать Financials/Documents для чистых управляющих |
| `src/components/owner/dashboard/OwnerPropertiesList.tsx` | Показывать две секции: "Мои" и "Под управлением" (если есть оба типа) |
| `src/pages/owner/OwnerDashboard.tsx` | Использовать `useMyProperties` вместо только owned |
| `src/pages/owner/OwnerCalendar.tsx` | PropertyThumbnailSelector показывает все доступные объекты (owned + managed) |
| `src/types/auth.ts` | `property_manager.defaultPath` поменять на `/owner` |
| `src/components/layout/AnimatedRoutes.tsx` | Удалить блок `/manager/*`, добавить редиректы `/manager` -> `/owner`, `/manager/calendar` -> `/owner/calendar`, `/manager/properties` -> `/owner/properties` |
| `src/pages/manager/*` | Удалить 3 файла |
| `src/components/manager/*` | Удалить 5 файлов |
| `src/components/auth/ManagerGuard.tsx` | Удалить |
| `src/components/layout/pageRegistry.ts` | Убрать Manager-импорты |

### Что НЕ меняется

- Таблица `property_manager_assignments` и хук `useAssignedProperties` — остаются как есть (используются внутри нового `useMyProperties`)
- Страница Team (`/owner/team`) — уже работает с приглашениями и ко-хостингом
- Система permissions (view, edit, financial, bookings) — остаётся для управляющих
- Компоненты календаря, задач — без изменений
