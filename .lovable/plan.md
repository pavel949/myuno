## Цель

Закрыть 5 критичных проблем (P0) из аудита онбординга поставщиков. Без рефакторинга архитектуры — только bugfix-уровень, безопасный для прод-данных. P1/P2 — отдельным спринтом.

## Что меняем

### 1. VendorOnboarding больше не активирует вендора автоматически
**Файл:** `src/pages/vendor/VendorOnboarding.tsx`

- Создаём профиль в `providers` со статусом `is_active: false` и помечаем `verification_status: 'pending'` (если поле есть; иначе только `is_active: false`).
- Параллельно создаём заявку в `partner_applications` (status `pending`) — это даёт админу единую очередь.
- Первый листинг в `vendor_services` сохраняется с `is_active: false`, появится после апрува.
- Step «Success» меняется на «Заявка на модерации, ответим за 24 часа» вместо «Вы в эфире».
- Дашборд `/vendor` остаётся доступен (для отслеживания статуса), но публикации скрыты до апрува.

### 2. ProviderOnboarding уведомляет админа
**Файл:** `src/pages/provider/ProviderOnboarding.tsx`

- После успешного INSERT в `partner_applications` добавляем `supabase.functions.invoke('notify-admin-partner-application', ...)` — fire-and-forget, не блокирует UX.
- Передаём id заявки, email, имя, категории.

### 3. Email заявителю при approve/reject
**Файл:** `supabase/functions/approve-partner-application/index.ts` + новые шаблоны.

- Используем Lovable Emails (built-in инфраструктура), не Resend напрямую — у проекта уже есть email-domain.
- Два новых шаблона в `supabase/functions/_shared/transactional-email-templates/`:
  - `partner-application-approved.tsx` — «Заявка одобрена, вход в кабинет, следующие шаги».
  - `partner-application-rejected.tsx` — «К сожалению, отказ. Причина: …» с CTA «Связаться с нами».
- Регистрируем в `registry.ts`.
- В edge function: после успешного approve → invoke `send-transactional-email` с шаблоном approved. Для reject — добавим отдельный путь (`action: 'reject'`) или отдельную fn, см. ниже.
- Аналогично добавляем подтверждение заявителю при подаче формы (через тот же канал): шаблон `partner-application-received.tsx` — «Получили вашу заявку #XXX, ответ за 24h».
- Триггер «received» — из `notify-admin-partner-application` (там уже есть email заявителя), чтобы не плодить дубли invoke в frontend.

### 4. /become-partner: graceful auth для анонимов
**Файл:** `src/pages/info/BecomePartnerPage.tsx`

- Перед submit: если `!user` → `navigate('/auth?redirect=/become-partner&prefill=' + encodeURIComponent(JSON.stringify({email, businessName})))` и сохраняем черновик формы в localStorage.
- После возврата с авторизации — восстанавливаем черновик и автоматически submit (или показываем кнопку «Отправить заявку»).
- Это убирает «непонятную RLS-ошибку» и сохраняет конверсию.

### 5. Подтверждение перед изменением модерационной логики

Перед тем как менять `is_active: true → false` в VendorOnboarding, надо понимать: **существующие вендоры**, созданные через старый flow, остаются активными — миграция бэкфилла **не нужна** (мы не хотим сносить уже-работающих). Затронуты только новые регистрации.

## Что НЕ делаем в этом спринте

- ❌ Унификация 4 потоков в один canonical funnel (P1, отдельный спринт).
- ❌ Rate limiting на публичных edge fn — в проекте **нет стандартного rate-limit примитива** для backend (документировано); это известный gap, отдельная инициатива.
- ❌ Funnel-метрики, страница статуса заявки, UI документов для Verified, дубль-чек с `vendor_prospects` — всё P1.
- ❌ Замена `analytics_events` логики.

## Технические детали

### Email-инфраструктура

Проверяем `email_domain--check_email_domain_status`. Если домен уже настроен — сразу скаффолдим транзакционные шаблоны через `email_domain--scaffold_transactional_email` (если ещё не было), создаём 3 шаблона, деплоим `send-transactional-email`.

Если домена нет — показываем диалог настройки и продолжаем после.

### Edge function `approve-partner-application`

Текущий контракт принимает `{ application_id, action: 'approve' | 'reject', rejection_reason? }`. Расширяем:
- Логика approve: после транзакции org/role → invoke `send-transactional-email` с `templateName: 'partner-application-approved'`, `recipientEmail: app.email`, `idempotencyKey: 'approve-' + application_id`.
- Логика reject: invoke с `partner-application-rejected`, передаём `rejection_reason`.
- Сбой email не должен откатывать approve — try/catch + лог.

### Edge function `notify-admin-partner-application`

Добавляем второй invoke (или один общий) на `send-transactional-email` с `partner-application-received` для заявителя.

### Frontend изменения

- `VendorOnboarding.tsx`: 1 поле в insert меняется, success-step текст меняется, добавляется INSERT в `partner_applications`.
- `ProviderOnboarding.tsx`: добавляется 1 invoke после успешного INSERT.
- `BecomePartnerPage.tsx`: добавляется проверка `user` перед submit + восстановление черновика на mount.

### Что НЕ требует миграций

Все изменения работают с существующей схемой (`providers.is_active`, `partner_applications` уже есть). Миграции БД не нужны.

## Acceptance criteria

- [ ] Новый вендор через `/vendor/onboarding` имеет `is_active=false` и видимую заявку в `PartnerApplicationsAdmin`.
- [ ] Заявитель получает email «Заявка получена» в течение минуты после submit на любой из 3 форм.
- [ ] При approve в админке заявитель получает email «Одобрено» с CTA на `/vendor`.
- [ ] При reject заявитель получает email с причиной.
- [ ] На `/become-partner` без логина клик «Отправить» уводит на `/auth`, после возврата форма заполнена.
- [ ] Существующие активные вендоры не затронуты.

## Очерёдность работы

1. Email-инфраструктура: проверка статуса домена → scaffold (если нужно) → 3 шаблона → deploy.
2. `approve-partner-application` — добавить рассылку.
3. `notify-admin-partner-application` — добавить рассылку заявителю.
4. `ProviderOnboarding.tsx` — добавить invoke.
5. `VendorOnboarding.tsx` — снять автоактивацию + INSERT в `partner_applications`.
6. `BecomePartnerPage.tsx` — auth-guard + draft restore.
7. Финальная проверка в preview: пройти 3 формы, проверить заявки в админке, проверить email-flow.
