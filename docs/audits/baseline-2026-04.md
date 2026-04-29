# Cleanup Baseline — 2026-04-29

Стартовая точка для роадмапа `docs/cleanup/CLEANUP_ROADMAP.md`.
Все цифры — live-snapshot. Используются для сравнения после каждой волны.

## Frontend

| Метрика | Значение | Цель (8 нед) | Заметка |
|---|---|---|---|
| Файлов в `src/` (.ts/.tsx) | **2 134** | ≤ 1 400 | -34% |
| LOC в `src/` | **477 852** | ≤ 320 000 | вкл. `types.ts` 1 МБ авто-ген |
| Страниц `src/pages/` | **502** | ≤ 350 | |
| Компонентов `src/components/` | **950** | ≤ 650 | |
| Хуков `src/hooks/` | **409** | ≤ 280 | |
| Контекстов `src/contexts/` | **15** | ≤ 8 | -47% |
| Provider-упоминаний в `App.tsx` | **46** | ≤ 25 | |
| `<Route>` определений | **617** | ≤ 350 | при 502 страницах = много дублей |
| Файлов Old/V1/Legacy/Backup в `src/` | **3 кода** + 4 ассета | 0 | мало, хорошо |
| Hardcoded `navigate('/...')` | **419** | 0 | ESLint rule в В2 |
| `: any` / `as any` / `<any>` | **745** | < 50 | блокер для TS strict |
| `console.log` в `src/` | **2** | 0 | почти чисто |
| TODO/FIXME/HACK | **19** | tracked | приемлемо |

### Топ-10 жирных файлов
| Размер | Файл |
|---|---|
| 1.0 MB | `src/integrations/supabase/types.ts` (авто-ген, не трогаем) |
| 161 KB | `src/content/landings/personaLandings.ts` |
| 81 KB | `src/content/landings/clusterLandings.ts` |
| 67 KB | `src/lib/filterRegistry.ts` |
| 64 KB | `src/pages/owner/ContactDetail.tsx` |
| 62 KB | `src/pages/owner/OwnerRentalTerms.tsx` |
| 60 KB | `src/lib/config/verticalCategorySchemas.ts` |
| 57 KB | `src/pages/property/PropertyConsultation.tsx` |
| 50 KB | `src/components/layout/AnimatedRoutes.tsx` |
| 49 KB | `src/components/vendor/wizard/CanonicalListingWizard.tsx` |

## Backend / Edge

| Метрика | Значение | Цель | Заметка |
|---|---|---|---|
| Edge functions | **157** | ≤ 90 | аудит вызовов в `edge-functions-usage.md` |
| SQL миграций | **661** | n/a | append-only, не режем |

## Database (Supabase, primary `kakkwibljrjsawxgnupk`)

| Метрика | Значение |
|---|---|
| Таблиц в `public` | **405** (а не 432 из аудита — уже есть прогресс) |
| Таблиц без RLS | **0** — 100% покрытие |
| RLS-политик | **1 051** (~2.6 на таблицу) |
| Views | 27 |
| RPC-функций | **432** |
| Триггеров (не системных) | 285 |

### Распределение таблиц по нагрузке (КРИТИЧНО)

| Категория | Таблиц | Доля |
|---|---|---|
| **Пустые (0 строк)** | **219** | **54%** |
| Tiny (1–9 строк) | 97 | 24% |
| Small (10–999) | 89 | 22% |
| Large (≥ 1 000) | **3** | < 1% |
| **Итого строк во всей БД** | **16 020** | pre-PMF |

→ 78% таблиц фактически не используются. Реальная боевая модель помещается в **50–80 таблиц**. **В4 (БД) — самая выгодная волна.**

### Топ-таблицы по нагрузке (живой production)

| Rows | Table |
|---|---|
| 5 204 | `property_activity_log` |
| 1 478 | `calendar_sync_logs` |
| 1 102 | `property_operational_tasks` |
| 693 | `property_financials` |
| 609 | `analytics_events` |
| 500 | `listings` |
| 406 | `lookup_values` |
| 391 | `catalog_life_map` |
| 386 | `crm_contacts` |
| 349 | `contact_identities` |
| 283 | `booking_notifications_log` |
| 266 | `property_projects` |
| 148 | `notifications` |
| 124 | `marketplace_products` |
| 113 | `orders` |
| 87 | `ledger_entries` |

→ Подтверждается SSOT-память: `properties`, `listings`, `orders`, `ledger_entries`, `crm_contacts` — реальные ядра.

### Распределение пустых таблиц по префиксу (сюда метить DROP)

| Префикс | Всего | Пустых | Используется |
|---|---|---|---|
| `property_*` | 39 | 24 | 15 |
| `crm_*` | 26 | 18 | 8 |
| `user_*` | 18 | 10 | 8 |
| `mcc_*` | 12 | 11 | 1 |
| `vendor_*` | 12 | 11 | 1 |
| `booking_*` | 10 | 7 | 3 |
| `owner_*` | 10 | 9 | 1 |
| `team_*` | 10 | 6 | 4 |
| `marketplace_*` | 10 | 2 | 8 |
| `capital_*` | 5 | 5 | **0** |
| `platform_*` | 4 | 4 | **0** |
| `concierge_*` | 2 | 2 | **0** |
| `mc_*` | 2 | 2 | **0** |

→ Кандидаты на drop в один заход (0 used): `capital_*`, `platform_*`, `concierge_*`, `mc_*`, `approval_*`. Перед drop — проверить references в коде.

## Tests

| Метрика | Значение | Цель | Заметка |
|---|---|---|---|
| Test файлов | **48** | 200+ | покрытие < 2% |
| TypeScript strict | **off** | on | по папкам в В5 |

## Деплой / окружение

- 1 БД (production) для local + preview + prod
- node_modules: 519 MB
- Bundle size: не измерен (CI замерит при первом запуске `cleanup-metrics.yml`)

## Что уже хорошо
- 100% RLS coverage (1 051 политика на 405 таблиц)
- 0 console.log в src
- `APP_ROUTES` уже существует
- Master Taxonomy v1.0 канонизирована
- 7 файлов Old/V1/Legacy — почти чисто
- Аудит уже снизил БД с 432 → 405 таблиц

## Худшие 6 проблем
1. **219 пустых таблиц БД** — главный источник энтропии
2. **419 hardcoded route strings** — нарушение собственного правила
3. **745 `any`** — блокер TS strict
4. **15 контекстов / 46 Provider-упоминаний** в App.tsx
5. **617 `<Route>` при 502 страницах** — дубли и redirects
6. **< 2% test coverage** при 432 RPC

## Snapshot info
- Date: 2026-04-29
- Branch: `pavel/wip-current-version-20260318`
- Method: `node scripts/audit-baseline.mjs` (записывается в этой же волне)
