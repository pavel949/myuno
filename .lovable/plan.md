

# Stripe Checkout для Beauty, Medical, Fitness

## Текущее состояние

Все три вертикали (BeautyBooking, FitnessBooking, MedicalAppointment) используют `useBooking` → `useOrders` с `payment_method: 'cash'`. Stripe не задействован. Существующий `create-service-checkout` Edge Function подходит по структуре, но не использует Order-First паттерн и не считает комиссию 10%.

## Архитектура

Создаём **одну** Edge Function `create-wellness-checkout`, которая:
- Следует Order-First паттерну (order создаётся ДО Stripe session)
- Использует `create_order_atomic` RPC
- Считает 10% platform fee через `calculateOrderTotals` или inline
- Поддерживает все три вертикали через параметр `vertical: 'beauty' | 'fitness' | 'medical'`
- Stripe webhook уже обрабатывает `service_payment` — переиспользуем этот тип

## Файлы и изменения

| Файл | Действие |
|------|----------|
| `supabase/functions/create-wellness-checkout/index.ts` | **Новый** — Edge Function с Order-First + 10% fee |
| `src/hooks/useWellnessCheckout.ts` | **Новый** — тонкая обёртка над `useStripeUnifiedCheckout` с подготовкой payload |
| `src/pages/beauty/BeautyBooking.tsx` | **Изменение** — при `paymentMethod === 'card'` → вызов `createWellnessCheckout` вместо `createBooking` |
| `src/pages/fitness/FitnessBooking.tsx` | **Изменение** — аналогично |
| `src/pages/medical/MedicalAppointment.tsx` | **Изменение** — аналогично |
| `src/pages/wellness/WellnessOrderSuccess.tsx` | **Новый** — страница успеха после Stripe оплаты |
| `src/components/layout/AnimatedRoutes.tsx` | **Изменение** — +1 route для success page |
| `src/components/layout/pageRegistry.ts` | **Изменение** — lazy import |
| `src/lib/config/routes.ts` | **Изменение** — +1 route constant |

## Edge Function: create-wellness-checkout

```text
Input:
  vertical: 'beauty' | 'fitness' | 'medical'
  items: [{ id, name, price, duration_minutes? }]
  total_amount: number
  scheduled_at: string
  contact_name, contact_phone, contact_email?
  provider_id?, provider_name?
  notes?

Flow:
  1. Auth check
  2. Calculate: service_fee = round(total_amount * 0.10)
  3. create_order_atomic(order_type=vertical, payment_method='stripe', ...)
  4. Stripe session create (mode: 'payment', metadata.type='service_payment', metadata.order_id)
  5. Return { url, sessionId, orderId }
```

## Изменения в Booking Pages

Логика `handleSubmit`:
- Если `paymentMethod === 'card'` или `'online'` → вызов Edge Function → redirect на Stripe
- Если `paymentMethod === 'cash'` → существующий `createBooking` flow (без изменений)

Добавляем `showOnline` prop в `BookingPaymentSelect` для отображения опции "Оплата картой онлайн".

## Комиссия 10%

- Service fee показывается в `BookingSummary` как отдельная строка
- Stripe line items: услуги + "Platform Service Fee / Сервисный сбор"
- Вендор получает 90%, fee остаётся платформе

## ~9 файлов, 1 новая Edge Function

