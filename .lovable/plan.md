
# ✅ ВЫПОЛНЕНО: Профессиональная таксономия недвижимости Пхукета

## Статус: Завершено

Все 4 этапа реализованы:
- ✅ Функции нормализации в `propertyTaxonomy.ts`
- ✅ Централизованный хук `usePropertyFormOptions.ts`
- ✅ Рефакторинг форм PropertyEditor и VendorProperties
- ✅ Миграция данных БД (ac→air-conditioning, Patong→patong)

## Обзор проблемы (РЕШЕНО)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ТЕКУЩЕЕ СОСТОЯНИЕ (ПРОБЛЕМЫ)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  БД (lookup_values)          Фронтенд (формы)         БД (properties)      │
│  ─────────────────          ────────────────         ────────────────      │
│  air-conditioning           ac                       air_conditioning      │
│  sea-view                   sea_view                 sea_view              │
│  pet-friendly               pets                     pet-friendly          │
│  beach-access               (отсутствует)            beach_access          │
│                                                                             │
│  РЕЗУЛЬТАТ: Фильтры не работают, данные не отображаются корректно          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Найденные проблемы

1. **Несогласованность ключей аменитиз**
   - БД `lookup_values`: `air-conditioning`, `sea-view`, `pet-friendly`
   - Формы вендоров: `ac`, `sea_view`, `pets`
   - Реальные данные в `properties.amenities`: `air_conditioning`, `air-conditioning`, `ac`

2. **Дублирование списков районов**
   - `PropertyEditor.tsx`: статический массив 13 районов
   - `propertyTaxonomy.ts`: 22 района с метаданными
   - `lookup_values`: 22 района (синхронизированы)

3. **Формы не используют централизованную таксономию**
   - `VendorProperties.tsx` — свои статические списки
   - `PropertyEditor.tsx` — свои статические списки
   - Не загружают данные из `lookup_values` или `propertyTaxonomy.ts`

4. **Отсутствует нормализация при сохранении/чтении**
   - При записи: разные ключи сохраняются как есть
   - При чтении: фильтры не находят совпадений

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ЦЕЛЕВАЯ АРХИТЕКТУРА                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    src/lib/propertyTaxonomy.ts                              │
│                    ─────────────────────────                                │
│                    Единый источник истины                                   │
│                           ↓                                                 │
│           ┌───────────────┼───────────────┐                                 │
│           ↓               ↓               ↓                                 │
│    PropertyIndex    PropertyEditor   VendorProperties                       │
│    (фильтры)        (формы owner)    (формы vendor)                         │
│           ↓               ↓               ↓                                 │
│           └───────────────┼───────────────┘                                 │
│                           ↓                                                 │
│                   normalizeAmenityId()                                      │
│                   ─────────────────────                                     │
│                   Приведение к единому формату                              │
│                           ↓                                                 │
│                    БД properties                                            │
│                    ─────────────                                            │
│                    Только стандартные ключи                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Этапы реализации

### Этап 1: Расширение таксономии

**Файл:** `src/lib/propertyTaxonomy.ts`

Добавить:
- Функции нормализации ключей аменитиз
- Маппинг алиасов (ac → air-conditioning)
- Расширенный список районов с координатами
- Типы для TypeScript

```typescript
// Маппинг алиасов к каноническим ключам
const AMENITY_ALIASES: Record<string, string> = {
  'ac': 'air-conditioning',
  'air_conditioning': 'air-conditioning',
  'sea_view': 'sea-view',
  'ocean_view': 'ocean-view',
  'pets': 'pet-friendly',
  'beach': 'beach-access',
  // ...
};

export function normalizeAmenityId(id: string): string {
  const normalized = id.toLowerCase().trim();
  return AMENITY_ALIASES[normalized] || normalized;
}
```

### Этап 2: Создание централизованного хука для форм

**Новый файл:** `src/hooks/usePropertyFormOptions.ts`

```typescript
// Загружает опции из lookup_values с fallback на propertyTaxonomy
export function usePropertyFormOptions() {
  // Возвращает:
  // - districts: DistrictOption[]
  // - propertyTypes: PropertyTypeOption[]
  // - amenities: AmenityOption[]
  // - всё с is_active, sort_order, icons
}
```

### Этап 3: Рефакторинг форм

**Файлы:**
- `src/pages/owner/PropertyEditor.tsx`
- `src/pages/vendor/VendorProperties.tsx`

Изменения:
1. Удалить статические массивы `districts`, `propertyTypes`, `amenitiesList`
2. Использовать `usePropertyFormOptions()` 
3. Применять `normalizeAmenityId()` при сохранении

### Этап 4: Миграция данных в БД

**SQL миграция:**

