# Wave 5 — E2E Post-Cleanup Diagnostic (2026-04-26)

> Сквозная проверка работоспособности после 5 волн чистки (15 удалённых edge-функций, рефактор `AppLayout`, `vite.config.ts`, миграции).
> **Вердикт: ✅ APP HEALTHY.** Все Wave-5 регрессии отсутствуют. Найденные проблемы — pre-existing, не входят в scope.

---

## Сводка

| Проверка | Статус | Детали |
|---|---|---|
| TypeScript `tsc --noEmit` | ✅ | 0 ошибок |
| ESLint | ⚠️ | 8 errors / 1295 warnings — **все pre-existing**, не из Wave 5 |
| Stale-ref scan (15 удалённых функций) | ✅ | 0 ссылок в `src/`, `supabase/functions/`, `scripts/` |
| `supabase/config.toml` drift | 🛠 | Найдено и удалено 3 осиротевших блока (`fazwaz-discover-projects`, `fazwaz-scrape-project`, `stays-subscribe`) |
| Supabase linter | ⚠️ | 1 ERROR + 4 WARN — **pre-existing** (security definer view, search_path, public extensions, RLS true, public bucket listing) |
| Edge-function 5xx за 24 ч | ✅ | 0 ошибок |
| Cron-функции (последний запуск) | ✅ | `booking-reminders`, `ical-scheduled-sync`, `task-reminders`, `execute-campaign-rules`, `update-user-segments`, `post-order-autopilot` — Boot/Shutdown чистые |
| Vitest (полный прогон) | ⚠️ | 922/939 пройдено. 17 фейлов — все pre-existing, **0 связанных с Wave 5** |
| Vitest (Wave-5 critical: layout/mc-hard-suite/catalog) | ✅ | 119/119 |
| `npm run build` | ✅ | 57.7 s, 2196 PWA precache entries, без ошибок |
| Smoke-тест 14 роутов | ✅ | Все 200 OK, `<div id="root">` + `main.tsx` присутствуют, 0 "App configuration error" |
| Cold-start latency dev-сервера | ✅ | `/` = 10 ms, `/src/main.tsx` = 2 ms (после фикса `vite.config.ts`) |

---

## 1. Удалённые функции (Wave 5) — ссылок нет

`ai-concierge`, `auto-social-publish`, `claude-chat`, `create-order`, `create-refund`, `create-service-checkout`, `document-reminder-check`, `etagi-scrape-projects`, `firecrawl-map`, `firecrawl-search`, `generate-report-pdf`, `generate-sitemap`, `process-guest-messages`, `remove-bouquet-backgrounds`, `rentals-united-sync` — **0 stale references**.

## 2. Конфиг Supabase — синхронизирован

Удалены осиротевшие блоки `[functions.*]` для уже не существующих директорий:

- `fazwaz-discover-projects`
- `fazwaz-scrape-project`
- `stays-subscribe`

`supabase/config.toml`: 72 → 69 блоков. Остальные 88 функций используют дефолтную конфигурацию (это норма).

## 3. Smoke-тест маршрутов

```
200  /              200  /property/rent   200  /flowers
200  /discover      200  /property/buy    200  /market
200  /auth          200  /yachts          200  /me
200  /property      200  /transport       200  /wallet
                                          200  /mc
                                          200  /admin
```

Главное подтверждение: `/` отдаёт consumer-home без "App configuration error" — фикс из предыдущих волн (`vite.config.ts` + `AppLayout.tsx`) держится.

## 4. Pre-existing проблемы (НЕ Wave 5)

### Lint errors (8)
- `src/components/developer-portal/DeveloperDocumentUpload.tsx` — `no-useless-escape`, `prefer-const`
- `src/components/nav/BottomBar.tsx` — `react-hooks/rules-of-hooks` (3)
- `src/components/routing/NewbuildLegacyRedirects.tsx` — `react-hooks/rules-of-hooks` (2)
- `src/hooks/useDealPipelineStages.ts` — `react-hooks/rules-of-hooks`
- `src/lib/errorHandler.ts` — `react-hooks/rules-of-hooks`

### Vitest failures (17)
- `src/lib/nav/__tests__/clusterCatalog.test.ts` (3) — фильтрация кластеров для guest/developer
- `src/content/landings/__tests__/personaLandings.test.ts` (2) — счётчик landings (ожидается 26)
- `src/pages/landings/__tests__/PersonaLandingPage.test.tsx` (3) — `HelmetDispatcher` падает (тест-сетап без `<HelmetProvider>`)
- `src/pages/landings/__tests__/ClusterLandingPage.test.tsx` (6) — та же helmet-проблема
- `src/test/components/ErrorBoundary.test.tsx` (2)
- `src/test/semantic/validate-semantic.test.ts` (1)

Все эти файлы не трогались Wave-5; ошибки воспроизводятся на коммитах **до** чистки.

### Supabase linter
- 1 ERROR: Security Definer View
- 4 WARN: Function Search Path Mutable, Extension in Public, RLS Policy Always True, Public Bucket Allows Listing

Pre-existing. Решаются отдельной security-итерацией.

## 5. Применённые фиксы в этой сессии

- `supabase/config.toml`: удалены 3 осиротевших блока конфигурации.
- `docs/audits/2026-04-wave5-e2e-diagnostic.md`: создан отчёт.

## 6. Рекомендации

1. **`package.json`**: добавить скрипты `"test": "vitest run"` и `"test:e2e": "playwright test"` для удобства CI.
2. **Pre-existing test failures**: создать отдельную задачу — обернуть landing-тесты в `<HelmetProvider>` и обновить snapshot для `personaLandings.test.ts` (ожидание 26 vs реальное число).
3. **Supabase linter**: запланировать security-аудит по 5 пунктам.
4. **Lint hooks-rules errors**: 7 настоящих багов в hook-вызовах — рефакторинг через сезонную хардеинг-итерацию.
5. **Bundle**: `App-*.js` = 1.5 MB — рассмотреть code-splitting через `manualChunks` (предупреждение rollup).

## 7. Итог

После Wave 5 приложение полностью работоспособно: типы, билд, ключевые тесты и роуты — зелёные. Edge-функции не валятся в проде (24 ч без 5xx). Все обнаруженные проблемы существовали до чистки и не блокируют ни один пользовательский флоу.
