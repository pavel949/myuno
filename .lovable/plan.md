

# Аудит Booking Flows — Результаты проверки

## Итоги анализа

Я проверил **13 booking flows** во всём приложении. Только **ОДИН** файл содержит критическую ошибку с симуляцией вместо реального сохранения:

### ❌ КРИТИЧЕСКАЯ ОШИБКА

| Файл | Проблема |
|------|----------|
| `src/pages/experiences/ExperienceBooking.tsx` | `setTimeout` симуляция вместо `createBooking()` |

```typescript
// Строки 94-106 — ПРОБЛЕМА
const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    // Simulate booking submission  ← ЭТО ЗАГЛУШКА!
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(...);
    navigate('/bookings');
  }
  ...
}
```

---

### ✅ РАБОТАЮЩИЕ BOOKING FLOWS

Все остальные booking pages **корректно используют** `useBooking().createBooking()`:

| Файл | Статус |
|------|--------|
| `TourBooking.tsx` | ✅ Работает |
| `YachtBooking.tsx` | ✅ Работает + yacht_details |
| `EventBooking.tsx` | ✅ Работает |
| `TransportBooking.tsx` | ✅ Работает + transport_details |
| `AirportTransferBooking.tsx` | ✅ Работает + transport_details |
| `FitnessBooking.tsx` | ✅ Работает |
| `CleaningBooking.tsx` | ✅ Работает |
| `BeautyBooking.tsx` | ✅ Работает |
| `ServiceBooking.tsx` | ✅ Работает |
| `TableReservation.tsx` | ✅ Работает + Stripe deposit |
| `TaxiBooking.tsx` | (существует) |

---

## План исправления

### Шаг 1: Исправить `ExperienceBooking.tsx`

Заменить симуляцию на реальный вызов `createBooking()`:

```typescript
const handleSubmit = async () => {
  if (!selectedDate || !selectedTime || !contactData.name || !contactData.phone) {
    return;
  }

  const scheduledAt = new Date(selectedDate);
  const [hours, minutes] = selectedTime.split(':').map(Number);
  scheduledAt.setHours(hours, minutes, 0, 0);

  const totalPrice = (experience.price || 0) * participants;
  const experienceTitle = isRu ? experience.title_ru : experience.title_en;

  const result = await createBooking({
    booking_type: 'activity', // or 'tour' — experience type
    scheduled_at: scheduledAt,
    total_amount: totalPrice,
    currency: experience.currency || 'THB',
    notes: `Experience: ${experienceTitle}. Participants: ${participants}`,
    items: [{
      item_type: 'experience',
      item_id: experience.id,
      item_name: experienceTitle,
      quantity: participants,
      unit_price: experience.price || 0,
      subtotal: totalPrice,
    }],
    participants: [{
      name: contactData.name,
      phone: contactData.phone,
      email: contactData.email,
      is_primary: true,
    }],
    payment: {
      amount: totalPrice,
      payment_method: paymentMethod,
    },
    metadata: {
      experience_id: experience.id,
      experience_type: experience.experience_type,
      duration_minutes: experience.duration_minutes,
    },
  });

  if (result.success) {
    navigate(`/bookings/${result.booking_id}/success`);
  }
};
```

### Шаг 2: Добавить состояние подтверждения

Добавить `BookingConfirmation` компонент как в других booking pages:

```typescript
const [bookingResult, setBookingResult] = useState<{
  success: boolean;
  bookingId?: string;
} | null>(null);

// В success state показать BookingConfirmation
if (bookingResult?.success && bookingResult.bookingId) {
  return (
    <BookingConfirmation
      bookingId={bookingResult.bookingId}
      title={experienceTitle}
      date={format(selectedDate, 'PPP', { locale: isRu ? ru : undefined })}
      time={selectedTime}
      location={experience.meeting_point}
      total={totalPrice}
      currency={experience.currency || 'THB'}
      continuePath="/experiences"
      continueLabel={isRu ? 'К активностям' : 'Browse Experiences'}
    />
  );
}
```

### Шаг 3: Импортировать недостающие зависимости

```typescript
import { useBooking } from "@/hooks/useBooking";
import { BookingConfirmation } from "@/components/booking";
```

---

## Что будет исправлено

1. **ExperienceBooking** будет реально сохранять заказы в `orders` таблицу
2. Пользователь увидит подтверждение с `booking_id`
3. Заказы появятся в `/bookings` и `/account`
4. Метаданные (`experience_type`, `duration`) сохранятся для аналитики

---

## Техническая справка: Как работает `useBooking`

```text
useBooking() 
  ↓
useOrders().createOrder()
  ↓
INSERT INTO orders + order_items + order_participants + order_payments
  ↓
return { success: true, booking_id: UUID }
```

Все 12 других booking flows уже используют эту цепочку корректно.

