
# Аудит пересечений: новые треки vs действующая система STR-бронирования

## Что уже работает (STR — краткосрочная аренда)

Это **рабочий контур**, который трогать нельзя:

1. **Каталог STR** → `useStaysSearch.ts` — фильтрует `properties` по `is_active=true` + `approval_status=approved`, отсекает занятые даты через `property_availability` и `property_bookings`.
2. **Карточка объекта** → `PropertyDetail.tsx` + `PropertyBookingCard.tsx` — выбор дат/гостей.
3. **Календарь занятости** → `usePropertyAvailability.ts` (`check_property_availability` RPC), `usePropertyUnavailableDates.ts` (`get_property_unavailable_dates` RPC), `usePropertyBlockedDates.ts` (читает `orders` с `vertical='property'`).
4. **Запрос/инстант-бронь** → `PropertyInquiry.tsx` — создаёт `order` через `useOrders` + `vertical='property'`, item_type='property', записывает `start_at/end_at`, депозит, оплата через Stripe.
5. **Цены** → `pricingEngine.ts` + `property_rate_seasons` (поночная логика, сезоны).
6. **Канал-менеджер** → iCal+ синк, Rentals United.
7. **Поле выбора режима в визарде** — старое поле `listing_modes: ['platform','sale','rent']` (строится в `usePropertyWizard.ts` строки 717-721 при сохранении).

## Найденные пересечения и риски

### ⚠️ Коллизия #1 — Два параллельных поля для одного смысла
- **Старое:** `properties.listing_modes` (`platform | sale | rent`) — используется в `useStaysSearch.ts` (строки 116-122) для фильтрации STR, в `PropertyCard.tsx` для бейджа «На платформе», в `CanonicalPropertyForm.tsx` (строки 244, 168).
- **Новое:** `properties.tenancy_modes` (`short | medium | long`) + `sale_intent` — добавлено миграцией, заполнено для всех 31 объектов (`new_short_tenancy=31`).
- **Риск:** `usePropertyWizard.ts` при каждом сохранении **перезаписывает `listing_modes`** на основе `platform_listed/is_for_sale/price_per_night`, игнорируя `tenancy_modes`. Поэтому если оунер уберёт «short» из `tenancy_modes`, объект всё равно останется в выдаче STR (фильтр идёт по старому `listing_modes`).

### ⚠️ Коллизия #2 — Фильтр STR не учитывает новый `tenancy_modes`
`useStaysSearch.ts` ищет в `listing_modes` строки `short|vacation|night|daily`. Но в реальности `listing_modes` хранит `'platform' | 'sale' | 'rent'` — ни одно слово не матчится regex'ом. Сейчас спасает fallback `return shortTermOnly.length > 0 ? shortTermOnly : rows;` — то есть фильтр **по факту не работает** и возвращает всё подряд (и продажные объекты тоже могут попадать в STR-выдачу).

### ⚠️ Коллизия #3 — `sale_intent` ещё не отфильтровывает продажу из аренды
Если оунер выставил объект только на продажу (`sale_intent='resale'`, `tenancy_modes=[]`), он всё равно попадёт в `useStaysSearch` (нет фильтра по `tenancy_modes`/`sale_intent`).

### ⚠️ Коллизия #4 — `min_lease_months` vs `min_stay_nights`
Для MTR/LTR введено новое поле `min_lease_months`, но `PropertyInquiry.tsx` валидирует только `min_stay_nights`. Если сохранить объект как «long» с `min_lease_months=6`, гость всё равно сможет забронировать на 2 ночи через STR-флоу.

### ✅ Что НЕ конфликтует
- `is_assignment`, `escrow_offered`, `installment_plan`, `title_deed_type` — относятся только к продаже/переуступке, к STR-бронированию не подключены, поломать ничего не могут.
- `property_availability`, `property_bookings`, `orders.vertical='property'` — структурно не изменились.
- Stripe webhook, депозиты, `pricingEngine` — не затронуты.
- Resale-блок (`useResaleProperties`, `ResaleDetail`) уже работает с `is_assignment` корректно.

## План исправлений (минимальные правки, без слома STR)

