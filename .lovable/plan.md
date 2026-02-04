
# План улучшения поиска недвижимости для гостей

## Обзор текущей ситуации

### Что есть сейчас:
1. **PopularFiltersCards** — жёстко захардкожены 4 района + 4 удобства, не из базы
2. **usePropertyFilterOptions** — загружает property_type, district, amenity из lookup_values
3. **property_highlights** — есть в lookup_values (13 тегов), но НЕ используются в поиске для гостей
4. **properties.highlights** — колонка НЕ существует в базе (только в TypeScript типах)
5. **instant_booking, is_featured, is_verified** — есть в базе, но не выведены как быстрые фильтры
6. **property_projects** — таблица комплексов существует, связь через project_id

### Что требуется по запросу (стиль Agoda/Airbnb):
- Мгновенное бронирование ⚡
- Пешком до пляжа 🏖️
- Полное обслуживание 🧹
- Можно с питомцами 🐕
- Новый объект ✨
- Вид на море 🌊
- Дизайнерский ремонт 💎
- Скидка/Акция 🏷️
- Выбор комплекса (The Title Legendary и др.)
- Мульти-выбор типов жилья

---

## Архитектура решения

### Источники данных для быстрых фильтров:

| Тег | Источник данных | Логика фильтрации |
|-----|-----------------|-------------------|
| Мгновенное бронирование | `properties.instant_booking = true` | Boolean поле |
| Пешком до пляжа | `lookup_values.property_highlight: beach_close` | Массив highlights |
| Вид на море | `properties.view_type = 'sea'` ИЛИ amenities contains 'sea-view' | Поле + amenities |
| Можно с питомцами | `lookup_values.amenity: pet-friendly` | Массив amenities |
| Новый объект | `properties.created_at > now() - 30 days` | Вычисляемое |
| Полное обслуживание | `lookup_values.property_highlight: full_service` | Добавить в таксономию |
| Дизайнерский ремонт | `lookup_values.property_highlight: designer_interior` | Добавить в таксономию |
| Скидка/Акция | `properties.monthly_discount > 0` ИЛИ специальный флаг | Вычисляемое |
| Проверено | `properties.is_verified = true` | Boolean поле |
| Популярное | `properties.is_featured = true` | Boolean поле |
| Комплекс X | `properties.project_id = X` | UUID связь |

---

## Фазы реализации

### Фаза 1: Миграция базы данных

**1.1 Добавить колонку highlights в таблицу properties:**
```sql
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';
```

**1.2 Расширить lookup_values новыми тегами:**
```sql
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order, is_active)
VALUES 
  ('property_highlight', 'full_service', 'Full Service', 'Полное обслуживание', '🧹', 14, true),
  ('property_highlight', 'designer_interior', 'Designer Interior', 'Дизайнерский ремонт', '💎', 15, true),
  ('property_highlight', 'pet_friendly', 'Pet Friendly', 'Можно с питомцами', '🐕', 16, true),
  ('property_highlight', 'walking_to_beach', 'Walk to Beach', 'Пешком до пляжа', '🚶', 17, true),
  ('property_highlight', 'new_listing', 'New Listing', 'Новый объект', '🆕', 18, true),
  ('property_highlight', 'special_offer', 'Special Offer', 'Акция', '🏷️', 19, true)
ON CONFLICT DO NOTHING;
```

---

### Фаза 2: Создать hook для быстрых фильтров

**Файл: `src/hooks/usePropertyQuickFilters.ts`**

Этот hook будет:
1. Загружать property_highlights из lookup_values
2. Загружать property_projects для фильтра по комплексам
3. Добавлять "вычисляемые" теги (Instant, New, Discount)
4. Группировать по категориям (Booking, Location, Features, Complexes)

```text
Структура:
interface QuickFilter {
  id: string;
  type: 'boolean' | 'highlight' | 'amenity' | 'computed' | 'project';
  labelEn: string;
  labelRu: string;
  icon: string;
  field?: string; // для boolean: 'instant_booking', 'is_verified'
  value?: string; // для highlight/amenity: value_key
  projectId?: string; // для комплексов
}
```

---

### Фаза 3: Обновить PopularFiltersCards

**Файл: `src/components/property/PopularFiltersCards.tsx`**

Заменить статический массив на динамические данные:
1. Использовать `usePropertyQuickFilters()`
2. Добавить горизонтальный scroll для всех фильтров
3. Разделить на секции: "Особенности", "Комплексы", "Районы"
4. Стиль как у Agoda — компактные чипы с иконками

