
# План: "Попросить myUNO оплатить за вас" — Concierge Advance Payment

## Концепция

Новый метод оплаты для клиентов, которые:
- Не имеют тайских батов физически
- Не имеют тайского банковского счёта
- Хотят оплатить картой/криптой, но провайдер принимает только наличные

**Схема работы:**
1. Клиент выбирает "Попросить myUNO оплатить"
2. Создаётся заказ со статусом `pending_advance`
3. Создаётся запрос в `consultation_requests` (для координации)
4. Админ получает уведомление и принимает решение
5. Если одобрено → myUNO платит провайдеру наличными
6. Клиент получает уведомление "Предоплата внесена" + ссылку на оплату UNO
7. Клиент оплачивает UNO (карта/крипто/перевод) + 5% комиссия
8. После получения денег → заказ `confirmed`

---

## Визуальный дизайн

```text
ТЕКУЩИЕ МЕТОДЫ ОПЛАТЫ (FlowersOrder.tsx):
┌─────────────────────────────────────────────────────────────────────────────┐
│  [ ] 💳 Из кошелька         Баланс: ฿5,000                                  │
│  [●] 💳 Банковская карта    Visa, Mastercard, JCB                          │
│  [ ] ฿  Наличными           Оплата при получении                           │
└─────────────────────────────────────────────────────────────────────────────┘

ПОСЛЕ ДОБАВЛЕНИЯ:
┌─────────────────────────────────────────────────────────────────────────────┐
│  [ ] 💳 Из кошелька         Баланс: ฿5,000                                  │
│  [●] 💳 Банковская карта    Visa, Mastercard, JCB                          │
│  [ ] ฿  Наличными           Оплата при получении                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ✨ Попросить myUNO оплатить за вас                     +5% сервис    │ │
│  │                                                                        │ │
│  │  Нет батов? Нет тайского счёта?                                       │ │
│  │  myUNO внесёт предоплату провайдеру, вы оплатите нам любым способом   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Поток данных

```text
                           Клиент                        Система                      Админ
                              │                             │                           │
     Выбрать "myUNO Advance"  │                             │                           │
     ─────────────────────────┼────────────────────────────→│                           │
                              │                             │                           │
                              │   1. Создать Order          │                           │
                              │      status: pending_advance│                           │
                              │      payment_method: concierge│                         │
                              │                             │                           │
                              │   2. Создать Consultation   │                           │
                              │      Request (vertical_id:  │                           │
                              │      'concierge_advance')   │                           │
                              │                             │                           │
                              │   3. Уведомление админу     │                           │
                              │────────────────────────────→│──────────────────────────→│
                              │                             │                           │
                              │                             │   4. Админ решает:        │
                              │                             │      Approve / Decline    │
                              │                             │←──────────────────────────│
                              │                             │                           │
                              │   5. Если Approve:          │                           │
                              │   • myUNO платит провайдеру │                           │
                              │   • Order: awaiting_client_payment                      │
                              │   • Отправить клиенту ссылку│                           │
                              │     на оплату + 5% fee      │                           │
                              │←────────────────────────────│                           │
                              │                             │                           │
     6. Клиент оплачивает     │                             │                           │
        UNO (карта/крипто)    │                             │                           │
     ─────────────────────────┼────────────────────────────→│                           │
                              │                             │                           │
                              │   7. Order: confirmed       │                           │
                              │   8. Уведомление клиенту    │                           │
                              │←────────────────────────────│                           │
```

---

## Архитектура решения

### Новые статусы заказа

```sql
-- Добавить в order_status enum:
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_advance';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_client_payment';
```

### Новый метод оплаты

```typescript
// В BookingPaymentSelect.tsx
export type PaymentMethod = 'cash' | 'card' | 'wallet' | 'online' | 'promptpay' | 'concierge_advance';
```

### Структура consultation_request для advance

```typescript
{
  vertical_id: 'concierge_advance',
  request_type: 'advance_payment',
  entry_point: 'flowers_checkout', // или 'property_booking', 'yacht_booking'
  vertical_metadata: {
    order_id: 'uuid',
    order_number: 'ORD-XXXX',
    order_type: 'flowers',
    base_amount: 2000,           // Сумма заказа
    concierge_fee: 100,          // 5% комиссия
    total_client_pays: 2100,     // Итого для клиента
    provider_receives: 2000,     // Сколько получит провайдер
    provider_name: 'Phuket Flowers',
    delivery_address: '...',
    delivery_date: '2024-02-05',
    client_payment_method_preference: 'card_usd', // или 'crypto', 'wire_transfer'
  },
  status: 'new',
  priority: 'high',
}
```

---

## Фазы реализации

### Фаза 1: Миграция БД

1. Добавить новые статусы в `order_status` enum
2. Добавить `concierge_fee_amount` в `orders` таблицу
3. Создать vertical 'concierge_advance' в `lookup_values`

```sql
-- Новые статусы
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_advance';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'awaiting_client_payment';

