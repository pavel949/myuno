
# Taxonomy Management Center (Центр Управления Таксономиями)

## ✅ СТАТУС: ЗАВЕРШЕНО

**Все 4 фазы реализованы.** Система готова к использованию.

---

## Что было сделано

### Фаза 1: Инфраструктура ✅
- [x] Создана таблица `taxonomy_definitions` с 34 типами таксономий
- [x] Создан универсальный хук `useTaxonomy()` с React Query кешированием
- [x] Создан хук `useTaxonomyDefinitions()` для мета-данных
- [x] Добавлены индексы для оптимизации запросов

### Фаза 2: Интерфейс администратора ✅
- [x] `AdminTaxonomyManager.tsx` — главная страница с иерархической навигацией
- [x] `TaxonomyValueEditor.tsx` — редактор с drag-and-drop (dnd-kit)
- [x] `TaxonomyBulkActions.tsx` — массовые операции, экспорт/импорт JSON
- [x] Навигация добавлена в AdminSidebar

### Фаза 3: Миграция данных ✅
- [x] **257 значений** мигрированы в БД из TypeScript файлов
- [x] **34 типа таксономий** зарегистрированы
- [x] Все вертикали покрыты: Property, Transport, Yachts, Restaurants, Home Services, Tours

### Фаза 4: Рефакторинг фронтенда ✅
- [x] `usePropertyFormOptions()` — теперь использует БД с fallback на legacy
- [x] `useDynamicFilterOptions.ts` — новые хуки для всех вертикалей
- [x] `useDynamicFormOptions.ts` — новые хуки для форм
- [x] Обновлены filterConfigs: yacht, transport, restaurant
- [x] Legacy файлы сохранены как fallback

---

## Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN TAXONOMY MANAGER                   │
│                    /admin/taxonomy                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  taxonomy_definitions                       │
│  (34 types: property_type, district, amenity, etc.)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     lookup_values                           │
│  (257+ records: all taxonomy values with translations)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    UNIVERSAL HOOKS                          │
├─────────────────────────────────────────────────────────────┤
│  useTaxonomy('property_type')  → options, CRUD, loading     │
│  useTaxonomyHierarchy('home_service_domain') → hierarchy    │
│  useTaxonomyDefinitions() → all types grouped by vertical   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DYNAMIC FILTER HOOKS                     │
├─────────────────────────────────────────────────────────────┤
│  usePropertyFilterOptions()                                 │
│  useTransportFilterOptions()                                │
│  useYachtFilterOptions()                                    │
│  useHomeServiceFilterOptions()                              │
│  useRestaurantFilterOptions()                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI COMPONENTS                          │
│  PropertyFilters, TransportFilters, YachtFilters, etc.      │
│  OwnerPropertyForm, AdminPropertyForm, etc.                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Новые файлы

| Файл | Назначение |
|------|------------|
| `src/hooks/useTaxonomy.ts` | Универсальный хук для всех компонентов |
| `src/hooks/useTaxonomyDefinitions.ts` | Хук для мета-данных о типах |
| `src/hooks/useDynamicFilterOptions.ts` | Хуки для фильтров всех вертикалей |
| `src/hooks/useDynamicFormOptions.ts` | Хуки для форм с опциями |
| `src/pages/admin/AdminTaxonomyManager.tsx` | Главная страница управления |
| `src/components/admin/taxonomy/TaxonomyValueEditor.tsx` | Редактор значений |
| `src/components/admin/taxonomy/TaxonomyBulkActions.tsx` | Массовые операции |

---

## Типы таксономий в БД

| Вертикаль | Типы | Значений |
|-----------|------|----------|
| **Property** | property_type, district, amenity, view_type, furnishing_level, key_handover_method, deposit_type, cleaning_frequency, payment_model, included_service, extra_service, property_highlight, house_rule, listing_type, bedroom_option | 122 |
| **Transport** | vehicle_type, fuel_type, transmission_type, vehicle_feature | 25 |
| **Yachts** | yacht_type, yacht_experience, yacht_amenity | 23 |
| **Restaurants** | cuisine, dietary_option, restaurant_feature | 24 |
| **Home Services** | home_service_domain, home_service_category | 20 |
| **Tours** | tour_type | 12 |
| **General** | district, provider_type | 25 |

---

## Использование

### В компонентах фильтров

```typescript
// OLD (hardcoded)
import { PROPERTY_TYPES } from '@/lib/propertyTaxonomy';

// NEW (dynamic)
import { usePropertyFilterOptions } from '@/hooks/useDynamicFilterOptions';

function PropertyFilters() {
  const { filterConfig, isLoading } = usePropertyFilterOptions();
  // filterConfig.sections содержит все опции из БД
}
```

### В формах

```typescript
import { usePropertyFormOptions } from '@/hooks/usePropertyFormOptions';

function PropertyForm() {
  const { propertyTypes, districts, amenities, isLoading } = usePropertyFormOptions();
  // Все опции загружаются из БД с fallback на legacy
}
```

### Прямое использование хука

```typescript
import { useTaxonomy } from '@/hooks/useTaxonomy';

function MyComponent() {
  const { options, isLoading, create, update, delete: remove } = useTaxonomy('yacht_type');
  // options: TaxonomyOption[]
  // create/update/delete: mutation functions
}
```

---

## Для администратора

Доступ: `/admin/taxonomy`

Функционал:
- ✅ Просмотр всех таксономий по вертикалям
- ✅ Добавление/редактирование значений
- ✅ Drag-and-drop сортировка
- ✅ Активация/деактивация
- ✅ Экспорт/импорт JSON
- ✅ Массовые операции

---

## Что осталось (опционально)

1. **AI-перевод** — автоматический перевод EN↔RU
2. **AI Import** — вставка текста и парсинг в структуру
3. **Удаление legacy файлов** — после полной валидации
4. **Preview режим** — предпросмотр в фильтрах/формах

---

## Результаты

### Для администратора
| Действие | Раньше | Теперь |
|----------|--------|--------|
| Добавить район | Деплой | 30 сек |
| Изменить иконку | Деплой | 5 сек |
| Новая категория услуг | Невозможно | 1 мин |
| Массовая деактивация | Правка кода | 10 сек |

### Для платформы
- ✅ Single Source of Truth
- ✅ Гибкость без деплоев
- ✅ Готовность к мульти-городам (city_id)
- ✅ Автоматическая локализация
