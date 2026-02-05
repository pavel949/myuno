
# План: Объединение таблиц недвижимости

## Резюме решения

Предлагается **объединить таблицы `owner_properties` и `properties` в одну таблицу** с разграничением доступа через RLS-политики и view'ы. Это устранит дублирование данных и решит проблему "один объект = аренда + продажа".

---

## Архитектура: До и После

### Текущее состояние (ДВЕ таблицы)
```text
┌─────────────────────────┐     ┌───────────────────────┐
│    owner_properties     │────▶│      properties       │
│  (Бэк-офис владельца)   │ 1:1 │  (Витрина маркетп.)  │
├─────────────────────────┤     ├───────────────────────┤
│ owner_id                │     │ provider_id           │
│ purchase_price          │     │ listing_type          │
│ ical_token              │     │ rating, review_count  │
│ house_rules             │     │ is_active, is_featured│
│ electricity_*, water_*  │     │ price, currency       │
│ 115+ полей              │     │ 20+ полей             │
└─────────────────────────┘     └───────────────────────┘
     ↓ sync trigger ↓
```

### Целевое состояние (ОДНА таблица + Views)
```text
┌──────────────────────────────────────────────────────────┐
│                 unified_properties                        │
│  (ВСЕ данные: и бэк-офис, и маркетплейс)                │
├──────────────────────────────────────────────────────────┤
│ id, owner_id (nullable), provider_id (nullable)          │
│ listing_modes: text[] = ['rent', 'sale']  ◀── массив!   │
│ price (для аренды), sale_price (для продажи)             │
│ is_active, is_featured, rating, review_count             │
│ house_rules, electricity_*, water_*, ical_token          │
│ purchase_price, acquisition_costs (скрыто от витрины)    │
└──────────────────────────────────────────────────────────┘
          ↓                          ↓
┌─────────────────────┐    ┌─────────────────────────┐
│ v_owner_properties  │    │ v_marketplace_listings  │
│ (VIEW для владельца)│    │ (VIEW для гостей)       │
│ ВСЕ поля            │    │ Только публичные поля   │
│ RLS: owner_id=user  │    │ Без финансов/документов │
└─────────────────────┘    └─────────────────────────┘
```

---

## Шаги реализации

### Шаг 1: Расширение таблицы `properties`
Добавляем недостающие поля из `owner_properties`:

```sql
ALTER TABLE properties
  -- Ownership
  ADD COLUMN owner_id uuid REFERENCES auth.users(id),
  ADD COLUMN management_type text,
  ADD COLUMN ownership_type text,
  -- Listing modes (решает проблему rent+sale)
  ADD COLUMN listing_modes text[] DEFAULT ARRAY['rent'],
  ADD COLUMN sale_price numeric,
  ADD COLUMN sale_currency text DEFAULT 'THB',
  -- All rental terms (70+ полей)
  ADD COLUMN house_rules text,
  ADD COLUMN electricity_included boolean,
  -- ... остальные поля из owner_properties
  -- Financial (только для owner view)
  ADD COLUMN purchase_price numeric,
  ADD COLUMN acquisition_costs numeric,
  ADD COLUMN ical_token text;
```

### Шаг 2: Миграция данных
```sql
-- Копируем данные из owner_properties в properties
UPDATE properties p
SET 
  owner_id = op.owner_id,
  house_rules = op.house_rules,
  electricity_included = op.electricity_included,
  -- ...все остальные поля
FROM owner_properties op
WHERE op.marketplace_property_id = p.id;

-- Добавляем объекты без marketplace_property_id
INSERT INTO properties (...)
SELECT ... FROM owner_properties 
WHERE marketplace_property_id IS NULL;
```

### Шаг 3: Создание View для разграничения доступа
```sql
-- View для владельцев (все поля)
CREATE VIEW v_owner_properties AS
SELECT * FROM properties
WHERE owner_id IS NOT NULL;

-- View для маркетплейса (скрываем финансы)
CREATE VIEW v_marketplace_listings AS
SELECT 
  id, title_en, title_ru, property_type, listing_modes,
  price, sale_price, bedrooms, bathrooms, area_sqm,
  cover_image, images, rating, review_count,
  is_active, is_featured, district
FROM properties
WHERE is_active = true;
```

### Шаг 4: RLS политики
```sql
-- Владелец видит свои объекты
CREATE POLICY owner_select ON properties
  FOR SELECT USING (owner_id = auth.uid());

-- Публичные листинги для всех
CREATE POLICY public_select ON properties
  FOR SELECT USING (is_active = true AND owner_id IS NULL);

-- Только владелец редактирует
CREATE POLICY owner_update ON properties
  FOR UPDATE USING (owner_id = auth.uid());
```

### Шаг 5: Рефакторинг хуков
- `useOwnerProperties` → работает с view `v_owner_properties`
- `useProperties` → работает с view `v_marketplace_listings`  
- `useVendorProperties` → работает с `properties` где `provider_id = user`

### Шаг 6: Удаление старой таблицы
```sql
DROP TABLE owner_properties CASCADE;
```

---

## Решение проблемы "Аренда + Продажа"

**До (ограничение):**
```sql
listing_type text = 'rent'  -- только один вариант
```

**После (гибкость):**
```sql
listing_modes text[] = ARRAY['rent', 'sale']  -- оба режима
price numeric        -- цена аренды
sale_price numeric   -- цена продажи
```

**В UI:**
```typescript
// Фильтр каталога теперь работает через ANY
.filter('listing_modes', 'cs', `{${mode}}`);
```

---

## Затрагиваемые файлы

### Миграции
- `supabase/migrations/XXX_unify_properties.sql` — создать

### Хуки (рефакторинг)
- `src/hooks/usePropertyCare.ts` → изменить таблицу
- `src/hooks/useOwnerProperties.ts` → использовать view
- `src/hooks/useProperties.ts` → использовать view
- `src/hooks/useVendorProperties.ts` → адаптировать

### Типы
- `src/types/property.ts` → объединить интерфейсы

### Компоненты (минимальные изменения)
- `src/lib/verticals.ts` → изменить `table: 'properties'`
- Формы уже используют канонический компонент

---

## Преимущества

| Аспект | Сейчас | После объединения |
|--------|--------|-------------------|
| Синхронизация | Триггеры, дублирование | Не нужна |
| Аренда + Продажа | Ограничено | Массив `listing_modes` |
| Количество таблиц | 2 | 1 |
| Сложность запросов | JOIN через `marketplace_property_id` | Прямые запросы |
| RLS политики | Отдельные на 2 таблицы | Единые |

---

## Риски и митигация

1. **Обратная совместимость** — создаём views с теми же именами
2. **Существующие данные** — миграция сначала копирует, потом удаляет
3. **Большая миграция** — разбиваем на 3-4 этапа

---

## Технические детали миграции

Миграция выполняется в 4 этапа:
1. Добавление новых колонок в `properties`
2. Копирование данных из `owner_properties`
3. Создание Views и RLS
4. Удаление `owner_properties`

Оценка времени: ~2-3 часа на код, тестирование отдельно.
