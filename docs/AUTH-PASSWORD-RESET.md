# Восстановление пароля — как это устроено и что проверить

## Поток в приложении

1. Пользователь: **`/auth/forgot-password`** → `supabase.auth.resetPasswordForEmail(email, { redirectTo })`.
2. `redirectTo` формируется в **`getPasswordResetRedirectUrl()`** (`src/lib/config/routes.ts`):
   - если задан **`VITE_PUBLIC_APP_URL`** (например `https://myuno.app`), используется он + путь **`/auth/reset-password`**;
   - иначе **`window.location.origin`** (удобно для localhost и preview).
3. Пользователь переходит по ссылке из письма на **`/auth/reset-password`** с токенами в **query `?code=`** (PKCE) или в **hash** (`#access_token=...`) — оба варианта обрабатываются в `ResetPassword.tsx`.

## Если письмо «не приходит»

### 1. Supabase — URL и allowlist (самая частая причина)

В [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**:

| Поле | Что указать |
|------|-------------|
| **Site URL** | Основной URL продакшена, напр. `https://myuno.app` |
| **Redirect URLs** | Явно добавьте **полный** URL сброса, например: `https://myuno.app/auth/reset-password`, `http://localhost:8080/auth/reset-password`, при необходимости preview (`https://*.lovable.app/auth/reset-password` — если поддерживается). |

Если `redirectTo` из запроса **не входит** в список, Supabase может не отправить письмо или сломать ссылку.

**Рекомендация для Vercel:** задайте в переменных окружения сборки:

`VITE_PUBLIC_APP_URL=https://myuno.app`

(без слэша в конце), чтобы ссылка в письме всегда совпадала с allowlist, даже если пользователь зашёл на сайт через `www` или другой алиас.

### 2. Почта и доставка

- Проверьте **Спам / Promotions**.
- В Dashboard → **Authentication** → **Providers** → **Email**: включена ли отправка, нет ли кастомного SMTP с ошибками.
- Если используется **Send Email Hook** (например `auth-email-hook` + Lovable Email), убедитесь, что hook **развёрнут**, секреты заданы, в логах функции нет 401/500.

### 3. Безопасность (ожидаемое поведение)

Для **неизвестного email** Supabase часто возвращает **успех** без отправки письма (антиenumeration). В UI добавлено пояснение после отправки формы.

### 4. Лимиты

При частых запросах возможен rate limit — в ответе API будет ошибка; в консоли браузера и логах смотрите текст от Supabase.

## Связанные файлы

- `src/pages/auth/ForgotPassword.tsx` — форма запроса сброса  
- `src/pages/auth/ResetPassword.tsx` — установка нового пароля после перехода по ссылке  
- `src/contexts/AuthContext.tsx` — `resetPassword()` с тем же `redirectTo`  
- `supabase/functions/auth-email-hook/` — кастомные шаблоны писем (если используются)
