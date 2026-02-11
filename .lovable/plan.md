
# Мульти-выбор категорий (чипов) на странице жилья

## Проблема
Сейчас `PropertyCategoryIcons` поддерживает только **одиночный** выбор (`selected: string | null`). Пользователь не может одновременно выбрать "Бассейн" + "С питомцами" + "У пляжа".

## Данные в базе
40 из 42 объектов уже имеют заполненные `amenities` (массив строк). Логика сопоставления `matchesCategory` работает корректно — она проверяет `amenities`, `highlights` и `view_type`. Проблема только в интерфейсе (single-select).

## Решение

### 1. `src/components/property/PropertyCategoryIcons.tsx`
- Изменить интерфейс с `selected: string | null` на `selected: string[]` и `onSelect: (ids: string[]) => void`
- При клике — добавлять/убирать из массива (toggle), а не заменять
- Визуально: активные чипы подсвечиваются (как сейчас для одного)
- Сохранить обратную совместимость: добавить overloaded props или новый пропс `multi?: boolean`

### 2. `src/pages/property/PropertyIndex.tsx`
- Заменить `selectedCategory: string | null` на `selectedCategories: string[]`
- В фильтрации: объект проходит если соответствует **всем** выбранным категориям (AND-логика — "бассейн И парковка")
- Передать массив в `PropertyCategoryIcons`

### 3. `src/pages/property/PropertySearchPage.tsx`
- Аналогичная замена `selectedCategory: string | null` на `selectedCategories: string[]`
- Обновить фильтрацию с AND-логикой

### Логика фильтрации
Если выбраны `['pool', 'pet_friendly']`, объект отображается только если `matchesCategory(property, 'pool') === true` **И** `matchesCategory(property, 'pet_friendly') === true`.

## Технические детали

### Изменение интерфейса PropertyCategoryIcons
```typescript
// Было:
interface PropertyCategoryIconsProps {
  selected: string | null;
  onSelect: (id: string | null) => void;
}

// Станет:
interface PropertyCategoryIconsProps {
  selected: string[];
  onSelect: (ids: string[]) => void;
}
```

### Изменение состояния в PropertyIndex и PropertySearchPage
```typescript
// Было:
const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

// Станет:
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
```

### Фильтрация (AND-логика)
```typescript
// Объект проходит только если соответствует КАЖДОЙ выбранной категории
if (selectedCategories.length > 0) {
  const passesAll = selectedCategories.every(cat => matchesCategory(p, cat));
  if (!passesAll) return false;
}
```

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/components/property/PropertyCategoryIcons.tsx` | Пропсы: `string \| null` -> `string[]`. Toggle при клике |
| `src/pages/property/PropertyIndex.tsx` | Состояние -> массив, AND-фильтрация |
| `src/pages/property/PropertySearchPage.tsx` | Состояние -> массив, AND-фильтрация |
