# Environment, Databases & Keys — Source of Truth

> **Канонический документ.** Все остальные .md и AI-инструменты (Claude, Cursor, Lovable) ссылаются сюда.
> Last sync: 2026-04-18

Если возникает противоречие между этим файлом и другими — **этот файл выигрывает**.

---

## 1. Главное в одной таблице

| Что | Значение | Где живёт |
|---|---|---|
| **Production frontend** | https://myuno.app, https://www.myuno.app | Lovable hosting |
| **Lovable preview** | https://uno-connect-hub.lovable.app | Lovable hosting |
| **Lovable project ID** | `dcc2b024-7627-4ad9-a915-a3df3dd839f0` | Lovable platform |
| **PRIMARY DB (production)** | Supabase project `kakkwibljrjsawxgnupk` | Lovable Cloud (managed Supabase) |
| **PRIMARY DB URL** | `https://kakkwibljrjsawxgnupk.supabase.co` | `.env` → `VITE_SUPABASE_URL` |
| **MIRROR DB (optional)** | Supabase project `erfwtoavipwjqmylpizt` | Standalone Supabase (внешний) |
| **PEYLAA DB (read-only)** | отдельный Supabase проект продаж | `.env` → `VITE_PEYLAA_*` |

---

## 2. Базы данных — кто куда пишет

### 2.1 PRIMARY: Lovable Cloud (`kakkwibljrjsawxgnupk`) — ✅ источник правды

**Это единственная база, в которую пишет фронтенд и Edge Functions.**

- Весь CRM, заявки, лиды, бронирования, юзеры, недвижимость, платежи — пишутся **сюда**.
- Импорт в коде: `import { supabase } from "@/integrations/supabase/client";`
- Клиент создаётся **один раз** в `src/integrations/supabase/client.ts` — **НЕ ТРОГАТЬ**, файл авто-генерируемый.
- Edge Functions подключаются через `supabase/functions/_shared/supabase.ts` (`createServiceClient` / `createAnonClient`).

**Запрещено:**
- Создавать новые `createClient(...)` инстансы для основной БД.
- Писать в БД `erfwtoavipwjqmylpizt` напрямую с фронтенда.

### 2.2 MIRROR: standalone Supabase (`erfwtoavipwjqmylpizt`) — 📦 опциональное зеркало

- Отдельный проект пользователя для бэкапа / автономии от Lovable.
- **НЕ получает прямые записи с фронта.** Только через ручной `scripts/export-data.mjs` → `scripts/import-data.mjs` (см. `scripts/MIGRATION_HOWTO.md`).
- Frontend код **не должен** ссылаться на этот проект.
- Используется только если решено мигрировать с Lovable Cloud полностью.

### 2.3 PEYLAA: внешняя БД продаж (read-only)

- Отдельный Supabase-проект для системы продаж PEYLAA.
- Клиент: `src/lib/peylaa/supabaseClient.ts` (`peylaaDb`).
- Только чтение, без auth-сессии (`persistSession: false`).
- **Не путать с PRIMARY DB.** Использовать только в коде PEYLAA-фич.

---

## 3. Окружения

| Окружение | URL | DB | Назначение |
|---|---|---|---|
| **Production** | myuno.app | `kakkwibljrjsawxgnupk` | Реальные пользователи и платежи |
| **Lovable preview** | id-preview--…lovable.app | `kakkwibljrjsawxgnupk` | Превью изменений в Lovable |
| **Local dev** | http://localhost:8080 | `kakkwibljrjsawxgnupk` | Локальная разработка (та же БД!) |

⚠️ **Внимание:** локальная разработка идёт в **ту же production-БД**. Отдельной staging-БД нет. Тестовые данные помечайте маркером (`source = 'smoke_test'`, `[TEST]` в полях, `*@myuno.test` для email).

---

## 4. Ключи и секреты

### 4.1 Frontend `.env` (публичные ключи, OK хранить в коде)

