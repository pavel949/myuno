
# План: Рефакторинг каталога на каноническую таксономию

## Проблема
Текущий `ServiceCategoryAccordion` использует неправильный источник данных:
- **Сейчас**: `useCategories()` → таблицы `category_groups` + `categories` (вертикали платформы)
- **Должно быть**: `useTaxonomy()` / `useTaxonomyHierarchy()` → таблица `lookup_values` (справочник)

Хардкод `GROUP_ICONS` и `GROUP_GRADIENTS` — антипаттерн, данные должны идти из БД.

---

## Архитектура канонической системы

```text
taxonomy_definitions (мета-справочник)
├── type_key: "home_service_domain"    → icon: "🏠", vertical: "home_services"
├── type_key: "home_service_category"  → icon: "🔧", vertical: "home_services"  
├── type_key: "yacht_type"             → icon: "🛥️", vertical: "yachts"
├── type_key: "tour_type"              → icon: "✈️", vertical: "tours"
├── type_key: "cuisine"                → icon: "🍽️", vertical: "restaurants"
└── ...

lookup_values (справочник значений)
├── lookup_type: "home_service_domain"
│   ├── maintenance (Ремонт) → icon: "🏠"
│   ├── cleaning (Уборка)    → icon: "✨"
│   ├── outdoor (Двор)       → icon: "🌿"
│   └── logistics (Переезд)  → icon: "🚚"
│
└── lookup_type: "home_service_category"
    ├── handyman   → metadata: {domain: "maintenance"}
    ├── plumbing   → metadata: {domain: "maintenance"}
    ├── electrical → metadata: {domain: "maintenance"}
    ├── home-cleaning → metadata: {domain: "cleaning"}
    └── ...
```

---

## Решение: Новый SuperAppCatalogAccordion

### Структура каталога (по вертикалям)

```text
┌─────────────────────────────────────────────────────┐
│  ⚡ БЫСТРЫЙ ДОСТУП                                  │
│  🔥 Акции | ⭐ Популярное | ❤️ Избранное | 📅 Мои записи│
├─────────────────────────────────────────────────────┤
│  📍 ВСЕ ВЕРТИКАЛИ (из taxonomy_definitions)         │
│                                                     │
│  ▼ 🛥️ Яхты                                          │
│     └── yacht_type: [Катамаран, Спидбот, ...]       │
│                                                     │
│  ▼ ✈️ Туры                                          │
│     └── tour_type: [Острова, Сафари, ...]           │
│                                                     │
│  ▼ 🍽️ Рестораны                                     │
│     └── cuisine: [Тайская, Итальянская, ...]        │
│                                                     │
│  ▼ 🔧 Домашние услуги                               │
│     ├── 🏠 Ремонт                                   │
│     │   └── [Сантехник, Электрик, Кондиционеры...]  │
│     ├── ✨ Уборка                                   │
│     │   └── [Уборка дома, Генеральная, Прачечная...] │
│     ├── 🌿 Двор                                     │
│     │   └── [Садовник, Бассейн, Мойка...]           │
│     └── 🚚 Переезд                                  │
│         └── [Переезд, Доставка воды, Авто...]       │
│                                                     │
│  ▼ 🚗 Транспорт                                     │
│     └── vehicle_type: [Авто, Мото, Велосипед...]    │
│                                                     │
│  ▼ 🏥 Медицина                                      │
│     └── (простой переход)                           │
│                                                     │
│  ... (другие вертикали)                             │
└─────────────────────────────────────────────────────┘
```

---

## Файлы для создания

| Файл | Описание |
|------|----------|
| `src/components/services/drawer/SuperAppCatalogAccordion.tsx` | Новый аккордеон на основе `useTaxonomyDefinitions` + `useTaxonomyHierarchy` |
| `src/hooks/useSuperAppCatalog.ts` | Хук для агрегации данных каталога из разных таксономий |

## Файлы для редактирования

| Файл | Изменения |
|------|-----------|
| `src/components/services/ServiceCategoryDrawer.tsx` | Заменить `ServiceCategoryAccordion` на `SuperAppCatalogAccordion` |
| `src/components/services/drawer/index.ts` | Экспорт нового компонента |

---

## Детали реализации

### 1. Хук `useSuperAppCatalog.ts`

