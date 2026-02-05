
# План оптимизации модуля бронирования недвижимости — Airbnb Pattern

## Анализ текущих проблем

### 1. "Scrambled" верхний фильтр
Сейчас sticky header содержит **4 ряда интерактивных элементов**:
- Ряд 1: BackButton + Заголовок + PropertyModeToggle (Аренда/Покупка)
- Ряд 2: AirbnbSearchBar (полноэкранная поисковая строка)
- Ряд 3: PropertyTypeSelector (pills) + кнопка Filters
- Ряд 4: BedroomChips (ещё один ряд chips)

**Результат:** Огромный sticky header занимает ~40% экрана на мобильных.

### 2. "Огромные карточки локаций"
В `AirbnbSearchBar.tsx` селектор локаций использует `grid-cols-2` с крупными карточками (`p-4 rounded-2xl`):
```tsx
// Строки 240-261 — мобильная версия
<motion.button className="flex items-center gap-3 p-4 rounded-2xl...">
  <span className="text-2xl">{loc.icon}</span>
  <span className="text-sm font-medium">...</span>
</motion.button>
```
Карточки слишком громоздкие, занимают много места и сложны для сканирования.

### 3. Дублирование фильтров
- Районы есть в AirbnbSearchBar И в QuickFiltersRibbon
- Спальни есть отдельно BedroomChips И в UniversalFilter
- PropertyTypeSelector дублирует опции из фильтра

---

## Референс: Airbnb Pattern

```text
┌─────────────────────────────────────────────┐
│  [←]  Homes in Phuket         [Map] [Filter]│  ← Компактный header
├─────────────────────────────────────────────┤
│  🏠 All │ 🏢 Condo │ 🏡 Villa │ ••• │       │  ← Категории (1 ряд)
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 🔍 Anywhere · Any week · Add guests     │ │  ← Компактный search
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│        [PROPERTY CARDS GRID]                │
└─────────────────────────────────────────────┘
```

**Ключевые принципы Airbnb:**
1. Search bar — компактный, открывается в модал
2. Категории — один горизонтальный ряд с иконками
3. Фильтры — консолидированы в одну кнопку/модал
4. Локации — список, а не крупные карточки

---

## План реализации

### ФАЗА 1: Рефакторинг Header (Критическая)

**Файл:** `src/pages/property/PropertyIndex.tsx`

**Изменения:**
1. **Консолидация header до 2 рядов:**
   - Ряд 1: BackButton + Title + [Map] + [Filter button]
   - Ряд 2: Категории + Rent/Buy toggle (интегрирован в категории)

2. **Перенос BedroomChips внутрь UniversalFilter** — убрать отдельный ряд

3. **QuickFiltersRibbon** — убрать из header, разместить как горизонтальные tags после результатов

```text
Было:                           Станет:
├─ BackButton + Title + Mode    ├─ BackButton + Title + Map + Filter
├─ AirbnbSearchBar              ├─ CompactSearchBar (кликабельный)
├─ PropertyTypeSelector + Filt  ├─ CategoryRibbon (Rent|Buy + Types)
├─ BedroomChips                 └─ [RESULTS]
└─ QuickFiltersRibbon
```

### ФАЗА 2: Редизайн SearchBar (Airbnb-style)

**Файл:** `src/components/property/AirbnbSearchBar.tsx`

**Изменения:**

1. **Компактный вид (collapsed):**
```tsx
// Новый компактный вид — одна строка
<div className="flex items-center gap-2 px-4 py-2.5 bg-card rounded-full border shadow-sm">
  <Search className="w-4 h-4 text-muted-foreground" />
  <span className="text-sm font-medium truncate">Anywhere</span>
  <span className="text-muted-foreground">·</span>
  <span className="text-sm text-muted-foreground">Any week</span>
  <span className="text-muted-foreground">·</span>
  <span className="text-sm text-muted-foreground">Add guests</span>
</div>
```

2. **Селектор локаций — список вместо карточек:**
```tsx
// Компактный список вместо grid
<div className="space-y-1 max-h-[300px] overflow-y-auto">
  {locations.map((loc) => (
    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
      <span className="text-lg w-6">{loc.icon}</span>
      <span className="text-sm">{loc.label}</span>
      {selected && <Check className="w-4 h-4 ml-auto text-primary" />}
    </button>
  ))}
</div>
```

