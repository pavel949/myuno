
# Taxonomy Management Center (Центр Управления Таксономиями)

## Обзор ситуации

### Текущее состояние: Хаос разрозненных источников

Таксономии платформы myUNO сейчас распределены по **3 разным источникам**:

| Источник | Что там | Проблема |
|----------|---------|----------|
| **TypeScript файлы** | 600+ строк в `propertyTaxonomy.ts`, 180+ в `homeServicesTaxonomy.ts`, 180+ в `transportTaxonomy.ts`, 728+ в `intakeVerticals.ts` | Изменения требуют деплоя |
| **Таблица `lookup_values`** | 128 записей (14 кухонь, 22 района, 12 удобств и др.) | Частично работает, но не покрывает все вертикали |
| **Hardcoded в компонентах** | Фильтры яхт, туров, транспорта в `filterConfigs/` | Дублирование, невозможно редактировать |

### Целевое состояние: Single Source of Truth

**Таблица `lookup_values`** становится единственным источником правды для ВСЕХ таксономий платформы. Администратор управляет всем из одного интерфейса.

---

## Архитектура решения

### Принцип работы

```
Администратор → AdminTaxonomyManager → lookup_values (БД)
                                              ↓
                       useTaxonomy('property_type') ← Все компоненты
```

### Что нужно сделать

**Этап 1: Расширение схемы (Мета-таксономия)**

Создать таблицу `taxonomy_definitions` — описание САМИХ справочников:

| Поле | Описание |
|------|----------|
| `type_key` | Уникальный ключ (property_type, yacht_type) |
| `name_en` / `name_ru` | Название для UI |
| `icon` | Иконка категории |
| `vertical` | К какой вертикали относится (property, yachts, transport) |
| `supports_hierarchy` | Поддерживает ли вложенность |
| `supports_metadata` | Какие мета-поля доступны |
| `is_system` | Системный справочник (нельзя удалить) |

**Этап 2: Миграция данных**

Перенести все константы из TypeScript в БД:

| Файл | Что переносим | Новый lookup_type |
|------|---------------|-------------------|
| `propertyTaxonomy.ts` | PROPERTY_TYPES (8) | `property_type` ✓ уже есть |
| `propertyTaxonomy.ts` | PHUKET_DISTRICTS (22) | `district` ✓ уже есть |
| `propertyTaxonomy.ts` | ALL_AMENITIES (35+) | `amenity` (расширить) |
| `propertyTaxonomy.ts` | INCLUDED_SERVICES (15) | `included_service` ✓ |
| `propertyTaxonomy.ts` | EXTRA_SERVICES (15) | `extra_service` ✓ |
| `propertyTaxonomy.ts` | PROPERTY_HIGHLIGHTS (13) | `property_highlight` ✓ |
| `propertyTaxonomy.ts` | VIEW_TYPES (7) | `view_type` NEW |
| `propertyTaxonomy.ts` | FURNISHING_LEVELS (4) | `furnishing_level` NEW |
| `propertyTaxonomy.ts` | KEY_HANDOVER_METHODS (4) | `key_handover_method` NEW |
| `propertyTaxonomy.ts` | DEPOSIT_TYPES (4) | `deposit_type` NEW |
| `propertyTaxonomy.ts` | CLEANING_FREQUENCIES (6) | `cleaning_frequency` NEW |
| `propertyTaxonomy.ts` | PAYMENT_MODELS (4) | `payment_model` NEW |
| `propertyTaxonomy.ts` | HOUSE_RULES_PRESETS (10+) | `house_rule` NEW |
| `homeServicesTaxonomy.ts` | SERVICE_DOMAINS (4) + CATEGORIES (16) | `home_service_domain`, `home_service_category` |
| `transportTaxonomy.ts` | VEHICLE_CATEGORIES (7) | `vehicle_type` → расширить |
| `transportTaxonomy.ts` | FUEL_TYPES (4) | `fuel_type` NEW |
| `transportTaxonomy.ts` | TRANSMISSION_TYPES (2) | `transmission_type` NEW |
| `transportTaxonomy.ts` | VEHICLE_FEATURES (12) | `vehicle_feature` NEW |

**Итого**: ~30 типов справочников, ~300+ значений

**Этап 3: Новый интерфейс администратора**

