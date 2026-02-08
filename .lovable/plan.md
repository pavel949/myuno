

## Добавление оплаты и CTA на страницу аренды транспорта

### Проблема

Страница аренды транспорта (`/transport/booking/:id`) имеет компонент выбора оплаты, но:
- Нет опции **"Оплатить картой онлайн"** через Stripe (нет интеграции с `create-checkout`)
- Нет опции **"Пусть оплатит myUNO"** (Concierge Advance)
- Кнопка внизу всегда показывает "Забронировать" вне зависимости от выбранного метода оплаты
- Нет Stripe redirect после создания заказа

### Решение

Привести страницу аренды в соответствие с другими вертикалями (Flowers, Market, Airport Transfer).

### Изменения

#### 1. `TransportBooking.tsx` -- добавить Concierge Advance + Stripe

- Импортировать `ConciergeAdvanceOption` из `@/components/booking/ConciergeAdvanceOption`
- Добавить блок Concierge Advance под `BookingPaymentSelect` (аналогично FlowersOrder)
- После `createBooking` при выборе `online` -- вызывать `create-checkout` Edge Function и делать redirect на Stripe
- При выборе `concierge_advance` -- показывать подтверждение без оплаты
- Обновить текст кнопки в `BookingBottomBar`:
  - `online` --> "Перейти к оплате ฿X" / "Proceed to Payment ฿X"
  - `concierge_advance` --> "Отправить запрос" / "Submit Request"
  - `cash` --> "Забронировать" / "Book Now"

#### 2. Логика оплаты (в `handleSubmit`)

```text
handleSubmit()
  |
  +-- createBooking(...) --> order_id
  |
  +-- if online/promptpay:
  |     invoke('create-checkout', { order_id, amount, ... })
  |     redirect to Stripe URL
  |
  +-- if concierge_advance:
  |     show success with myUNO badge
  |
  +-- if cash/wallet:
        show standard confirmation
```

#### 3. Файлы для изменения

| Файл | Что меняется |
|------|-------------|
| `src/pages/transport/TransportBooking.tsx` | Добавить Stripe checkout, ConciergeAdvanceOption, динамический текст CTA |

Один файл, все изменения локальные. Паттерн полностью повторяет существующие вертикали (FlowersOrder, MarketCheckout).