| Переменная | Где взять | Описание |
|---|---|---|
| `VITE_SUPABASE_URL` | Lovable Cloud | URL primary DB |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Lovable Cloud | Anon key primary DB |
| `VITE_SUPABASE_PROJECT_ID` | Lovable Cloud | `kakkwibljrjsawxgnupk` |
| `VITE_PEYLAA_SUPABASE_URL` | PEYLAA проект | URL PEYLAA DB |
| `VITE_PEYLAA_SUPABASE_KEY` | PEYLAA проект | Anon key PEYLAA DB |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud Console | Maps JS + Places + Geocoding |
| `VITE_BYPASS_COMING_SOON` | — | `"true"` чтобы пропустить gate в dev |
| `VITE_SENTRY_DSN` | Sentry | Error monitoring (только prod) |

`.env` и `.env.example` синхронизированы. Не добавляйте сюда private keys.

### 4.2 Backend secrets (Lovable Cloud → Edge Functions)

⚠️ **Никогда не хранить в коде или `.env`.** Управление: tools `secrets--add_secret` / `secrets--fetch_secrets` или Lovable Cloud UI.

| Секрет | Используется в | Назначение |
|---|---|---|
| `STRIPE_SECRET_KEY` | `create-*-checkout`, `stripe-webhook` | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | `stripe-webhook` | Подпись webhook'ов |
| `STRIPE_CONNECT_WEBHOOK_SECRET` | `devmod-stripe-webhook` | Stripe Connect |
| `RESEND_API_KEY` | `notify-*`, `send-*-email` | Email рассылка |
| `LOVABLE_API_KEY` | `ai-*` | Lovable AI Gateway |
| `FIRECRAWL_API_KEY` | `firecrawl-*`, `etagi-scrape-projects` | Web scraping |
| `RENTALS_UNITED_ACCESS_KEY` + `RENTALS_UNITED_SECRET_KEY` | `rentals-united-sync` | Channel manager |
| `ANTHROPIC_API_KEY` | `devmod-buyer-kyc` | Claude Vision OCR |
| `TELEGRAM_BOT_TOKEN` + `TELEGRAM_BROKER_CHAT_ID` | Developer module | Уведомления брокеру |
| `BROKER_EMAIL`, `PLATFORM_EMAIL`, `MASKED_EMAIL_DOMAIN` | Developer module | Маскированные email |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Все Edge Functions | Авто-инжектируются Lovable Cloud |

### 4.3 Что НЕ существует

- ❌ **Нет `.env.production` / `.env.staging`** — единое окружение.
- ❌ **Нет VITE_SIMULATION_MODE / VITE_DEMO_MODE** — флаги удалены.
- ❌ **Нет v2 schema в Supabase** — все таблицы в `public`. Не использовать `supabase.schema('v2')`.

---

## 5. Правила для AI-инструментов (Claude, Cursor, Lovable)

1. **PRIMARY DB всегда `kakkwibljrjsawxgnupk`.** Если видите запросы к `erfwtoavipwjqmylpizt` с фронтенда — это баг.
2. **Не редактировать** `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `.env`, `supabase/migrations/*` — auto-managed.
3. **Изменения схемы БД** — только через `supabase--migration` tool. Никаких ручных SQL в `migrations/`.
4. **Секреты** — через `secrets--add_secret` tool, никогда не просить пользователя вписать значение в чат.
5. **Типы** — после миграции `types.ts` пере-генерируется автоматически. Не править вручную.
6. **Локальная разработка пишет в production DB** — помечайте тестовые записи маркерами.

---

## 6. Связанные документы

- `README.md` — quick start
- `.env.example` — список переменных
- `docs/DATABASE.md` — схема БД
- `docs/EDGE_FUNCTIONS.md` — справочник 60+ Edge Functions
- `docs/DEPLOY_EDGE_FUNCTIONS.md` — деплой
- `docs/DB_MIRROR_SETUP.md` — настройка зеркала на standalone Supabase
- `scripts/MIGRATION_HOWTO.md` — миграция данных Lovable → standalone