Заменить текущий `AdminLookups.tsx` на полноценный **Taxonomy Manager**:

### Структура интерфейса

```
┌─────────────────────────────────────────────────────────────┐
│  Taxonomy Manager                              [+ Add Type] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📦 Property          🚗 Transport         🏠 Home Services │
│  ├─ Types (8)         ├─ Categories (7)    ├─ Domains (4)   │
│  ├─ Districts (22)    ├─ Fuel (4)          └─ Categories    │
│  ├─ Amenities (35)    ├─ Transmission (2)      (16)         │
│  ├─ Views (7)         └─ Features (12)                      │
│  ├─ Highlights (13)                                         │
│  └─ Rules (10)        🚤 Yachts            🍽 Restaurants   │
│                       └─ Types (6)          └─ Cuisines(14) │
│  📍 General                                                 │
│  ├─ Districts (22)    🎯 Tours             🏥 Medical       │
│  └─ Languages         └─ Types (12)         └─ Specialties  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Selected: Property → Amenities]                           │
│                                                             │
│  ┌──────┬────────────┬──────────────┬────┬────────┐        │
│  │ ⋮⋮   │ ID         │ EN / RU      │ 🔘 │ Actions│        │
│  ├──────┼────────────┼──────────────┼────┼────────┤        │
│  │ ⋮⋮   │ pool       │ Pool/Бассейн │ ✓  │ ✏️ 🗑  │        │
│  │ ⋮⋮   │ wifi       │ WiFi/WiFi    │ ✓  │ ✏️ 🗑  │        │
│  │ ⋮⋮   │ gym        │ Gym/Зал      │ ✓  │ ✏️ 🗑  │        │
│  └──────┴────────────┴──────────────┴────┴────────┘        │
│                                                             │
│  [+ Add Value]  [🤖 AI Import]  [📤 Export]  [📥 Import]   │
└─────────────────────────────────────────────────────────────┘
```

### Ключевые фичи

1. **Иерархический браузер** — навигация по вертикалям и типам
2. **Drag-and-drop сортировка** — изменение порядка отображения
3. **Inline-редактирование** — быстрое изменение названий
4. **AI-перевод** — автоматический перевод EN↔RU
5. **AI Import** — вставь текст, получи структурированные данные
6. **Bulk Actions** — массовое включение/отключение
7. **Metadata Editor** — редактирование доп. полей (popular, zone, category)
8. **Preview** — как будет выглядеть в фильтрах/формах

**Этап 4: Универсальный хук**

Создать `useTaxonomy(type)` для использования во всех компонентах:

```typescript
// Вместо импорта констант
import { PROPERTY_TYPES } from '@/lib/propertyTaxonomy';

// Используем динамический хук
const { options, isLoading } = useTaxonomy('property_type');
```

### Преимущества хука:
- Кеширование через React Query
- Автоматическое обновление при изменениях в БД
- Поддержка иерархии (parent_id)
- Фильтрация по метаданным

**Этап 5: Рефакторинг компонентов**

Поэтапная замена жестко заданных данных:

| Приоритет | Компонент | Текущий источник | Новый источник |
|-----------|-----------|------------------|----------------|
| P0 | PropertyFilters | `propertyTaxonomy.ts` | `useTaxonomy()` |
| P0 | OwnerPropertyForm | `propertyTaxonomy.ts` | `useTaxonomy()` |
| P1 | YachtFilters | `filterConfigs/yachtFiltersKlook.ts` | `useTaxonomy('yacht_type')` |
| P1 | TransportFilters | `filterConfigs/transportFiltersKlook.ts` | `useTaxonomy('vehicle_type')` |
| P2 | HomeServiceCategories | `homeServicesTaxonomy.ts` | `useTaxonomy('home_service_category')` |
| P2 | RestaurantFilters | `restaurantFiltersKlook.ts` | `useTaxonomy('cuisine')` |

---

## Технические детали

### Новые файлы

