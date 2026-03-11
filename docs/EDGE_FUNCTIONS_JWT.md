# Edge Functions: verify_jwt и доступ

В `supabase/config.toml` у большинства Edge Functions задано `verify_jwt = false`. Ниже зафиксировано, какие функции по дизайну публичные (без JWT), а какие в перспективе стоит защитить.

## Зачем verify_jwt = false

- **Внешние webhooks** — Stripe, WhatsApp, OTA, календари и т.п. вызывают функции по HTTP без JWT пользователя.
- **Auth/system hooks** — Supabase вызывает `auth-email-hook` и подобные при событиях аутентификации (нет пользовательского JWT в контексте вызова).
- **Cron/фоновые задачи** — задачи по расписанию (напоминания, синхронизации, отчёты) запускаются планировщиком, не от имени пользователя.
- **Публичные API** — например, геокодинг, погода, генерация sitemap вызываются с фронта или краулеров; при необходимости защита через API key в заголовке/теле.

## Категории функций (по config.toml)

| Категория | Примеры | verify_jwt | Примечание |
|-----------|---------|------------|------------|
| **Webhooks** | `stripe-webhook`, `whatsapp-incoming-webhook` | false | Проверка подписи/секрета в коде обязательна. |
| **Auth/system** | `auth-email-hook` | false | Вызов от Supabase, не от пользователя. |
| **Cron/фоновые** | `booking-reminders`, `ota-scrape`, `monthly-owner-statements`, `send-promotions`, `update-user-segments` | false | Запуск по расписанию или из админки. |
| **Checkout / payment** | `create-checkout-session`, `create-flowers-checkout`, `create-order-checkout`, `create-restaurant-checkout`, `create-vendor-subscription` | false | Часто вызываются с фронта до логина или с отдельным flow; при необходимости проверять JWT или ключ в коде. |
| **AI / внешние сервисы** | `ai-agent`, `ai-concierge`, `geocode-address`, `get-weather`, `get-mapbox-token`, `firecrawl-*` | false | Публичные или с ключом в заголовке. |
| **Email/send** | `send-email`, `send-order-email`, `send-crm-email`, `notify-admin-partner-application` | false | Вызов из других функций или по событиям. |
| **Скрапинг/синк** | `ota-scrape`, `ical-sync`, `airbnb-sync`, `rentals-united-sync`, `etagi-scrape-projects`, `fazwaz-*` | false | Cron или внутренние вызовы. |
| **Единственная с JWT** | `approve-partner-application` | **true** | Действие от имени админа. |

## Рекомендации

1. **Webhooks (Stripe, WhatsApp и т.д.)** — не переводить на `verify_jwt = true`; проверять подпись/секрет в коде функции.
2. **Checkout-функции** — если вызов только от авторизованного пользователя, можно включить `verify_jwt = true` или проверять JWT в коде; иначе оставить false и защищать rate limit / API key.
3. **Cron и внутренние вызовы** — оставить `verify_jwt = false`; доступ ограничивать через секреты/переменные окружения и список разрешённых вызывающих.
4. **Новые функции** — по умолчанию задавать `verify_jwt = true`, кроме webhooks, auth hooks и явно публичных API; для последних описать причину в этом документе.

При изменении `verify_jwt` для существующей функции обновить этот файл и при необходимости код вызова (заголовок `Authorization: Bearer <jwt>`).
