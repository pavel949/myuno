
# Синхронизация тарифов MC и карточки объекта

## Проблема

Сейчас данные о ценообразовании хранятся в двух несвязанных местах:
- **Карточка объекта** (`properties.seasonal_pricing` JSONB, `price_per_night`, скидки и т.д.) -- используется движком расчёта цен для гостей
- **Страница "Тарифы"** (`property_rate_seasons` таблица) -- отдельная страница MC, данные которой НЕ попадают в расчёт бронирования

Гости видят цены только из карточки. Данные со страницы тарифов никуда не попадают. Нужна единая система.

## Решение

Сделать таблицу `property_rate_seasons` единственным источником правды для сезонных цен. Страница MC `/mc/rates` становится центром финансовых условий аренды, показывая все данные из карточки и позволяя редактировать их напрямую.

---

## Шаг 1. Расширить таблицу `property_rate_seasons`

Добавить поля для скидок и условий, чтобы всё было в одной таблице:

```text
ALTER TABLE property_rate_seasons ADD COLUMN IF NOT EXISTS
  early_booking_discount numeric,
  early_booking_days integer,
  last_minute_discount numeric,
  last_minute_days integer,
  weekly_discount integer,
  monthly_discount integer;
```

Это позволит задавать скидки per-season (например, высокий сезон -- без скидок, низкий -- Early Bird 15%).

## Шаг 2. Движок расчёта цен (`pricingEngine.ts`)

Обновить `PricingRules` и `calculatePricing`, чтобы принимать данные из `property_rate_seasons` вместо JSONB:
- Новая функция `buildPricingRules(property, rateSeasons)` -- собирает правила из базовых данных объекта + записей таблицы сезонов
- `SeasonalPricingRule` будет строиться из `property_rate_seasons` (start_date/end_date конвертируется в startMonth/startDay/endMonth/endDay)

## Шаг 3. Переделать страницу MC "Тарифы" (`/mc/rates`)

Превратить из простого списка сезонов в полноценный центр ценообразования:

**Структура страницы:**

1. **Сводка по объектам** -- таблица/список всех объектов MC с базовой ценой за ночь (из `properties.price_per_night`), количеством активных сезонов и текущей эффективной ценой. Inline-редактирование базовой цены.

2. **Сезонные тарифы** -- текущий список, но обогащённый: при создании/редактировании сезона подтягивается `price_per_night` объекта как "базовая", а пользователь задаёт `nightly_rate` сезона. Показывается разница в %.

3. **Скидки** -- в Sheet/форме сезона добавить секцию скидок (weekly, monthly, early bird, last minute), которые применяются для этого сезона. Если не заданы -- используются дефолтные из карточки.

## Шаг 4. Синхронизация данных

При сохранении сезона на странице тарифов:
- Записи сохраняются в `property_rate_seasons`
- Одновременно обновляется `properties.seasonal_pricing` JSONB для обратной совместимости (чтобы существующий `pricingEngine` и гостевые компоненты работали без изменений)
- Функция `syncRateSeasonsToProperty(propertyId)` -- берёт все активные сезоны из таблицы и записывает их в JSONB

При сохранении карточки объекта (PricingStep):
- Если пользователь добавляет сезон через карточку, создаётся запись в `property_rate_seasons`
- JSONB обновляется как и раньше

## Шаг 5. Базовая цена inline-edit

На странице тарифов -- список объектов с возможностью быстро изменить `price_per_night` прямо в строке (click-to-edit). Изменение сразу обновляет `properties.price_per_night`.

## Шаг 6. Обновить гостевые компоненты

- `PropertyCalendar`, `PropertyBookingCard`, `PropertyDetail` -- загружать данные из `property_rate_seasons` напрямую (query by property_id) вместо чтения JSONB
- Это обеспечит мгновенную синхронизацию: MC поменял тариф -- гость сразу видит новую цену

---

## Технические детали

**Новые/изменённые файлы:**
- `supabase/migrations/` -- расширение таблицы `property_rate_seasons`
- `src/lib/pricingEngine.ts` -- функция `buildPricingRulesFromSeasons()`
- `src/pages/owner/RateManagementPage.tsx` -- полная переработка UI
- `src/hooks/usePropertyRateSeasons.ts` -- новый хук для загрузки сезонов по property_id
- `src/components/property/PropertyBookingCard.tsx` -- подключение к новому хуку
- `src/components/property/PropertyCalendar.tsx` -- подключение к новому хуку
- `src/pages/property/PropertyDetail.tsx` -- передача данных из хука
- `src/components/owner/property-wizard/steps/PricingStep.tsx` -- синхронизация с таблицей при сохранении

**Обратная совместимость:** JSONB-поле `seasonal_pricing` сохраняется и синхронизируется автоматически, но со временем становится кэшем, а не источником правды.