| Файл | Назначение |
|------|------------|
| `src/pages/admin/AdminTaxonomyManager.tsx` | Главная страница управления |
| `src/components/admin/taxonomy/TaxonomyBrowser.tsx` | Дерево навигации по типам |
| `src/components/admin/taxonomy/TaxonomyValueEditor.tsx` | Редактор значений |
| `src/components/admin/taxonomy/TaxonomyBulkActions.tsx` | Массовые операции |
| `src/components/admin/taxonomy/TaxonomyAIImport.tsx` | AI-импорт данных |
| `src/hooks/useTaxonomy.ts` | Универсальный хук для всех компонентов |
| `src/hooks/useTaxonomyDefinitions.ts` | Хук для мета-данных о типах |

### Изменения в БД

```sql
-- Таблица определений таксономий
CREATE TABLE taxonomy_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ru TEXT,
  icon TEXT,
  vertical TEXT, -- 'property', 'transport', 'yachts', 'general'
  supports_hierarchy BOOLEAN DEFAULT false,
  metadata_schema JSONB, -- какие мета-поля поддерживаются
  is_system BOOLEAN DEFAULT false, -- нельзя удалить
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индекс для lookup_values по иерархии
CREATE INDEX idx_lookup_values_parent ON lookup_values(parent_id) WHERE parent_id IS NOT NULL;

-- Наполнение taxonomy_definitions
INSERT INTO taxonomy_definitions (type_key, name_en, name_ru, icon, vertical, is_system) VALUES
('property_type', 'Property Types', 'Типы недвижимости', '🏠', 'property', true),
('district', 'Districts', 'Районы', '📍', 'general', true),
('amenity', 'Amenities', 'Удобства', '✨', 'property', true),
-- ... и остальные ~30 типов
```

### Миграция данных из TypeScript

```typescript
// Скрипт миграции (Edge Function или разовый запуск)
const migratePropertyTaxonomy = async () => {
  const PROPERTY_TYPES = [...]; // из propertyTaxonomy.ts
  
  for (const item of PROPERTY_TYPES) {
    await supabase.from('lookup_values').upsert({
      lookup_type: 'property_type',
      value_key: item.id,
      value_en: item.labelEn,
      value_ru: item.labelRu,
      icon: item.icon,
      metadata: { popular: item.popular },
      is_active: true,
    }, { onConflict: 'lookup_type,value_key' });
  }
};
```

---

## План реализации

### Фаза 1: Инфраструктура (1 сессия)
1. Создать таблицу `taxonomy_definitions`
2. Создать `useTaxonomy` хук с кешированием
3. Наполнить `taxonomy_definitions` метаданными о 30 типах

### Фаза 2: Интерфейс администратора (1-2 сессии)
1. Создать `AdminTaxonomyManager.tsx` с иерархическим браузером
2. Реализовать редактор значений с drag-and-drop
3. Интегрировать AI-перевод и AI-импорт
4. Добавить bulk actions

### Фаза 3: Миграция данных (1 сессия)
1. Перенести данные из `propertyTaxonomy.ts`
2. Перенести данные из `homeServicesTaxonomy.ts`
3. Перенести данные из `transportTaxonomy.ts`
4. Верифицировать целостность

### Фаза 4: Рефакторинг фронтенда (2-3 сессии)
1. Заменить импорты в Property компонентах
2. Заменить импорты в Transport компонентах
3. Заменить импорты в Home Services компонентах
4. Удалить старые TypeScript файлы

---

## Ожидаемый результат

### Для администратора
- Добавление нового района Пхукета — **30 секунд** (сейчас: деплой)
- Изменение иконки типа недвижимости — **5 секунд** (сейчас: деплой)
- Добавление новой категории услуг — **1 минута** (сейчас: невозможно)
- Массовая деактивация устаревших опций — **10 секунд** (сейчас: правка кода)

### Для разработки
- Единый источник правды — меньше багов
- Нет дублирования данных
- Проще добавлять новые вертикали
- Автоматические типы через Supabase

### Для платформы
- Гибкость без деплоев
- A/B тестирование опций фильтров
- Локализация управляется без кода
- Готовность к мульти-городам (city_id уже есть)

---

## Вопросы для уточнения

Перед началом реализации:

1. **Приоритет вертикалей**: Какие справочники нужны в первую очередь? (Property, Transport, Home Services, все сразу?)

2. **Иерархия**: Нужна ли поддержка вложенных категорий? (Домен → Категория → Подкатегория)

3. **Права доступа**: Кто может редактировать таксономии? (Только superadmin или определенные роли?)
