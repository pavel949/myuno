# Cleanup Progress — 2026-04-29

Snapshot после автономного прогона Волн 1, 4, 5.

## Метрики

| Метрика | Baseline | После В1+4.A+4.B | После В4.C+5 | Δ от baseline |
|---|---|---|---|---|
| Tables `public` | 405 | 387 | **386** | −19 |
| Edge functions (active) | 157 | 124 | 124 | −33 |
| `personaLandings.ts` LOC | 1689 | 80 + 27 модулей | без изм. | сплит |
| Hardcoded `navigate('/')` | 419 | 419 | 419 | без изм. |
| RPC functions (`public`) | n/a | n/a | **432** (296 без явных рефов) | задокументировано |
| `any` usage | 745 | 745 | 745 | без изм. |

## Выполнено

### Волна 1.A — Edge Functions Quarantine
33 orphan-функции в `supabase/functions/_archive/` (14-day observation).

### Волна 1.B — Modularization
`personaLandings.ts` сплит на 27 файлов в `personas/`.

### Волна 4.A — DB Tier 1 (4 таблицы)
`booking_scheduled_messages`, `clearview_projects`, `document_reminders`, `property_passport_events`.

### Волна 4.B — DB Tier 2 (14 таблиц)
14 пустых таблиц без frontend-рефов (см. предыдущий отчёт).

### Волна 4.B Rollback
19 таблиц `mcc_*`, `platform_*`, `vendor_*` восстановлены — UI активно использует.

### Волна 4.C — Кросс-референс пустых таблиц
- 201 пустая таблица в `public`
- Кросс-референс с `src/**/*.{ts,tsx}` и `supabase/functions/**` (исключая `_archive`)
- 155 таблиц без рефов в frontend и активных edge fn — **но при двойной проверке** оказалось, что 99 из 100 кандидатов имеют UI-привязку (через хуки/компоненты).
- **Вывод**: подавляющее большинство пустых таблиц = «pending-data» (UI готов, ждёт первых записей). Дроп без удаления UI = регрессия.
- **Удалено: 1 подтверждённая сирота** — `user_analytics_daily`.
- Полный аудит-CSV: `docs/audits/empty-tables-refs-2026-04-29.csv` (201 строка).

### Волна 5 — RPC аудит
- 432 функции в `public` schema.
- 296 «orphan-кандидатов» (нет `.rpc('name')` вызовов в `src/`, нет упоминаний в активных edge fn, нет прямой привязки к триггерам через `tgfoid`).
- **НЕ удаляем** — детектор не покрывает: триггеры через `EXECUTE PROCEDURE` в DDL, RLS helper-функции в политиках, cron jobs (`pg_cron`), вызовы из других функций (`PERFORM fn()`), вызовы из VIEW.
- Список: `docs/audits/orphan-rpcs-2026-04-29.txt`.
- **Рекомендация**: ручной аудит по 20-30 функций за итерацию с проверкой `pg_depend` и `pg_proc.prosrc` на cross-reference.

## Отложено

- **Волна 1.C** — 419 hardcoded routes → `APP_ROUTES`. Длинный хвост ≤8 на файл. Делать оппортунистически.
- **Волна 4.C-deep** — UI-аудит для каждой из ~100 «pending-data» таблиц: оставить или дропать вместе с UI-модулем.
- **Волна 5-deep** — ручной аудит RPC через `pg_depend` для безопасного дропа.
- **Edge functions** — финальное удаление архивированных после 2026-05-13.

## Артефакты

- `docs/audits/baseline-2026-04.md`
- `docs/audits/wave-progress-2026-04-29.md` (этот файл)
- `docs/audits/empty-tables-refs-2026-04-29.csv` — кросс-референс 201 пустой таблицы
- `docs/audits/orphan-rpcs-2026-04-29.txt` — 296 кандидатов RPC
- `docs/audits/edge-functions-usage.md`
- `docs/audits/db-table-classification.md`
- `docs/cleanup/CLEANUP_ROADMAP.md`
- `supabase/functions/_archive/README.md` — 33 архивные edge fn

## Следующие шаги (рекомендация)

1. **Pавел review** — `empty-tables-refs-2026-04-29.csv`: для ~100 «pending-data» таблиц решить keep/kill вместе с UI.
2. **Волна 5-deep** — ручной аудит RPC через `pg_depend`:
   ```sql
   SELECT objid::regprocedure, refobjid::regclass
   FROM pg_depend
   WHERE objid = 'public.<fn>'::regprocedure;
   ```
3. **CI guard** — добавить порог 386 таблиц / 124 active edge fn в `.github/workflows/cleanup-metrics.yml` чтобы регрессия ловилась.

