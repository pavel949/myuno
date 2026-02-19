
# Комплексный план: Поведенческая аналитика и маркетинговые инструменты

## Текущее состояние (после аудита)

Инфраструктура частично создана, но не подключена к реальным данным:

| Компонент | Статус | Проблема |
|---|---|---|
| `user_events` | Таблица есть | 0 строк — `useUserTracking` нигде не вызывается |
| `page_views` | Таблица есть | 0 строк — трекинг не активирован |
| `user_sessions` | Таблица есть | Не используется |
| `user_segments` | Таблица есть | Не обновляется автоматически |
| `MCCAnalyticsTab` | Компонент есть | Работает на mock-данных |
| `MCCAutomationTab` | Компонент есть | Работает на mock-данных |
| `send-promotions` | Edge Function есть | Нет UI для сегментированной рассылки |

---

## Архитектура решения

```text
┌─────────────────────────────────────────────────────────┐
│  СЛОЙ 1: СБОР ДАННЫХ                                    │
│  AppLayout → useUserTracking() → user_events + page_views│
└──────────────────────┬──────────────────────────────────┘
                       │ (автоматически)
┌──────────────────────▼──────────────────────────────────┐
│  СЛОЙ 2: ОБРАБОТКА                                      │
│  Edge Function (cron) → обновление user_segments        │
│  на основе user_events + orders + sessions              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  СЛОЙ 3: ИНТЕРФЕЙС ADMIN                                │
│  MCCAnalyticsTab (реальные данные)                      │
│  MCCLeadsTab → CRM с сегментами                         │
│  Broadcast Panel (рассылка по сегментам)                │
└─────────────────────────────────────────────────────────┘
```

---

## Модуль 1 — Активация трекинга поведения

**Проблема**: `useUserTracking` написан, но не вызывается нигде в приложении. Данные не собираются.

**Что делаем**:
- Подключить `useUserTracking()` в `src/components/layout/AppLayout.tsx` (один раз, глобально)
- Добавить вызовы `trackEvent()` в ключевых точках:
  - Поиск (search queries)
  - Просмотр карточки товара/услуги
  - Нажатие CTA-кнопок
  - Добавление в избранное
  - Начало и завершение заказа/букинга
- Добавить `user_id` при записи в `user_events` (сейчас поле есть, но хук его не передаёт — нужно получать из `supabase.auth.getUser()`)

**Файлы**:
- `src/components/layout/AppLayout.tsx` — добавить вызов хука
- `src/hooks/useUserTracking.ts` — исправить запись `user_id` в `user_events`

---

## Модуль 2 — Автоматическое обновление сегментов

**Проблема**: Таблица `user_segments` существует с богатой структурой (LTV, engagement_level, is_vip, is_at_risk), но никогда не заполняется.

**Что делаем**:
- Создать Edge Function `update-user-segments` (cron раз в час):
  - Считает метрики каждого пользователя: количество заказов, сумма, сессии, дни с последнего визита
  - Присваивает `lifecycle_stage`: `new` → `active` → `at_risk` → `dormant` → `churned`
  - Присваивает `value_segment`: `low` / `mid` / `high` / `vip`
  - Флаги `is_vip` (total_spent > 50,000 THB) и `is_at_risk` (не было визита > 21 дня)
- Обновить `mcc_user_states` синхронно с переходами сегментов

**Новые файлы**:
- `supabase/functions/update-user-segments/index.ts`

---

## Модуль 3 — MCCAnalyticsTab на реальных данных

**Проблема**: Вкладка Analytics показывает hardcoded mock-данные.

**Что делаем**:
- Создать хук `useMCCAnalytics(period)`, который читает реальные данные из:
  - `user_events` — по типам событий и каналам
  - `mcc_events` — маркетинговые события кампаний
  - `mcc_channel_metrics` — данные по каналам
  - `orders` — выручка
- Заменить mock на реальные графики (уже есть `recharts` в проекте):
  - График трафика по дням
  - Разбивка по источникам (utm_source из `user_sessions`)
  - Top страниц по просмотрам (из `page_views`)

