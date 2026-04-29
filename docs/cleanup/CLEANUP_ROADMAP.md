# Cleanup Roadmap — myUNO 2026-Q2

**Источник правды:** этот документ. Каждая волна = 1–2 недели, серия PR ≤300 LOC.
**Baseline:** [`docs/audits/baseline-2026-04.md`](../audits/baseline-2026-04.md)
**Mode:** без заморозки фич. Cleanup идёт параллельно продуктовой работе (~16 недель вместо 8).

## Принципы
1. Не строить новое, пока не измерено старое.
2. Карантин (`archive/`), а не `rm`. Удаление — только через 2 недели после переноса.
3. Каждый PR попадает в одну из 8 разрешённых merge-категорий (см. `mem://index.md` Core).
4. Параллельные продуктовые фичи — ОК. Но cleanup-PR помечаются меткой `tech-debt`.
5. Master Taxonomy v1.0 — единственный судья для решений keep/drop по продуктовым модулям.

---

## Волна 0 — Baseline & инфраструктура измерений (3 дня)

**Статус:** in-progress

### Артефакты
- [x] `docs/audits/baseline-2026-04.md` — снимок метрик
- [ ] `scripts/audit-baseline.mjs` — переснимаемая метрика
- [ ] `.github/workflows/cleanup-metrics.yml` — knip + ts-prune + depcheck (report-only) + regression-guard
- [ ] `docs/audits/db-table-classification.md` — KEEP / MERGE / ARCHIVE / DROP по 405 таблицам
- [ ] `docs/audits/edge-functions-usage.md` — какие из 157 функций живые

### Выход
Все 5 файлов commited. Первый запуск CI зелёный.

---

## Волна 1 — Карантин мёртвого кода (1 неделя)

### Что убрать (в `archive/2026-Q2-quarantine/`)
- Файлы из knip "unused exports" (0 импортов)
- 7 файлов Old/V1/Legacy/Backup
- Edge functions без вызовов из `src/` и без cron — список из `edge-functions-usage.md`

### Что НЕ трогать
- Lifestyle apps (MuayThai/Scuba/Golf/Yacht/Wedding) — оставляем как есть (решение Pavel)

### Метрика выхода
- Файлов в `src/`: -15% (с 2 134 до ~1 815)
- Edge functions: -25% (с 157 до ~120)

---

## Волна 2 — Маршруты и Surfaces (1 неделя)

### Переделать
1. Разрезать `AnimatedRoutes.tsx` (50 KB) на 6 файлов по surface + public + operate
2. Lazy-load per surface (не per page) → -40% initial JS
3. Заменить **419 hardcoded `navigate('/...')`** на `APP_ROUTES`
4. Удалить дубль-маршруты (617 `<Route>` при 502 страницах)

### Дополнить
- В `routeMeta.ts` поле `surface: NavCluster` для каждого маршрута
- ESLint rule, запрещающий строки в `navigate(...)` и `<Link to="...">`

### Метрика выхода
- Initial bundle (gz): -30%
- 0 hardcoded route strings (lint error)
- `<Route>` ≤ 400

---

## Волна 3 — Контексты и провайдеры (3–4 дня)

### Переделать
- Слить `LanguageProvider` + `CurrencyProvider` + `LocationProvider` → `LocaleProvider`
- Lazy-mount: `GoogleMapsProvider`, `StorefrontProvider`, `LifeSituationProvider`
- Выбрать один из `ImpersonationProvider` / `PlatformViewAsProvider` (дублируются)
- `HintProvider`, `AuthSheetProvider`, `PrefetchProvider` → переоценить, многие → hook без context

### Метрика выхода
- Контекстов: 15 → ≤ 8
- Provider-mentions в `App.tsx`: 46 → ≤ 25
- TTI на главной: -15%

---

## Волна 4 — База данных (4 недели) — САМАЯ ВЫГОДНАЯ

### Фаза 1: классификация (3 дня)
- `db-table-classification.md` готов из В0 → разбить на PR по 20 таблиц