```typescript
// Агрегирует данные из taxonomy_definitions и lookup_values
// для построения структуры каталога

export function useSuperAppCatalog() {
  const { groupedByVertical } = useTaxonomyDefinitions();
  
  // Для каждой вертикали загружаем её категории
  const yachtTypes = useTaxonomy('yacht_type');
  const tourTypes = useTaxonomy('tour_type');
  const cuisines = useTaxonomy('cuisine');
  const serviceDomains = useTaxonomy('home_service_domain');
  const serviceCategories = useTaxonomy('home_service_category');
  const vehicleTypes = useTaxonomy('vehicle_type');
  // ...
  
  // Структурируем для отображения
  const catalog: CatalogSection[] = [
    {
      id: 'yachts',
      icon: '🛥️',
      nameEn: 'Yachts',
      nameRu: 'Яхты',
      path: '/yachts',
      children: yachtTypes.options.map(opt => ({
        id: opt.value,
        label: language === 'ru' ? opt.labelRu : opt.labelEn,
        icon: opt.icon,
        path: `/yachts?type=${opt.value}`,
      })),
    },
    {
      id: 'home_services',
      icon: '🔧',
      nameEn: 'Home Services',
      nameRu: 'Домашние услуги',
      // Двухуровневая иерархия: домены → категории
      children: serviceDomains.options.map(domain => ({
        id: domain.value,
        label: language === 'ru' ? domain.labelRu : domain.labelEn,
        icon: domain.icon,
        children: serviceCategories.options
          .filter(cat => cat.metadata?.domain === domain.value)
          .map(cat => ({
            id: cat.value,
            label: language === 'ru' ? cat.labelRu : cat.labelEn,
            icon: cat.icon,
            path: `/services?category=${cat.value}`,
          })),
      })),
    },
    // ... другие вертикали
  ];
  
  return { catalog, isLoading };
}
```

### 2. Компонент `SuperAppCatalogAccordion.tsx`

```tsx
// Использует useSuperAppCatalog для построения UI
// Поддерживает:
// - Простые вертикали (1 уровень: Яхты → типы яхт)
// - Сложные вертикали (2 уровня: Домашние услуги → Домены → Категории)
// - Поиск по всем уровням
// - Счётчики провайдеров/услуг из БД

export function SuperAppCatalogAccordion({ searchQuery, onNavigate }) {
  const { catalog, isLoading } = useSuperAppCatalog();
  const { language } = useLanguage();
  
  // Иконки и градиенты берутся из taxonomy_definitions.icon
  // НЕ хардкодятся в компоненте!
  
  return (
    <Accordion type="multiple">
      {catalog.map(section => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger>
            <span>{section.icon}</span>
            <span>{language === 'ru' ? section.nameRu : section.nameEn}</span>
            <Badge>{section.children.length}</Badge>
          </AccordionTrigger>
          <AccordionContent>
            {/* Рекурсивный рендер для вложенных уровней */}
            <CatalogChildren items={section.children} onNavigate={onNavigate} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

### 3. Маппинг вертикаль → таксономия

```typescript
// В useSuperAppCatalog.ts

const VERTICAL_TAXONOMY_MAP: Record<string, string[]> = {
  yachts: ['yacht_type', 'yacht_experience', 'yacht_amenity'],
  tours: ['tour_type'],
  restaurants: ['cuisine', 'restaurant_feature', 'dietary_option'],
  home_services: ['home_service_domain', 'home_service_category'],
  transport: ['vehicle_type', 'fuel_type', 'transmission_type'],
  property: ['property_type', 'district', 'amenity'],
  events: ['event_category'],
  medical: [], // Простой переход без подкатегорий
  pets: ['pet_type'],
  // ...
};
```

---

## Преимущества

1. **0 хардкода** — все данные из `taxonomy_definitions` и `lookup_values`
2. **Единый источник правды** — каноническая система таксономий
3. **Админ-редактируемость** — добавление категорий через AdminTaxonomyManager
4. **Иерархия** — поддержка 1-2-3 уровневых структур
5. **Консистентность** — одни и те же данные в каталоге, фильтрах, формах

---

## Миграционный путь

1. Создать `useSuperAppCatalog.ts` — агрегация данных
2. Создать `SuperAppCatalogAccordion.tsx` — новый компонент
3. Заменить в `ServiceCategoryDrawer.tsx`
4. Удалить хардкод `GROUP_ICONS`, `GROUP_GRADIENTS`
5. Опционально: Удалить старый `ServiceCategoryAccordion.tsx`

---

## Связи с БД

```text
taxonomy_definitions
│
├── type_key: "home_service_domain"
│   vertical: "home_services"
│   icon: "🔧"
│
└── type_key: "home_service_category"
    vertical: "home_services"
    icon: "🛠️"
    metadata_schema: {fields: ["domain"]}
         │
         ▼
    lookup_values
    ├── value_key: "handyman", metadata: {domain: "maintenance"}
    ├── value_key: "plumbing", metadata: {domain: "maintenance"}
    ├── value_key: "home-cleaning", metadata: {domain: "cleaning"}
    └── ...
```

---

## Результат

- **Каталог на основе канонической таксономии** (не хардкод)
- **Вертикали из `taxonomy_definitions`** (yachts, tours, restaurants, home_services...)
- **Категории из `lookup_values`** с parent-child иерархией через metadata
- **Иконки и названия из БД** — редактируются в Admin
- **Единообразие** — те же данные что в формах, фильтрах, админке