**Файлы**:
- `src/hooks/useMCCAnalytics.ts` — новый хук
- `src/components/admin/marketing/MCCAnalyticsTab.tsx` — переключение с mock на реальные данные

---

## Модуль 4 — MCCAutomationTab на реальных данных

**Проблема**: Автоматизация показывает статичные mock-правила, не связанные с `mcc_automation_rules`.

**Что делаем**:
- Создать хук `useMCCAutomation()`, который читает/пишет `mcc_automation_rules`
- UI позволяет включать/выключать правила (Switch → UPDATE в БД)
- Добавить форму создания нового правила:
  - Триггер: `signup` / `dormant_30d` / `high_score` / `cart_abandoned`
  - Действие: `email` / `push` / `whatsapp`
  - Фильтр по состоянию пользователя (`user_state_filter`) и лендингу
- Показывать реальный счётчик `executions_count` и `last_executed_at`

**Файлы**:
- `src/hooks/useMCCAutomation.ts` — новый хук
- `src/components/admin/marketing/MCCAutomationTab.tsx` — реальные данные + форма создания

---

## Модуль 5 — Сегментированные рассылки (Broadcast Panel)

**Проблема**: Edge Function `send-promotions` отправляет всем с `promotions=true`, но нет UI для таргетинга по сегментам.

**Что делаем**:
- Создать новый компонент `MCCBroadcastPanel` внутри вкладки Automation:
  - Выбор аудитории: ВСЕ / по `lifecycle_stage` / по `value_segment` / VIP / At-Risk
  - Превью: "Охват: ~N пользователей"
  - Форма сообщения: заголовок (RU/EN), тело, опциональный promo-код
  - Канал: In-app уведомление / Email (через Resend)
  - Кнопка "Запустить рассылку" → вызов `send-promotions` с параметрами фильтрации
- Обновить `send-promotions` Edge Function для поддержки фильтрации по сегменту

**Новые файлы**:
- `src/components/admin/marketing/MCCBroadcastPanel.tsx`

**Изменяемые файлы**:
- `supabase/functions/send-promotions/index.ts` — добавить параметр `segment_filter`

---

## Модуль 6 — Подписки пользователей на категории

**Проблема**: Пользователи не могут подписаться на уведомления о предложениях по интересующим вертикалям.

**Что делаем**:
- Новая таблица `vertical_subscriptions` (user_id, vertical_slug, notify_email, notify_push, created_at)
- UI в профиле пользователя (`/account`): карточки вертикалей с переключателями
- В `notification_preferences` добавить поле `preferred_verticals` (jsonb массив)
- При появлении нового листинга/предложения — фильтровать пользователей по подпискам и отправлять уведомление

**Новые файлы**:
- `src/components/account/VerticalSubscriptions.tsx` — UI в профиле
- Миграция для таблицы `vertical_subscriptions`

---

## Последовательность реализации

```text
Неделя 1:
  [1] Активация трекинга → AppLayout + useUserTracking fix
  [2] update-user-segments Edge Function (cron)

Неделя 2:
  [3] MCCAnalyticsTab → реальные данные + recharts
  [4] MCCAutomationTab → реальные данные + форма правил

Неделя 3:
  [5] Broadcast Panel с сегментацией
  [6] Vertical Subscriptions в профиле

```

---

## Технические детали

**База данных**:
- Новая таблица `vertical_subscriptions` с RLS (пользователь видит только свои)
- Добавить `user_id` к записи в `user_events` (поле есть, хук его не передаёт)
- Cron-job для `update-user-segments` через `pg_cron` или scheduled Edge Function

**Безопасность**:
- `user_events`: RLS — пользователь пишет только свои события
- `user_segments`: RLS — читают только admin/uno_team, обновляет только service role
- `mcc_automation_rules`: RLS — только admin/uno_team

**Приоритет**: Модули 1 и 2 являются фундаментом — без реальных данных в `user_events` остальные модули не дадут ценности. Рекомендуется начать именно с них.
