# Волна 0 — Baseline & инфраструктура измерений

## Что уже измерено (live snapshot)

### Frontend
| Метрика | Значение | Заметка |
|---|---|---|
| Файлов `src/` (.ts/.tsx) | **2 134** | |
| LOC | **477 852** | вкл. `types.ts` 1 МБ авто-ген |
| Страниц | **502** | |
| Компонентов | **950** | |
| Хуков | **409** | |
| Контекстов | **15** | |
| Provider-упоминаний в `App.tsx` | **46** | |
| `<Route>` определений | **617** | при 502 страницах = много дублей |
| Файлов с Old/V1/Legacy/Backup в имени | **3** | хорошо |
| Hardcoded `navigate('/...')` | **419** | при заявленной zero-policy |
| `: any` / `as any` / `<any>` | **745** | блокер для TS strict |
| `console.log` | **2** | почти чисто |
| TODO/FIXME | **19** | приемлемо |

### Backend
- Edge functions: **157**
- SQL миграций: **661** (append-only)

### Database (Supabase primary)
| Метрика | Значение |
|---|---|
| Таблиц в `public` | **405** (а не 432 из аудита — уже почистили) |
| Без RLS | **0** — 100% покрытие |
| RLS-политик | **1 051** |
| Views | 27 |
| RPC-функций | 432 |

**Главное открытие — нагрузка БД:**
| Категория | Таблиц | Доля |
|---|---|---|
| Пустые (0 строк) | **219** | **54%** |
| 1–9 строк | 97 | 24% |
| 10–999 | 89 | 22% |
| ≥ 1 000 | **3** | < 1% |
| Всего строк во всей БД | **16 020** | pre-PMF |

→ 78% таблиц фактически не используются. **Реальная модель помещается в 50–80 таблиц.** Это меняет приоритет: В4 (БД) станет самой выгодной волной.

### Топ-10 жирных файлов (кандидаты на split)
1. `src/integrations/supabase/types.ts` 1.0 MB — авто-ген, не трогаем
2. `src/content/landings/personaLandings.ts` 161 KB
3. `src/content/landings/clusterLandings.ts` 81 KB
4. `src/lib/filterRegistry.ts` 67 KB
5. `src/pages/owner/ContactDetail.tsx` 64 KB
6. `src/pages/owner/OwnerRentalTerms.tsx` 62 KB
7. `src/lib/config/verticalCategorySchemas.ts` 60 KB
8. `src/pages/property/PropertyConsultation.tsx` 57 KB
9. `src/components/layout/AnimatedRoutes.tsx` 50 KB
10. `src/components/vendor/wizard/CanonicalListingWizard.tsx` 49 KB

### Что уже хорошо
- 100% RLS coverage
- `APP_ROUTES` уже существует
- Master Taxonomy v1.0 канонизирована
- Почти 0 console.log

### Худшее
1. 219 пустых таблиц
2. 419 hardcoded routes
3. 745 `any`
4. 15 контекстов / 46 Provider-mentions
5. 617 `<Route>` при 502 страницах
6. < 2% test coverage

---

## Что сделаю в Волне 0 (после approve)

### Файлы создать
1. **`docs/audits/baseline-2026-04.md`** — полный baseline-отчёт (всё выше + sections "что хорошо / что хуже")
2. **`docs/cleanup/CLEANUP_ROADMAP.md`** — финальный роадмап на 7 волн с критериями выхода и метриками каждой
3. **`scripts/audit-baseline.mjs`** — скрипт, который пересобирает все frontend-метрики одной командой `node scripts/audit-baseline.mjs`. Используется в начале каждой волны для замера прогресса. Выводит markdown-таблицу + JSON.
4. **`.github/workflows/cleanup-metrics.yml`** — CI workflow, report-only:
   - knip (уже настроен в `knip.json`) → артефакт
   - ts-prune → артефакт
   - depcheck → артефакт
   - запуск `audit-baseline.mjs` → артефакт
   - **fail только** при росте `any` или hardcoded routes vs baseline (regression guard)

### Дополнительно (в этой же волне)
5. **`docs/audits/db-table-classification.md`** — SQL-аудит всех 405 таблиц с классификацией KEEP / MERGE / ARCHIVE / DROP. Запросы:
   - таблицы с 0 строк И 0 references из кода (`rg <table_name> src/` = 0)
   - таблицы без FK из/в (изолированные)
   - дубли по структуре
6. **`docs/audits/edge-functions-usage.md`** — аудит 157 edge-функций: какие вызываются из `src/`, какие из cron, какие "сироты"
7. Обновить `mem://index.md` Core: добавить ссылку на CLEANUP_ROADMAP.md как операционный документ

### Что НЕ делаю в В0
- Никаких удалений файлов
- Никаких миграций БД
- Никаких изменений в роутинге, контекстах, типах
- Только измерения + инфраструктура для дальнейших волн

### Бандл
Чтобы измерить размер бандла, **не запускаю `npm run build` вручную** (запрещено директивой) — добавлю шаг `vite build --mode production` в `cleanup-metrics.yml` и сниму первое значение с CI.

---

## Технические детали

### `scripts/audit-baseline.mjs` — структура
```text
- count files in src by extension
- count pages, components, hooks, contexts
- count <Route>, navigate('/'), any usages, console.log
- list top-20 largest files
- list duplicates by name (Old/V1/Legacy)
- output: docs/audits/baseline-YYYY-MM-DD.md + .json
```

### CI workflow (report-only)
```text
on: [pull_request, schedule(weekly)]
jobs:
  audit:
    - npx knip --reporter json
    - npx ts-prune
    - npx depcheck
    - node scripts/audit-baseline.mjs
    - upload-artifact: audits/
  regression-guard:
    - compare any-count vs baseline.json
    - compare hardcoded-routes vs baseline.json
    - fail if either grew
```

### Merge gate напоминание
Каждый PR из В0 попадает в категорию **(c) tech debt** разрешённых merges из памяти. Никаких "refactor for cleanliness" без метрики.

---

## Следующие шаги после В0
- **В1** (карантин мёртвого кода) стартует только после того, как `db-table-classification.md` и `edge-functions-usage.md` готовы — это даст список целей для архивации
- Параллельно идут продуктовые фичи (без заморозки, по решению)

---

## Что нужно от тебя
Approve этот план — переключусь в build mode и за 1 заход создам все 7 файлов выше + сделаю SQL-классификацию таблиц через `supabase--read_query`. После этого В0 закрыта, и ты решаешь, когда стартуем В1.
