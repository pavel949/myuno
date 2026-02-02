
# План: UX улучшения бронирования + мультиканальные уведомления

## Проблема

Пользователи на первых шагах формы бронирования опасаются нажимать на кнопку — не понимают, что ещё не платят, а только выбирают параметры. После бронирования уведомления отправляются не по всем каналам.

---

## Решение: Двухчастная доработка

### Часть 1: UX — "Booking Confidence System"

**1.1 Динамическая подсказка в BookingBottomBar**

Добавить контекстный текст над кнопкой, который меняется в зависимости от шага:

| Шаг | Кнопка | Подсказка (RU/EN) |
|-----|--------|-------------------|
| 0 (Детали) | "Далее" | "Выберите дату, время и участников" / "Select date, time and participants" |
| 1 (Контакты) | "Далее" | "Никаких списаний — это только ваши контакты" / "No charges yet — just your contact info" |
| 2 (Оплата) | "Подтвердить" | "Проверьте и подтвердите бронирование" / "Review and confirm your booking" |
| Final | "Оплатить" | Показывается сумма + "Безопасная оплата" |

**1.2 Обновление BookingBottomBar**

```tsx
interface BookingBottomBarProps {
  // ... existing props
  step?: number;           // Текущий шаг (0-3)
  totalSteps?: number;     // Всего шагов
  hint?: string;           // Опциональная кастомная подсказка
}
```

Добавить:
- Иконка 🔒 рядом с "Безопасно" на финальном шаге
- Текст "Оплата не требуется" на промежуточных шагах
- Прогресс `1 из 3` внизу бара

**1.3 Компонент BookingStepHint**

Новый компонент для показа контекстных подсказок:
- Показывает что нужно заполнить на текущем шаге
- Показывает сколько осталось шагов
- Анимированный при смене шагов

---

### Часть 2: Мультиканальные уведомления

**2.1 Расширение системы email-уведомлений**

Добавить новый тип email: `order_request_received` (для всех типов оплаты):

```typescript
// email-templates.ts — новый шаблон
generateOrderRequestEmail({
  customerName,
  orderNumber,
  orderType,
  totalAmount,
  paymentMethod,  // cash, card, wallet
  scheduledAt,
  nextSteps,      // Что делать дальше
})
```

Шаблон покажет:
- "Мы получили ваш запрос" (не "Заказ подтверждён")
- Детали бронирования
- Для cash: "Наш менеджер свяжется с вами"
- Для card: "Ожидаем оплату"
- Для wallet: "Оплата прошла"

**2.2 Триггер email при создании заказа**

Изменить `useOrders.ts`:

```typescript
// После создания заказа — отправляем email
await supabase.functions.invoke('send-order-email', {
  body: {
    type: 'order_request_received',
    order_id: orderId,
    user_id: user.id,
    payment_method: input.payment?.method,
  },
});
```

**2.3 Обновление BookingConfirmation**

После успешного бронирования показывать:
- ✓ Бронирование создано
- 📧 Подтверждение отправлено на email
- 📱 Уведомление в приложении
- 💬 (если cash) Менеджер свяжется через WhatsApp

---

## Файлы для изменения

### Новые файлы:
1. `src/components/booking/BookingStepHint.tsx` — контекстные подсказки по шагам

### Изменяемые файлы:
1. `src/components/booking/BookingBottomBar.tsx` — добавить hint, step props
2. `src/components/booking/BookingConfirmation.tsx` — показывать каналы уведомлений
3. `src/hooks/useOrders.ts` — отправка email при создании заказа
4. `supabase/functions/send-order-email/index.ts` — новый тип email
5. `supabase/functions/_shared/email-templates.ts` — шаблон "Request Received"

### Страницы бронирования для обновления:
- `ExperienceBooking.tsx`
- `TourBooking.tsx`
- `YachtBooking.tsx`
- `BabysitterBooking.tsx`
- `BeautyBooking.tsx`
- `TransportBooking.tsx`
- `CleaningBooking.tsx`
- `WaterActivityBooking.tsx`

---

## Технические детали

### BookingBottomBar — обновлённая логика

```tsx
// Определение hint на основе шага
const getStepHint = (step: number, isRu: boolean) => {
  const hints = {
    0: isRu ? '👆 Выберите параметры — оплата будет позже' : '👆 Select options — payment comes later',
    1: isRu ? '✍️ Укажите контакты для связи' : '✍️ Add contact details',
    2: isRu ? '💳 Выберите способ оплаты' : '💳 Choose payment method',
    3: isRu ? '🔒 Безопасное подтверждение' : '🔒 Secure confirmation',
  };
  return hints[step] || hints[0];
};
```

### Email template — Request Received

```typescript
generateOrderRequestEmail({
  customerName: 'Иван',
  orderNumber: 'UNO-240202-ABC1',
  orderType: 'experience',
  totalAmount: 5000,
  currency: 'THB',
  paymentMethod: 'cash',
  scheduledAt: '2024-02-05T14:00:00Z',
})
// → Subject: "Запрос получен! #UNO-240202-ABC1"
// → Body: "Мы получили ваш запрос на бронирование..."
```

---

## Результат

После реализации:

1. **Пользователь уверен** — на каждом шаге видит что делать и что оплата будет потом
2. **Мультиканальные уведомления** — email + in-app сразу после бронирования
3. **Консистентность** — единый UX паттерн во всех формах бронирования
4. **Прозрачность** — на экране подтверждения видно по каким каналам отправлены уведомления
