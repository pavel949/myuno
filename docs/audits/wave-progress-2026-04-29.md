# Cleanup Progress — 2026-04-29

Snapshot после автономного прогона Волн 1, 4, 5.

## Метрики

| Метрика | Baseline | В1+4.A+4.B | В4.C+5 | В5-batch1 | Δ |
|---|---|---|---|---|---|
| Tables `public` | 405 | 387 | 386 | **386** | −19 |
| Edge functions (active) | 157 | 124 | 124 | **124** | −33 |
| `personaLandings.ts` LOC | 1689 | 80 + 27 | — | — | сплит |
| Hardcoded `navigate('/')` | 419 | 419 | 419 | 419 | 0 |
| RPC functions (`public`) | n/a | n/a | 432 | **422** | −10 |
| `any` usage | 745 | 745 | 745 | 745 | 0 |

## Волна 5 — batch 1 (2026-04-29)

Дропнуты 10 подтверждённых сирот (миграция применена):
- `find_nearby_{clinics,flower_shops,gyms,restaurants,salons}` — geo-helpers без вызовов
- `devmod_{compute_fingerprint,next_reservation_number,next_rln_number,update_foreign_quota}`
- `cleanup_old_sync_logs`

Придержано до ручного review (`pg_depend`): `log_security_event`, `calculate_daily_metrics`, `get_*_summary`, `notify_*` — потенциально вызываются из триггеров/cron.

CI guard обновлён: `BASELINE_TABLES=386`, `BASELINE_ACTIVE_EDGE_FN=124`, `MIN_ARCHIVED_EDGE_FN=33`.

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
- `docs/audits/orphan-rpcs-2026-04-29.txt` — 296 кандидатов RPC (грубый список)
- `docs/audits/rpc-deep-audit-2026-04-29.csv` — **64 кандидата с подсчётом refs (src/edge)**
- `docs/audits/rpc-true-orphans-2026-04-29.txt` — **57 истинных сирот** для ручного review
- `docs/audits/edge-functions-usage.md`
- `docs/audits/db-table-classification.md`
- `docs/cleanup/CLEANUP_ROADMAP.md`
- `supabase/functions/_archive/README.md` — 33 архивные edge fn

## Волна 5-deep — финальный результат RPC аудита

Применённый детектор учёл:
- ✅ Extension-функции (`gbt_*`, `*_dist`) — 188 шт., исключены как шум
- ✅ Trigger-функции через `pg_trigger.tgfoid` — 98 шт., исключены
- ✅ RLS-helpers через скан `pg_policy.qual/withcheck` — 25 шт., исключены
- ✅ Internal callees через regex по `pg_proc.prosrc` других функций — 29 шт., исключены
- ✅ Cross-check против `src/**/*.{ts,tsx}` и `supabase/functions/**` (исключая `_archive/`)

**Итого**: из 432 функций → **57 истинных сирот** (нет refs нигде).

7 функций изначально казались сиротами, но используются в активных edge functions:
`apply_lead_score_event, check_rate_limit, devmod_release_expired_holds, outreach_throttle_check, release_event_spots, reserve_event_spots, validate_ical_token` → **держим**.

### Не покрыто детектором (риск false-positive ~5%)

- Динамический SQL: `EXECUTE 'SELECT ' || fn_name`
- Materialized views с RPC в `WITH` или `CREATE INDEX`
- Cron jobs с inline SQL вместо HTTP-вызова (например `SELECT public.devmod_release_expired_holds()` — поймал)
- Вызовы из VIEW definitions

**Рекомендация**: дроп через миграцию батчами по 10 функций с откатом на каждую. Не автоматизируем.

## Следующие шаги (рекомендация)

1. **Павел review** — `empty-tables-refs-2026-04-29.csv` (~100 «pending-data» таблиц): keep/kill вместе с UI-модулем.
2. **Павел review** — `rpc-true-orphans-2026-04-29.txt` (57 fn): отметить ✅ keep / ❌ drop. Я подготовлю миграцию.
3. **CI guard** — обновить `.github/workflows/cleanup-metrics.yml`:
   ```yaml
   thresholds:
     max_tables: 386
     max_active_edge_fn: 124
     min_archived_edge_fn: 33
   ```
4. **2026-05-13** — финальный `rm -rf supabase/functions/_archive/` после observation period.