```text
Визуальная структура:
┌──────────────────────────────────────────────────────┐
│ ⚡ Мгновенное  🏖️ У пляжа  🌊 Море  🐕 Питомцы  ✨ Новое │
├──────────────────────────────────────────────────────┤
│ 🏢 The Title  🏢 Laguna Park  🏢 Kamala Hills        │
└──────────────────────────────────────────────────────┘
```

---

### Фаза 4: Обновить логику фильтрации

**Файл: `src/pages/property/PropertyIndex.tsx`**

Добавить обработку новых типов фильтров:

```text
filterValues = {
  quickFilters: ['instant_book', 'sea_view', 'pet_friendly'],
  project: 'uuid-of-project',
  propertyType: ['villa', 'condo'],
  ...
}
```

Логика фильтрации:
- `instant_book` → `property.instant_booking === true`
- `sea_view` → `property.view_type === 'sea'` ИЛИ `property.amenities.includes('sea-view')` ИЛИ `property.highlights?.includes('sea_view')`
- `pet_friendly` → `property.amenities.includes('pet-friendly')`
- `new_listing` → `isAfter(property.created_at, subDays(new Date(), 30))`
- `project:uuid` → `property.project_id === uuid`

---

### Фаза 5: Обновить форму редактирования объекта

**Файлы:**
- `src/components/owner/property-manage/HighlightsSection.tsx` (создать)
- `src/pages/owner/PropertyManage.tsx` (добавить секцию)

Добавить селектор highlights для владельцев:
- Загружать опции из lookup_values (property_highlight)
- Ограничение 6 тегов (как сейчас в PropertyHighlights)
- Сохранять в `properties.highlights[]`

---

### Фаза 6: Добавить фильтр по комплексам

**Компонент: ProjectFilterSection**

Горизонтальная карусель с карточками комплексов:
```text
┌────────────┐ ┌────────────┐ ┌────────────┐
│ 🏢 Title   │ │ 🏢 Laguna  │ │ 🏢 Kamala  │
│ Legendary  │ │ Park       │ │ Hills      │
│  12 units  │ │   8 units  │ │   5 units  │
└────────────┘ └────────────┘ └────────────┘
```

При клике → фильтрация `project_id = selected`

---

## Структура файлов

### Новые файлы:
```text
src/hooks/usePropertyQuickFilters.ts      # Hook для быстрых фильтров
src/components/property/QuickFiltersRibbon.tsx  # UI компонент
src/components/property/ProjectsCarousel.tsx    # Карусель комплексов
src/components/owner/property-manage/HighlightsSection.tsx # Редактор тегов
```

### Изменяемые файлы:
```text
src/pages/property/PropertyIndex.tsx      # Интеграция фильтров
src/components/property/PopularFiltersCards.tsx # Рефакторинг
src/hooks/usePropertyFilterOptions.ts     # Добавить highlights
```

---

## Итоговый UX (Agoda/Airbnb стиль)

```text
┌─────────────────────────────────────────────────────────┐
│  🔍 Поиск жилья на Пхукете                               │
├─────────────────────────────────────────────────────────┤
│  📍 Куда · 📅 Даты · 👥 Гости          [Найти]          │
├─────────────────────────────────────────────────────────┤
│  🏠 Все  🏡 Вилла  🏢 Кондо  🏬 Апарты  ⚙️ Фильтры      │
├─────────────────────────────────────────────────────────┤
│  ⚡ Мгновенное  🏖️ У пляжа  🌊 Море  🐕 Питомцы  ✨ Новое │
│  🧹 Сервис  💎 Дизайн  🏷️ Акция  ✅ Проверено           │
├─────────────────────────────────────────────────────────┤
│  🏢 Комплексы: [Title Legendary] [Laguna] [Kamala Hills]│
├─────────────────────────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                        │
│  │Villa│ │Condo│ │House│ │Villa│ ...                    │
│  └─────┘ └─────┘ └─────┘ └─────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

## Техническое резюме

| Компонент | Действие |
|-----------|----------|
| База данных | Добавить `highlights TEXT[]` в properties |
| lookup_values | Добавить 6 новых property_highlight |
| usePropertyQuickFilters | Создать hook для динамических фильтров |
| QuickFiltersRibbon | Горизонтальные чипы с мульти-выбором |
| ProjectsCarousel | Карусель комплексов для быстрого выбора |
| PropertyIndex | Интегрировать новую логику фильтрации |
| PropertyManage | Добавить редактор highlights для владельцев |

**Преимущества:**
- Все теги редактируются через Admin Panel (lookup_values)
- Владельцы могут устанавливать highlights при листинге
- Гости видят релевантные быстрые фильтры
- Комплексы выделены отдельной секцией
- Мульти-выбор типов жилья работает
