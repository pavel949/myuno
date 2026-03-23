# Настройка продакшена: что делает команда в коде vs что делаете вы

**Полный чеклист Vercel + Supabase (домен, env, Edge secrets, порядок действий):**  
→ **[`VERCEL-SUPABASE-PRODUCTION-SETUP.md`](./VERCEL-SUPABASE-PRODUCTION-SETUP.md)**

**Код уже поддерживает** восстановление пароля (`VITE_PUBLIC_APP_URL`, PKCE на `/auth/reset-password`). Ниже — только действия в **ваших** аккаунтах (автоматически из репозитория их не настроить).

---

## 1. Vercel (5 минут)

1. Откройте проект → **Settings** → **Environment Variables**.
2. Добавьте переменную:

| Name | Value | Environments |
|------|--------|----------------|
| `VITE_PUBLIC_APP_URL` | `https://myuno.app` | **Production** (и Preview только если нужен фиксированный URL; иначе оставьте пустым — будет `window.location.origin`) |

3. **Redeploy** последний деплой Production (**Deployments** → ⋮ → Redeploy), иначе сборка не подхватит переменную.

> Без redeploy письма могут по-прежнему строиться со старым `redirectTo`.

---

## 2. Supabase Dashboard (5 минут)

1. [Supabase](https://supabase.com/dashboard) → ваш проект → **Authentication** → **URL Configuration**.
2. **Site URL:** `https://myuno.app` (или ваш основной домен).
3. **Redirect URLs** — добавьте строки (каждая отдельно):

   - `https://myuno.app/auth/reset-password`
   - `http://localhost:8080/auth/reset-password` (локальная разработка)

   При работе через Lovable/preview добавьте соответствующие URL вида  
   `https://<preview-host>/auth/reset-password`.

4. **Authentication** → **Providers** → **Email**: убедитесь, что отправка писем включена.

5. Если используется **Send Email Hook** на `auth-email-hook`: **Edge Functions** → логи функции при тестовом сбросе пароля (не должно быть 401/500).

---

## 3. Проверка после настройки

1. На **продакшене** откройте `/auth/forgot-password`, введите email существующего пользователя.
2. Проверьте почту (и **Спам**).
3. Перейдите по ссылке — должна открыться форма нового пароля на `/auth/reset-password`.

Подробности и типичные причины сбоев: [`AUTH-PASSWORD-RESET.md`](./AUTH-PASSWORD-RESET.md).

---

*Файл для владельца проекта; в git можно хранить как внутреннюю инструкцию.*