3. **Размеры карточек:**
   - Было: `p-4 rounded-2xl text-2xl` (48px+ height)
   - Станет: `px-3 py-2.5 rounded-lg text-lg` (40px height)

### ФАЗА 3: Unified Category Ribbon

**Новый файл:** `src/components/property/PropertyCategoryRibbon.tsx`

Объединяет:
- PropertyModeToggle (Rent/Buy)
- PropertyTypeSelector (All/Condo/Villa/...)
- Иконки категорий Airbnb-style

```tsx
interface PropertyCategoryRibbonProps {
  mode: 'rent' | 'buy';
  onModeChange: (mode: 'rent' | 'buy') => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  types: PropertyTypeOption[];
}

// Визуал:
// [🏠 Rent] [🏢 Buy] | [All] [Condo] [Villa] [House] [•••]
```

**Дизайн по Airbnb:**
- Категории с иконками сверху, текст снизу
- Underline indicator для активной категории
- Плавный scroll с `touch-pan-y`

### ФАЗА 4: Консолидация фильтров

**Файл:** `src/components/filters/UniversalFilter.tsx`

**Добавить секции:**
1. **Спальни** — перенести из BedroomChips
2. **Районы** — основной UI здесь, убрать дублирование
3. **Amenities** — уже есть
4. **Price Range** — уже есть

**QuickFiltersRibbon** — трансформировать в "быстрые теги" ПОСЛЕ списка результатов, как "Popular filters" suggestion.

### ФАЗА 5: Итоговая структура страницы

```text
┌─────────────────────────────────────────────┐
│ [←]  Аренда жилья              [🗺] [⚙️3]  │  Header (compact)
├─────────────────────────────────────────────┤
│ 🔍 Весь Пхукет · Выберите даты · 2 гостя   │  Search (collapsed)
├─────────────────────────────────────────────┤
│ [Аренда] [Покупка] │ 🏠All 🏢Condo 🏡Villa…│  Categories
├─────────────────────────────────────────────┤
│ Консультация CTA                            │  (compact banner)
├─────────────────────────────────────────────┤
│ 142 объекта найдено                         │  Results count
├─────────────────────────────────────────────┤
│ [Beachfront] [Pool] [Sea View] [Pet OK]    │  Quick filter tags
├─────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │     │ │     │ │     │ │     │            │  Property Grid
│ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │            │
│ └─────┘ └─────┘ └─────┘ └─────┘            │
└─────────────────────────────────────────────┘
```

---

## Технические детали

### Файлы для изменения

| Файл | Действие |
|------|----------|
| `src/pages/property/PropertyIndex.tsx` | Реструктуризация layout, удаление BedroomChips из header |
| `src/components/property/AirbnbSearchBar.tsx` | Компактный режим + список локаций |
| `src/components/property/PropertyCategoryRibbon.tsx` | **Новый** — объединённый ribbon |
| `src/components/property/BedroomChips.tsx` | Удалить или интегрировать в filter |
| `src/components/property/QuickFiltersRibbon.tsx` | Перенести после результатов |
| `src/components/filters/UniversalFilter.tsx` | Добавить bedroom/district sections |

### Метрики улучшения

| Метрика | Было | Станет |
|---------|------|--------|
| Высота sticky header | ~220px | ~120px |
| Рядов фильтров | 4 | 2 |
| Размер location card | 80x48px | 100% x 40px (список) |
| Дублирование фильтров | 3 места | 1 место (UniversalFilter) |

### Совместимость с бэкендом

- PropertyTypeSelector уже использует `usePropertyFilterOptions()` → lookup_values
- Районы из `lookup_values` (type: district)
- Amenities из `lookup_values` (type: amenity)
- **Никаких изменений БД не требуется**

---

## Ожидаемый результат

✅ Компактный header — больше места для контента  
✅ Список локаций вместо громоздких карточек  
✅ Единый паттерн категорий Airbnb-style  
✅ Консолидированные фильтры без дублирования  
✅ Профессиональный индустриальный UX  
