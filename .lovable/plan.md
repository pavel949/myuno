
# План аудита и унификации поисковой функциональности myUNO

## Результаты аудита: 3 паттерна взаимодействия

Анализ показал, что в приложении используются **3 принципиально разных UX-паттерна** для поиска и фильтрации, что создаёт когнитивный диссонанс у пользователей:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ТЕКУЩИЕ ПАТТЕРНЫ ВЗАИМОДЕЙСТВИЯ                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ПАТТЕРН A: "DROPDOWN"           ПАТТЕРН B: "FULL-SCREEN"                  │
│  ┌────────────────────┐          ┌────────────────────┐                    │
│  │ [🔍 Search...    ] │          │ [🔍 Search...    ] │ ← клик            │
│  ├────────────────────┤          └────────────────────┘                    │
│  │ Результат 1      → │                    ↓                               │
│  │ Результат 2      → │          ┌────────────────────┐                    │
│  │ Результат 3      → │          │ ✕ Поиск      Сброс │ ← полный экран    │
│  └────────────────────┘          │ ┌────────────────┐ │                    │
│                                  │ │  📍 Куда       │ │                    │
│  Используется в:                 │ ├────────────────┤ │                    │
│  • InlineSearch (Home)           │ │  📅 Когда      │ │                    │
│  • UnifiedHeader (Mini-apps)     │ ├────────────────┤ │                    │
│  • GlobalSearchModal             │ │  👥 Кто        │ │                    │
│                                  │ └────────────────┘ │                    │
│                                  │     [🔍 Найти]     │                    │
│  ПАТТЕРН C: "STICKY RIBBON"      └────────────────────┘                    │
│  ┌────────────────────┐                                                    │
│  │ [Today][Tomorrow][Pick date] │ ← дата-пресеты                          │
│  │ [All] [🏝️ Islands] [🏊 Water] │ ← категории                            │
│  │ 42 results   [Sort↓][Filter] │ ← сортировка + drawer                   │
│  └────────────────────┘                                                    │
│                                  Используется в:                           │
│  Используется в:                 • Vacation Rentals (Property)             │
│  • Experiences (Tours)                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Детальный аудит по вертикалям

| Вертикаль | Паттерн поиска | Паттерн фильтров | Benchmark-лидер | Gap |
|-----------|---------------|------------------|-----------------|-----|
| **Home** | Dropdown + AI | — | Revolut | Нет Quick Filters |
| **Experiences** | Header inline | Sticky Ribbon + Drawer | Klook ✓ | Соответствует |
| **Property** | Multi-step Modal | Multi-step Modal | Airbnb ✓ | Соответствует |
| **Restaurants** | Header inline | Bottom Sheet | Uber Eats | Нет Quick Filters (Open Now) |
| **Yachts** | Header inline | Bottom Sheet | — | Нет Date picker |
| **Beauty** | Header inline | Bottom Sheet | Booksy | Нет Time slots |
| **Market** | Header inline | Category Drawer | Ozon ✓ | Соответствует |
| **Transport** | Header inline | Bottom Sheet | Turo | Нет Date range |

---

## Проблемы функциональности

### 1. Отсутствие Quick Filters в ключевых вертикалях

**Рестораны**: Отсутствуют фильтры:
- 🕐 "Сейчас открыто" (Open Now)  
- 🚴 "Бесплатная доставка" (Free Delivery)
- ⚡ "Быстрая доставка" (Under 30 min)

**Яхты**: Отсутствуют:
- 📅 Выбор даты аренды
- ⏱️ Длительность (Half-day / Full-day)

**Beauty**: Отсутствуют:
- 📅 Выбор даты визита
- ⏰ Доступные временные слоты

### 2. Несогласованность Date Picker

```text
Experiences:   [Today] [Tomorrow] [This Week] [📅 Pick date]  ← полный набор
Property:      📅 Check-in → Check-out (Calendar modal)       ← range picker
Yachts:        ❌ Нет выбора даты                              ← критический gap
Restaurants:   ❌ Нет выбора даты для бронирования             ← gap
Transport:     ❌ Нет выбора дат аренды                        ← критический gap
```

### 3. Разный уровень "глубины" фильтров

