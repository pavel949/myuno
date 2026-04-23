

# Аудит платформы myUNO на соответствие каноническим документам

## Цель

Проверить кодовую базу против всех 10 канонических документов (`docs/canonical/01–10`) + архитектурных правил (`architecture/ARCHITECTURE_V2.md §13`) и выдать отчёт со списком расхождений по приоритету.

## Объём проверок (по документам)

| # | Документ | Что проверяю в коде | Артефакты проверки |
|---|----------|---------------------|--------------------|
| 01 | segmentation-framework | `profiles.roles_stack`, `primary_role`, lifecycle/role/cluster теги в `src/lib/personas/`, CRM-схема | SQL select по `profiles`, поиск `lifecycle_phase`, `persona_*` |
| 02 | service-catalogue-v2 | 16 категорий × 230 услуг — сверка с `src/lib/taxonomies/`, `lookup_types`, lifecycle/role-теги в БД | SQL по `lookup_values`, обход `src/content/landings/` |
| 03 | tone-of-voice | Запрещённые слова §14 + Tone в `src/i18n/{ru,en,uiStrings}.ts`, в DB-content (cms-страницы) | grep по UI + `validate-semantic.mjs` + ESLint sweep |
| 04 | implementation-protocol | Процессные правила (M-вехи, additive, audit-before-change) — сверка с `CHANGELOG.md` и наличием M6/M7d/M7e/M9.6 заделов | чтение CHANGELOG + audits/ |
| 05 | visual-design-system | Hex-литералы вне `src/styles/tokens.css`, шрифты (Golos/DM Sans/JetBrains/Playfair), 44px touch-targets, кластерные цвета | regex `#[0-9a-f]{3,6}` по `src/**`, обход tailwind.config |
| 06 | clearview-methodology | 8 категорий × веса, AAA–BB шкала, 5-step maturity в `src/pages/clearview/`, RPC и таблицах ratings | сверка с `mem://strategy/clearview-methodology-v3` |
| 07 | information-architecture | URL-структура, отсутствие новых top-level routes, redirects (offplan→property/offplan), субдомены | обход `src/App.tsx`, `APP_ROUTES`, `vercel.json` |
| 08 | ai-prompts-library | Промпты Edge Functions vs канон (concierge, ClearView draft, Tax Advisor, support) | обход `supabase/functions/*/index.ts` system prompts |
| 09 | data-schema | Naming conventions, RLS на всех публикуемых таблицах, FK, enums, отсутствие триггеров в reserved schemas | `supabase--linter`, `supabase--read_query` по `pg_policies` |
| 10 | semantic-core | `validate-semantic.mjs` + 4 слоя guard (ESLint, exact, fuzzy, CI), schema.org, sitemap, meta-templates | прогон `npm run validate:semantic` (по результатам — список нарушений) |
| Arch | ARCHITECTURE_V2 §13 hard rules | Новые top-level routes, новые shells, hex-цвета, cross-cluster imports, money-moves без аудит-маркера, feature_flags | grep по `src/App.tsx`, `MiniAppLayout`, `ledger_entries` usage |

## Методика

Для каждого документа:
1. **Прочитать канон** (full read MD-файла).
2. **Снять текущее состояние** в коде/БД (search_files / read_query / linter).
3. **Сопоставить** правило ↔ реализация.
4. **Зафиксировать** в матрице: `Pass / Warn / Fail` + конкретный файл/таблица + цитата из канона.

## Deliverable

Один сводный документ `docs/canonical/audits/M10-full-canon-conformance-2026-04-23.md` со структурой:

```
1. Executive summary
   - Overall conformance: X/10 docs green
   - Critical violations: N (block release)
   - Warnings: M (cleanup backlog)

2. Per-document matrix (01..10 + Arch)
   ┌────┬─────────────┬────────┬──────────────┬────────┐
   │ #  │ Rule        │ Status │ Evidence     │ Fix    │
   └────┴─────────────┴────────┴──────────────┴────────┘

3. Critical findings (must-fix before next release)
4. Warnings (M11 backlog)
5. Recommended remediation milestones (M11.x)
6. Appendix: raw outputs (validate-semantic, supabase linter, ESLint stats)
```

Плюс: bump канона до **v1.20.0** + запись в `CHANGELOG.md` + bump app до **3.52.0**.

## Технические шаги (default mode)

1. Прочитать каждый из 10 MD-файлов целиком.
2. Запустить `npm run validate:semantic -- --verbose` и `npm run lint` — собрать счётчики.
3. Запросить `supabase--linter` и `supabase--read_query` по `pg_policies`, `pg_tables`, `lookup_values`, `profiles`, `clearview_*`.
4. Grep-аудит:
   - hex literals: `#[0-9a-fA-F]{3,8}\b` по `src/**` исключая `tokens.css`/`tailwind.config.ts`/`design-system/`
   - cross-cluster imports: `from '@/pages/(arrive|live|manage|invest|legal|build)/.+/.+/'` из чужих кластеров
   - hardcoded routes: строковые `'/...'` мимо `APP_ROUTES`
   - `noscript` в `<head>` (`index.html`)
   - money-move screens без `tx_id` маркера
5. Сверить `supabase/functions/*/index.ts` system prompts с `08-ai-prompts-library.md`.
6. Скомпоновать отчёт, обновить CHANGELOG/version.

## Что НЕ входит в этот pass

- Автоматическое исправление найденных нарушений — только инвентаризация.
- Контентный sweep DB (М7d) и alt-text (M7e) — только подсчёт остатка.
- Полный E2E-прогон Playwright — только наличие/конфигурация.

После approve — переключаюсь в default mode, читаю все 10 канонов, выполняю шаги 1–6 и публикую отчёт.