-- Колонка для concierge fee
ALTER TABLE orders ADD COLUMN IF NOT EXISTS concierge_fee_amount NUMERIC(10,2) DEFAULT 0;

-- Vertical для lead tracking
INSERT INTO lookup_values (lookup_type, value_key, value_en, value_ru, icon, sort_order)
VALUES ('vertical', 'concierge_advance', 'Concierge Advance', 'Аванс через консьержа', '💸', 20)
ON CONFLICT (lookup_type, value_key) DO NOTHING;
```

### Фаза 2: Компонент ConciergeAdvanceOption

Новый UI компонент для отображения опции:

```typescript
// src/components/booking/ConciergeAdvanceOption.tsx

interface ConciergeAdvanceOptionProps {
  isSelected: boolean;
  onSelect: () => void;
  baseAmount: number;
  feePercent?: number;  // default 5%
  currency?: string;
}

// Показывает:
// - Иконку ✨
// - "Попросить myUNO оплатить за вас"
// - Бейдж "+5% сервис"
// - Объяснение: "Нет батов? myUNO внесёт предоплату..."
// - Итоговую сумму с комиссией
```

### Фаза 3: Хук useConciergeAdvance

```typescript
// src/hooks/useConciergeAdvance.ts

interface ConciergeAdvanceRequest {
  orderId: string;
  orderNumber: string;
  orderType: string;
  baseAmount: number;
  currency: string;
  providerName: string;
  providerPhone?: string;
  deliveryDetails: Record<string, unknown>;
  clientPaymentPreference?: 'card' | 'crypto' | 'wire';
}

export function useConciergeAdvance() {
  const createAdvanceRequest = async (params: ConciergeAdvanceRequest) => {
    const feePercent = 0.05;
    const conciergeFee = Math.round(params.baseAmount * feePercent * 100) / 100;
    const totalClientPays = params.baseAmount + conciergeFee;
    
    // 1. Update order status
    await supabase
      .from('orders')
      .update({
        status: 'pending_advance',
        concierge_fee_amount: conciergeFee,
        metadata: {
          ...existingMetadata,
          concierge_advance_requested: true,
          total_with_concierge_fee: totalClientPays,
        }
      })
      .eq('id', params.orderId);
    
    // 2. Create consultation request
    await supabase.from('consultation_requests').insert({
      vertical_id: 'concierge_advance',
      request_type: 'advance_payment',
      entry_point: `${params.orderType}_checkout`,
      vertical_metadata: {
        order_id: params.orderId,
        order_number: params.orderNumber,
        base_amount: params.baseAmount,
        concierge_fee: conciergeFee,
        total_client_pays: totalClientPays,
        provider_name: params.providerName,
        delivery_details: params.deliveryDetails,
      },
      status: 'new',
      priority: 'high',
      currency: params.currency,
      budget_min: params.baseAmount,
    });
    
    // 3. Notify admin (WhatsApp + notification)
    await notifyAdminAdvanceRequest(params);
    
    // 4. Return confirmation for UI
    return { success: true, totalWithFee: totalClientPays };
  };
  
  return { createAdvanceRequest };
}
```

### Фаза 4: Интеграция в FlowersOrder.tsx

```typescript
// Добавить опцию в RadioGroup

{/* Concierge Advance Option */}
<ConciergeAdvanceOption
  isSelected={formData.paymentMethod === 'concierge_advance'}
  onSelect={() => setFormData({ ...formData, paymentMethod: 'concierge_advance' })}
  baseAmount={finalTotal}
  currency="THB"
/>

