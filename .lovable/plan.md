
# План улучшений и стандартизации 4 ключевых вертикалей

## Резюме проблем

После глубокого анализа выявлены следующие категории проблем:

### 1. Несогласованность таксономии между слоями
- **Transport**: `TRANSPORT_CATEGORIES` в коде содержит `car, motorbike, scooter`, а в БД `lookup_values` — `sedan, compact, suv, van, luxury, motorcycle, electric`
- **Flowers**: Категории захардкожены в `FlowersIndex.tsx` (`FLOWER_CATEGORIES`), в БД таксономия для цветов **пустая** (0 записей в `lookup_values`)
- **Property**: Хорошо синхронизирована с БД через `usePropertyFilterOptions`

### 2. Проблемы с потоками бронирования
- **Transport Rental**: `TransportBooking.tsx` использует demo-fallback данные вместо реальных из БД
- **Airport Transfer**: Типы машин загружаются из `transport_vehicle_types`, но `base_price = 0` для airport_transfer
- **Flowers**: Полноценный поток доставки работает, но категории не синхронизированы с БД

### 3. Пробелы в календарях и availability
- **Transport Rental**: Нет проверки доступности через `useAvailabilityCheck`, используется простой `<Input type="date">`
- **Property**: Полноценный `PropertyBookingCard` с блокированными датами
- **Flowers**: Только слоты доставки (morning/afternoon/evening), что корректно

### 4. Отсутствие тайского перевода
- Во всех файлах используется паттерн `labelEn/labelRu` без `labelTh`
- В `lookup_values` нет колонки `value_th`

---

## Группа A: Синхронизация таксономии Transport

### A.1 Обновить `TRANSPORT_CATEGORIES` в `transportFiltersKlook.ts`
Заменить хардкод на динамическую загрузку через `useTransportFilterOptions().categoryRibbon`

```text
Было:
car, motorbike, scooter, suv (хардкод)

Станет:
sedan, compact, suv, van, luxury, motorcycle, electric (из БД)
```

### A.2 Использовать динамический хук в `TransportIndex.tsx`
```
- Добавить: const { categoryRibbon } = useTransportFilterOptions();
- Заменить статические категории на categoryRibbon
```

### A.3 Добавить записи в БД для vehicle_feature
Текущий lookup_type `vehicle_feature` пуст — нужно заполнить:
- `ac`, `gps`, `bluetooth`, `child_seat`, `insurance`, `unlimited_km`

---

## Группа B: Миграция таксономии Flowers в БД

### B.1 Создать записи в `lookup_values` для цветов
```sql
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order)
VALUES
('flower_category', 'roses', 'Roses', 'Розы', '🌹', 1),
('flower_category', 'mixed', 'Mixed', 'Микс', '💐', 2),
('flower_category', 'tulips', 'Tulips', 'Тюльпаны', '🌷', 3),
...
```

### B.2 Создать хук `useFlowerFilterOptions`
```text
Файл: src/hooks/useDynamicFilterOptions.ts
Добавить: useFlowerFilterOptions() аналогично useTransportFilterOptions()
```

### B.3 Рефакторинг `FlowersIndex.tsx`
```text
- Удалить: const FLOWER_CATEGORIES = [...]
- Добавить: const { categoryRibbon } = useFlowerFilterOptions();
- Заменить: categories={categoryRibbon}
```

---

## Группа C: Исправление потока бронирования Transport

### C.1 Рефакторинг `TransportBooking.tsx`
```text
Проблема: Использует demoVehicles вместо реальных данных

Решение:
1. Получать vehicle из location.state или загружать через useVehicle(id)
2. Убрать fallback на demoVehicles
3. Добавить proper loading state
```

### C.2 Интегрировать Calendar (date range picker)
```text
Заменить:
<Input type="date" value={pickupDate} .../>

На:
<Popover><Calendar mode="range" .../></Popover>
(аналогично PropertyBookingCard)
```

### C.3 Добавить availability check для транспорта
```text
import { useAvailabilityCheck } from '@/hooks/useAvailabilityCheck';
- Проверять доступность машины на выбранные даты
- Показывать blocked dates в календаре
```

