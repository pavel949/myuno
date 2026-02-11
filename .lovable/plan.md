

# Фильтры на первом экране жилья (/property)

## Текущая проблема

1. **Спальни в AirbnbSearchBar** имеют только 6 вариантов (Studio, 1, 2, 3, 4, 5+), а нужны 1+, 2+, ... 12+
2. **На первом экране** (`/property`) фильтры скрыты в модалке поиска — пользователь не видит их сразу
3. **Атрибуты** (животные, пешком до пляжа, бассейн) доступны только через PropertyCategoryIcons, но нет быстрого доступа к спальням и типу жилья

## Решение

Перенести ключевые фильтры **прямо на первый экран** под поисковую строку, перед карточками. Вместо того чтобы прятать всё в модалку, показать inline-фильтры как на PropertySearchPage.

### Что появится на первом экране (под AirbnbSearchBar)

```text
[Поиск: район, даты, гости]                    ← уже есть
[Beachfront | Pool | Sea View | ... ]           ← уже есть (PropertyCategoryIcons)
[Тип жилья ▼] [Спальни ▼] [⚡Мгновенное] [Фильтры ▼]  ← НОВОЕ: inline compact поповеры
[Карточки...]
```

### Спальни: формат "N+" до 12+

Заменить текущие 6 вариантов (Studio, 1-5+) на полный набор из PropertySearchPage:

```text
Studio | 1+ | 2+ | 3+ | 4+ | 5+ | 6+ | 8+ | 10+ | 12+
```

Это изменение применяется и в AirbnbSearchBar (мобильный модал), и в inline-поповерах.

## Изменения по файлам

### 1. `src/components/property/AirbnbSearchBar.tsx`
- Заменить `BEDROOM_OPTIONS` (6 вариантов) на расширенный набор с форматом N+:
  - Studio, 1+, 2+, 3+, 4+, 5+, 6+, 8+, 10+, 12+
- Обновить сетку в мобильном табе "Спальни" с `grid-cols-3` на `grid-cols-4` для 10 кнопок
- Обновить desktop попover аналогично
- Поменять лейбл с просто числа на "N+" формат

### 2. `src/pages/property/PropertyIndex.tsx`
- Добавить inline compact filter bar (поповеры) между PropertyCategoryIcons и карточками
- Скопировать паттерн из PropertySearchPage: "Тип жилья", "Спальни", "Мгновенное бронирование" как компактные кнопки-попопверы
- Подключить `usePropertyFilterOptions` для типов жилья
- Фильтровать `allProperties` по выбранным спальням, типу, instant booking
- При переходе на `/property/search` передавать все выбранные фильтры в URL

### 3. `src/pages/property/PropertySearchPage.tsx`
- Синхронизировать `BEDROOM_OPTIONS` с новым форматом (уже частично есть Studio-12+, но нужно выровнять лейблы на "N+")

## Технические детали

### Новые состояния в PropertyIndex
```typescript
const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);
const [instantBookOnly, setInstantBookOnly] = useState(false);
```

### Единый массив BEDROOM_OPTIONS (shared)
```typescript
const BEDROOM_OPTIONS = [
  { id: 'studio', labelEn: 'Studio', labelRu: 'Студия' },
  { id: '1', labelEn: '1+', labelRu: '1+' },
  { id: '2', labelEn: '2+', labelRu: '2+' },
  { id: '3', labelEn: '3+', labelRu: '3+' },
  { id: '4', labelEn: '4+', labelRu: '4+' },
  { id: '5', labelEn: '5+', labelRu: '5+' },
  { id: '6', labelEn: '6+', labelRu: '6+' },
  { id: '8', labelEn: '8+', labelRu: '8+' },
  { id: '10', labelEn: '10+', labelRu: '10+' },
  { id: '12', labelEn: '12+', labelRu: '12+' },
];
```

### Фильтрация по спальням (логика "N+")
Выбор "3+" означает >= 3 спален. При множественном выборе берётся минимальное значение из выбранных.

### Inline filter bar на PropertyIndex
Компактные pill-кнопки с Popover (как на PropertySearchPage), расположенные горизонтально с overflow-x-auto. Это позволяет пользователю сразу видеть и использовать фильтры без открытия модалки.

