
# План: Улучшение карточки объекта и пути клиента (Airbnb-стиль)

## Выявленные проблемы

### 1. Бейдж "Instant Booking" использует неверную логику
| Файл | Текущая логика | Правильная логика |
|------|----------------|-------------------|
| `PropertyIndex.tsx` | `property.min_stay_nights === 1` | `property.instant_booking === true` |
| `PropertyCard.tsx` | Использует `instantBooking` из props | ✓ Корректно |

### 2. Кнопка бронирования не динамическая
**Текущее:** Всегда показывает "Забронировать" ("Reserve")
**Airbnb-стандарт:** 
- Без дат → "Проверить наличие" ("Check availability")  
- С датами → "Забронировать" ("Reserve") или "Мгновенное бронирование" ("Instant book")

### 3. Карточка в списке не показывает CTA "Check availability"
Пользователь видит только цену, без призыва к действию

### 4. Мобильная bottom bar не показывает "instant booking"
Bottom CTA показывает статичный текст без учёта возможности мгновенного бронирования

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  ПУТЬ КЛИЕНТА (Текущий → Улучшенный)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Список объектов]                                                          │
│       │                                                                     │
│       │ СЕЙЧАС: Карточка → клик → детали                                   │
│       │ СТАНЕТ: Карточка с ⚡ Instant + CTA hint → клик → детали          │
│       ▼                                                                     │
│  [Страница деталей]                                                         │
│       │                                                                     │
│       │ СЕЙЧАС: Sidebar "Reserve" (даже без дат)                           │
│       │ СТАНЕТ: Sidebar "Check availability" → выбор дат → "Reserve/Book"  │
│       ▼                                                                     │
│  [Форма бронирования]                                                       │
│       │                                                                     │
│       │ СЕЙЧАС: ✓ Корректно работает                                       │
│       ▼                                                                     │
│  [Оплата депозита]                                                          │
│       │                                                                     │
│       │ СЕЙЧАС: ✓ Stripe + PromptPay                                       │
│       ▼                                                                     │
│  [Подтверждение]                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Фаза 1: Исправление бейджа Instant Booking

**Файл: `src/pages/property/PropertyIndex.tsx`**

Заменить логику на строках 322-327:

```typescript
// БЫЛО:
{property.min_stay_nights === 1 && (
  <Badge className="bg-amber-500 ...">
    <Zap className="w-3 h-3" />
    {language === 'ru' ? 'Быстрое' : 'Instant'}
  </Badge>
)}

// СТАНЕТ:
{property.instant_booking && (
  <Badge className="bg-amber-500 text-white border-0 text-xs gap-1">
    <Zap className="w-3 h-3" />
    {language === 'ru' ? 'Мгновенное' : 'Instant'}
  </Badge>
)}
```

---

## Фаза 2: Динамическая кнопка в PropertyBookingCard

**Файл: `src/components/property/PropertyBookingCard.tsx`**

Обновить логику кнопки Reserve (строки 270-279):

```typescript
// БЫЛО:
<Button size="lg" className="w-full" onClick={handleReserve}>
  {rentalTerms?.instant_booking && <Zap className="w-4 h-4 mr-2" />}
  {isRu ? 'Забронировать' : 'Reserve'}
</Button>

// СТАНЕТ:
<Button 
  size="lg" 
  className="w-full"
  onClick={handleReserve}
  disabled={!dateRange?.from || !dateRange?.to || validationErrors.length > 0}
>
  {!dateRange?.from || !dateRange?.to ? (
    <>
      <Calendar className="w-4 h-4 mr-2" />
      {isRu ? 'Проверить наличие' : 'Check availability'}
    </>
  ) : rentalTerms?.instant_booking ? (
    <>
      <Zap className="w-4 h-4 mr-2" />
      {isRu ? 'Мгновенное бронирование' : 'Book instantly'}
    </>
  ) : (
    isRu ? 'Забронировать' : 'Reserve'
  )}
</Button>
```

Также добавить пояснительный текст под кнопкой:

```typescript
// После кнопки, заменить строки 281-284:
{!nights ? (
  <p className="text-center text-sm text-muted-foreground">
    {isRu ? 'Выберите даты для расчёта стоимости' : 'Select dates to see total price'}
  </p>
) : (
  // existing price breakdown
)}
```

---

## Фаза 3: Улучшение карточки в списке

**Файл: `src/pages/property/PropertyIndex.tsx`**

Добавить визуальную подсказку доступности под ценой (строки 356-360):

```typescript
{/* Price */}
<p className="pt-1">
  <span className="font-semibold">{formatPrice(property.price || 0)}</span>
  <span className="text-muted-foreground">{formatPriceLabel(property.price_period)}</span>
</p>

{/* NEW: Availability hint */}
{property.instant_booking && (
  <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
    <Zap className="w-3 h-3" />
    {language === 'ru' ? 'Забронировать сейчас' : 'Book now'}
  </p>
)}
```

---

## Фаза 4: Мобильная bottom bar с динамическим CTA

**Файл: `src/pages/property/PropertyDetail.tsx`**

Обновить bottom bar (строки 778-785):