**Experiences** (наиболее развит):
- Date presets + calendar
- Price range slider
- Sort dropdown
- Quick filters (Instant confirm, Free cancel, Hotel pickup)
- Interest chips (Kid-friendly, Sunset, Adventure...)
- Category ribbon

**Restaurants** (средний):
- Category ribbon (cuisines)
- Location ribbon
- Mode tabs (Delivery / Reservation)
- Bottom sheet filters (Price level, Features, Dietary)
- ❌ Нет дат для бронирования

**Yachts** (базовый):
- Category ribbon (yacht types)
- Experience chips (custom component)
- Bottom sheet filters (Price level, Capacity, Amenities)
- ❌ Нет дат

---

## Предлагаемая унификация: 3 стандартных режима

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    УНИФИЦИРОВАННЫЕ РЕЖИМЫ ПОИСКА                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MODE 1: KEYWORD SEARCH           MODE 2: KLOOK RIBBON                     │
│  ┌────────────────────────────┐   ┌────────────────────────────────────┐   │
│  │ 🔍 Поиск или спросите AI...│   │ [Today][Tomorrow][📅] │ [All][🏝️] │   │
│  └────────────────────────────┘   │ 42 results    [Sort↓] [Filter⚙️]  │   │
│            ↓                      └────────────────────────────────────┘   │
│  ┌────────────────────────────┐                                             │
│  │ 🤖 UNO Assistant           │   Применяется для:                         │
│  │ "Рекомендую jet-ski..."    │   • Experiences (туры, водные)             │
│  ├────────────────────────────┤   • Restaurants (+ Open Now)               │
│  │ 🏷️ Категории: [Yachts]     │   • Yachts (+ Date picker)                 │
│  │ 📍 Найдено: Speedboat →    │   • Beauty (+ Time slots)                  │
│  └────────────────────────────┘   • Transport (+ Date range)               │
│                                                                             │
│  Применяется для:                                                          │
│  • Home (глобальный поиск)                                                 │
│  • Market (product search)                                                 │
│                                                                             │
│  MODE 3: PLANNING WIZARD                                                   │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ ✕ Поиск жилья                                              Сброс  │   │
│  │ ┌──────────────────────────────────────────────────────────────┐  │   │
│  │ │  STEP 1: 📍 Куда                                             │  │   │
│  │ │  ┌──────┐ ┌──────┐ ┌──────┐                                  │  │   │
│  │ │  │Patong│ │ Kata │ │Kamala│  ...                             │  │   │
│  │ │  └──────┘ └──────┘ └──────┘                                  │  │   │
│  │ └──────────────────────────────────────────────────────────────┘  │   │
│  │ ┌──────────────────────────────────────────────────────────────┐  │   │
│  │ │  STEP 2: 📅 Когда                                            │  │   │
│  │ │  [Weekend] [Week] [Month] [Calendar...]                      │  │   │
│  │ └──────────────────────────────────────────────────────────────┘  │   │
│  │ ┌──────────────────────────────────────────────────────────────┐  │   │
│  │ │  STEP 3: 👥 Кто                                              │  │   │
│  │ │  Взрослые: [−] 2 [+]     Дети: [−] 0 [+]                     │  │   │
│  │ └──────────────────────────────────────────────────────────────┘  │   │
│  │                            [🔍 Найти жильё]                       │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Применяется для:                                                          │
│  • Vacation Rentals (Property)                                             │
│  • Потенциально: VIP Concierge                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Техническая реализация

### Этап 1: Расширение UnifiedFiltersKlook (базовый компонент)

**Файл:** `src/components/shared/UnifiedFiltersKlook.tsx`

Добавить новые конфигурационные опции:

```typescript
interface UnifiedFiltersKlookConfig {
  // Существующие поля...
  
  // NEW: Quick Filters в ленте (не в drawer)
  inlineQuickFilters?: {
    id: string;
    labelEn: string;
    labelRu: string;
    icon: string | LucideIcon;
    filterLogic: (item: any) => boolean; // функция фильтрации
  }[];
  
  // NEW: Time slot picker (для Beauty, Restaurants)
  showTimeSlots?: boolean;
  timeSlotPresets?: { id: string; labelEn: string; labelRu: string }[];
  
  // NEW: Date range picker (для Transport, Property-like)
  showDateRange?: boolean;
  dateRangeLabels?: { fromEn: string; fromRu: string; toEn: string; toRu: string };
}
```

