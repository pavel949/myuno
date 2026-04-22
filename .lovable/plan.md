

# План — Способ оплаты «Рублями (RUB)» с ручной обработкой

## Контекст и цель

Среди гостей myUNO много россиян: Visa/Mastercard зарубежные карты не работают, нужен путь «оплачу рублями». Пока — обработка вручную хост/админом. Архитектурно делаем так, чтобы потом легко подключить СБП/ЮKassa/CloudPayments **без переработки UX**.

Ключевые принципы:
1. **Order-First сохранён**: гость нажимает «Запрос рублями» → создаётся `order` со статусом `pending_manual_payment` (а не deposit-checkout). Это даёт audit trail и ничего не ломает в существующем pricing engine.
2. **Атомарный hold дат**: те же `check_property_dates_available` + soft-hold, что и в request-режиме — даты блокируются на 24ч пока админ не подтвердит / отклонит.
3. **3 канала уведомлений** одновременно: email админам и хосту, WhatsApp админу и хосту, in-app в `notifications` для админ-панели.
4. **Запасной вариант для гостя**: после отправки заявки — экран «Менеджер свяжется с вами в течение 30 минут» + явная кнопка «Открыть WhatsApp» (deep-link с готовым сообщением).

---

## A. UX гостя

### A1. Расширяем `PaymentMethodPicker` — 4-я опция «Рублями (Россия)»

Добавляем под существующие 3 опции, иконка `Wallet` (lucide), title `RU: Оплата в рублях / EN: Pay in Russian Rubles`, hint:
- RU: «Менеджер пришлёт реквизиты СБП / перевод на карту РФ»
- EN: «Manager sends SBP / Russian card transfer details»

В `useLastPaymentMethod` добавляем 4-й literal `'rub_manual'`.

### A2. Когда выбран `rub_manual` — заменяем кнопку оплаты в sticky footer

Вместо «Pay $X» / «Confirm and pay»:
- **Кнопка**: «Запросить оплату в рублях» / «Request RUB payment»
- **Под кнопкой**: подпись «Менеджер свяжется в течение 30 минут · 9:00–22:00 ICT»
- Convert `pricing.total` (USD/THB) в RUB по курсу из `exchange_rates` → показываем `≈ 185 000 ₽` справочно (мелким шрифтом, без обмана: «Финальная сумма по курсу ЦБ +2% на момент оплаты»). Memory `payment_rails`: курсы из БД, никаких хардкодов.

### A3. Submit flow `rub_manual`

1. Атомарный re-check дат через существующий RPC.
2. INSERT в `orders`: `status='pending_manual_payment'`, `metadata.payment_channel='rub_manual'`, `metadata.guest_locale='ru'`.
3. INSERT в новую таблицу `manual_payment_requests` (см. ниже) — это «карточка задачи» для админа.
4. Soft-hold дат на 24ч в `property_inquiries` (status=`hold`, expires_at=`now()+24h`).
5. Edge function `notify-manual-payment-request` — email + WhatsApp + in-app.
6. Редирект на новый экран `/property/booking/manual-payment/:order_id` (см. A4).

### A4. Новый экран подтверждения `ManualPaymentPending`

Заменяет Stripe redirect для этого канала. Структура (Airbnb-style success page):

```
✓ Заявка отправлена · #UNO-2026-04-22-AB
─────────────────────────────────────
🏠 Vista Villa · 3 гостя · 25–28 апр (3 ночи)
💰 Полная сумма: ≈ 185 200 ₽ (≈ $2 040)
─────────────────────────────────────
Что дальше:
1. ⏱ Менеджер myUNO свяжется в течение 30 минут (9:00–22:00 ICT)
2. 💳 Получите реквизиты СБП или карты РФ в WhatsApp/email
3. ✅ После оплаты подтвердим бронь и пришлём ваучер
─────────────────────────────────────
[Открыть WhatsApp с менеджером] ← основная CTA, deep-link с order_number
[Скопировать номер заявки]
[Вернуться на главную]
─────────────────────────────────────
ℹ Даты заблокированы на 24 часа. Если не оплатите за это время —
   бронирование автоматически отменится и даты освободятся.
```

Realtime-канал (`supabase.channel('manual_payment_requests:order_id=eq.X')`) — когда админ переключает статус на `confirmed`/`rejected`, экран сразу обновляется на «Оплачено! Ваучер отправлен на email» / «Отклонено: причина».

---

## B. Что видит хост и админ

### B1. Email хосту + админам