```typescript
// БЫЛО:
<Button size="lg" onClick={() => navigate(`/property/${id}/inquiry`)}>
  <Calendar className="w-4 h-4 mr-2" />
  {isRu ? 'Бронировать' : 'Reserve'}
</Button>

// СТАНЕТ:
<Button
  size="lg"
  className={cn(
    "flex-shrink-0 px-6",
    rentalTerms?.instant_booking && "bg-amber-500 hover:bg-amber-600"
  )}
  onClick={() => navigate(`/property/${id}/inquiry`)}
>
  {rentalTerms?.instant_booking ? (
    <>
      <Zap className="w-4 h-4 mr-2" />
      {isRu ? 'Забронировать' : 'Book Now'}
    </>
  ) : (
    <>
      <Calendar className="w-4 h-4 mr-2" />
      {isRu ? 'Проверить даты' : 'Check Dates'}
    </>
  )}
</Button>
```

---

## Фаза 5: Индикатор Instant Booking на странице деталей

**Файл: `src/pages/property/PropertyDetail.tsx`**

Уже есть highlight для instant booking (строки 430-443), но можно усилить:

Добавить бейдж рядом с ценой в мобильной bottom bar (строка 760-765):

```typescript
{/* Price section */}
<div className="flex-1 min-w-0">
  <div className="flex items-baseline gap-1">
    <span className="text-xl font-bold text-foreground">
      ฿{pricePerNight.toLocaleString()}
    </span>
    <span className="text-sm text-muted-foreground">
      /{isRu ? 'ночь' : 'night'}
    </span>
  </div>
  {rentalTerms?.instant_booking && (
    <Badge className="mt-0.5 bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs gap-1">
      <Zap className="w-3 h-3" />
      {isRu ? 'Мгновенное бронирование' : 'Instant Book'}
    </Badge>
  )}
</div>
```

---

## Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `src/pages/property/PropertyIndex.tsx` | Бейдж instant_booking + CTA hint |
| `src/components/property/PropertyBookingCard.tsx` | Динамическая кнопка |
| `src/pages/property/PropertyDetail.tsx` | Мобильный CTA + бейдж |

---

## Визуальный результат

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  КАРТОЧКА В СПИСКЕ (после улучшений)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  [Фото виллы]                                    ❤️          │            │
│  │                                                             │            │
│  │  ⚡ Мгновенное            ← бейдж для instant_booking=true  │            │
│  │  ★ Популярное            ← бейдж для is_featured=true      │            │
│  └─────────────────────────────────────────────────────────────┘            │
│  Kamala                                              ⭐ 4.9                  │
│  Luxury Ocean View Villa                                                    │
│  4 спален · 3 ванных · 8 гостей                                            │
│  ฿85,000/мес                                                                │
│  ⚡ Забронировать сейчас      ← новый CTA hint                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  BOOKING CARD (Sidebar на десктопе)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ฿3,500 / ночь                                                              │
│                                                                             │
│  ┌───────────────┬───────────────┐                                          │
│  │ Заезд         │ Выезд         │                                          │
│  │ Дата          │ Дата          │  ← пустые поля                          │
│  └───────────────┴───────────────┘                                          │
│                                                                             │
│  ┌───────────────────────────────┐                                          │
│  │ 📅 Проверить наличие         │  ← динамическая кнопка                   │
│  └───────────────────────────────┘                                          │
│                                                                             │
│  Выберите даты для расчёта стоимости                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ▼ После выбора дат

┌─────────────────────────────────────────────────────────────────────────────┐
│  BOOKING CARD (с датами)                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ฿3,500 / ночь                                                              │
│                                                                             │
│  ┌───────────────┬───────────────┐                                          │
│  │ Заезд         │ Выезд         │                                          │
│  │ 15 янв       │ 22 янв        │  ← заполненные даты                      │
│  └───────────────┴───────────────┘                                          │
│                                                                             │
│  ┌───────────────────────────────┐                                          │
│  │ ⚡ Мгновенное бронирование   │  ← для instant_booking=true              │
│  └───────────────────────────────┘                                          │
│            или                                                              │
│  ┌───────────────────────────────┐                                          │
│  │ Забронировать                │  ← для instant_booking=false             │
│  └───────────────────────────────┘                                          │
│                                                                             │
│  ฿3,500 × 7 ночей                               ฿24,500                     │
│  Скидка 10% (неделя)                           -฿2,450                      │
│  ─────────────────────────────────────────────                              │
│  Итого                                          ฿22,050                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  МОБИЛЬНЫЙ BOTTOM BAR (после улучшений)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ฿3,500/ночь                    📞  💬  ┌──────────────────────┐           │
│  ⚡ Мгновенное бронирование              │ ⚡ Забронировать    │           │
│                                          └──────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Данные в базе

Аудит показал, что в базе уже есть 4 объекта с `instant_booking = true`:
- Luxury Tropical Villa Rawai
- Investment Villa Nai Harn
- Premium Villa Layan
- Luxury Penthouse Surin

После внедрения изменений эти объекты сразу получат визуальные индикаторы.

---

## Техническое резюме

**Изменения:** 3 файла
**Риск регрессии:** Низкий - изменения касаются только UI/UX, не затрагивают логику бронирования
**Результат:** Путь клиента соответствует Airbnb-стандарту с динамическими CTA и визуальными индикаторами доступности