### C.4 Исправить цены в Airport Transfer
```text
Проблема: transport_vehicle_types.base_price = 0 для airport_transfer

Решение: Обновить записи в БД через migration:
UPDATE transport_vehicle_types 
SET base_price = 800 WHERE type = 'airport_transfer' AND name_en = 'Sedan';
```

---

## Группа D: Стандартизация Property Booking Flow

### D.1 Текущее состояние — ХОРОШО
- `PropertyBookingCard` с date range selection ✅
- Blocked dates через `usePropertyBlockedDates` ✅
- Pricing с discounts ✅
- Validation (min_stay, max_guests) ✅

### D.2 Мелкие улучшения
```text
1. PropertyInquiry.tsx: Добавить step progress indicator
2. Унифицировать PaymentStageSelector с другими вертикалями
```

---

## Группа E: Унификация UX между вертикалями

### E.1 Создать общий компонент `DateRangePickerCard`
```text
Файл: src/components/booking/DateRangePickerCard.tsx

Props:
- startDate, endDate
- blockedDates
- minStay, maxStay
- onRangeChange
- labels (localized)
```

### E.2 Переиспользовать во всех вертикалях
```text
- PropertyBookingCard → использует DateRangePickerCard
- TransportBooking → использует DateRangePickerCard
- YachtBooking → использует DateRangePickerCard
```

### E.3 Стандартизировать Bottom CTA Bar
```text
Все detail-страницы должны использовать единый паттерн:
1. Цена слева
2. Phone/WhatsApp иконки
3. Primary CTA справа
```

---

## Группа F: Добавление тайского языка (подготовка)

### F.1 Миграция БД: добавить колонку `value_th`
```sql
ALTER TABLE lookup_values ADD COLUMN value_th TEXT;
```

### F.2 Обновить типы и хуки
```text
- useTaxonomy: добавить labelTh в TaxonomyOption
- FilterOption: добавить labelTh
- Все компоненты: добавить проверку language === 'th'
```

### F.3 Приоритетные страницы для перевода
```text
1. Home (QuickActionsGrid)
2. Transport Index + Booking
3. Flowers Index + Order
4. Property Index + Booking
```

---

## Технический раздел

### Файлы для модификации

| Файл | Изменения |
|------|-----------|
| `src/lib/filterConfigs/transportFiltersKlook.ts` | Убрать хардкод TRANSPORT_CATEGORIES |
| `src/pages/transport/TransportIndex.tsx` | Использовать динамические категории |
| `src/pages/transport/TransportBooking.tsx` | Calendar, availability, убрать demo |
| `src/hooks/useDynamicFilterOptions.ts` | Добавить useFlowerFilterOptions |
| `src/pages/flowers/FlowersIndex.tsx` | Динамические категории |
| `src/components/booking/DateRangePickerCard.tsx` | Новый компонент |
| `src/components/filters/FlowersFilters.tsx` | Миграция на БД |

### Миграции БД

1. **Заполнить lookup_values для цветов** (~15 записей)
2. **Заполнить lookup_values для vehicle_feature** (~12 записей)
3. **Исправить base_price для airport_transfer** (4 записи)
4. **Добавить колонку value_th** (миграция схемы)

### Порядок выполнения

```text
1. [DB] Миграции lookup_values для цветов и транспорта
2. [Code] useFlowerFilterOptions хук
3. [Code] DateRangePickerCard компонент
4. [Code] TransportBooking.tsx рефакторинг
5. [Code] FlowersIndex.tsx рефакторинг
6. [DB] value_th колонка
7. [Code] Тайские переводы (итеративно)
```

---

## Ожидаемый результат

| Вертикаль | До | После |
|-----------|-----|-------|
| Transport | Хардкод категорий, простой date input, demo данные | БД-driven, Calendar с availability, реальные данные |
| Flowers | Хардкод категорий, нет связи с БД | БД-driven таксономия, консистентный UX |
| Property | Хорошо | Унифицированные компоненты |
| Общее | RU/EN only | Подготовка к TH |

