
# План: Реорганизация фильтров недвижимости

## Текущее состояние

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ТЕКУЩАЯ СТРУКТУРА ФИЛЬТРОВ                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Все] [🏬 Apartment] [🏢 Condo] [🏡 Villa] [🏘️ Townhouse] ... ← 8 типов  │
│                                                              [⚙️ Фильтры]   │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Quick Filters (ленточка):                                                  │
│  [⚡ Instant] [🏖️ У пляжа] [🌊 Beachfront] [🐕 Pet Friendly] ...           │
│                                                                             │
│  Residences:                                                                │
│  [Blue Tree] [VIP Kata] [Botanica] ...                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

ПРОБЛЕМЫ:
1. ❌ Все 8 типов недвижимости показаны одинаково - нет приоритета
2. ❌ Спальни только в модальном фильтре (глубоко)
3. ❌ Теги/локации только в модальном фильтре
4. ❌ Нет группировки "Ещё типы"
```

---

## Целевой UX

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  НОВАЯ СТРУКТУРА ФИЛЬТРОВ (Airbnb/Klook стиль)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  УРОВЕНЬ 1: Тип недвижимости (приоритетные + dropdown)                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Все] [🏢 Кондо] [🏡 Вилла] [📋 Ещё типы ▾] ← dropdown          │   │
│  │                                                    [⚙️ Фильтры]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  УРОВЕНЬ 2: Спальни (inline chips)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Спальни: [Студия] [1] [2] [3] [4] [5+]                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  УРОВЕНЬ 3: Теги + Локации (scrollable chips)                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [⚡ Instant] [🏖️ У пляжа] [🌊 Вид на море] [🐕 Pet] [🏊 Pool]...  │   │
│  │ ─────────────────────────────────────────────────────────────────── │   │
│  │ 📍 Локации: [Patong] [Kata] [Kamala] [Surin] [Rawai] ...           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  УРОВЕНЬ 4: Комплексы (карусель)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 🏢 Комплексы: [Blue Tree|23 ед.] [VIP Kata|8 ед.] [Botanica]...    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Данные в базе (уже готовы!)

### Типы недвижимости (lookup_values: property_type)
| value_key | EN | RU | icon |
|-----------|-----|-----|------|
| condo | Condo | Кондо | 🏢 |
| villa | Villa | Вилла | 🏡 |
| apartment | Apartment | Квартира | 🏬 |
| townhouse | Townhouse | Таунхаус | 🏘️ |
| house | House | Дом | 🏠 |
| penthouse | Penthouse | Пентхаус | 🌆 |
| studio | Studio | Студия | 🛏️ |
| bungalow | Bungalow | Бунгало | 🌴 |

**Приоритетные:** `condo`, `villa`
**Остальные:** В dropdown "Ещё типы"

### Спальни (lookup_values: bedroom_option)
| value_key | EN | icon |
|-----------|-----|------|
| studio | Studio | 🛏️ |
| 1 | 1 Bedroom | 1️⃣ |
| 2 | 2 Bedrooms | 2️⃣ |
| 3 | 3 Bedrooms | 3️⃣ |
| 4 | 4 Bedrooms | 4️⃣ |
| 5+ | 5+ Bedrooms | 5️⃣ |

### Теги (lookup_values: property_highlight) - 22 тега!
- ⚡ Instant Book
- 🏖️ Near Beach / Beachfront / Walk to Beach
- 🌊 Sea View / Ocean View
- 🐕 Pet Friendly
- 🏊 Pool / Private Pool / Infinity Pool
- 🏋️ Gym
- ✨ New Listing / Luxury
- 🧹 Full Service
- 💎 Designer Interior
- ✅ Verified
- ⭐ Featured

### Районы (lookup_values: district) - 22 района
Все 22 района Пхукета уже в базе с иконками.

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  PropertyIndex.tsx                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  PropertyTypeSelector (NEW)                                           │ │
│  │  ├─ [Все] [Кондо] [Вилла]   ← приоритетные таблетки                  │ │
│  │  └─ [📋 Ещё ▾]              ← DropdownMenu с остальными              │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  BedroomChips (NEW)                                                   │ │
│  │  └─ Scrollable FilterChip[] с multi-select                           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  QuickFiltersRibbon (ОБНОВИТЬ)                                        │ │
│  │  ├─ Теги (property_highlight) ← уже работает                         │ │
│  │  ├─ ─────────────────────── separator ───────────────────────        │ │
│  │  └─ Локации (district) ← добавить                                    │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  ProjectChips (уже есть)                                              │ │
│  │  └─ property_projects                                                 │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Фазы реализации

### Фаза 1: Новый компонент PropertyTypeSelector

**Файл: `src/components/property/PropertyTypeSelector.tsx`** (новый)

Компонент с приоритетными типами + dropdown:

```typescript
interface PropertyTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  propertyTypes: FilterOption[];
  language: string;
}

// Приоритетные типы (показываем как таблетки)
const priorityTypes = ['all', 'condo', 'villa'];

// Остальные уходят в dropdown "Ещё типы"
```

**Компоненты:**
- 3 таблетки: Все, Кондо, Вилла
- DropdownMenu с остальными типами (Apartment, Townhouse, House, Penthouse, Studio, Bungalow)
- При выборе из dropdown, показывать активный тип вместо "Ещё типы"

### Фаза 2: Компонент BedroomChips

**Файл: `src/components/property/BedroomChips.tsx`** (новый)

Inline чипы для выбора спален:

```typescript
interface BedroomChipsProps {
  selectedBedrooms: string[];
  onBedroomsChange: (bedrooms: string[]) => void;
  language: string;
}
```

**Дизайн:**
- Лейбл "Спальни:" слева
- Горизонтальный scroll с FilterChip
- Multi-select (можно выбрать несколько)
- Компактный размер (size="sm")

### Фаза 3: Обновление QuickFiltersRibbon

**Файл: `src/hooks/usePropertyQuickFilters.ts`**

Добавить загрузку районов:

```typescript
// Добавить в hook
const { data: districts } = await supabase
  .from('lookup_values')
  .select('id, value_key, value_en, value_ru, icon')
  .eq('lookup_type', 'district')
  .eq('is_active', true)
  .order('sort_order');

