

## Единый range-календарь для выбора дат заезда и выезда + уведомление менеджеру

### Проблема
Сейчас в PropertyBookingCard два отдельных попова для check-in и check-out, каждый открывает свой календарь. Это нудно — пользователю нужно дважды кликать и дважды взаимодействовать с календарём. На мобильном устройстве (PropertyDetail) в Sheet уже используется `mode="range"`, но desktop-карточка — нет.

Кроме того, уведомления при создании заказа отправляются только на hardcoded админские email/WhatsApp. Менеджер листинга (property manager) не получает уведомление.

### Изменения

#### 1. PropertyBookingCard — единый range-календарь (desktop)
**Файл:** `src/components/property/PropertyBookingCard.tsx`

Заменить два отдельных Popover (строки 172-200) на один:
- Кнопка check-in/check-out — одна полоска с двумя полями (как у Airbnb), клик по любому из них открывает один Popover
- Внутри Popover — один `Calendar mode="range"` с `numberOfMonths={2}` на desktop
- После выбора обеих дат (from + to) — показать summary строку "X ночей" и кнопку "Применить" / "Apply" для закрытия
- Автозакрытие попова через 300ms после выбора `to` даты (+ ручная кнопка "Очистить даты")

#### 2. PropertyDetail — mobile Sheet уже OK
Мобильный Sheet на PropertyDetail (строки 780-870) уже использует range-календарь с кнопкой "Перейти к бронированию". Оставляем как есть.

#### 3. Уведомление менеджеру листинга
**Файл:** `src/hooks/useOrders.ts` (строки ~298-324)
**Файл:** `supabase/functions/notify-admin-order/index.ts`

Текущее: `createOrder` вызывает `notify-admin-order` с данными заказа → отправляет на hardcoded `ADMIN_EMAILS` и `ADMIN_WHATSAPP`.

Изменения:
- В `useOrders.ts`: передавать `manager_email` и `manager_phone` из property metadata в payload `notify-admin-order`
- В `notify-admin-order/index.ts`: если в payload есть `manager_email` — добавить его в список получателей email; если есть `manager_phone` — отправить WhatsApp и ему
- В `PropertyInquiry.tsx`: передавать `manager_email`/`manager_phone` из `rentalTerms` в metadata заказа

### Файлы для изменения

| Файл | Изменение |
|---|---|
| `src/components/property/PropertyBookingCard.tsx` | Объединить 2 попова в 1 с range-календарём, кнопка "Очистить", авто-закрытие |
| `src/pages/property/PropertyInquiry.tsx` | Добавить manager_email/phone в metadata заказа |
| `src/hooks/useOrders.ts` | Передавать manager_email/phone в notify-admin-order |
| `supabase/functions/notify-admin-order/index.ts` | CC менеджеру листинга (email + WhatsApp) |

### UX единого календаря

```text
┌──────────────────────────────┐
│  Заезд          │  Выезд     │  ← одна полоска, клик открывает попов
│  5 Mar          │  12 Mar    │
└──────────────────────────────┘
         ↓ клик
┌──────────────────────────────────────────┐
│          Март 2026       Апрель 2026     │
│  Calendar range picker (2 months)        │
│                                          │
│  [7 ночей]          [Очистить] [Готово]  │
└──────────────────────────────────────────┘
```

На мобильном (< sm) — `numberOfMonths={1}`, на desktop — `numberOfMonths={2}`.

После выбора обеих дат:
- Показать badge "X ночей"  
- Через 500ms автозакрыть попов (или сразу по нажатию "Готово")