### Этап 2: Создание вертикаль-специфичных конфигов

**Файл:** `src/lib/filterConfigs/restaurantFiltersKlook.ts`

```typescript
export const RESTAURANT_KLOOK_CONFIG: UnifiedFiltersKlookConfig = {
  showDateFilters: true,
  datePresets: [
    { id: 'today', labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow', labelEn: 'Tomorrow', labelRu: 'Завтра' },
  ],
  
  inlineQuickFilters: [
    { id: 'open-now', labelEn: 'Open Now', labelRu: 'Открыто', icon: '🕐' },
    { id: 'free-delivery', labelEn: 'Free Delivery', labelRu: 'Бесплатно', icon: '🚴' },
    { id: 'fast', labelEn: 'Under 30 min', labelRu: 'До 30 мин', icon: '⚡' },
  ],
  
  sortOptions: [
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'delivery_time', labelEn: 'Fastest', labelRu: 'Быстрая доставка' },
    { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена ↑' },
  ],
  
  // Drawer sections
  chipSections: [
    { id: 'cuisine', titleEn: 'Cuisine', titleRu: 'Кухня', options: [...] },
    { id: 'dietary', titleEn: 'Dietary', titleRu: 'Диета', options: [...] },
  ],
};
```

**Файл:** `src/lib/filterConfigs/yachtFiltersKlook.ts`

```typescript
export const YACHT_KLOOK_CONFIG: UnifiedFiltersKlookConfig = {
  showDateFilters: true,
  datePresets: [
    { id: 'today', labelEn: 'Today', labelRu: 'Сегодня' },
    { id: 'tomorrow', labelEn: 'Tomorrow', labelRu: 'Завтра' },
    { id: 'this-week', labelEn: 'This week', labelRu: 'Эта неделя' },
  ],
  
  showPriceFilter: true,
  priceRange: { min: 0, max: 500000, step: 5000 },
  currencySymbol: '฿',
  
  sortOptions: [
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
    { id: 'price_asc', labelEn: 'Price: Low to High', labelRu: 'Цена ↑' },
    { id: 'capacity', labelEn: 'Capacity', labelRu: 'Вместимость' },
  ],
  
  chipSections: [
    { id: 'duration', titleEn: 'Duration', titleRu: 'Длительность', options: [
      { id: 'half-day', labelEn: 'Half Day', labelRu: 'Полдня', icon: '⏱️' },
      { id: 'full-day', labelEn: 'Full Day', labelRu: 'Весь день', icon: '☀️' },
      { id: 'overnight', labelEn: 'Overnight', labelRu: 'С ночёвкой', icon: '🌙' },
    ]},
    { id: 'experiences', titleEn: 'Experiences', titleRu: 'Впечатления', options: [
      { id: 'fishing', labelEn: 'Fishing', labelRu: 'Рыбалка', icon: '🎣' },
      { id: 'sunset', labelEn: 'Sunset Cruise', labelRu: 'Закат', icon: '🌅' },
      { id: 'party', labelEn: 'Party', labelRu: 'Вечеринка', icon: '🎉' },
      { id: 'diving', labelEn: 'Diving', labelRu: 'Дайвинг', icon: '🤿' },
    ]},
  ],
};
```

**Файл:** `src/lib/filterConfigs/transportFiltersKlook.ts`

```typescript
export const TRANSPORT_KLOOK_CONFIG: UnifiedFiltersKlookConfig = {
  showDateRange: true, // NEW: range picker вместо single date
  dateRangeLabels: {
    fromEn: 'Pick-up', fromRu: 'Получение',
    toEn: 'Return', toRu: 'Возврат',
  },
  
  showPriceFilter: true,
  priceRange: { min: 0, max: 5000, step: 100 },
  currencySymbol: '฿/day',
  
  inlineQuickFilters: [
    { id: 'automatic', labelEn: 'Automatic', labelRu: 'Автомат', icon: '🅰️' },
    { id: 'insurance', labelEn: 'Insurance', labelRu: 'Страховка', icon: '🛡️' },
    { id: 'delivery', labelEn: 'Delivery', labelRu: 'Доставка', icon: '🚚' },
  ],
  
  sortOptions: [
    { id: 'price_asc', labelEn: 'Cheapest', labelRu: 'Дешевле' },
    { id: 'rating', labelEn: 'Top Rated', labelRu: 'По рейтингу' },
  ],
};
```