### Шаг 1 — Синхронизировать `listing_modes` ↔ `tenancy_modes` в визарде
В `usePropertyWizard.ts` (стр. 717-721) расширить построение `listing_modes`:
```
listing_modes: [
  ...(platform_listed ? ['platform'] : []),
  ...(sale_intent && sale_intent !== 'none' ? ['sale'] : (is_for_sale ? ['sale'] : [])),
  ...(tenancy_modes?.includes('short') ? ['rent','short'] : []),
  ...(tenancy_modes?.includes('medium') ? ['medium'] : []),
  ...(tenancy_modes?.includes('long') ? ['long'] : []),
]
```
Так старые потребители (`useStaysSearch`, `PropertyCard`) продолжат работать, а regex `/short|vacation|night|daily/` начнёт реально матчить.

### Шаг 2 — Сделать фильтр STR строгим по `tenancy_modes`
В `useStaysSearch.ts`:
- Добавить в SELECT `tenancy_modes, sale_intent`.
- Заменить логику строк 116-124 на:
  ```
  return rows.filter(r => 
    Array.isArray(r.tenancy_modes) 
      ? r.tenancy_modes.includes('short')
      : /short|vacation|night|daily/i.test((r.listing_modes ?? []).join(','))
  );
  ```
- Убрать fallback `shortTermOnly.length > 0 ? shortTermOnly : rows` — он маскирует пустую выдачу и пропускает «sale-only» объекты.

### Шаг 3 — Защитить `PropertyInquiry` от MTR/LTR
В `PropertyInquiry.tsx` при загрузке property проверить:
- если `tenancy_modes` не содержит `'short'` → показать баннер «Этот объект сдаётся на месяц+, оставьте запрос» и скрыть calendar/instant-book, переключив на форму lead'а (без создания order).
- `min_stay_nights` поднять до `max(min_stay_nights, min_lease_months*30)` если active mode = medium/long.

### Шаг 4 — Защитить карточку (`PropertyDetail`)
Кнопка «Забронировать» / `PropertyBookingCard` показывается только если `tenancy_modes.includes('short')`. Иначе — кнопка «Запросить аренду» (LTR/MTR lead) или «Запросить просмотр» (sale).

### Шаг 5 — Бэкфилл данных (одна миграция SELECT-only проверкой)
Уже сделано: 31 объект имеет `'short' ∈ tenancy_modes`. Нужно только обновить `listing_modes` чтобы они содержали `'short'`/`'rent'` явно — одной UPDATE-миграцией:
```sql
UPDATE properties
SET listing_modes = (
  SELECT array_agg(DISTINCT m) FROM unnest(
    coalesce(listing_modes,'{}') 
    || CASE WHEN 'short'  = ANY(tenancy_modes) THEN ARRAY['rent','short']  ELSE '{}'::text[] END
    || CASE WHEN 'medium' = ANY(tenancy_modes) THEN ARRAY['medium']        ELSE '{}'::text[] END
    || CASE WHEN 'long'   = ANY(tenancy_modes) THEN ARRAY['long']          ELSE '{}'::text[] END
    || CASE WHEN sale_intent IS NOT NULL AND sale_intent <> 'none' THEN ARRAY['sale'] ELSE '{}'::text[] END
  ) m
)
WHERE tenancy_modes IS NOT NULL OR sale_intent IS NOT NULL;
```

## Что НЕ нужно делать (явно)
- НЕ трогать `orders`, `property_bookings`, `property_availability`, RPC `check_property_availability`/`get_property_unavailable_dates`, `pricingEngine`, Stripe webhook, iCal sync.
- НЕ удалять `listing_modes` — его читает 8+ мест, оставляем как denormalised cache для обратной совместимости.
- НЕ менять схему `orders` — для MTR/LTR/Sale на этом этапе используем lead-форму (без транзакции), новый order-flow добавим позже отдельным этапом.

## Итог
Действующее STR-бронирование пересекается с новыми треками **только через два поля** (`listing_modes` ↔ `tenancy_modes`) и **только в трёх точках кода** (`usePropertyWizard`, `useStaysSearch`, `PropertyInquiry/Detail`). Шаги 1-5 закрывают коллизии, при этом весь рабочий контур STR (календарь, цены, заказы, оплаты, iCal) остаётся нетронутым.

Подтвердите план — и я внесу правки одним патчем + одной миграцией бэкфилла.
