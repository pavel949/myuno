

## Аудит остатков и план следующих P3-улучшений календаря

После Фазы 1 (унификация SSOT) и Фазы 2 (sync orders→legacy + цены в host-календаре) остаются конкретные пробелы. Ниже — приоритезированный список с минимальными, точечными правками.

### Что уже работает
- Гость и хост читают доступность из `orders` через RPC `check_property_dates_available` / `check_property_availability` / `get_property_unavailable_dates`.
- `useStaysUnifiedCalendar` показывает реальные конфликты (orders + iCal), без шумов.
- `PropertyBookingCard` блокирует невалидные `checkout` по min-stay и показывает подсказку.
- Триггер `trg_sync_order_to_property_booking` зеркалит брони в legacy-таблицу для iCal-экспорта.
- В `AirbnbCalendarGrid` отображаются цены за ночь с цветовой иерархией (override / season / base).

### Что чинить дальше (P3, по убыванию ценности)

**P3-1. Гостевой календарь не подсвечивает занятые даты заранее**
`PropertyBookingCard` сегодня узнаёт о недоступности только после нажатия на даты (через RPC при подтверждении). Гость может выбрать занятый диапазон и увидеть ошибку лишь в конце. Нужно: подгружать `get_property_unavailable_dates(property_id, today, +12mo)` через новый хук `usePropertyUnavailableDates`, передавать массив в `Calendar.disabled`, чтобы занятые ночи были визуально серыми и некликабельными.

**P3-2. Нет визуального различия checkout-only дня**
В STR последний день брони (checkout) физически свободен под новый check-in. Сейчас он либо заблокирован, либо нет — без подсказки. Добавим в RPC `get_property_unavailable_dates` маркер `is_checkout_only`, и в `Calendar` отрисуем такие дни с диагональной штриховкой (CSS-класс) — кликабельны только как `from`.

**P3-3. Хост-календарь не показывает источник брони и гостя**
В `AirbnbCalendarGrid` сейчас видно только цвет канала, но непонятно, кто заехал. Доработка: tooltip на ячейку с гостем, каналом и суммой (берём из уже загруженного `unifiedData.bookings`).

**P3-4. Нет защиты от drag-select поверх занятых дат у хоста**
В `PropertyCalendar` drag-выделение позволяет накрыть забронированные ночи и поставить на них блок/цену — это ломает `property_availability` для уже проданной ночи. Добавим проверку: при `onSelect` пересекаем выбранный диапазон с `unifiedDayMeta`; если есть пересечение — показать `toast.error` и отменить.

**P3-5. Кэш React Query не инвалидируется после iCal-синка**
После `syncAllCalendars` обновляется БД, но `['stays-unified-calendar']` и `['property-availability-management']` остаются в кэше до 30s. Добавим `queryClient.invalidateQueries` по обоим ключам в `onSuccess` мутации `syncAllCalendars` в `useExternalCalendars`.

**P3-6. Realtime-обновление календаря**
Когда другой менеджер/гость создаёт бронь, открытый календарь не обновляется. Подпишемся на `postgres_changes` для `orders` (filter: `vertical=eq.property`) внутри `useStaysUnifiedCalendar` и инвалидируем query при событии.

### Технические детали

**SQL (migration):**
```sql
-- расширяем RPC: возвращаем тип ночи
create or replace function public.get_property_unavailable_dates(
  p_property_id uuid, p_from date, p_to date
) returns table(date date, kind text) ...
-- kind ∈ ('booked','blocked','checkout_only')
```

**Новый хук** `src/hooks/usePropertyUnavailableDates.ts` — обёртка вокруг RPC + 60s staleTime.

**Файлы к правке:**
- `src/components/property/PropertyBookingCard.tsx` — `disabled` + `modifiers.checkoutOnly`
- `src/components/ui/calendar.tsx` — поддержка modifier `checkoutOnly` (штриховка)
- `src/components/owner/AirbnbCalendarGrid.tsx` — tooltip с гостем/каналом/суммой
- `src/components/property/PropertyCalendar.tsx` — guard на drag-select
- `src/hooks/useExternalCalendars.ts` — invalidate после sync
- `src/hooks/useStaysUnifiedCalendar.ts` — realtime-подписка
- 1 новая миграция: расширение RPC `get_property_unavailable_dates`

### Порядок реализации
Одной сессией: P3-1 + P3-2 (миграция RPC + хук + Calendar) → P3-4 (guard) → P3-5 (invalidate) → P3-3 (tooltip) → P3-6 (realtime). Бэкэнд-правка одна, остальное — фронт.

