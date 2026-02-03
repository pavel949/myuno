
# Аудит мини-приложения «Транспорт (Аренда)» — Сравнение с мировыми лидерами

## Сравнительный анализ: myUNO vs Turo / Rentalcars / Getaround / Kayak

### Общая оценка: 🟡 Функционально, но требует доработки

---

## 1. ТАКСОНОМИЯ ТРАНСПОРТА

### Текущее состояние myUNO

| Источник | Категории |
|----------|-----------|
| `VEHICLE_CATEGORIES` (UI ribbon) | `all`, `car`, `motorbike`, `suv` — **4 категории** |
| `vehicleTypeOptions` (модальный фильтр) | `car`, `motorbike`, `suv`, `van`, `luxury`, `electric` — **6 категорий** |
| Таблица `vehicles` (реальные данные) | `sedan`, `van`, `suv`, `motorcycle` |
| Таблица `transport_vehicle_types` | `taxi`, `airport_transfer`, `economy`, `premium`, `luxury`, `vip`, `motorbike` |

### Проблемы

| Проблема | Критичность |
|----------|-------------|
| **Несинхронизация ID**: UI показывает `car`, в БД хранится `sedan` | 🔴 Высокая |
| **Дублирование таблиц**: `vehicles` и `transport_vehicle_types` — два источника правды | 🔴 Высокая |
| **Нет фильтрации по `sedan`**: Категория `car` в ленте не ловит `sedan` в БД | 🔴 Высокая |
| **Отсутствуют популярные сегменты**: Electric, Convertible, Compact | 🟠 Средняя |

### Как у лидеров (Turo / Rentalcars)

```
Economy → Compact → Standard → Full-size → SUV → Van → Luxury → Electric → Convertible → Truck
```

**Рекомендация**: Создать единый файл `transportTaxonomy.ts` как источник правды (аналог `homeServicesTaxonomy.ts`).

---

## 2. ФИЛЬТРЫ

### Текущее состояние

| Секция фильтра | Тип | Работает? |
|----------------|-----|-----------|
| Price Level (฿/฿฿/฿฿฿) | price-level | ✅ Да |
| Vehicle Type | multi | ⚠️ ID не совпадают с БД |
| Transfer Type (airport/hotel/hourly) | single | ❌ Не используется в листинге аренды |
| Passengers | single | ✅ Да |
| Features (AC, GPS, insurance) | multi | ⚠️ Частично — зависит от формата features[] |

### Чего не хватает (по сравнению с Turo/Kayak)

| Фильтр | Важность | Статус |
|--------|----------|--------|
| **Трансмиссия (Auto/Manual)** | Критично для Азии | ❌ Отсутствует в ленте |
| **Тип топлива (Petrol/Diesel/Electric)** | Важно | ❌ Отсутствует |
| **Год выпуска** | Средне | ❌ Отсутствует |
| **Слайдер цены (min-max)** | Важно | ❌ Только уровни ฿/฿฿/฿฿฿ |
| **Instant Book / Delivery** | Средне | ❌ Отсутствует |
| **Рейтинг владельца** | Низко | ❌ Отсутствует |

---

## 3. КАРТОЧКИ ЛИСТИНГА

### Текущая реализация (`ItemCard` в TransportIndex.tsx)

```tsx
<ItemCard
  meta={[
    { icon: Users, label: `${vehicle.capacity || 0}` },
    { icon: Gauge, label: 'Auto' },  // ❌ HARDCODE!
  ]}
  tags={vehicle.features?.slice(0, 2) || []}
/>
```

### Проблемы

| Проблема | Описание |
|----------|----------|
| **Hardcoded «Auto»** | Всегда показывает «Auto», даже если `vehicle.transmission = 'manual'` |
| **Не показывает тип топлива** | `fuel_type` доступен в БД, но не выводится |
| **Не показывает багаж** | `luggage_capacity` есть в БД, но скрыт |
| **Generic теги** | `features` показываются как текст без локализации |
| **Нет депозита** | `deposit_amount` важен для аренды, но не виден |