Новый template `manual-payment-request.tsx` (через scaffolded transactional email infra) — RU+EN, ярко-жёлтая шапка «🇷🇺 RUB Payment Request — действие требуется». В письме:
- Номер заявки, объект, даты, гости
- Гость: имя, телефон (clickable `tel:` + `wa.me/`), email (clickable `mailto:`)
- Сумма USD + ≈ RUB
- Срок hold дат (`expires_at`)
- 3 кнопки: «Открыть WhatsApp с гостем» (deep-link), «Открыть в админке» (`/admin/operations?tab=manual-payments&id=...`), «Подтвердить оплату» (magic link → одноразовый JWT-токен → переводит статус в `confirmed`).

### B2. WhatsApp хосту + админам (UltraMSG, повторяем паттерн `notify-admin-order`)

Шаблон сообщения:
```
🇷🇺 *RUB PAYMENT REQUEST* #UNO-...
🏠 Vista Villa · 25–28 апр · 3 гостя
💰 ≈ 185 200 ₽ ($2 040)

👤 Иван Петров
📱 +7 999 123-45-67
📧 ivan@mail.ru

⏱ Hold дат до 23 апр 14:00
🔗 Ответить гостю: wa.me/79991234567?text=...
🔗 Подтвердить: https://myuno.app/admin/manual-pay/{token}
```

### B3. In-app уведомление для админ-панели

INSERT в `notifications` для каждого user_id с ролью `admin`/`super_admin` (через `has_role()`), `type='manual_payment_request'`, `data={order_id, order_number, amount_rub, expires_at}`. Подхватывается существующим `AdminNotificationsDropdown` (который уже навигирует на `/admin/operations`).

### B4. Новая вкладка в `/admin/operations` — `Manual Payments`

Добавляем 6-й таб к `AdminOperations`: `OperationsManualPaymentsTab`. Список карточек заявок (статус: `awaiting_admin / contacted / paid / confirmed / rejected / expired`), фильтр по статусу, цветной timer до expiry. Действия:
- **Открыть WhatsApp с гостем** (одна кнопка)
- **Отметить «Связался»** (status → `contacted`, гостю не уведомление)
- **Подтвердить оплату** → модалка (сумма RUB фактическая, способ: СБП/карта/крипта, файл-чек uploadable в `manual_payment_proofs` bucket) → status=`confirmed` → создаются `payment_intents` запись `provider='manual_rub'` + ledger entries через существующий `record_ledger_entries` RPC → даты переводятся из `hold` в `confirmed_booking` → гостю realtime + email с ваучером.
- **Отклонить** → причина из dropdown (RU+EN) → status=`rejected` → даты освобождаются → гостю email.

### B5. Cron-cleanup expired holds

Новый cron (pg_cron, hourly) → find `manual_payment_requests` где `expires_at < now()` AND `status IN ('awaiting_admin','contacted')` → status=`expired`, освобождает hold, уведомляет гостя email-ом «Hold истёк, дайте знать если ещё интересно».

---

## C. Схема БД

### C1. Новая таблица `manual_payment_requests`

```sql
create table public.manual_payment_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  property_id uuid not null references public.properties(id),
  user_id uuid not null,           -- гость (auth.users.id, без FK, по нашему стандарту)
  manager_user_id uuid,            -- хост/owner, для роутинга уведомлений
  channel text not null default 'rub_manual' check (channel in ('rub_manual','crypto','swift','other')),
  amount_listing numeric not null, -- сумма в валюте листинга
  currency_listing text not null,  -- 'USD'/'THB'
  amount_rub_estimate numeric,     -- расчётный эквивалент на момент создания
  fx_rate_used numeric,            -- курс из exchange_rates
  guest_name text not null,
  guest_phone text not null,
  guest_email text not null,
  status text not null default 'awaiting_admin'
    check (status in ('awaiting_admin','contacted','paid','confirmed','rejected','expired')),
  hold_expires_at timestamptz not null default (now() + interval '24 hours'),
  contacted_at timestamptz,
  contacted_by uuid,
  confirmed_at timestamptz,
  confirmed_by uuid,
  rejected_reason text,
  proof_file_path text,            -- путь в storage bucket 'manual_payment_proofs'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Realtime для гостя
alter publication supabase_realtime add table public.manual_payment_requests;

-- RLS
alter table public.manual_payment_requests enable row level security;

-- Гость видит свою заявку
create policy "guest reads own request" on public.manual_payment_requests
  for select to authenticated using (auth.uid() = user_id);

-- Хост видит заявки по своим объектам
create policy "owner reads property requests" on public.manual_payment_requests
  for select to authenticated using (
    exists (select 1 from public.properties p
            where p.id = property_id and p.owner_id = auth.uid())
  );

-- Админ видит и управляет всем
create policy "admin all" on public.manual_payment_requests
  for all to authenticated using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Триггер updated_at
```

