

# Автоматизация операционной деятельности: платформа, которая продвигает себя сама

## Текущая ситуация

У платформы уже есть сильный фундамент автоматизации:
- Сегментация пользователей (lifecycle: new/active/at_risk/dormant/churned)
- Система рассылок по сегментам (send-promotions)
- Скоринг лидов (leads-factory)
- Vendor acquisition pipeline с AI-скорингом
- Напоминания о бронированиях
- Уведомления админам (email, WhatsApp, in-app)

**Чего не хватает:** все процессы запускаются вручную. Нет cron-задач, нет event-driven триггеров, нет автоматических цепочек.

---

## Что делаем: 5 автономных контуров

### 1. Cron-движок: автоматические ежедневные процессы

Настраиваем pg_cron для запуска существующих функций по расписанию:

| Задача | Расписание | Функция |
|--------|-----------|---------|
| Обновление сегментов | Каждые 6 часов | update-user-segments |
| Напоминания о бронированиях | Каждый час | booking-reminders |
| Реактивация "at_risk" пользователей | Ежедневно 10:00 | **новая**: auto-lifecycle-actions |
| Синхронизация календарей | Каждые 4 часа | ical-scheduled-sync |

### 2. Auto-Lifecycle Actions (новая Edge Function)

Автоматические действия на основе сегментов пользователей:

- **New (7 дней, 0 заказов)** -- отправить welcome-цепочку с рекомендацией первой услуги
- **At Risk (21+ дней без визита)** -- автоматическое push-уведомление "Мы скучаем" + персональная скидка
- **Dormant (60+ дней)** -- email-реактивация с подборкой новых услуг
- **VIP (потратил 50K+)** -- персональное поздравление и эксклюзивные предложения

Все сообщения берутся из шаблонов в БД (новая таблица `lifecycle_templates`), чтобы менять текст без кода.

### 3. Auto-Vendor-Nurture (новая Edge Function)

Автоматическая "прогревка" поставщиков из vendor_prospects:

- Новые перспективы (status = 'new') автоматически скорятся через AI
- "Hot" перспективам автоматически генерируется outreach-сообщение
- Через 3 дня без ответа -- follow-up
- Все действия логируются в vendor_prospect_activity

### 4. Post-Order Autopilot (новая Edge Function)

Автоматические действия после выполнения заказа:

- **Через 2 часа** после завершения заказа -- push "Как всё прошло? Оцените" 
- **Через 24 часа** -- если нет отзыва, мягкий remind
- **Через 7 дней** -- предложение повторного заказа или смежной услуги (cross-sell через AI)

### 5. Trigger-based Automation Engine

Расширяем существующую таблицу `mcc_automation_rules`, чтобы правила реально исполнялись через database triggers:

- Триггер на `profiles` INSERT -- welcome flow
- Триггер на `orders` UPDATE (status = 'completed') -- post-order flow
- Триггер на `user_segments` UPDATE -- lifecycle actions

---

## Технические детали

### Новые файлы

| Файл | Описание |
|------|----------|
| `supabase/functions/auto-lifecycle-actions/index.ts` | Cron-функция: читает user_segments, применяет lifecycle-шаблоны |
| `supabase/functions/auto-vendor-nurture/index.ts` | Cron-функция: auto-score и auto-outreach для vendor_prospects |
| `supabase/functions/post-order-autopilot/index.ts` | Cron-функция: review-remind и cross-sell после завершения заказов |

### Новая таблица

**`lifecycle_templates`** -- шаблоны автоматических сообщений:
- `id`, `trigger_type` (welcome, at_risk_reactivation, dormant_winback, vip_reward, post_order_review, cross_sell)
- `channel` (push, email, inapp)
- `title_ru`, `title_en`, `body_ru`, `body_en`
- `promo_code`, `discount_percent`
- `is_active`, `created_at`

### Миграция: pg_cron + pg_net

SQL для включения расширений и создания 4 cron-задач, вызывающих Edge Functions по расписанию.

### Изменяемые файлы

| Файл | Изменение |
|------|-----------|
| `src/components/admin/marketing/MCCAutomationTab.tsx` | Добавить секцию "Cron Jobs" с индикаторами статуса и "Lifecycle Templates" -- таблицу шаблонов |
| `src/hooks/useMCCAutomation.ts` | Добавить CRUD для lifecycle_templates |

---

## Результат

Платформа будет автоматически:
1. Встречать новых пользователей welcome-цепочкой
2. Возвращать уходящих пользователей персональными предложениями
3. Скорить и обрабатывать новых поставщиков без участия менеджера
4. Собирать отзывы и делать cross-sell после каждого заказа
5. Держать сегменты актуальными для таргетированных рассылок

Все без увеличения штата -- один человек управляет шаблонами через админку.