### Как у лидеров (Turo)

```
┌─────────────────────────────────────────────────┐
│ [Image]  Toyota Camry 2024                      │
│          ⭐ 4.9 (156) • Instant Book            │
│          ┌───────────────────────────────────┐  │
│          │ 👥 5  │ 🧳 3  │ ⚙️ Auto │ ⛽ Petrol │  │
│          └───────────────────────────────────┘  │
│          Free cancellation • All-Star Host      │
│          ฿2,500/day                             │
└─────────────────────────────────────────────────┘
```

**Рекомендация**: Создать специализированный `VehicleCard` с иконками specs, или добавить variant `vehicle` в `ItemCard`.

---

## 4. ДАННЫЕ И КОНСИСТЕНТНОСТЬ

### Схема таблицы `vehicles` — полнота

| Поле | В схеме | Используется в UI | Используется в форме |
|------|---------|-------------------|---------------------|
| `transmission` | ✅ | ❌ Hardcode «Auto» | ? |
| `fuel_type` | ✅ | ❌ Не показывается | ? |
| `luggage_capacity` | ✅ | ❌ Не в карточке | ? |
| `doors` | ✅ | ❌ Не в карточке | ✅ VehicleDetail |
| `year_built` | ✅ | ❌ Только в Detail | ? |
| `deposit_amount` | ✅ | ❌ Не в карточке | ✅ VehicleDetail |
| `color` | ✅ | ❌ Нигде | ? |
| `engine_size` | ✅ | ❌ Нигде | ? |
| `free_km_per_day` | ✅ | ✅ VehicleDetail | ? |
| `extra_km_price` | ✅ | ✅ VehicleDetail | ? |

### Данные в БД — проверка реальных записей

```
Toyota Camry Premium:
  - vehicle_type: 'sedan' (а не 'car'!)
  - transmission: 'automatic'
  - fuel_type: 'petrol'
  - features: ['wifi', 'water', 'child_seat', 'english_driver']
```

**Проблема**: Features хранятся как технические ID ('wifi', 'child_seat'), а не локализованные строки. В карточке они выводятся as-is.

---

## 5. BOOKING FLOW

### Текущий флоу TransportBooking.tsx

```
Step 1: Выбор дат (два отдельных input type="date")
Step 2: Место получения (AddressPickerInput)
Step 3: Контакты (BookingContactForm)
Step 4: Оплата (BookingPaymentSelect)
```

### Проблемы

| Проблема | Критичность |
|----------|-------------|
| **Fallback demoVehicles** | В коде hardcoded demo-данные (строки 28-34) | 🔴 Высокая |
| **Нет DateRangePicker** | Два отдельных поля вместо визуального календаря | 🟠 Средняя |
| **Нет выбора опций** | GPS, child seat, insurance — нет upsell | 🟠 Средняя |
| **Нет загрузки прав** | Лидеры требуют фото водительского удостоверения | 🟡 Низкая |

### Как у лидеров (Rentalcars/Kayak)

```
1. Dates & Location → DateRangePicker + Map
2. Vehicle Selection → Comparison view
3. Protection & Extras → Insurance tiers, GPS, child seats
4. Driver Details → License upload, age verification
5. Payment → Multiple options + promo codes
```

---

## 6. AIRPORT TRANSFER (Отдельный продукт)

### Анализ AirportTransferBooking.tsx

✅ **Хорошо реализовано**:
- 3-шаговый wizard
- Динамическая загрузка vehicle types и destinations из БД
- Транслитерация имени для таблички встречи
- Сохранение в `order_item_transport_details`

⚠️ **Требует улучшения**:
- Нет предпросмотра маршрута на карте
- Нет выбора конкретного водителя / рейтинга
- Нет трекинга рейса (Flight tracking API)

---

## 7. TAXI (Отдельный продукт)

### Анализ TaxiBooking.tsx