### C2. Storage bucket `manual_payment_proofs`

Private bucket. Только админ может upload/read. Гость не видит.

### C3. Расширение `orders.metadata`

В существующее поле `metadata` (jsonb) кладём `payment_channel: 'rub_manual'` для отчётности и чтобы отделить от Stripe-заказов.

---

## D. Edge functions

### D1. `notify-manual-payment-request` (новая)

Триггерится из фронта после успешного INSERT. Делает параллельно:
1. Email через `send-transactional-email` (template `manual-payment-request`) на `ADMIN_EMAILS` + `manager_email`.
2. WhatsApp через UltraMSG на `ADMIN_WHATSAPP` + `manager_phone` (повторяем паттерн `notify-admin-order`).
3. INSERT в `notifications` для каждого админа (через service role).
4. Возвращает `{ok:true}` гостю → редирект на `ManualPaymentPending`.

### D2. `confirm-manual-payment` (новая)

POST `{order_id, amount_rub_actual, proof_file_path?, payment_method}`. Только для роли `admin`:
1. UPDATE `manual_payment_requests` status=`confirmed`.
2. INSERT `payment_intents` с `provider='manual_rub'`.
3. RPC `record_ledger_entries` (уже есть).
4. UPDATE `orders` status=`confirmed`, `paid_at=now()`.
5. Перевод inquiry hold → `confirmed_booking`.
6. Гостю: email с ваучером (через существующий `generate-booking-voucher` + `send-transactional-email`).

### D3. `expire-manual-payments` (cron, hourly)

См. B5.

### D4. Magic-link `confirm-from-email` (опционально для В2)

Edge function принимает одноразовый JWT-токен (signed admin link из email B1) → автоматически вызывает `confirm-manual-payment`. Удобно для админа на телефоне.

---

## E. Telemetry

Через существующий канал:
- `payment_rub_method_selected` (выбор в picker)
- `payment_rub_request_submitted` (INSERT успешен)
- `payment_rub_admin_contacted` / `confirmed` / `rejected` / `expired`
- Воронка `selected → submitted → confirmed` = ключевой KPI ручной обработки.

---

## F. Будущая интеграция платёжных систем РФ (zero-rebuild path)

Когда подключим ЮKassa/CloudPayments/СБП API:
- `manual_payment_requests.channel` → новые значения `'yookassa','cloudpayments','sbp_qr'`.
- На том же экране `ManualPaymentPending` рисуем QR-код / форму вместо «WhatsApp CTA».
- `confirm-manual-payment` дёргается **вебхуком** платёжки, а не админом.
- Picker в гостевом UI остаётся тем же — меняется только `hint` и backend-ветвление.

UX гостя и админа меняется минимально, БД-схема расширяема enum-ами без миграции структуры.

---

## G. Что **не делаем** (явно отрезаем scope)

- ❌ Никаких реальных RUB-платежей сейчас (нет интеграции, нарушает WorldCheck-flow до подключения KYC-канала).
- ❌ Не убираем Stripe для других гостей.
- ❌ Не показываем картинки QR / реквизиты в UI — только через WhatsApp от живого менеджера (защита от фрода и автоматизированного скама на платежи).
- ❌ Не дублируем уведомления в Telegram — у нас уже есть Telegram Bot для админов, но для этого канала сделаем в Phase 2 если будет нагрузка >5 заявок/день.

---

## H. Порядок реализации (8 атомарных шагов)

1. **DB миграция** — таблица `manual_payment_requests`, RLS, realtime, storage bucket.
2. **`PaymentMethodPicker`** — добавляем 4-ю опцию + расширяем `useLastPaymentMethod` тип.
3. **Submit flow** в `DepositPaymentOptions` — ветка `rub_manual` (создаёт order + request + редирект).
4. **`/property/booking/manual-payment/:order_id`** — новая страница `ManualPaymentPending` с realtime.
5. **Edge fn `notify-manual-payment-request`** + email template + WhatsApp (UltraMSG).
6. **Админ-таб** `OperationsManualPaymentsTab` в `/admin/operations` (список + действия + загрузка пруфа).
7. **Edge fn `confirm-manual-payment`** + cron `expire-manual-payments`.
8. **In-app notif** (INSERT в `notifications` для админов) + telemetry.

Migration risk: zero — все новые поля/таблицы независимы. Текущие card/transfer/whatsapp пути не затрагиваются.

