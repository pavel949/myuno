# Продакшен: Vercel + Supabase — полный чеклист

> **Важно:** ни AI, ни репозиторий не могут зайти в ваши аккаунты **Vercel** и **Supabase**. Ниже — точный порядок действий, чтобы выставить всё вручную за один проход. После каждого блока делайте **Redeploy** на Vercel, если меняли `VITE_*`.

**Канонический домен в примерах:** `https://myuno.app` — замените на свой, если другой.

---

## Порядок работы

1. **Сначала Supabase** — скопируйте URL и ключи.  
2. **Потом Vercel** — вставьте те же значения в Environment Variables.  
3. **Снова Supabase** — Redirect URLs и Site URL должны совпадать с тем, что на Vercel.  
4. **Redeploy** production на Vercel.

---

## Часть A — Supabase (dashboard)

### A1. API — ключи для фронтенда

1. [Supabase Dashboard](https://supabase.com/dashboard) → ваш проект → **Project Settings** → **API**.
2. Скопируйте:
   - **Project URL** → это будет `VITE_SUPABASE_URL`.
   - **Project API keys** → **anon** / **public** → это `VITE_SUPABASE_PUBLISHABLE_KEY` (в коде так и названо; это не service role).
3. **Project ID** (ref) — опционально для `VITE_SUPABASE_PROJECT_ID`.

### A2. Authentication — URL и редиректы

1. **Authentication** → **URL Configuration**.
2. **Site URL:** `https://myuno.app` (основной продакшен-домен).
3. **Redirect URLs** — добавьте **каждую строку отдельно** (минимум для сброса пароля):

   | URL |
   |-----|
   | `https://myuno.app/auth/reset-password` |
   | `http://localhost:8080/auth/reset-password` |

   При необходимости добавьте **точные** URL превью (Lovable / Vercel), например  
   `https://<preview-host>/auth/reset-password`.  
   Wildcard-поддомены (`https://*.vercel.app/...`) — только если [документация Supabase](https://supabase.com/docs/guides/auth/redirect-urls) для вашего плана это разрешает.

   Подробнее: [`AUTH-PASSWORD-RESET.md`](./AUTH-PASSWORD-RESET.md).

4. **Authentication** → **Providers** → **Email**: включите, если вход по email.

Подробнее про сброс пароля: [`AUTH-PASSWORD-RESET.md`](./AUTH-PASSWORD-RESET.md).

### A3. Edge Functions — секреты (бэкенд)

Секреты **не** кладутся в Vite. Их задают в Supabase для Edge Functions:

1. **Project Settings** → **Edge Functions** → **Secrets** (или через CLI: `supabase secrets set KEY=value`).

2. Минимальный набор, который часто встречается в этом репозитории (имена как в коде функций):

   | Secret | Назначение |
   |--------|------------|
   | `SUPABASE_URL` | Обычно подставляется автоматически при деплое функций; проверьте в доках к вашей версии CLI. |
   | `SUPABASE_SERVICE_ROLE_KEY` | Service role — только на сервере, **никогда** во фронт. |
   | `SUPABASE_ANON_KEY` | Некоторые функции создают клиента с anon key. |
   | `RESEND_API_KEY` | Письма (уведомления, CRM email и т.д.). |
   | `LOVABLE_API_KEY` | AI через Lovable Gateway. |
   | `FIRECRAWL_API_KEY` | Скрапинг / поиск. |
   | `STRIPE_SECRET_KEY` | Платежи. |
   | `INTERNAL_SECRET` | Вызовы между edge functions. |
   | `ULTRAMSG_INSTANCE`, `ULTRAMSG_TOKEN` | WhatsApp (если используете). |

Точный список для вашего деплоя — по тем функциям, которые вы реально включили. См. также комментарии в [`.env.example`](../.env.example) и `CLAUDE.md`.

### A4. База и миграции

- Миграции применяются **к вашему проекту** через Supabase CLI / Dashboard SQL, а не через Vercel.  
- Команда в репозитории: `npm run supabase:db-push` (локально, с привязкой к проекту) — см. документацию Supabase.

---

## Часть B — Vercel (dashboard)

### B1. Подключение репозитория

1. [Vercel](https://vercel.com) → **Add New** → **Project** → импорт GitHub-репозитория `myuno`.
2. **Root Directory:** корень репозитория (если монорепо — укажите подпапку).
3. **Framework Preset:** Vite (или оставьте авто — в корне есть `vercel.json`).

В репозитории уже задано:

- `build`: `npm run build`
- **Output:** `dist`
- **Rewrites:** SPA → `index.html` (см. `vercel.json`)

### B2. Environment Variables (обязательно для продакшена)

**Settings** → **Environment Variables**. Для **Production** (и при необходимости **Preview**) добавьте:

| Name | Value | Откуда взять |
|------|--------|----------------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJ...` (anon public) | Supabase → Settings → API → anon public |
| `VITE_PUBLIC_APP_URL` | `https://myuno.app` | Ваш канонический origin **без** слэша в конце |

**Рекомендуется:**

| Name | Value |
|------|--------|
| `VITE_SUPABASE_PROJECT_ID` | ref проекта из URL/dashboard |
| `VITE_GOOGLE_MAPS_API_KEY` | Если на проде нужны карты — ключ из Google Cloud (ограничьте по referrer: домен + localhost). |

**Опционально** (если нет своих Vercel Serverless `/api/*`):

| Name | Value |
|------|--------|
| `VITE_CHAT_API_URL` | Полный URL edge function для чата |
| `VITE_ADMIN_LOGIN_API_URL` | Полный URL для `POST` логина админки |

См. [`ENV.md`](./ENV.md).

### B3. Node.js

- **Settings** → **General** → **Node.js Version:** **20.x** (согласовано с CI в `.github/workflows/ci.yml`).

### B4. Домен

1. **Settings** → **Domains** → подключите `myuno.app` / `www` по инструкции Vercel (DNS у reg.ru или другого регистратора).
2. Убедитесь, что **один** канонический адрес совпадает с `VITE_PUBLIC_APP_URL` и Supabase **Site URL**.

### B5. Redeploy

После **любого** изменения `VITE_*`:

**Deployments** → последний production → **⋯** → **Redeploy** (без кэша — по желанию).

Иначе в браузере останутся старые зашитые при сборке значения.

---

## Проверка после настройки

| Проверка | Ожидание |
|----------|----------|
| Открыть продакшен в инкогнито | Страница грузится, нет белого экрана с ошибкой `[env]` в консоли |
| Логин по email | Работает |
| `/auth/forgot-password` → письмо → ссылка | Открывается `/auth/reset-password` на **том же** домене |
| Любой клиентский роут (например `/discover`) | Обновление F5 не даёт 404 (работает SPA rewrite) |

---

## Связанные документы

- [`ENV.md`](./ENV.md) — переменные Vite  
- [`OWNER-SETUP-VERCEL-SUPABASE.md`](./OWNER-SETUP-VERCEL-SUPABASE.md) — акцент на сброс пароля  
- [`AUTH-PASSWORD-RESET.md`](./AUTH-PASSWORD-RESET.md) — детали PKCE и редиректов  

---

*Внутренняя инструкция для владельца проекта; доступ к Vercel/Supabase только у вас.*
