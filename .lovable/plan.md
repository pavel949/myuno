

# План усиления myUNO

## Цель
Превратить myUNO из "хорошего инструмента управления" в **незаменимую платформу**, которую владельцы и менеджеры не смогут покинуть, благодаря уникальной экосистемной ценности.

---

## Фаза 1: Unified Inbox (Единый почтовый ящик)

**Проблема:** Сейчас сообщения привязаны только к бронированиям (`booking_messages`). Нет единого потока коммуникации.

**Решение:** Объединить все каналы (внутренний чат, WhatsApp, Email) в единый Inbox с фильтрацией по объектам и статусам.

### Что будет сделано:
1. **Новая таблица `unified_messages`** -- хранит сообщения из всех каналов с полями `channel` (internal/whatsapp/email), `thread_id`, `property_id`, `booking_id`, `direction` (inbound/outbound)
2. **Обновление страницы OwnerMessages** -- добавить фильтры по каналу, приоритету и объекту; показывать иконку канала (WhatsApp/Email/Chat) рядом с каждым сообщением
3. **Quick Reply шаблоны** -- возможность ответить шаблоном в один тап прямо из ленты
4. **Realtime подписка** -- мгновенные обновления через Realtime

---

## Фаза 2: AI Revenue Manager (Динамическое ценообразование)

**Проблема:** Сейчас это только пункт в roadmap. Нет инструмента оптимизации цен.

**Решение:** AI-модуль, который анализирует загрузку, сезонность и рыночные данные и предлагает оптимальные тарифы.

### Что будет сделано:
1. **Новая таблица `pricing_recommendations`** -- AI-рекомендации с полями `property_id`, `date_range`, `current_price`, `recommended_price`, `confidence`, `reasoning`, `status` (pending/accepted/rejected)
2. **Edge Function `ai-pricing-optimizer`** -- вызывает AI-модель (Gemini) с контекстом: текущие бронирования, сезонность, загрузка за последние 90 дней, средний ADR по району
3. **Виджет на дашборде** -- карточка "Revenue Insights" с top-3 рекомендациями и потенциальным ростом дохода
4. **Страница /owner/pricing** -- полный список рекомендаций с возможностью принять/отклонить и применить к календарю

---

## Фаза 3: Автоматический Cross-Selling при бронировании

**Проблема:** Cross-sell существует как статичные ссылки на страницах. Нет контекстного предложения на основе данных бронирования.

**Решение:** При создании/подтверждении бронирования автоматически предлагать релевантные услуги.

### Что будет сделано:
1. **Новая таблица `booking_cross_sell_offers`** -- привязка предложений к бронированию с полями `booking_id`, `service_type`, `suggested_price`, `status` (suggested/accepted/dismissed)
2. **Edge Function `ai-cross-sell`** -- на основе дат, локации объекта и профиля гостя генерирует персонализированные предложения (трансфер из аэропорта, яхта на выходные, клининг при выезде)
3. **Компонент BookingCrossSellSheet** -- bottom sheet после подтверждения бронирования с карточками предложений
4. **Интеграция в auto-messaging** -- включить cross-sell предложения в автоматические сообщения гостям (за 3 дня до заезда)

---

## Фаза 4: Digital Property Passport (Расширение Owner Vault)

**Проблема:** Vault -- просто файловое хранилище. Нет timeline, версионирования, напоминаний.

**Решение:** Превратить Vault в полный цифровой паспорт объекта.

### Что будет сделано:
1. **Новая таблица `property_passport_events`** -- timeline событий объекта (покупка, ремонт, смена управляющего, страховка) с полями `property_id`, `event_type`, `event_date`, `description`, `document_ids[]`
2. **Новая таблица `document_reminders`** -- автоматические напоминания об истечении документов (страховка, лицензия, контракт) с полями `vault_file_id`, `expires_at`, `reminder_days_before`, `notified`
3. **Timeline UI** -- визуальная хронология объекта на странице Property Detail (вертикальная линия с событиями)
4. **Cron-задача** -- ежедневная проверка истекающих документов с отправкой push/email напоминаний

---

## Техническая реализация

### База данных (4 миграции)

```text
Migration 1: unified_messages
  - id, thread_id, property_id, booking_id
  - channel (internal/whatsapp/email)
  - direction (inbound/outbound)
  - sender_id, sender_name, content
  - is_read, created_at
  - RLS: owner видит только свои объекты

Migration 2: pricing_recommendations
  - id, property_id, date_from, date_to
  - current_price, recommended_price
  - confidence (0-100), reasoning (text)
  - status (pending/accepted/rejected)
  - created_at
  - RLS: owner видит только свои объекты

Migration 3: booking_cross_sell_offers
  - id, booking_id, service_type, service_id
  - suggested_price, discount_percent
  - status (suggested/accepted/dismissed)
  - created_at
  - RLS: через связь booking -> property -> owner

Migration 4: property_passport_events + document_reminders
  - property_passport_events: id, property_id, event_type, event_date, description, document_ids
  - document_reminders: id, vault_file_id, property_id, expires_at, reminder_days_before, notified, created_at
  - RLS: owner видит только свои объекты
```

### Edge Functions (3 новые)
- `ai-pricing-optimizer` -- анализ и рекомендации цен (Gemini 2.5 Flash)
- `ai-cross-sell` -- генерация персонализированных предложений (Gemini 2.5 Flash Lite)
- `document-reminder-check` -- cron-проверка истекающих документов

### Новые UI компоненты
- `RevenueInsightsWidget` -- виджет дашборда
- `PricingRecommendationsPage` -- /owner/pricing
- `BookingCrossSellSheet` -- bottom sheet предложений
- `PropertyTimeline` -- timeline паспорта объекта
- `DocumentExpiryAlert` -- алерт об истечении документов

### Обновления существующих файлов
- `OwnerMessages.tsx` -- добавить фильтр по каналу, иконки каналов
- `OwnerDashboard.tsx` -- добавить виджет Revenue Insights
- `OwnerVaultPage.tsx` -- добавить секцию Timeline и настройку напоминаний
- `OwnerMobileNav.tsx` -- без изменений (Messages уже есть)
- `businessRoles.ts` -- добавить виджет `revenue_insights` в конфиг ролей

---

## Приоритет внедрения

| # | Фаза | Влияние | Сложность | Срок |
|---|-------|---------|-----------|------|
| 1 | Cross-Selling | Прямой доход | Средняя | 1-й |
| 2 | Revenue Manager | Оптимизация дохода | Средняя | 2-й |
| 3 | Property Passport | Удержание (lock-in) | Низкая | 3-й |
| 4 | Unified Inbox | UX улучшение | Высокая | 4-й |

