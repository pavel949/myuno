
# План исправлений системы ввода данных

## Резюме проблем

| Проблема | Влияние | Приоритет |
|----------|---------|-----------|
| 16 провайдеров без `marketplace_vendor_id` | Не могут продавать товары | P0 |
| 36 яхт без `provider_id` | Невидимы в vendor dashboard | P0 |
| `bulk-import` — 9 таблиц vs 20+ в mapping | AI intake ломается для clinics, gyms, etc. | P0 |
| Рассинхрон таблиц между Edge Functions | intake-listing-agent имеет 24+ вертикали, bulk-import — только 9 | P1 |

---

## Фаза 1: Синхронизация Edge Functions (P0)

### 1.1 Обновление `bulk-import/index.ts`

**Текущее состояние (строки 10-20):**
```typescript
const ALLOWED_TABLES = [
  'providers',
  'marketplace_products',
  'marketplace_vendors',
  'restaurants',
  'salons',
  'yachts',
  'tours',
  'services',
  'properties',
];
```

**Исправление — добавить все таблицы из `providerIdMapping.ts`:**
```typescript
const ALLOWED_TABLES = [
  // Core
  'providers',
  'marketplace_products',
  'marketplace_vendors',
  'vendor_services',
  
  // Verticals
  'yachts',
  'tours',
  'water_activities',
  'restaurants',
  'salons',
  'clinics',
  'gyms',
  'vehicles',
  'babysitters',
  'cleaning_providers',
  'pet_services',
  'lawyers',
  'education_centers',
  'properties',
  'owner_properties',
  'flower_shops',
  'bouquets',
  'user_listings',
  
  // Deprecated but may have data
  'services',
];
```

### 1.2 Добавить provider_id mapping в bulk-import

Добавить поддержку правильного FK на основе таблицы:
```typescript
const PROVIDER_ID_FIELD: Record<string, string> = {
  'marketplace_products': 'vendor_id',
  'vendor_services': 'provider_id',
  'bouquets': 'shop_id',
  'owner_properties': 'owner_id',
  'user_listings': 'user_id',
  // Default: 'provider_id'
};

function getProviderField(table: string): string {
  return PROVIDER_ID_FIELD[table] || 'provider_id';
}
```

---

## Фаза 2: Миграция legacy данных (P0)

### 2.1 SQL скрипт для orphan providers

Создать marketplace_vendor для каждого провайдера без связи:

```sql
-- Для каждого провайдера без marketplace_vendor создаём запись
INSERT INTO marketplace_vendors (slug, name_en, name_ru, is_active, is_verified)
SELECT 
  LOWER(REGEXP_REPLACE(p.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(p.id::text, 1, 8),
  p.name,
  COALESCE(p.name_ru, p.name),
  p.is_active,
  p.is_verified
FROM providers p
WHERE p.marketplace_vendor_id IS NULL;

-- Связать обратно
UPDATE providers p
SET marketplace_vendor_id = mv.id
FROM marketplace_vendors mv
WHERE mv.slug LIKE LOWER(REGEXP_REPLACE(p.name, '[^a-zA-Z0-9]+', '-', 'g')) || '-%'
  AND p.marketplace_vendor_id IS NULL;
```

### 2.2 SQL скрипт для orphan yachts

Присвоить системного провайдера или первого активного:

```sql
-- Получить ID первого активного провайдера с яхтами
WITH system_provider AS (
  SELECT id FROM providers 
  WHERE is_active = true 
  ORDER BY created_at ASC 
  LIMIT 1
)
UPDATE yachts 
SET provider_id = (SELECT id FROM system_provider)
WHERE provider_id IS NULL;
```

---

## Фаза 3: Валидация и защита (P1)

### 3.1 Добавить проверку в useIntakeAgent

Уже реализовано в предыдущем commit — проверить что работает:
```typescript
// P0 FIX: Validate table before calling bulk-import
if (!isValidIntakeTable(item.detectedVertical)) {
  const errorMsg = `Unknown vertical table: ${item.detectedVertical}`;
  toast.error(errorMsg);
  return false;
}
```

### 3.2 Синхронизировать VERTICALS в intake-listing-agent

Убедиться что все таблицы из VERTICALS массива (строки 10-35 в edge function) присутствуют в ALLOWED_TABLES bulk-import.

---

## Файлы для изменения

| Файл | Действие | Описание |
|------|----------|----------|
| `supabase/functions/bulk-import/index.ts` | Редактирование | Расширить ALLOWED_TABLES до 20+ таблиц |
| Database | SQL Insert | Миграция 16 orphan providers |
| Database | SQL Update | Миграция 36 orphan yachts |

---

## Проверочный чеклист после реализации

1. [ ] Edge function bulk-import поддерживает все 20+ вертикалей
2. [ ] Все 16 providers имеют marketplace_vendor_id
3. [ ] Все 36 yachts имеют provider_id  
4. [ ] AI Intake создаёт записи для clinics, gyms, pet_services
5. [ ] Vendor dashboard показывает все записи провайдера

---

## Важные ограничения

- **НЕ трогаем** `useVendor.ts` — уже содержит P0 fix для новых провайдеров
- **НЕ трогаем** `useCanonicalSubmit.ts` — уже использует mapping
- **НЕ трогаем** `providerIdMapping.ts` — источник истины для таблиц
- Миграция данных выполняется через SQL Insert tool, не через миграции схемы