### Этап 3: Миграция вертикалей на UnifiedFiltersKlook

**Файлы для изменения:**

| Файл | Текущий компонент | Целевой компонент |
|------|-------------------|-------------------|
| `RestaurantsIndex.tsx` | `MiniAppLayout` + `UniversalFilter` | `UnifiedFiltersKlook` + Quick Filters |
| `YachtsIndex.tsx` | `UniversalFilter` + custom chips | `UnifiedFiltersKlook` + Date picker |
| `BeautySpaIndex.tsx` | (проверить) | `UnifiedFiltersKlook` + Time slots |
| `TransportIndex.tsx` | (проверить) | `UnifiedFiltersKlook` + Date range |

### Этап 4: Обновление RestaurantsIndex.tsx

**Изменения:**

1. Заменить `MiniAppLayout` + `filterConfig` на интеграцию с `UnifiedFiltersKlook`
2. Добавить Quick Filters "Open Now", "Free Delivery", "Fast"
3. Добавить Date picker для бронирования столика
4. Унифицировать визуальный стиль с Experiences

### Этап 5: Обновление YachtsIndex.tsx

**Изменения:**

1. Заменить `UniversalFilter` + `ExperienceFilterChips` на `UnifiedFiltersKlook`
2. Добавить Date picker в sticky ribbon
3. Добавить Duration chips (Half-day, Full-day, Overnight)
4. Интегрировать Experience chips в конфиг

### Этап 6: Создание TransportFiltersKlook.tsx

**Новый файл:** `src/components/transport/TransportFiltersKlook.tsx`

Wrapper-компонент аналогичный `ExperienceFiltersKlook`, использующий `UnifiedFiltersKlook` с конфигом для транспорта:
- Date Range picker (Pick-up / Return)
- Vehicle type chips
- Transmission filter
- Insurance options

---

## Матрица соответствия лидерам рынка

После унификации:

| Вертикаль | Benchmark | Ключевые features | Статус |
|-----------|-----------|-------------------|--------|
| **Experiences** | Klook | Date presets, Categories, Price, Sort | ✅ Есть |
| **Property** | Airbnb | Multi-step wizard, Location, Dates, Guests | ✅ Есть |
| **Restaurants** | Uber Eats | **Open Now**, Free Delivery, Fast, Cuisines | 🔄 Добавляем |
| **Yachts** | — | **Date picker**, Duration, Capacity, Routes | 🔄 Добавляем |
| **Beauty** | Booksy | **Date + Time slots**, Services, Price | 🔄 Добавляем |
| **Transport** | Turo | **Date range**, Transmission, Insurance | 🔄 Добавляем |
| **Market** | Ozon | Category drawer, Price, Sort | ✅ Есть |

---

## Объём работ

| Файл | Тип | Сложность | Строк кода |
|------|-----|-----------|------------|
| `UnifiedFiltersKlook.tsx` | Расширение | Высокая | ~100 |
| `restaurantFiltersKlook.ts` | Создание | Низкая | ~60 |
| `yachtFiltersKlook.ts` | Создание | Низкая | ~80 |
| `transportFiltersKlook.ts` | Создание | Низкая | ~50 |
| `RestaurantsIndex.tsx` | Рефакторинг | Средняя | ~80 |
| `YachtsIndex.tsx` | Рефакторинг | Средняя | ~60 |
| `TransportIndex.tsx` | Рефакторинг | Средняя | ~60 |
| **Итого** | | | ~490 строк |

Время реализации: ~60-75 минут

---

## Ожидаемый результат

1. **Единый UX-паттерн**: Все вертикали с высоким инвентарём используют Klook-style sticky ribbon
2. **Quick Filters**: Быстрые фильтры ("Open Now", "Free Delivery") видны без открытия drawer
3. **Date Awareness**: Все booking-вертикали имеют выбор даты в основном интерфейсе
4. **Соответствие лидерам**: Каждая вертикаль соответствует UX глобального лидера в категории
5. **Масштабируемость**: Новые вертикали добавляются через конфиг, без дублирования кода