```sql
-- Нормализация существующих данных
UPDATE properties 
SET amenities = (
  SELECT array_agg(
    CASE 
      WHEN a = 'ac' THEN 'air-conditioning'
      WHEN a = 'air_conditioning' THEN 'air-conditioning'
      WHEN a = 'sea_view' THEN 'sea-view'
      WHEN a = 'pets' THEN 'pet-friendly'
      ELSE a
    END
  )
  FROM unnest(amenities) AS a
)
WHERE amenities IS NOT NULL;
```

### Этап 5: Синхронизация отображения

**Файлы для обновления:**
- `src/pages/property/PropertyDetail.tsx` — использовать хелперы из таксономии
- `src/components/property/PropertyPreviewCard.tsx` — уже использует
- `src/components/filters/PropertyFilters.tsx` — уже использует

---

## Детальные технические изменения

### 1. Обновление `propertyTaxonomy.ts`

| Секция | Изменения |
|--------|-----------|
| Districts | Добавить `lat/lng`, `description`, `beachQuality` |
| Amenities | Добавить алиасы, группировку по категориям |
| Нормализация | Новые функции `normalizeAmenityId`, `normalizeDistrictId` |
| Типы | Экспортировать строгие TypeScript типы |

### 2. Новый хук `usePropertyFormOptions`

```typescript
interface PropertyFormOptions {
  districts: Array<{
    id: string;
    labelEn: string;
    labelRu: string;
    icon: string;
    zone: string;
    popular: boolean;
  }>;
  propertyTypes: Array<{ ... }>;
  amenities: Array<{ ... }>;
  isLoading: boolean;
}
```

### 3. Изменения в PropertyEditor.tsx

**Было (строки 48-59):**
```typescript
const districts = [
  'Patong', 'Kata', 'Karon', ...
];
const propertyTypes = [
  { value: 'villa', labelEn: 'Villa', ... },
  ...
];
```

**Станет:**
```typescript
import { PHUKET_DISTRICTS, PROPERTY_TYPES } from '@/lib/propertyTaxonomy';
// Или через хук для динамической загрузки
const { districts, propertyTypes, amenities } = usePropertyFormOptions();
```

### 4. Изменения в VendorProperties.tsx

**Было (строки 64-97):**
```typescript
const propertyTypes = [...];
const amenitiesList = [
  { id: 'ac', label: 'Air Conditioning', ... },
  ...
];
```

**Станет:**
```typescript
import { 
  PROPERTY_TYPES, 
  ALL_AMENITIES, 
  normalizeAmenityId 
} from '@/lib/propertyTaxonomy';

// При сохранении:
const normalizedAmenities = formData.amenities.map(normalizeAmenityId);
```

---

## Миграция данных

### SQL скрипт для нормализации

```sql
-- 1. Создать маппинг алиасов
CREATE TEMP TABLE amenity_mapping (
  old_key TEXT,
  new_key TEXT
);

INSERT INTO amenity_mapping VALUES
  ('ac', 'air-conditioning'),
  ('air_conditioning', 'air-conditioning'),
  ('sea_view', 'sea-view'),
  ('ocean_view', 'ocean-view'),
  ('pets', 'pet-friendly'),
  ('beach', 'beach-access'),
  ('Pool', 'pool'),
  ('WiFi', 'wifi'),
  ('Gym', 'gym');

-- 2. Нормализовать amenities в properties
UPDATE properties p
SET amenities = (
  SELECT array_agg(COALESCE(m.new_key, LOWER(a)))
  FROM unnest(p.amenities) AS a
  LEFT JOIN amenity_mapping m ON LOWER(a) = m.old_key
)
WHERE amenities IS NOT NULL;

-- 3. Нормализовать district (capitalize)
UPDATE properties
SET district = initcap(district)
WHERE district IS NOT NULL;
```

---

## Файлы для изменения

| Файл | Тип изменения |
|------|---------------|
| `src/lib/propertyTaxonomy.ts` | Расширить (алиасы, нормализация) |
| `src/hooks/usePropertyFormOptions.ts` | Создать новый |
| `src/pages/owner/PropertyEditor.tsx` | Рефакторинг |
| `src/pages/vendor/VendorProperties.tsx` | Рефакторинг |
| `src/pages/property/PropertyDetail.tsx` | Обновить отображение аменитиз |
| `src/components/property/UnitSpecs.tsx` | Использовать таксономию |
| `src/components/uno/LocationSwitcher.tsx` | Использовать PHUKET_DISTRICTS |
| `supabase/migrations/xxx.sql` | Миграция данных |

---

## Ожидаемый результат

1. **Единый источник истины** — все формы, фильтры и карточки используют `propertyTaxonomy.ts`
2. **Консистентные данные** — любой ключ нормализуется к стандарту перед сохранением
3. **Фильтры работают** — `air-conditioning` в БД соответствует фильтру
4. **Легко редактировать** — добавление нового района/аменити в одном месте
5. **Профессионально** — полный охват Пхукета (22 района, 35+ аменитиз)
