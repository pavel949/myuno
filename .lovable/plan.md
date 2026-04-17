

User wants me to verify which database receives writes from CRM, leads (заявки), clients, bookings, and other frontend data flows. Context: previously discussed mirroring Lovable Cloud DB (`kakkwibljrjsawxgnupk`) to user's own Supabase (`erfwtoavipwjqmylpizt`). User wants confirmation that writes go to the correct DB.

Let me investigate the codebase to verify.

## План проверки: куда пишутся данные с фронтенда

### Что проверю (read-only аудит)

**1. Supabase clients** — найду все экземпляры `createClient` в коде, чтобы убедиться что используется только один основной клиент:
- `src/integrations/supabase/client.ts` — основной (Lovable Cloud `kakkwibljrjsawxgnupk`)
- `src/lib/peylaa/supabaseClient.ts` — отдельный PEYLAA проект (read-only, sales)
- Поиск других `createClient(...)` через codebase

**2. CRM записи** — куда идут `INSERT` для:
- `crm_contacts`, `crm_deals`, `crm_activities`, `crm_tasks`
- `mcc_leads` (Marketing Command Center)
- `consultation_requests` (заявки на консультации)
- `vendor_prospects`, `owner_prospects`

**3. Заявки/Лиды** — проверю:
- `nb_leads` (newbuilds лиды)
- `viewing_requests` (показы недвижимости)
- `consultation_requests` (юристы, визы)
- Формы из лендингов (relocate, wedding, kids)

**4. Клиенты/Брони** — проверю:
- `bookings`, `orders`, `order_items`
- `payment_intents` (Stripe webhook target)
- `guest_inquiries`

**5. .env проверка** — какой URL прописан в `VITE_SUPABASE_URL`:
- Подтвержу что = `https://kakkwibljrjsawxgnupk.supabase.co` (Lovable Cloud)

**6. Свежие записи в БД** — через `supabase--read_query` посмотрю последние 5-10 записей в каждой таблице с `created_at DESC` чтобы убедиться что данные реально приходят (timestamp ≤ 24h).

**7. Mirror workflow check** — напомню что GitHub Actions cron (если включён) копирует данные из Lovable Cloud → `erfwtoavipwjqmylpizt` односторонне; сам фронт всегда пишет в Lovable Cloud.

### Что выдам в результате

Краткий отчёт-таблица в чате:

| Категория | Таблица | Куда пишет фронт | Свежесть данных | Статус |
|---|---|---|---|---|
| CRM Contacts | `crm_contacts` | Lovable Cloud (kakk...) | last write: ... | ✅/⚠️ |
| CRM Deals | `crm_deals` | ... | ... | ... |
| Лиды newbuilds | `nb_leads` | ... | ... | ... |
| Консультации | `consultation_requests` | ... | ... | ... |
| Бронирования | `bookings` | ... | ... | ... |
| Заказы | `orders` | ... | ... | ... |
| Платежи | `payment_intents` | ... | ... | ... |
| PEYLAA данные | (внешняя БД) | ... | ... | ℹ️ |

Плюс:
- Список всех `createClient` инстансов с пояснением назначения каждого
- Подтверждение/опровержение, что `erfwtoavipwjqmylpizt` НЕ получает прямые записи с фронта (только через mirror workflow если активирован)
- Если найду аномалии (например запись в неправильную БД) — отдельный блок "⚠️ Найдено"

### Что НЕ делаю
- Никаких правок кода
- Никаких миграций
- Не трогаю mirror workflow

### Время
~3-5 минут (несколько SQL запросов + поиск по коду + чтение 3-4 файлов).

