

# Система оплаты объектов для Управляющих Компаний (Pay-per-Property)

## Концепция

Управляющая компания (УК) может добавить неограниченное количество объектов, но функции PMS (календарь, бронирования, финансы, задачи) доступны только для **оплаченных слотов**. Цена — **$25/мес за активный объект**. Неоплаченные объекты отображаются в списке с пометкой "Inactive" и предложением активировать.

## Архитектура

```text
+------------------------------+
|   management_companies       |
|   + paid_slots (int)         |  <-- сколько оплачено
|   + stripe_customer_id       |
|   + stripe_subscription_id   |
+------------------------------+
              |
              v
+------------------------------+
|   mc_property_slots          |  <-- какие объекты активны
|   company_id  |  property_id |
|   activated_at | is_active   |
+------------------------------+
              |
              v
+------------------------------+
|   properties                 |
|   (все объекты УК)           |
+------------------------------+
```

## Шаги реализации

### 1. База данных — новая таблица `mc_property_slots`

- `id` (uuid, PK)
- `company_id` (uuid, FK -> management_companies)
- `property_id` (uuid, FK -> properties, unique)
- `is_active` (boolean, default true)
- `activated_at` (timestamptz)
- `deactivated_at` (timestamptz, nullable)

Также добавить в `management_companies`:
- `paid_slots` (int, default 0) — количество оплаченных слотов
- `stripe_customer_id` (text, nullable)
- `stripe_subscription_id` (text, nullable)

RLS: доступ к `mc_property_slots` только участникам УК через `is_mc_member()`.

### 2. Edge Function: `create-mc-subscription`

- Получает `company_id` и `quantity` (сколько слотов покупается)
- Создает Stripe Checkout Session с `mode: "subscription"`, `quantity` = количество слотов
- Использует единый Stripe Price ($25/мес, recurring)
- Метаданные: `company_id`, `user_id`, `quantity`
- После оплаты Stripe webhook обновляет `paid_slots` в `management_companies`

### 3. Edge Function: `check-mc-subscription`

- Проверяет текущий статус подписки УК по `stripe_subscription_id`
- Возвращает: `paid_slots`, `active_slots_used`, `can_activate_more`, `subscription_status`
- Вызывается при загрузке Owner workspace

### 4. Edge Function: `update-mc-slots`

- Позволяет менять количество слотов (upgrade/downgrade) через `stripe.subscriptions.update({ items: [{ quantity }] })`
- Обновляет `paid_slots` в БД

### 5. Stripe Webhook — обработка событий MC-подписки

- `customer.subscription.updated` → обновить `paid_slots` из `quantity`
- `customer.subscription.deleted` → `paid_slots = 0`, деактивировать все слоты
- Добавить обработку в существующий `stripe-webhook` Edge Function

### 6. Хук `useMCSubscription`

Фронтенд-хук для Owner workspace:
- `paidSlots` — сколько оплачено
- `usedSlots` — сколько активировано
- `canActivateMore` — есть ли свободные слоты
- `isPropertyActive(propertyId)` — активен ли конкретный объект
- `activateProperty(propertyId)` / `deactivateProperty(propertyId)`
- `updateSlotCount(newCount)` — изменить подписку

### 7. UI: Гейтинг функций по статусу объекта

В компонентах PMS (Calendar, Bookings, Financials, Tasks) проверять `isPropertyActive`:
- **Активный** → полный доступ
- **Неактивный** → баннер "Activate this property ($25/mo)" с кнопкой; данные read-only или скрыты

В списке объектов (`OwnerProperties`):
- Неактивные объекты показываются с затемнением и бейджем "Inactive"
- Кнопка "Activate" если есть свободные слоты, или "Buy more slots" если нет

### 8. UI: Страница управления подпиской

Страница `/owner/subscription`:
- Текущий план: X из Y слотов использовано
- Прогресс-бар заполнения
- Список активных объектов с возможностью деактивации
- Кнопка "Add more slots" → Stripe Checkout
- Кнопка "Manage billing" → Stripe Portal

## Техническая детализация

### Stripe Product/Price
- Один Product: "PMS Property Slot"
- Один Price: $25/month, recurring, с поддержкой `quantity`
- При checkout: `line_items: [{ price: PRICE_ID, quantity: selectedSlots }]`

### Ключевая логика активации
```text
IF mc.paid_slots > count(mc_property_slots WHERE is_active)
  → можно активировать ещё
ELSE
  → нужно докупить слоты
```

### Файлы для изменения/создания

| Файл | Действие |
|------|----------|
| migration SQL | Создать `mc_property_slots`, расширить `management_companies` |
| `supabase/functions/create-mc-subscription/index.ts` | Новый — создание подписки |
| `supabase/functions/check-mc-subscription/index.ts` | Новый — проверка подписки |
| `supabase/functions/update-mc-slots/index.ts` | Новый — изменение количества |
| `supabase/functions/stripe-webhook/index.ts` | Добавить обработку MC-событий |
| `src/hooks/useMCSubscription.ts` | Новый — фронтенд хук |
| `src/pages/owner/MCSubscriptionPage.tsx` | Новый — страница управления |
| `src/components/owner/PropertySlotGate.tsx` | Новый — гейт компонент |
| `src/components/owner/OwnerSidebar.tsx` | Добавить пункт "Subscription" |
| Компоненты PMS (Calendar, Financials и т.д.) | Обернуть в `PropertySlotGate` |

