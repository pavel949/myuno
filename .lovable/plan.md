# Wave B — Edge Functions, Booking Flow, Operator/Admin UI

Wave A (БД, seed Klod, Tourist Police, цены ×1.35, RPC quote) уже выполнен. Теперь — функциональная часть.

## B1. Edge Functions (6 шт.)

1. **`create-transfer-order`** — Order-First, идемпотентный
   - Принимает: vehicle_class, destination_id, pickup_time, направление (airport→hotel / hotel→airport), пассажиры, рейс, заметки, attachments (storage paths), language=ru
   - Считает цену через `get_transfer_quote` RPC (с ночной надбавкой)
   - Создаёт `orders` (order_type='transfer', status='pending_operator'), `order_items`, `order_item_transport_details`, `order_attachments`
   - `UNIQUE(orders.external_ref)` + client idempotency_key защищают от дублей
   - Назначает оператора через `assign_transfer_operator()` → пишет в `orders.assigned_to`
   - Триггерит `notify-transfer-booking`

2. **`notify-transfer-booking`** — трилингвальные уведомления
   - Берёт заявку, переводит RU→EN+TH через Lovable AI Gateway (google/gemini-2.5-flash), сохраняет в `order_translations`
   - Отправляет оператору Klod:
     - WhatsApp (UltraMSG) на +66 62 965 5545 — карточка EN+TH с кнопкой подтверждения (deep link `/operate/transfers/:id`)
     - Email (Resend) — RU+EN+TH
   - Админу: WhatsApp +66 92 240 7355 + Email из `system_settings.admin_emails`
   - Клиенту: email/WA «заявка принята, ждём подтверждения оператора»
   - Всё логируется в `booking_notifications_log`

3. **`confirm-transfer-operator`** — подтверждение оператором
   - Принимает order_id + operator token (короткоживущий, подписанный)
   - Переводит `orders.status` → `confirmed`
   - Запускает Stripe Checkout link или PromptPay QR (зависит от выбранного payment_method)
   - Шлёт клиенту WA+email «бронирование подтверждено», карточка с фото точки встречи (Tourist Police), телефоном Klod, deep link на оплату

4. **`create-transfer-checkout`** — Stripe THB + PromptPay
   - Создаёт Stripe Checkout session с `idempotency_key = order.id`
   - `payment_method_types: ['card', 'promptpay']` (promptpay включён только если `system_settings.feature_flag:transfer_promptpay = true`, default OFF — требует активации в Stripe Dashboard)
   - Success → webhook (используем существующий `stripe-webhook`) → `record_ledger_entries`

5. **`transfer-reminders`** — cron T-24h / T-2h
   - Уже есть `pg_cron`; добавим job на каждые 15 мин
   - Шлёт клиенту+оператору напоминания (WA+email), статус → `reminded`

6. **`request-myuno-advance`** — оплата с баланса myUNO (advance)
   - Для verified users, лимит ≤300,000 ฿ — auto-approve, иначе manual
   - Пишет в `manual_payment_requests` + списывает с `wallets`

## B2. Storage RLS

Bucket `transfer-attachments` (private, уже создан) — добавить policies:
- Customer: insert/select собственных файлов (`order_id` в имени пути)
- Operator/admin: select всех

## B3. Frontend — 5-step booking form

`src/pages/transfer/TransferBookingPage.tsx` + шаги:

1. **Direction & vehicle** — airport→hotel / hotel→airport, Sedan vs Van, кол-во пассажиров/багажа
2. **Pickup & dropoff**
   - Если airport→hotel: dropoff = Google Places autocomplete + поиск по `property_complexes` (комплексы Пхукета) + ручной адрес
   - Hotel booking PDF upload, фото адреса (multi), карта с draggable pin
   - Если hotel→airport: фото точки встречи Tourist Police автоматически + телефон Klod
3. **Date, time, flight** — pickup_time (триггерит ночной surcharge), номер рейса, кол-во детей + child seats (+200/300 ฿)
4. **Contact & comments** — имя, телефон, WhatsApp, email, заметки оператору (RU/EN/TH автоперевод покажем превью)
5. **Review & payment** — итоговая цена с разбивкой (base + night + child seats), выбор метода (Stripe/PromptPay/Cash/Sber/myUNO advance), submit

Hook `useTransferQuote(vehicle, destinationId, pickupTime)` → RPC.
Хук `useCreateTransferOrder()` с idempotency_key из useId/uuid.

## B4. Operator UI — `/operate/transfers`

- Список заявок (Realtime subscription к `orders` where assigned_to=Klod)
- Карточка: EN+TH (RU свёрнуто), фото точки встречи, attachments, кнопки **Confirm / Reject / WhatsApp guest**
- Confirm → вызывает `confirm-transfer-operator`
- Фильтр по статусу, дате

## B5. Admin UI — `/admin/transfers`

- Полный список всех заявок, фильтры (status, operator, date, vehicle)
- KPI: всего заявок, conv. rate, средний чек, payment mix
- CSV export
- Drilldown карточка: вся история (`order_status_history`), переводы, attachments, payments
- Управление операторами (`transfer_operators` CRUD) и точками встречи (`transfer_meeting_points` CRUD)

## B6. Защита от дублей в switcher

Проверить `src/components/transfer/*` и `SuperSwitcher` — убедиться что нет 2 entry points на трансфер. Если есть — оставить один canonical путь `/app/arrive/transfer` + redirect.

## B7. Секреты (нужно подтверждение)

Уже есть: `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `ULTRAMSG_*`, `LOVABLE_API_KEY`.
Добавить: ничего нового — Klod номер хранится в БД, токены оператора генерим сами (HMAC через `service_role`).

## Open questions (не блокируют, но уточню сейчас)

1. Telegram bot для Klod — chat_id неизвестен; пока шлём только WA+email, Telegram добавим когда даст chat_id.
2. PromptPay в Stripe — оставляю флаг OFF; включишь когда активируешь в Stripe Dashboard.
3. Фото Tourist Police — сейчас placeholder, заменим как пришлёшь файл.

## Порядок выполнения

Wave B1 (Edge Functions 1+2) → B3 (форма) → B4 (operator UI) → B1 (3-6) → B5 (admin) → B6 (dedup) → smoke-test через test order.

**Готов начать? Нажми Implement plan.**
