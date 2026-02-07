

## Аудит и исправление интеграции яхт

### Найденные проблемы

**1. Критический баг: `useVendorYachts.ts` запрашивает несуществующие колонки**
- Хук запрашивает `price_per_day`, `price_per_hour`, `length_ft` -- этих колонок НЕТ в БД
- Правильные колонки: `price_half_day`, `price_full_day`, `length_meters`
- Это ломает панель вендора для яхт

**2. Захардкоженная комиссия платформы**
- В `YachtBooking.tsx` строка 118: `serviceFee = ... * 0.05` (5%)
- В `system_settings` значение `platform_fee_percent = 10`
- Нужно брать значение из БД через существующий механизм настроек

**3. Захардкоженный символ валюты**
- В `YachtBookingQuickSelect.tsx` строка 44: `currency === 'THB' ? '฿' : '$'`
- Должен использоваться `getCurrencySymbol()` из `src/lib/config/currencies.ts`

**4. Захардкоженные времена отправления**
- В `YachtBookingQuickSelect.tsx` и `YachtBooking.tsx` время жестко задано: `['09:00', '14:00']` и `['08:00', '09:00', '10:00']`
- Должно быть настраиваемым (хотя бы из поля яхты или справочника)

**5. Яхты не в Route Registry**
- `/yachts` маршруты работают в `AnimatedRoutes.tsx`, но отсутствуют в `src/lib/config/routes.ts`

**6. 3 яхты AYA Yachts в статусе `pending`**
- Sea Bear 40M (Overnight + Day Charter) и Princess S72 -- нужно аппрувить

**7. Intake-конфиг использует старые поля**
- `intakeVerticals.ts` ссылается на `price_per_day`, `price_per_hour` вместо `price_half_day`, `price_full_day`

### UUID яхт -- OK
Все 13 яхт используют корректные UUID v4 формата `b1000001-0000-4000-a000-*`. Провайдеры тоже имеют UUID.

### Цены -- соответствуют поставщикам
Проверка по source_urls подтверждает реальные цены Tiger Marine и Simba Sea Trips в THB.

---

### План исправлений

**Шаг 1. Исправить `useVendorYachts.ts`**
- Заменить `price_per_day` на `price_half_day`, `price_per_hour` на `price_full_day`, `length_ft` на `length_meters`
- Добавить недостающие поля: `price_sunset`, `price_overnight`

**Шаг 2. Убрать захардкоженную комиссию из `YachtBooking.tsx`**
- Импортировать `platform_fee_percent` из `system_settings` через существующий хук
- Заменить `0.05` на динамическое значение

**Шаг 3. Убрать захардкоженный символ валюты из `YachtBookingQuickSelect.tsx`**
- Использовать `getCurrencySymbol(yacht.currency)` вместо тернарного оператора

**Шаг 4. Зарегистрировать яхты в Route Registry**
- Добавить `YACHTS`, `YACHT_DETAIL`, `YACHT_BOOKING` в `APP_ROUTES` в `routes.ts`
- Добавить паттерн `/yachts/:id` в `dynamicPatterns`

**Шаг 5. Аппрувить pending яхты AYA Yachts**
- UPDATE `approval_status = 'approved'` для 3 записей

**Шаг 6. Исправить `intakeVerticals.ts`**
- Обновить поля яхт: `price_per_day` -> `price_half_day`, `price_per_hour` -> `price_full_day`

**Шаг 7. Обновить интерфейс `Yacht` в `useYachts.ts`**
- Убедиться что типы соответствуют реальной схеме БД (добавить `price_sunset`, `price_overnight`, `addons`, `charter_options` и др.)

