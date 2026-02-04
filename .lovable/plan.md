
# План: Отображение авансовых кредитов (Concierge Advance) в кошельках и админ-панели

## Концепция

Когда myUNO оплачивает за клиента (Concierge Advance), эта информация должна быть видна:

1. **Клиенту в кошельке** — чтобы он знал о задолженности и мог её погасить
2. **Админам в финансах** — чтобы отслеживать активные авансы и риски

---

## Текущая архитектура

### Таблица orders
```
✅ status: pending_advance | awaiting_client_payment | confirmed
✅ concierge_fee_amount: NUMERIC(10,2) — комиссия 5%
✅ metadata: JSONB — содержит concierge_advance_requested, total_with_concierge_fee
```

### Таблица wallet_transactions
```
type: topup | payment | refund | bonus | cashback
reference_type: orders | bookings | etc.
reference_id: UUID связанного объекта
```

### consultation_requests
```
vertical_id: 'concierge_advance' — уже настроено
```

---

## Фаза 1: Добавить тип транзакции "advance"

Для отображения кредитов в кошельке клиента добавим новый тип транзакции:

```typescript
// useWalletTransactions.ts
export type TransactionType = 'topup' | 'payment' | 'refund' | 'bonus' | 'cashback' | 'advance';

// TransactionList.tsx — добавить конфиг:
advance: {
  icon: HandCoins, // или CreditCard
  labelRu: 'Аванс myUNO',
  labelEn: 'myUNO Advance',
  colorClass: 'text-violet-500 bg-violet-500/10',
  isPositive: false, // это долг
}
```

---

## Фаза 2: Хук для получения активных авансов пользователя

```typescript
// src/hooks/useUserAdvances.ts

interface UserAdvance {
  orderId: string;
  orderNumber: string;
  baseAmount: number;
  conciergeFee: number;
  totalDue: number;
  currency: string;
  status: 'pending_advance' | 'awaiting_client_payment';
  createdAt: string;
  vertical: string;
  providerName?: string;
}

export function useUserAdvances() {
  // Получить заказы со статусами pending_advance | awaiting_client_payment
  // для текущего пользователя
}
```

---

## Фаза 3: Блок "Активные авансы" в кошельке

Добавить новую секцию в `Wallet.tsx` после баланса:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  💳 Баланс: ฿5,000                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ Активные авансы                                           Подробнее →  │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  📋 Заказ ORD-XXXX • Цветы                     Ожидает вашей оплаты         │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │  Сумма заказа:    ฿2,000                                              │ │
│  │  Сервис myUNO (5%):  ฿100                                             │ │
│  │  ─────────────────────────────────                                    │ │
│  │  К оплате:        ฿2,100                                              │ │
│  │                                                                        │ │
│  │  myUNO внесла предоплату провайдеру.                                  │ │
│  │  Пожалуйста, оплатите нам удобным способом.                           │ │
│  │                                                                        │ │
│  │  [Оплатить картой]  [Написать в WhatsApp]                             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Фаза 4: Компонент ActiveAdvancesCard

```typescript
// src/components/wallet/ActiveAdvancesCard.tsx

interface ActiveAdvancesCardProps {
  advances: UserAdvance[];
  onPayClick: (advance: UserAdvance) => void;
}

// Показывает:
// - Список активных авансов
// - Статус каждого (ожидает одобрения / ожидает вашей оплаты)
// - Сумму с разбивкой
// - Кнопки действий
```

---

## Фаза 5: Админ-панель — метрики авансов

### Новые метрики в AdminFinance.tsx

```text
ТЕКУЩИЕ МЕТРИКИ:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  GMV    │ │ Доход   │ │ Выплаты │ │К выплате│ │Подписки │ │Take Rate│
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘

ПОСЛЕ ДОБАВЛЕНИЯ:
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  GMV    │ │ Доход   │ │ Выплаты │ │К выплате│ │ АВАНСЫ  │ │Take Rate│
└─────────┘ └─────────┘ └─────────┘ └─────────┘ │ ฿25,000 │ └─────────┘
                                                │ 3 актив │
                                                └─────────┘
```

### Обновить useAdminFinance.ts

```typescript
// Добавить в FinancialSummary:
interface FinancialSummary {
  // ... existing
  activeAdvances: number;       // Сумма активных авансов
  activeAdvancesCount: number;  // Кол-во
  conciergeFeesPending: number; // Ожидаемый доход от комиссий 5%
}

// Новый запрос:
const { data: advances } = await supabase
  .from('orders')
  .select('total_amount, concierge_fee_amount')
  .in('status', ['pending_advance', 'awaiting_client_payment']);

const activeAdvances = advances?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
const conciergeFeesPending = advances?.reduce((sum, o) => sum + (o.concierge_fee_amount || 0), 0) || 0;
```

---

## Фаза 6: Вкладка "Авансы" в админ-финансах

Добавить новую вкладку в `AdminFinance.tsx`:

```typescript
<TabsTrigger value="advances">Авансы</TabsTrigger>

<TabsContent value="advances">
  <ConciergeAdvancesTable />
</TabsContent>
```

### Таблица активных авансов