// В handleSubmit добавить ветку:
if (formData.paymentMethod === 'concierge_advance') {
  // 1. Создать заказ со статусом pending_advance
  const result = await createOrder({
    ...orderParams,
    status: 'pending_advance',
  });
  
  // 2. Создать advance request
  await createAdvanceRequest({
    orderId: result.order_id,
    orderNumber: result.order_number,
    orderType: 'flowers',
    baseAmount: finalTotal,
    providerName: firstProvider?.providerName,
    deliveryDetails: {
      address: formData.address,
      date: formData.deliveryDate,
      slot: formData.deliverySlot,
    },
  });
  
  // 3. Показать confirmation screen
  navigate('/booking/advance-requested', { 
    state: { 
      orderNumber: result.order_number,
      totalWithFee: finalTotal * 1.05,
    } 
  });
}
```

### Фаза 5: Confirmation Screen

Новая страница `/booking/advance-requested`:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                            ✅                                               │
│                                                                             │
│              Запрос на предоплату отправлен!                               │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  📋 Заказ: ORD-20240205-XXXX                                          │ │
│  │  💰 Сумма: ฿2,000                                                     │ │
│  │  ✨ Сервис myUNO (5%): ฿100                                           │ │
│  │  ───────────────────────────────────────────────────────────────────  │ │
│  │  💳 К оплате: ฿2,100                                                  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Что дальше?                                                               │
│                                                                             │
│  1. Команда myUNO рассмотрит ваш запрос (обычно 1-2 часа)                 │
│  2. Мы свяжемся с вами для подтверждения                                   │
│  3. После оплаты провайдеру, вы получите ссылку на оплату                 │
│  4. Оплатите любым удобным способом (карта, крипто, перевод)              │
│                                                                             │
│  [Перейти к заказам]                                                       │
│                                                                             │
│  💬 Есть вопросы? Напишите нам в WhatsApp                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Где использовать

Эту опцию можно добавить во все вертикали, где есть cash payments:

| Вертикаль | Файл | Актуально? |
|-----------|------|------------|
| **Flowers** | `FlowersOrder.tsx` | ✅ Да — подарки, срочность |
| **Property Rental** | `DepositPaymentOptions.tsx` | ✅ Да — крупные суммы |
| **Yacht Charter** | Booking flow | ✅ Да — крупные суммы |
| **Tours** | `TourBookingCheckout.tsx` | ✅ Да — туристы без батов |
| **Vehicle Rental** | Booking flow | ✅ Да |
| **Services** | Various | ⚠️ Опционально |

---

## Файлы для создания/изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `supabase/migrations/xxx_concierge_advance.sql` | NEW | Новые статусы + колонка + vertical |
| `src/components/booking/ConciergeAdvanceOption.tsx` | NEW | UI компонент опции |
| `src/hooks/useConciergeAdvance.ts` | NEW | Логика создания запроса |
| `src/pages/booking/AdvanceRequested.tsx` | NEW | Confirmation screen |
| `src/components/booking/BookingPaymentSelect.tsx` | UPDATE | Добавить тип `concierge_advance` |
| `src/pages/flowers/FlowersOrder.tsx` | UPDATE | Интегрировать опцию |
| `src/components/layout/AnimatedRoutes.tsx` | UPDATE | Новый маршрут |

---

## Уведомления клиенту

### При создании запроса
> 📨 **Заголовок:** Запрос на предоплату принят  
> **Тело:** Команда myUNO рассмотрит ваш запрос на оплату заказа ORD-XXXX. Мы свяжемся с вами в течение 2 часов.

### При одобрении (после оплаты провайдеру)
> 📨 **Заголовок:** Предоплата внесена!  
> **Тело:** myUNO оплатила ваш заказ ORD-XXXX провайдеру. Пожалуйста, оплатите ฿2,100 (включая сервис 5%) любым удобным способом: [Ссылка на оплату]

### При получении денег от клиента
> 📨 **Заголовок:** Оплата получена  
> **Тело:** Спасибо! Ваш заказ ORD-XXXX полностью оплачен и подтверждён.

---

## Риски и митигация

| Риск | Вероятность | Митигация |
|------|-------------|-----------|
| Клиент не оплачивает после advance | Средняя | 1. Требовать KYC для сумм >5000 THB<br>2. Лимит на первый заказ<br>3. Предоплата 50% от клиента перед advance |
| Провайдер не выполняет заказ | Низкая | 1. Работа только с verified провайдерами<br>2. Escrow через ledger |
| Задержка одобрения | Низкая | 1. SLA 2 часа для advance requests<br>2. Автоматическая эскалация |

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Миграции БД | 1 |
| Новые компоненты | 2 |
| Новые хуки | 1 |
| Новые страницы | 1 |
| Обновляемые файлы | 4 |
| Риск регрессии | Низкий — additive changes |
| Время реализации | ~2-3 часа |

---

## Порядок реализации

1. **Миграция БД** — статусы, колонка, vertical
2. **useConciergeAdvance** — логика создания запроса
3. **ConciergeAdvanceOption** — UI компонент
4. **AdvanceRequested** — confirmation page
5. **FlowersOrder** — интеграция (первый use case)
6. **Тестирование** — проверка flow end-to-end
7. **Документация** — инструкция для админов

