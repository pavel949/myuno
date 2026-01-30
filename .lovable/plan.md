

# План: Расширение маппингов персон для AI-персонализации

## Обзор

"Обучение" AI в данном случае = обновление конфигурационных данных в двух местах:
1. **Edge Function** (`ai-personalize-home`) — для AI-рекомендаций и категорий
2. **QuickActionsGrid** — для быстрых действий на главном экране

AI не требует отдельного обучения — он работает на основе маппингов, которые мы определяем.

## Текущие vs Новые маппинги

### Турист (Tourist)

| Текущие | Ваши требования |
|---------|-----------------|
| yachts, tours, restaurants, events, water, transport, beauty, flowers | property (аренда), transport (авто/байки), yachts, tours, flowers, market (продукты), beauty (массаж), events, exchange (обмен валют) |

**Новый список:**
- `property` — Аренда жилья
- `transport` — Авто и байки
- `yachts` — Яхты
- `tours` — Туры и экскурсии
- `flowers` — Цветы
- `market` — Продукты и маркет
- `beauty` — Массаж и SPA
- `events` — Мероприятия
- `exchange` — Обмен валют

### Резидент (Resident)

| Текущие | Ваши требования |
|---------|-----------------|
| visa, medical, legal, insurance, banking, education, pharmacy, property | visa, property (аренда), education (школы, сады, репетиторы) |

**Новый список:**
- `visa` — Визы и документы
- `property` — Аренда жилья
- `education` — Школы, детсады, репетиторы
- `medical` — Медицина
- `legal` — Юридические услуги
- `insurance` — Страховки
- `banking` — Банки

### Владелец (Property Owner)

| Текущие | Ваши требования |
|---------|-----------------|
| property, legal, insurance, services, cleaning, visa | services (обслуживание), property-management (УК), rental (управление арендой) |

**Новый список:**
- `services` — Обслуживание объекта (клининг, ремонт)
- `property-management` — Поиск управляющей компании
- `rental` — Управление арендой
- `legal` — Юридические услуги
- `insurance` — Страховка объекта

## Файлы для изменения

### 1. Edge Function: `supabase/functions/ai-personalize-home/index.ts`

Обновить `PERSONA_CATEGORIES`:
```typescript
const PERSONA_CATEGORIES: Record<UserPersona, string[]> = {
  tourist: [
    'property',      // Аренда жилья
    'transport',     // Авто и байки  
    'yachts',        // Яхты
    'tours',         // Туры
    'flowers',       // Цветы
    'market',        // Продукты
    'beauty',        // Массаж/SPA
    'events',        // Мероприятия
    'exchange',      // Обмен валют
  ],
  resident: [
    'visa',          // Визы
    'property',      // Аренда жилья
    'education',     // Школы, сады, репетиторы
    'medical',       // Медицина
    'legal',         // Юристы
    'insurance',     // Страховки
    'banking',       // Банки
  ],
  property_owner: [
    'services',      // Обслуживание объекта
    'property-management', // Поиск УК
    'rental',        // Управление арендой
    'legal',         // Юридические услуги
    'insurance',     // Страховка объекта
    'cleaning',      // Клининг
  ],
};
```

Обновить `PERSONA_SERVICES` с релевантными рекомендациями:
```typescript
const PERSONA_SERVICES: Record<UserPersona, Array<...>> = {
  tourist: [
    { id: 'villa-rental', reasonRu: 'Лучшие виллы на острове' },
    { id: 'bike-rental', reasonRu: 'Удобное передвижение' },
    { id: 'yacht-charter', reasonRu: 'Незабываемый отдых на воде' },
    { id: 'island-tour', reasonRu: 'Откройте красоты острова' },
    { id: 'spa-massage', reasonRu: 'Расслабление и релакс' },
  ],
  resident: [
    { id: 'visa-extension', reasonRu: 'Продление визы без проблем' },
    { id: 'international-school', reasonRu: 'Лучшие школы для детей' },
    { id: 'long-term-rental', reasonRu: 'Жильё на долгий срок' },
  ],
  property_owner: [
    { id: 'property-management-company', reasonRu: 'Доверьте управление профессионалам' },
    { id: 'rental-management', reasonRu: 'Максимальный доход от аренды' },
    { id: 'maintenance-service', reasonRu: 'Обслуживание вашего объекта' },
  ],
};
```

### 2. QuickActionsGrid: `src/components/home/QuickActionsGrid.tsx`

Обновить массивы `TOURIST_ACTIONS`, `RESIDENT_ACTIONS`, `OWNER_ACTIONS` с новыми иконками и путями.

Добавить новые действия:
- `Exchange` (обмен валют) — иконка `Banknote`, путь `/exchange`
- `Market` (продукты) — уже есть
- `Rental Management` — путь `/property/management`

## Результат

После обновления:
- **Турист** увидит: Жильё, Транспорт, Яхты, Туры, Цветы, Маркет, Массаж, События, Обмен
- **Резидент** увидит: Визы, Жильё, Образование, Медицина, Юрист, Страховка, Банки
- **Владелец** увидит: Обслуживание, УК, Управление арендой, Юрист, Страховка

При комбинации персон (например, Турист + Владелец) AI объединит релевантные категории с приоритетом по частоте появления.

