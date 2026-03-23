# Вход не работает, а сброс пароля в Lovable — да

## В чём разница

- **Lovable (preview)** подставляет свои переменные Supabase в сборку.
- **Сайт на Vercel / локально** использует то, что задано в **`.env`** или в **Vercel → Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

Это **два разных «подключения»**. Если они указывают на **разные проекты Supabase**, то:

- пользователь и новый пароль живут в **проекте A** (там, где вы сбросили пароль);
- форма входа на myuno.app обращается к **проекту B** → Supabase отвечает **«неверный email или пароль»**, даже если данные введены верно.

Сброс пароля и вход используют **один и тот же** `supabase.auth` в коде — проблема не в «логике экрана», а в **несовпадении проекта**.

## Что сделать

1. Откройте **Supabase Dashboard** → проект, где вы **точно** видите пользователя `pavel@ignatevestate.com` после сброса пароля.
2. Скопируйте оттуда **Project URL** и **anon / publishable key** (как в API settings).
3. В **Vercel** → проект → **Settings** → **Environment Variables** задайте:
   - `VITE_SUPABASE_URL` = этот URL  
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = этот ключ  
   (имена именно **`VITE_*`**, не `NEXT_PUBLIC_*`.)
4. Выполните **Redeploy** production (без redeploy старая сборка останется со старыми значениями).
5. Локально: то же самое в `.env` и перезапуск `npm run dev`.

## Дополнительно

- **Email** при входе в приложении теперь нормализуется (trim + lowercase), чтобы не ловить ошибку из‑за пробела или регистра.
- В **Supabase** → **Authentication** → **Users** проверьте, что пользователь **подтверждён** (если у вас включено подтверждение email — иначе будет ошибка про неподтверждённый email, не «неверный пароль»).

См. также: [`VERCEL-SUPABASE-PRODUCTION-SETUP.md`](./VERCEL-SUPABASE-PRODUCTION-SETUP.md), [`ENV.md`](./ENV.md).
