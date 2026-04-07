# Деплой Edge Functions и миграций

## Требования

- [Supabase CLI](https://supabase.com/docs/guides/cli) установлен глобально или через `npx`
- Авторизация: выполните один раз `npx supabase login` (откроется браузер для входа)

## Деплой двух новых функций (партнёрские заявки)

Из корня проекта:

```bash
npm run supabase:deploy
```

Или по отдельности:

```bash
npx supabase functions deploy approve-partner-application
npx supabase functions deploy notify-admin-partner-application
```

## Применить миграцию БД (один триггер регистрации)

```bash
npm run supabase:db-push
```

Или:

```bash
npx supabase db push
```

Миграция `20260308120000_single_registration_trigger.sql` снимает дублирующий триггер `on_auth_user_created_profile` с `auth.users`.

## Секреты

Убедитесь, что в проекте Supabase заданы секреты для Edge Functions (Dashboard → Project Settings → Edge Functions → Secrets):

- `RESEND_API_KEY` — для отправки писем (в т.ч. notify-admin-partner-application)

После первого входа (`supabase login`) деплой можно выполнять командами выше.