```text
┌────────────────────────────────────────────────────────────────────────────────┐
│  📋 Активные авансы                                       Всего: ฿25,000 (3)   │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Заказ          │ Клиент        │ Сумма   │ Комиссия │ Статус    │ Дата        │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  ORD-XXXX       │ Иван П.       │ ฿10,000 │ ฿500     │ ⏳ Новый  │ 5 Feb 10:30 │
│                 │ +7999...      │         │          │           │             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  ORD-YYYY       │ Мария С.      │ ฿8,000  │ ฿400     │ ✅ Оплачен│ 4 Feb 15:00 │
│                 │ +7999...      │         │ провайд. │           │             │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  ORD-ZZZZ       │ Alex K.       │ ฿7,000  │ ฿350     │ ⏳ Ожидает│ 3 Feb 09:15 │
│                 │ alex@...      │         │          │ клиента   │             │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## Фаза 7: Добавить vertical в LEAD_VERTICALS

Обновить `leadVerticalConfig.ts` для отображения в консультациях:

```typescript
// Добавить в LEAD_VERTICALS:
{
  id: 'concierge_advance',
  icon: '💸',
  nameEn: 'Concierge Advance',
  nameRu: 'Консьерж-аванс',
  shortDescEn: 'Advance payment request',
  shortDescRu: 'Запрос на аванс',
  ctaTextEn: 'Process Request',
  ctaTextRu: 'Обработать запрос',
  popularityScore: 0, // не показывать в FAB
  requestTypes: [
    { value: 'advance_payment', labelEn: 'Advance Payment', labelRu: 'Авансовый платёж' },
  ],
  fields: [],
}
```

---

## Фаза 8: Обновить REQUEST_TYPE_CONFIG в AdminConsultations

```typescript
// AdminConsultations.tsx
const REQUEST_TYPE_CONFIG = {
  // ... existing
  advance_payment: { 
    icon: HandCoins, 
    labelRu: 'Аванс', 
    labelEn: 'Advance', 
    color: 'bg-violet-500' 
  },
};
```

---

## Фаза 9: Запись транзакции после оплаты клиентом

Когда админ подтверждает получение оплаты от клиента:

```typescript
// При изменении статуса на 'confirmed'
await supabase.from('wallet_transactions').insert({
  wallet_id: clientWalletId,
  user_id: clientUserId,
  type: 'payment', // или 'advance_repayment'
  amount: totalWithFee,
  currency: 'THB',
  description: `Repayment for order ${orderNumber}`,
  description_ru: `Оплата аванса по заказу ${orderNumber}`,
  reference_type: 'concierge_advance',
  reference_id: orderId,
  status: 'completed',
});
```

---

## Файлы для создания/изменения

| Файл | Тип | Описание |
|------|-----|----------|
| `src/hooks/useUserAdvances.ts` | NEW | Хук для получения авансов пользователя |
| `src/components/wallet/ActiveAdvancesCard.tsx` | NEW | Блок активных авансов в кошельке |
| `src/components/admin/ConciergeAdvancesTable.tsx` | NEW | Таблица авансов для админов |
| `src/hooks/useWalletTransactions.ts` | UPDATE | Добавить тип 'advance' |
| `src/components/wallet/TransactionList.tsx` | UPDATE | Конфиг для типа advance |
| `src/pages/Wallet.tsx` | UPDATE | Добавить ActiveAdvancesCard |
| `src/hooks/useAdminFinance.ts` | UPDATE | Метрики авансов |
| `src/pages/admin/AdminFinance.tsx` | UPDATE | Карточка + вкладка авансов |
| `src/lib/leadVerticalConfig.ts` | UPDATE | Вертикаль concierge_advance |
| `src/pages/admin/AdminConsultations.tsx` | UPDATE | REQUEST_TYPE_CONFIG |

---

## Визуальный пример: Кошелёк с авансом

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  💳 Баланс                                                                  │
│  ฿5,000                                                                     │
│  Используйте баланс для оплаты услуг                                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  ⚠️ У вас есть непогашенный аванс                                          │
│  ───────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  💸 myUNO оплатила за вас заказ на цветы                                   │
│                                                                             │
│  Сумма: ฿2,000 + сервис ฿100 = ฿2,100                                      │
│                                                                             │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐          │
│  │  💳 Оплатить картой        │  │  💬 Связаться               │          │
│  └─────────────────────────────┘  └─────────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [Пополнить] [Карты] [История]                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  📜 История операций                                                        │
│  ───────────────────────────────────────────────────────────────────────── │
│  5 Feb • 💸 Аванс myUNO                                    -฿2,100 (долг)   │
│         Заказ ORD-XXXX                                                      │
│  ─────────────────────────────────────────────────────────────────────────  │
│  4 Feb • ⬇️ Пополнение                                     +฿5,000          │
│         Stripe                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Техническое резюме

| Метрика | Значение |
|---------|----------|
| Новые хуки | 1 (useUserAdvances) |
| Новые компоненты | 2 (ActiveAdvancesCard, ConciergeAdvancesTable) |
| Обновляемые файлы | 7 |
| Сложность | Средняя |
| Риск регрессии | Низкий — additive changes |
| Время реализации | ~2-3 часа |

---

## Порядок реализации

1. **useUserAdvances** — получение данных об авансах
2. **ActiveAdvancesCard** — отображение в кошельке
3. **Wallet.tsx** — интеграция карточки
4. **useAdminFinance** — добавить метрики авансов
5. **ConciergeAdvancesTable** — таблица для админов
6. **AdminFinance.tsx** — карточка + вкладка
7. **leadVerticalConfig + AdminConsultations** — конфиг вертикали
8. **TransactionList** — отображение типа advance
