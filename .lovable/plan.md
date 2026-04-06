

# Добавление Комплексов и Проектов в панель УК

## Проблема

В панели УК (`/mc`) отсутствуют пункты навигации к **Жилым комплексам** и **Проектам (новостройкам)**:

1. **OwnerDashboardMenu** (основное меню-сетка) — секция "Properties" содержит только Properties, Inventory, Vendors. Нет "Complexes" и "Projects".
2. **Маршрут `/mc/projects`** — не существует вообще. Есть `/newbuilds/projects` (публичный каталог), но нет MC-маршрута для управления своими проектами.
3. **Quick Actions** — кнопки "Комплексы" уже есть в `FounderQuickActions` и `RoleQuickActions`, но это мелкие кнопки, которые легко не заметить.

## План

### 1. Добавить пункты в OwnerDashboardMenu (1 файл)

**`src/components/owner/dashboard/OwnerDashboardMenu.tsx`**

В секцию "Properties" добавить два новых пункта:
- **Complexes** → `/mc/complexes` (иконка `Building2` или `Landmark`)
- **Projects** → `/mc/projects` (иконка `Crane` / `HardHat`)

Итоговая секция: Properties, Complexes, Projects, Inventory, Vendors.

### 2. Создать страницу управления проектами MC (1 новый файл)

**`src/pages/owner/MCProjectsPage.tsx`**

Страница-обёртка для управления проектами (новостройками), созданными текущим пользователем. Использует существующий хук `useMyPropertyProjects()` из `usePropertyProjects.ts`. Включает:
- Список проектов с поиском
- Кнопку "Добавить проект"
- Карточки проектов с переходом на редактирование

### 3. Добавить маршрут `/mc/projects` (2 файла)

- **`src/lib/config/routes.ts`** — добавить `MC_PROJECTS: '/mc/projects'`
- **`src/components/layout/AnimatedRoutes.tsx`** — добавить `<Route path="projects" element={<MCProjectsPage />} />`

### 4. Обновить lazy imports (1 файл)

Зарегистрировать `MCProjectsPage` в lazy-imports в `AnimatedRoutes.tsx`.

### Порядок

| Шаг | Файлы | Описание |
|-----|-------|----------|
| 1 | `routes.ts` | Добавить `MC_PROJECTS` |
| 2 | `MCProjectsPage.tsx` | Новая страница управления проектами |
| 3 | `AnimatedRoutes.tsx` | Маршрут + lazy import |
| 4 | `OwnerDashboardMenu.tsx` | Пункты "Комплексы" и "Проекты" в меню |

