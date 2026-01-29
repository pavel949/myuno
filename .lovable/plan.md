
# Комплексное улучшение экосистемы для целевых аудиторий

## Текущий статус

### База данных — наполненность:
| Таблица | Записей | Статус |
|---------|---------|--------|
| tours | 24 | ✅ Хорошо |
| properties | 23 | ✅ Хорошо |
| gyms | 13 | ✅ Хорошо |
| salons | 13 | ✅ Хорошо |
| cleaning_services | 13 | ✅ Хорошо |
| education_providers | 13 | ✅ Хорошо |
| visa_services | 10 | ✅ Хорошо |
| transport_vehicle_types | 8 | ⚠️ Средне |
| restaurants | 6 | ⚠️ Требует seed |
| insurance_providers | 5 | ⚠️ Средне |
| clinics | 5 | ⚠️ Средне |
| legal_services | 3 | ⚠️ Требует seed |
| babysitters | 3 | ⚠️ Требует seed |
| pet_services | 3 | ⚠️ Требует seed |

### Проблемы в категориях:
1. **Дубликаты**: `Kids & Education` и `Home Care` встречаются по 2 раза
2. **Отсутствуют критичные для экспатов**: Banking, Veterinary clinic (не pet services), Storage/Logistics
3. **Insurance** — категория есть в коде, но отсутствует в таблице `categories`

---

## План изменений

### Часть 1: Исправление категорий в базе данных

**1.1. Добавить отсутствующие категории:**
```sql
-- Insurance - критично для резидентов
INSERT INTO categories (name_en, name_ru, slug, icon, group_id, mini_app_type, sort_order, is_active)
VALUES ('Insurance', 'Страхование', 'insurance', 'Shield', 
        (SELECT id FROM category_groups WHERE slug = 'professional'), 
        'insurance', 50, true);

-- Banking - критично для экспатов  
INSERT INTO categories (name_en, name_ru, slug, icon, group_id, mini_app_type, sort_order, is_active)
VALUES ('Banking', 'Банки', 'banking', 'Landmark', 
        (SELECT id FROM category_groups WHERE slug = 'professional'), 
        NULL, 60, true);

-- Storage - нужно владельцам
INSERT INTO categories (name_en, name_ru, slug, icon, group_id, mini_app_type, sort_order, is_active)
VALUES ('Storage', 'Хранение', 'storage', 'Warehouse', 
        (SELECT id FROM category_groups WHERE slug = 'home'), 
        NULL, 70, true);
```

**1.2. Удалить дубликаты:**
- Оставить 1 `Kids & Education` (slug: `education`)
- Оставить 1 `Home Care` (slug: `cleaning`)
- Удалить дублирующие записи `kids-education` и `services`

---

### Часть 2: Обновление системы маршрутизации

**2.1. Добавить маршрут Insurance в useCategories.ts:**

Добавить в `pathMap`:
```typescript
'insurance': '/insurance',
```

Добавить в `MINI_APP_SLUGS`:
```typescript
'insurance', 'legal',
```

---

### Часть 3: Добавить seed-данные для слабых категорий

**3.1. Restaurants (добавить 14 записей до 20):**
- Thai, Italian, Japanese, Indian, Russian cuisine
- С рейтингами, ценами, координатами

**3.2. Legal Services (добавить 7 записей до 10):**
- Иммиграционные юристы
- Нотариусы
- Бухгалтеры для бизнеса

**3.3. Transport (добавить 7 записей до 15):**
- Мотобайки
- Автомобили разных классов
- VIP трансферы

---

### Часть 4: Обновить QuickActionsGrid

**Текущие 10 действий → Оптимизация для 3 аудиторий:**

| Позиция | Сейчас | Предложение |
|---------|--------|-------------|
| 1 | Yachts | Yachts ✅ (туристы) |
| 2 | Transfer | Transfer ✅ |
| 3 | Flowers | Property (экспаты важнее) |
| 4 | Property | Food ✅ |
| 5 | Food | Tours ✅ |
| 6 | Tours | Medical ✅ |
| 7 | Medical | Legal + Visa (экспаты) |
| 8 | SOS | SOS ✅ |
| 9 | Market | Insurance (экспаты) |
| 10 | More | More → Discover |

---

### Часть 5: Добавить фильтрацию по аудитории в Discover

**5.1. Новые вкладки на странице каталога:**
- `Все` (текущее)
- `Туристам` — Yachts, Tours, Transport, Events, Water, Restaurants
- `Резидентам` — Legal, Insurance, Medical, Banking, Property, Education
- `Владельцам` — Property, Cleaning, Services, Legal

---

### Часть 6: Добавить иконки в iconMap

В `src/hooks/useCategories.ts` добавить:
```typescript
Shield: LucideIcons.Shield,      // Insurance
Landmark: LucideIcons.Landmark,   // Banking
Warehouse: LucideIcons.Warehouse, // Storage
```

---

## Изменяемые файлы

| Файл | Действие |
|------|----------|
| **База данных** | Миграция: добавить категории Insurance, Banking, Storage |
| **База данных** | Миграция: удалить дубликаты категорий |
| **База данных** | Seed: 14 ресторанов, 7 юр.услуг, 7 транспорта |
| `src/hooks/useCategories.ts` | Добавить iconMap + pathMap для новых категорий |
| `src/components/home/QuickActionsGrid.tsx` | Перегруппировать для 3 аудиторий |
| `src/pages/Discover.tsx` | Добавить фильтрацию по аудитории |

---

## Технические детали миграций

### SQL: Добавление категорий
```sql
-- 1. Insurance category
INSERT INTO categories (id, name_en, name_ru, slug, icon, group_id, mini_app_type, sort_order, is_active, is_new)
SELECT 
  gen_random_uuid(),
  'Insurance', 'Страхование', 'insurance', 'Shield',
  id, 'insurance', 45, true, true
FROM category_groups WHERE slug = 'professional';

-- 2. Banking category  
INSERT INTO categories (id, name_en, name_ru, slug, icon, group_id, sort_order, is_active, is_new)
SELECT 
  gen_random_uuid(),
  'Banking & Finance', 'Банки и Финансы', 'banking', 'Landmark',
  id, 55, true, true
FROM category_groups WHERE slug = 'professional';
```

### SQL: Удаление дубликатов
```sql
-- Keep education, delete kids-education  
DELETE FROM categories WHERE slug = 'kids-education';

-- Keep cleaning, delete services (duplicate Home Care)
DELETE FROM categories WHERE slug = 'services' AND name_en = 'Home Care';
```

---

## Ожидаемый результат

1. **Каталог без дубликатов** — чистая навигация
2. **Покрытие всех аудиторий**:
   - Туристы: 8+ категорий
   - Резиденты: 10+ категорий (включая Banking, Insurance)
   - Владельцы: 6+ категорий
3. **Seed-данные** — минимум 10+ записей в каждой активной категории
4. **Фильтрация в Discover** — быстрый доступ к релевантным услугам

