# Cleanup Progress — 2026-04-29

Snapshot после автономного прогона Волны 1 + 4.

## Метрики

| Метрика | Baseline (04-29 утро) | Текущая | Δ |
|---|---|---|---|
| Tables `public` | 405 | **387** | −18 |
| Edge functions (active) | 157 | **124** | −33 (в `_archive/`) |
| `personaLandings.ts` LOC | 1689 | 80 (барсель) + 27 модулей | сплит |
| Hardcoded `navigate('/')` | 419 | 419 | без изменений |
| `any` usage | 745 | 745 | без изменений |

## Выполнено

### Волна 1.A — Edge Functions Quarantine
- 33 orphan-функции перенесены в `supabase/functions/_archive/`
- 14-day observation (см. `_archive/README.md`)

### Волна 1.B — Modularization
- `src/content/landings/personaLandings.ts` сплит на 27 файлов в `personas/`
- Public API сохранён (`PERSONA_LANDINGS`, `LIVE_PERSONA_SLUGS`)

### Волна 4.A — DB Tier 1 (4 таблицы)
Удалены без рефов: `booking_scheduled_messages`, `clearview_projects`, `document_reminders`, `property_passport_events`.

### Волна 4.B — DB Tier 2 (14 таблиц, итерация 2)
Удалены пустые таблицы без frontend-рефов:
`airport_booking_addons`, `airport_passengers`, `booking_payments`,
`booking_vouchers`, `cohort_analytics`, `contact_disclosure_events`,
`crm_nurture_queue`, `crm_web_form_submissions`, `founder_daily_brief`,
`lifecycle_stage_history`, `masked_channels`, `offer_history`,
`outreach_messages`, `owner_reports`.

### Волна 4.B — Rollback (19 таблиц)
Первая попытка дропа `mcc_*`, `platform_*`, `vendor_*` была откачена
(таблицы активно используются UI). Восстановлены через миграцию,
с RLS только для `admin`.

## Отложено

- **Волна 1.C** — refactor 419 hardcoded routes → `APP_ROUTES`. Распределение: длинный хвост, ≤8 на файл, мало пользы от bulk-edit. Рекомендация: делать оппортунистически в продуктовых PR.
- **Волна 4.C** — 90+ оставшихся пустых таблиц с фронтенд-рефами. Требует UI-аудит для каждой (нужен ли модуль вообще).
- **Регрессия baseline** — числа `any` и `hardcoded routes` не изменились; CI guard продолжает работать на исходных порогах (745/419).

## Следующие шаги (рекомендация)

1. Волна 4.C — для каждой из ~90 таблиц с UI-рефом и 0 строк решить:
   - Tier A: модуль активен, ждём данные → KEEP
   - Tier B: модуль draft/неиспользуемый → DROP table + DROP UI files
2. Волна 5 — RPC/функции БД аудит (есть ли orphans).
3. Edge functions: после 14 дней наблюдения (после 2026-05-13) — финальное удаление архивированных.
