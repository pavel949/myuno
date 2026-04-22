

# Сравнение Airbnb «Booking a home» (Mobbin) vs myUNO

## Что я посмотрел в Mobbin (16 экранов flow)

PDP → Reserve → **Review and continue** (одна страница) → Add payment method (PayPal/Card/Bank) → Card details (нативная iOS клавиатура) → Confirm.

## Что у myUNO уже хорошо (не трогаем)

- **`PropertyInquiry`** уже сделан в логике Airbnb «Review and continue»: trip mini-card, dates row + Edit, guests row + Edit, price breakdown, cancellation, ground rules, sticky CTA.
- **Order-First** + RPC `check_property_dates_available` (атомарная защита от гонок) — лучше, чем у Airbnb mock.
- **Draft persistence** в localStorage с TTL 24ч — переживает OAuth round-trip, Airbnb так не умеет.
- **Two paths**: instant (предоплата) / request (бесплатно) — у Airbnb «Choose when to pay» Pay now / Pay later, у нас своя модель (10/30/50% prepay).

## Что взять из Airbnb (без поломки системы)

### A. Top-3 — высокая ценность, низкий риск

**A1. «Choose when to pay» — выбор момента оплаты**
- *Airbnb:* radio group «Pay $201.54 now» / «Pay part now, part later — $40.31 now, $161.23 charged on Aug 27».
- *myUNO сейчас:* prepay_percent захардкожен на уровне `rentalTerms`, гость видит только результат.
- *Сделать:* в `PropertyInquiry` секцию **«Когда оплачивать»** с двумя radio: «Полная оплата сейчас» / «Предоплата X% сейчас, остаток за N дней до заезда» — только если `rentalTerms.allow_pay_later === true` (новый флаг). Не ломает pricingEngine: тот уже считает `prepayAmount` и `balanceAmount`.

**A2. Объединённый «Add payment method» с tabs по способам**
- *Airbnb:* единый список PayPal / Credit card / Bank Account, выбор → раскрывает форму данных.
- *myUNO сейчас:* `DepositPaymentOptions` = одна большая кнопка Stripe + ContactAdminButton отдельно.
- *Сделать:* `PaymentMethodPicker` компонент — radio со способами:
  1. Карта (Stripe) — как сейчас
  2. Bank transfer (offline через ContactAdminButton)
  3. WhatsApp с менеджером (для кастомных условий)
  Метод запоминается в `localStorage` (`uno_last_payment_method`) и выбирается по умолчанию при следующей оплате.

**A3. Sticky footer по образцу Airbnb для instant-режима**
- *Airbnb:* всегда виден `Reserve` / `Next` снизу, не привязан к скроллу до payment options.
- *myUNO сейчас:* sticky footer есть **только** для request-режима. В instant-режиме `DepositPaymentOptions` живёт inline и кнопка «Pay» теряется при скролле.
- *Сделать:* единый sticky footer для обоих режимов: показывает total + кнопка `Confirm and pay X` / `Request to book` в зависимости от режима. Кнопка скроллит к секции оплаты, если способ ещё не выбран, или запускает checkout.

### B. Polish — средняя ценность

**B1. «Rare find! This place is usually booked» trust badge на mini-card**
- Уже есть данные: можно вычислить через `property_bookings` last 30d > 70% occupancy. Маленький badge на trip mini-card в `PropertyInquiry`. Усиливает urgency.

**B2. Итоговая строка `Total price · USD` с подчёркнутой валютой → всплывающий пояснитель**
- Сейчас валюта спрятана. Гость с RUB/THB пресетом не понимает, что именно списывается. Нужен `<sup>USD</sup>` с popover «Charged in property currency. Your bank may apply FX fee.»

**B3. Раскрытие «Details» рядом с Total**
- Airbnb: Total строка с боковой ссылкой `Details` → expand → разбивка.
- У нас разбивка всегда видна ниже. Можно оставить как есть, но добавить `Details` ссылку в sticky footer, открывающую полный breakdown в Sheet снизу — ускоряет review до click `Confirm`.

### C. Не брать (нарушает нашу систему)

- ❌ **PayPal как radio** — у нас нет PayPal интеграции, противоречит «WorldCheck перед платежом» (memory: payment rails). Оставляем Stripe + offline.
- ❌ **Bank Account как direct ACH** — в Таиланде ACH нет, только bank transfer через менеджера. Уже есть в `ContactAdminButton`.
- ❌ **Native iOS keypad mock** — мы PWA + Capacitor, нативная клавиатура и так открывается на `<Input type="number">`. Ничего делать не нужно.

## Баги, которые нашёл по пути (фиксим)

1. **Sticky footer пропадает в instant-режиме** (`PropertyInquiry.tsx:653`) — условие `&& !isInstantBooking` оставляет instant-юзера без видимой total-кнопки. → переделать в общий footer (см. A3).
2. **`DepositPaymentOptions` ловит ошибку Stripe и просто `toast.error('Ошибка при создании платежа')`** (`DepositPaymentOptions.tsx:93`) — без deeplink к деталям, без Sentry. → Передать `error.message` в toast и `Sentry.captureException(error, { extra: { propertyId, totalAmount } })`.
3. **`createOrder` в request-режиме не учитывает `result.success === false`** (`PropertyInquiry.tsx:777`) — если success=false и order_id=null, юзер остаётся на странице без сообщения. → `else { toast.error(...) }`.
4. **`deposit_amount` в metadata всегда нулевой** (`PropertyInquiry.tsx:747`) — берётся из `rentalTerms.deposit_amount` (security deposit), а не из `pricing.depositAmount`. Запутывает в репортах. → переименовать в `security_deposit_amount`.
5. **Кнопка `Confirm and pay` дёргает Stripe checkout без availability re-check** (`DepositPaymentOptions.handleOnlinePayment`) — request-режим re-check делает (`check_property_dates_available`), instant-режим **не делает**. Гонка возможна. → добавить тот же RPC перед `supabase.functions.invoke('create-property-deposit-checkout')`.

## План реализации (порядок)

1. **Bugfixes #1–#5** — точечные правки в `PropertyInquiry.tsx` и `DepositPaymentOptions.tsx`. Без новых компонентов.
2. **A3 — единый sticky footer** для обоих режимов (instant/request). Рефактор финальной секции `PropertyInquiry`.
3. **A1 — `PayWhenSelector`** компонент: radio Now / Now+Later. Гейт за `rentalTerms.allow_pay_later` (новая колонка, default false → текущее поведение не меняется).
4. **A2 — `PaymentMethodPicker`** компонент: card/transfer/whatsapp. Замена inline-разметки в `DepositPaymentOptions`.
5. **B1, B2** — мелкие визуальные улучшения trip mini-card.
6. **(B3 — опционально)** — Sheet с breakdown по `Details` в footer.

## Технические заметки

- Новая колонка `properties.allow_pay_later boolean default false` — миграция, добавить в `usePropertyWithRentalTerms` select.
- `useLastPaymentMethod` хук на базе `localStorage` — параллель к существующему draft-паттерну.
- Все user-facing строки RU+EN через текущий `useLanguage()`.
- Pricing math не трогаем — `pricingEngine.ts` уже отдаёт `prepayAmount` + `balanceAmount`.
- Telemetry: `booking_pay_when_selected`, `booking_method_selected`, `booking_confirm_clicked`, `booking_confirm_error` через существующий analytics-канал.
- Migration риск: zero — все новые поля опциональные, дефолты сохраняют текущее поведение.
- Тесты: добавить unit на `PayWhenSelector` (выбор сохраняется в order metadata) и e2e на «request → sticky footer виден» / «instant → sticky footer виден».

