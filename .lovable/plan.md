# План аудита и унификации поисковой функциональности myUNO

## ✅ Статус: ЭТАП 1 ЗАВЕРШЁН (3 февраля 2026)

---

## Выполненные работы

### ✅ Этап 1: Расширение UnifiedFiltersKlook
**Файл:** `src/components/shared/UnifiedFiltersKlook.tsx`
- Добавлены свойства: `inlineQuickFilters`, `showDateRange`, `dateRangeLabels`
- Добавлены пропсы: `selectedInlineFilters`, `onInlineFiltersChange`, `dateRange`, `onDateRangeChange`
- Inline quick filters отображаются в sticky bar между датами и категориями

### ✅ Этап 2: Вертикаль-специфичные конфиги
**Созданы файлы:**
- `src/lib/filterConfigs/restaurantFiltersKlook.ts` - Open Now, Free Delivery, Cuisines
- `src/lib/filterConfigs/yachtFiltersKlook.ts` - Dates, Duration, Experiences, Capacity
- `src/lib/filterConfigs/transportFiltersKlook.ts` - Automatic, Insurance, Delivery
- `src/lib/filterConfigs/index.ts` - экспорт всех конфигов

### ✅ Этап 3: Wrapper-компоненты
**Созданы:**
- `src/components/yachts/YachtFiltersKlook.tsx`
- `src/components/transport/TransportFiltersKlook.tsx`

### ✅ Этап 4: Миграция вертикалей
**Обновлены:**
- `src/pages/yachts/YachtsIndex.tsx` → YachtFiltersKlook
- `src/pages/transport/TransportIndex.tsx` → TransportFiltersKlook

---

## Новый UX паттерн

```text
┌─────────────────────────────────────────────────────────────────┐
│ [Today][Tomorrow][📅] │ [⏱️ Half][☀️ Full] │ [All][🛥️][⛵]    │  ← sticky bar
│ 42 results                         [Sort↓] [Filter⚙️]          │
└─────────────────────────────────────────────────────────────────┘
         ↑ dates              ↑ inline quick        ↑ categories
                              filters (NEW!)
```

---

## Следующие шаги (при необходимости)

### Рестораны
- [ ] `src/components/restaurants/RestaurantFiltersKlook.tsx`
- [ ] Обновить `RestaurantsIndex.tsx`
- [ ] Inline: "Open Now", "Free Delivery", "Fast"

### Beauty/Spa
- [ ] `src/lib/filterConfigs/beautyFiltersKlook.ts`
- [ ] `src/components/beauty/BeautyFiltersKlook.tsx`
- [ ] Time slot picker

---

## Соответствие лидерам рынка

| Вертикаль | Benchmark | Статус |
|-----------|-----------|--------|
| Experiences | Klook | ✅ |
| Property | Airbnb | ✅ |
| **Yachts** | — | ✅ Даты + длительность добавлены |
| **Transport** | Turo | ✅ Inline filters добавлены |
| Restaurants | Uber Eats | 🔄 Следующий этап |
| Beauty | Booksy | 🔄 Следующий этап |
| Market | Ozon | ✅ |
