
# План: Исправление роутинга каталога

## Проблема

1. **Кнопка "Ещё" на главной** ведёт на `/categories`, но эта страница показывает только категории, привязанные к группам (через `group_id`)
2. **Многие категории** в базе данных не имеют `group_id` (yachts, restaurants, medical и др.) — они **не отображаются** в каталоге
3. **`/discover`** — это страница поиска услуг с фильтрами, а не каталог категорий

## Что нужно исправить

### 1. Страница `/categories` должна показывать ВСЕ категории

Сейчас `useCategories` игнорирует категории без `group_id`. Нужно добавить автоматическую группу "Другие сервисы" для категорий без привязки к группе.

**Файл:** `src/hooks/useCategories.ts`

```typescript
// В fetchCategoryGroups() после группировки по group_id:

// Collect ungrouped categories
const ungroupedCategories = categories.filter(c => !c.groupId && !c.parentId);

// Add "Other" group if there are ungrouped categories
if (ungroupedCategories.length > 0) {
  result.push({
    id: 'other',
    slug: 'other',
    nameEn: 'Other Services',
    nameRu: 'Другие сервисы',
    sortOrder: 999,
    isActive: true,
    categories: ungroupedCategories,
  });
}
```

### 2. Унификация маршрутов

- `/categories` — полноценный каталог всех категорий и сервисов
- `/discover` — редирект на `/categories` ИЛИ страница поиска (зависит от желаемого поведения)

**Вариант A:** Сделать `/discover` редиректом на `/categories`

```tsx
// AnimatedRoutes.tsx
<Route path="/discover" element={<Navigate to="/categories" replace />} />
```

**Вариант B:** Оставить `/discover` как страницу поиска услуг, но убедиться, что `/categories` работает корректно

### 3. Улучшить страницу Categories

Добавить секцию поиска и сделать более полноценной:

**Файл:** `src/pages/Categories.tsx`

```tsx
export default function Categories() {
  return (
    <AppLayout title={...}>
      <div className="p-4 pb-24 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="..." />
          <Input placeholder="Поиск категорий..." onClick={() => navigate('/search')} readOnly />
        </div>
        
        {/* All categories grouped */}
        <CategoryGroupsSection expanded showAll />
      </div>
    </AppLayout>
  );
}
```

## Порядок реализации

1. **`useCategories.ts`** — добавить сбор категорий без группы в отдельную группу "Другие"
2. **`AnimatedRoutes.tsx`** — добавить редирект `/discover` → `/categories` (опционально)
3. **`Categories.tsx`** — добавить поиск и улучшить UI

## Результат

| Маршрут | До | После |
|---------|-----|-------|
| `/categories` | Показывает 7 групп, игнорирует ~10 категорий | Показывает все категории, включая "Другие" |
| `/discover` | Поиск услуг | Редирект на `/categories` или остаётся как есть |
| Кнопка "Ещё" | Ведёт на пустоватый каталог | Полный каталог всех сервисов |
