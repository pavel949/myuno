## Plan — Wave 4.2d + Wave 5

Продолжаем по двум фронтам параллельно: точечная типизация следующих топ-офендеров `any` и структурная инвентаризация неиспользуемых таблиц БД и edge-функций.

### Часть A — Wave 4.2d: следующие 4 файла по `any`

Применяем тот же безопасный паттерн (DB types из `Database`, локальные `Ext`-расширения, narrow types для `unknown`).

1. **`src/hooks/useAdminProperties.ts`** (~22 `any`) — Supabase queries с устаревшими `(supabase as any)` обходами; типизировать через `Database['public']['Tables']['properties']['Row']`.
2. **`src/pages/admin/AdminUsers.tsx`** (~20 `any`) — массивы профилей и ролей; ввести `ProfileWithRoles` локальный тип.
3. **`src/components/owner/dashboard/*` крупные `any`-блоки** — найти топ-3 после прохода (orders/properties/messages блоки).
4. **`src/hooks/useCRMContacts.ts`** или ближайший CRM-хук с >15 `any` — типизировать через `crm_contacts` Row/Insert/Update.

После каждого файла: `tsc --noEmit` + точечный пересчёт `any`. По окончании — `vite build` и запись метрик в `docs/audits/2026-04-cleanup-map.md`.

Цель: **−80…−120** `any` за проход (с 1111 до ~1000).

### Часть B — Wave 5: структурная зачистка БД и edge-функций

#### B1. Cross-ref 85 edge-функций
- Прочитать список из `supabase/functions/`.
- Для каждой проверить:
  - вызов из `src/` (`supabase.functions.invoke('name')`, `fetch(.../functions/v1/name)`);
  - использование как webhook (`supabase/migrations/*` + `system_settings`);
  - использование в `pg_cron` (через `supabase--read_query` к `cron.job`).
- Классифицировать: **используется** / **webhook/cron** / **не используется** / **требует ручной проверки**.
- Записать в `docs/audits/2026-04-cleanup-map.md` секцию **"Edge functions cross-ref"**.
- Никаких удалений в этой волне — только список с рекомендацией.

#### B2. Cross-ref 48 неиспользуемых таблиц
- Для каждой таблицы из аудита:
  - проверить наличие записей: `SELECT count(*) FROM <table>`;
  - проверить FK-зависимости через `information_schema.referential_constraints`;
  - проверить наличие RLS-политик и триггеров.
- Классифицировать: **пустая+без FK = кандидат на drop** / **пустая+с FK = legacy** / **есть данные = архив**.
- Записать в audit-доку секцию **"DB tables cross-ref"** с рекомендацией по каждой.
- Никаких миграций — только инвентаризация.

### Технические детали

- **Не трогать**: `src/integrations/supabase/types.ts`, edge runtime config, миграции.
- **Безопасные приёмы для `any`**:
  - `Database['public']['Tables']['X']['Row' | 'Insert' | 'Update']` для Supabase сущностей;
  - `type FooExt = { ... }; const fooExt = foo as typeof foo & FooExt` для полей вне generated types;
  - `unknown` + narrow guard для error-handlers.
- **Read-only DB операции** в части B — только `supabase--read_query` к `pg_catalog`/`information_schema`/`cron`.
- **Verification gate**: после каждого файла — `bunx tsc --noEmit`; в конце волны — `bun run build`.

### Deliverables

- 4 файла с `any` → ~0 (или строго обоснованным остатком);
- Обновлённый счётчик `any` в audit-доке;
- Две новые секции в `docs/audits/2026-04-cleanup-map.md`: **Edge functions cross-ref** и **DB tables cross-ref** со списком и рекомендациями;
- Зелёный билд.

### Что НЕ делаем в этой волне

- Не удаляем edge-функции и таблицы (только аудит);
- Не правим runtime-логику, только типы;
- Не трогаем `usePropertyWithRentalTerms` API — расширения только локально через `Ext`.