✅ **Хорошо реализовано**:
- Карта с выбором точек (LocationPickerMap)
- Геолокация текущего местоположения
- Динамический расчет расстояния и цены
- Выбор времени подачи

⚠️ **Требует улучшения**:
- Нет ETA водителя в реальном времени
- Нет live-трекинга после заказа
- Нет интеграции с Grab/Bolt API

---

## 8. СВОДНАЯ ТАБЛИЦА КОНСИСТЕНТНОСТИ

| Аспект | Аренда | Airport | Taxi | Оценка |
|--------|--------|---------|------|--------|
| Layout (MiniAppLayout) | ✅ | ⚠️ AppLayout | ⚠️ AppLayout | 🟡 |
| Категории = БД | ❌ car≠sedan | ✅ | ✅ | 🔴 |
| Фильтры работают | ⚠️ частично | N/A | N/A | 🟡 |
| Карточки показывают все данные | ❌ | N/A | N/A | 🔴 |
| Booking сохраняет в БД | ✅ | ✅ | ✅ | ✅ |
| Features локализованы | ❌ | ⚠️ | ⚠️ | 🔴 |

---

## 9. ПЛАН ИСПРАВЛЕНИЙ

### Фаза 1: Критические исправления таксономии

| Файл | Изменение |
|------|-----------|
| **Новый** `src/lib/config/transportTaxonomy.ts` | Единый источник категорий: Economy, Compact, Sedan, SUV, Van, Luxury, Motorbike, Electric |
| `TransportIndex.tsx` | Импорт категорий из taxonomy, правильный маппинг для фильтрации |
| `TransportFilters.tsx` | Синхронизация vehicleTypeOptions с taxonomy |
| **Миграция БД** | Нормализовать `vehicle_type`: sedan→car или наоборот |

### Фаза 2: Улучшение карточек

| Файл | Изменение |
|------|-----------|
| `TransportIndex.tsx` | Динамический вывод transmission из данных вместо hardcode |
| `ItemCard.tsx` или новый `VehicleCard.tsx` | Добавить слоты для specs: transmission, fuel, luggage, doors |
| **Новый** `src/lib/adapters/vehicleAdapters.ts` | `mapVehicleToCardProps()` — централизованный маппинг |

### Фаза 3: Расширение фильтров

| Файл | Изменение |
|------|-----------|
| `TransportFilters.tsx` | Добавить секции: Transmission (auto/manual), Fuel Type, Price Range slider |
| `TransportIndex.tsx` | Логика фильтрации по новым параметрам |

### Фаза 4: Улучшение Booking Flow

| Файл | Изменение |
|------|-----------|
| `TransportBooking.tsx` | Удалить demoVehicles fallback, загружать данные из БД |
| `TransportBooking.tsx` | Заменить 2× input[date] на DateRangePicker |
| **Новый** `ExtrasSelector.tsx` | Компонент выбора доп. опций (GPS, child seat, insurance) |

---

## 10. ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

| Метрика | До | После |
|---------|-----|-------|
| Категории ribbon = БД | ❌ 4 vs 5+ | ✅ Единая taxonomy |
| Transmission в карточке | ❌ Hardcode | ✅ Из данных |
| Фильтры по трансмиссии | ❌ Нет | ✅ Есть |
| Demo-данные в booking | ✅ Есть | ❌ Удалены |
| Features локализованы | ❌ | ✅ |
| Соответствие Turo/Kayak UX | ~40% | ~75% |

---

## ПРИОРИТЕТЫ

1. 🔴 **Срочно**: Синхронизация категорий (car↔sedan) — фильтры не работают
2. 🔴 **Срочно**: Динамический transmission в карточках
3. 🟠 **Важно**: Расширение фильтров (transmission, fuel)
4. 🟠 **Важно**: Удаление demoVehicles из TransportBooking
5. 🟡 **Улучшение**: DateRangePicker в booking
6. 🟡 **Улучшение**: VehicleCard с полными specs
