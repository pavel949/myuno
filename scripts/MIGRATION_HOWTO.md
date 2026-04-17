# Миграция myUNO: Lovable → свой Supabase

> ⚠️ **STATUS: ON HOLD (2026-04-17).**
> Сейчас работаем на **Lovable Cloud (`kakkwibljrjsawxgnupk`)**. Миграция на self-managed (`erfwtoavipwjqmylpizt`) **не запланирована к исполнению**. Эти команды — для будущего запуска миграции, не инструкция к действию сегодня. См. [`../docs/DATABASES.md`](../docs/DATABASES.md) для актуальной топологии.

## Что нужно

- Node.js 18+
- Supabase CLI (`npm i -g supabase`)
- Access token от Supabase (Account → Access Tokens)
- Database password от нового проекта

## Шаг 1: Применить схему (создать все таблицы)

```bash
# Залогиниться в Supabase CLI
supabase login

# Привязать к проекту
supabase link --project-ref erfwtoavipwjqmylpizt

# Пушнуть все 514 миграций (создаст таблицы, RLS, functions, triggers)
supabase db push
```

Если `db push` падает с ошибками — запусти с флагом:
```bash
supabase db push --include-all
```

Или примени миграции вручную через SQL Editor в Supabase Dashboard.

## Шаг 2: Экспорт данных из Lovable

```bash
# Установить зависимости (если не установлены)
npm install

# Экспортировать все таблицы через REST API
node scripts/export-data.mjs
```

Данные сохранятся в `tmp/export/*.json`. Посмотри `tmp/export/_summary.json` для отчёта.

## Шаг 3: Импорт данных в новую базу

Получи **service_role key** из Supabase Dashboard:
1. Settings → API → Project API Keys → service_role (⚠️ secret!)

```bash
# Импортировать данные
SERVICE_ROLE_KEY=eyJhbG...ваш_ключ node scripts/import-data.mjs
```

## Шаг 4: Перегенерировать типы

```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

## Шаг 5: Деплой Edge Functions

```bash
supabase functions deploy
```

## Шаг 6: Настроить секреты

```bash
supabase secrets set GOOGLE_MAPS_API_KEY=xxx
supabase secrets set STRIPE_SECRET_KEY=xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=xxx
supabase secrets set RESEND_API_KEY=xxx
# ... остальные секреты
```

## Шаг 7: Создать Storage Buckets

В Supabase Dashboard → Storage → New bucket:
- `avatars` (public)
- `listings` (public)
- `documents` (private)
- `property-images` (public)
- `vendor-uploads` (public)

## Шаг 8: Проверить

```bash
npm run build
npm run dev
```

Проверь:
- Авторизация работает
- Список properties загружается
- Карта открывается
- Создание букинга работает

## Ограничения

- **RLS** может блокировать экспорт некоторых таблиц через anon key
- Для заблокированных таблиц нужен **service_role key от Lovable** (спроси support)
- **Auth users** не переносятся через REST API — пользователям нужно зарегистрироваться заново
- **Storage files** (изображения) не переносятся — нужен отдельный скрипт или ручной перенос