return {
  quickFilters,      // теги (property_highlight)
  districts,         // районы (district)
  projects,          // комплексы
  isLoading,
};
```

**Файл: `src/components/property/QuickFiltersRibbon.tsx`**

Добавить секцию локаций:

```typescript
{/* Tags (existing) */}
<div className="flex gap-2 overflow-x-auto ...">
  {quickFilters.map(...)}
</div>

{/* Separator */}
{districts.length > 0 && (
  <div className="flex items-center gap-2 mt-2">
    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
    <div className="flex gap-2 overflow-x-auto ...">
      {districts.map((district) => (
        <FilterChip
          key={district.id}
          label={language === 'ru' ? district.labelRu : district.labelEn}
          icon={district.icon}
          isActive={selectedDistricts.includes(district.id)}
          onToggle={() => onDistrictToggle(district.id)}
          size="sm"
        />
      ))}
    </div>
  </div>
)}
```

### Фаза 4: Обновление PropertyIndex

**Файл: `src/pages/property/PropertyIndex.tsx`**

1. Заменить текущий ScrollArea с типами на PropertyTypeSelector
2. Добавить BedroomChips после типов
3. Обновить props для QuickFiltersRibbon
4. Синхронизировать фильтры спален с filterValues

```typescript
// Новые состояния
const [selectedBedrooms, setSelectedBedrooms] = useState<string[]>([]);
const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

// В JSX
<PropertyTypeSelector
  selectedType={selectedType}
  onTypeChange={setSelectedType}
  propertyTypes={propertyTypes}
  language={language}
/>

<BedroomChips
  selectedBedrooms={selectedBedrooms}
  onBedroomsChange={setSelectedBedrooms}
  language={language}
/>

<QuickFiltersRibbon
  selectedFilters={quickFilters}
  selectedDistricts={selectedDistricts}
  onDistrictToggle={(id) => {
    setSelectedDistricts(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  }}
  {...otherProps}
/>
```

---

## Визуальный макет (мобильная версия)

```text
┌─────────────────────────────────────────────────┐
│  ← Аренда жилья                                 │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │  🔍 Куда • Даты • 2 гостя              │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  [Все] [🏢 Кондо] [🏡 Вилла] [📋 Ещё▾] [⚙️]   │
│                                                 │
│  Спальни:                                       │
│  [Студия] [1] [2] [3] [4] [5+]                 │
│                                                 │
│  [⚡ Instant] [🏖️ У пляжа] [🌊 Sea View]       │
│  [🐕 Pet] [🏊 Pool] [✅ Verified] ...           │
│                                                 │
│  📍 [Patong] [Kata] [Kamala] [Rawai]           │
│     [Surin] [Bang Tao] ...                      │
│                                                 │
│  🏢 Комплексы:                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Blue Tree│ │ VIP Kata │ │ Botanica │ →      │
│  │ 23 ед.   │ │ 8 ед.    │ │ 12 ед.   │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  ─────────────────────────────────────────────  │
│  45 объектов найдено            📍 На карте   │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐    │
│  │ [Фото виллы]                   ❤️       │    │
│  │ ⚡ Мгновенное                           │    │
│  └─────────────────────────────────────────┘    │
│  Kamala                              ⭐ 4.9    │
│  Luxury Ocean View Villa                       │
│  4 спален · 3 ванных · 8 гостей               │
│  ฿85,000/мес                                   │
│  ⚡ Забронировать сейчас                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Файлы для изменения

| Файл | Тип | Изменение |
|------|-----|-----------|
| `src/components/property/PropertyTypeSelector.tsx` | NEW | Приоритетные типы + dropdown |
| `src/components/property/BedroomChips.tsx` | NEW | Inline чипы спален |
| `src/hooks/usePropertyQuickFilters.ts` | UPDATE | + districts загрузка |
| `src/components/property/QuickFiltersRibbon.tsx` | UPDATE | + секция локаций |
| `src/pages/property/PropertyIndex.tsx` | UPDATE | Интеграция новых компонентов |

---

## Технические детали

### Props для QuickFiltersRibbon (расширение)

```typescript
interface QuickFiltersRibbonProps {
  // Существующие
  selectedFilters: string[];
  selectedProjectId?: string | null;
  onFilterToggle: (filterId: string) => void;
  onProjectSelect: (projectId: string | null) => void;
  
  // Новые
  selectedDistricts?: string[];
  onDistrictToggle?: (districtId: string) => void;
}
```

### Фильтрация по районам

```typescript
// В PropertyIndex useMemo для properties
if (selectedDistricts.length > 0) {
  const normalizedDistricts = selectedDistricts.map(d => normalizeForFilter(d));
  if (!normalizedDistricts.some(d => 
    normalizeForFilter(prop.district || '').includes(d) ||
    d.includes(normalizeForFilter(prop.district || ''))
  )) {
    return false;
  }
}
```

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые файлы | 2 |
| Обновляемые файлы | 3 |
| Данные в БД | ✅ Уже готовы (22 тега, 22 района, 8 типов, 6 опций спален) |
| Риск регрессии | Низкий - существующие чипы сохраняются |
| UX улучшения | Приоритизация Кондо/Вилла, inline спальни, inline локации |

