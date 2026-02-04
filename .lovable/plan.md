
# План: Унификация Checkout маркетплейса с FlowersOrder

## Проблема
`MarketCheckout` значительно беднее по функционалу чем `FlowersOrder`:
- **Нет Concierge Advance** (кредитование от myUNO)
- **Нет Stripe Card payment** (только cash/wallet)
- **Нет BookingStepProgress** (подсказки для покупателя)

---

## Решение: Портирование функций из FlowersOrder в MarketCheckout

### Фаза 1: Добавить BookingStepProgress
Добавить визуальный прогресс-бар с шагами

```tsx
// Импорт
import { BookingStepProgress, deliveryBookingSteps } from '@/components/booking';

// Логика определения шага
const getCurrentStep = () => {
  if (paymentMethod) return 2;
  if (deliveryType && (isLocalFormValid || isIntlFormValid)) return 2;
  if (localFormData.name || intlFormData.name) return 1;
  return 0;
};

// В JSX после PageHeader
<BookingStepProgress steps={deliveryBookingSteps} currentStep={getCurrentStep()} />
```

### Фаза 2: Добавить Stripe Checkout
Создать хук `useStripeMarketCheckout.ts` (аналогично `useStripeFlowersCheckout`)

```tsx
// src/hooks/useStripeMarketCheckout.ts
export function useStripeMarketCheckout() {
  // Вызов edge function create-market-checkout
  // Возврат URL для redirect на Stripe
}
```

Создать edge function `create-market-checkout/index.ts` (аналогично flowers):
- Принимает items, delivery_fee, total_amount, recipient данные
- Создаёт Stripe Checkout Session
- Возвращает URL

### Фаза 3: Добавить Concierge Advance
Добавить опцию кредитования в `BookingPaymentSelect`

```tsx
// Импорты
import { useConciergeAdvance } from '@/hooks/useConciergeAdvance';
import { ConciergeAdvanceOption } from '@/components/booking/ConciergeAdvanceOption';

// В секции Payment
{paymentMethod === 'concierge_advance' && (
  <ConciergeAdvanceOption
    isSelected={true}
    onSelect={() => setPaymentMethod('concierge_advance')}
    baseAmount={total}
    feePercent={feePercent}
    currency="THB"
  />
)}
```

### Фаза 4: Обработка всех payment methods в handleSubmit

```tsx
const handleSubmit = async () => {
  // 1. Card → Stripe Checkout redirect
  if (paymentMethod === 'card') {
    await createMarketCheckout({ ... });
    return;
  }
  
  // 2. Wallet → payFromWallet + createBooking
  if (paymentMethod === 'wallet') {
    const result = await payFromWallet(...);
    if (!result.success) return;
  }
  
  // 3. Concierge Advance → createBooking + createAdvanceRequest
  if (paymentMethod === 'concierge_advance') {
    const bookingResult = await createBooking({ status: 'pending_advance', ... });
    await createAdvanceRequest({ orderId: bookingResult.booking_id, ... });
    navigateToAdvanceRequested(...);
    return;
  }
  
  // 4. Cash → createBooking (existing flow)
  await createBooking({ ... });
};
```

---

## Файлы для создания

| Файл | Описание |
|------|----------|
| `supabase/functions/create-market-checkout/index.ts` | Stripe Checkout для маркетплейса |
| `src/hooks/useStripeMarketCheckout.ts` | Хук для вызова edge function |

## Файлы для редактирования

| Файл | Изменения |
|------|-----------|
| `src/pages/market/MarketCheckout.tsx` | Добавить BookingStepProgress, Stripe, Concierge Advance |

---

## Результат

- ✅ **Единый UX** между Flowers и Market checkout
- ✅ **4 способа оплаты**: Cash, Wallet, Card (Stripe), Concierge Advance
- ✅ **Визуальные подсказки** через BookingStepProgress
- ✅ **Buy Now** полностью работает с оплатой картой
- ✅ **Кредитование** доступно для пользователей без тайского счёта