### Фаза 2: DROP пустых без references (2 недели)
Приоритет (по `baseline-2026-04.md`):
1. `capital_*` (5 таблиц, 0 used) — проверить references → drop
2. `platform_*` (4 таблицы, 0 used)
3. `concierge_*` (2 таблицы, 0 used)
4. `mc_*` (2 таблицы, 0 used)
5. `approval_*` (3 таблицы, 0 used)
6. `mcc_*` (11 пустых из 12) — marketing command center, проверить, есть ли план реактивации
7. `vendor_*` (11 пустых из 12)
8. `owner_*` (9 пустых из 10)
9. `crm_*` (18 пустых из 26)
10. `property_*` (24 пустых из 39) — осторожно, ядро SSOT

### Фаза 3: MERGE дублей (1 неделя)
- Привести к SSOT-памяти: `properties`, `listings`, `orders`, `ledger_entries`, `crm_contacts`
- Убедиться, что все 11+ marketplace verticals → в `public.listings`

### Фаза 4: RPC ревизия (3–4 дня)
- 432 функции → удалить unused (без caller'ов в коде и cron)

### Метрика выхода
- Таблиц: 405 → ≤ 150
- RPC: 432 → ≤ 200
- RLS-coverage: остаётся 100%

---

## Волна 5 — TypeScript strict + i18n (1.5 недели)

### TypeScript per-folder
Порядок (от критичного к некритичному):
1. `src/lib/payments/`, `src/lib/auth/`, `src/integrations/` → strict
2. `src/hooks/` → strict
3. `src/components/` → strict
4. `src/pages/` → strict (последним)

Метод: per-folder `tsconfig.json` с `extends` + `strict: true`. Шаблон в `docs/TYPESCRIPT_POLICY.md`.

### i18n
- БД-колонки `name_ru/name_en` → `name jsonb` (`{ru, en, th, zh}`) через миграцию
- Подключить `i18next` + `react-i18next`
- `useLanguage()` оставить как тонкий адаптер
- Готовность к TH/ZH без новых миграций

### Метрика выхода
- `strict: true` глобально, 0 ошибок
- `: any` ≤ 50 (только в адаптерах, явно помечены)
- i18n: language-agnostic schema

---

## Волна 6 — Тесты и качество (2 недели)

### Приоритет
1. Stripe webhook + ledger entries → integration tests (Vitest)
2. Booking engine (Order-First) → e2e (Playwright уже есть)
3. iCal sync → unit + integration
4. Pricing engine → unit
5. RLS-isolation suite → расширить `mc-hard-suite`

### Coverage gates
- CI: `--coverage` с порогом **30% сейчас → +10% каждый месяц** до 60%
- Sentry: тэги по surface

---

## Волна 7 — Документация и DevX (3–4 дня)

- Удалить устаревшие docs (`docs/audits/*` старше 6 мес → archive)
- ADR-формат для новых решений (`docs/adr/`)
- Runbook: «как добавить новую вертикаль» (5 шагов)
- Обновить `PROJECT.md` с финальными цифрами после В6

---

## Итоговые цели (через 16 недель)

| Метрика | Сейчас | Цель |
|---|---|---|
| Файлов в `src/` | 2 134 | ≤ 1 400 |
| Страниц | 502 | ≤ 350 |
| Edge functions | 157 | ≤ 90 |
| Таблиц БД | 405 | ≤ 150 |
| RPC-функций | 432 | ≤ 200 |
| Контекстов | 15 | ≤ 8 |
| Initial JS (gz) | ? | -40% |
| Test coverage | < 2% | 30% |
| TS strict | off | on (100%) |
| RLS coverage | 100% | 100% (держим) |
| `: any` | 745 | ≤ 50 |
| Hardcoded routes | 419 | 0 |

## Зависимости волн

```text
В0 (метрики) ──► В1 (карантин) ──► В2 (роуты) ──► В3 (провайдеры)
       │                                                  │
       └────────► В4 (БД, 4 недели, может идти параллельно В2/В3)
                          │
                          ▼
                    В5 (strict + i18n) ──► В6 (тесты) ──► В7 (docs)
```

**Параллелить можно:** В4 ⫴ В2/В3 (разные люди), В6 ⫴ В7.
**Нельзя пропускать:** В0 — без baseline нет доказательства прогресса.
