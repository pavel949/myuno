## Цель

После 5 волн чистки (удалено 15 edge-функций, миграции, рефактор `AppLayout`, `vite.config.ts`) — провести сквозную диагностику и убедиться, что приложение полностью работоспособно. Никаких новых фич — только проверки и точечные фиксы найденных регрессий.

## Что уже подтверждено в плане-моде

- TypeScript `tsc --noEmit` — **0 ошибок**
- `rg` по удалённым функциям (`ai-concierge`, `create-service-checkout`, `claude-chat`, `firecrawl-*`, `etagi-*`, `process-guest-messages`, `document-reminder-check`, `auto-social-publish`, `generate-report-pdf`, `generate-sitemap`, `remove-bouquet-backgrounds`, `rentals-united-sync`, `create-order`, `create-refund`) в `src/`, `supabase/functions/`, `scripts/` — **0 stale-ссылок**
- Dev-сервер отвечает на `/` и `/src/main.tsx` за ~10 ms
- `supabase/config.toml` содержит 72 блока `[functions.*]` — нужно сверить с реально присутствующими 157 функциями
- В репозитории есть Vitest (50+ test-файлов) и Playwright-сценарии в `e2e/`, но в `package.json` **нет npm-скриптов `test` / `test:e2e`** — поэтому E2E запустятся только через прямой вызов `npx`

## Объём диагностики

### 1. Статика и типы
- `npx tsc --noEmit` (повторный прогон, фиксируем 0 ошибок)
- `npm run lint` — собираем ESLint-предупреждения, чинить только новые/блокирующие
- `npx knip --no-progress` — найти dead exports/файлы, появившиеся после Wave 5
- `rg` повторно по списку удалённых функций + по удалённым таблицам из `docs/audits/2026-04-wave5-dead-code.md`

### 2. Конфиг Supabase
- Сравнить `supabase/config.toml` (72 `[functions.*]`) со списком директорий в `supabase/functions/` (157). Удалить осиротевшие блоки конфига для уже удалённых функций; пометить функции без блока (используют дефолты — это ок)
- `supabase--linter` — security/RLS-предупреждения
- `supabase--edge_function_logs` для последних cron-функций (`booking-reminders`, `ical-scheduled-sync`, `task-reminders`, `execute-campaign-rules`, `update-user-segments`, `post-order-autopilot`) — убедиться, что `Boot` / `Shutdown` без ошибок (по последнему срезу — чисто)
- `supabase--analytics_query` по `function_edge_logs` — выбрать все 5xx за последние 24 ч, сгруппировать по функции

### 3. Unit/Integration тесты (Vitest)
- `npx vitest run --reporter=basic` — полный прогон, особое внимание:
  - `src/test/layout/home-consumer-shell.test.tsx` (новый, должен быть зелёным)
  - `src/test/mc-hard-suite/*` (booking engine, RLS, ical, тарифы)
  - `src/test/catalog/taxonomy-coverage.test.ts`
  - `src/test/semantic/*`
- Чинить только реальные регрессии, связанные с Wave 5

### 4. Build sanity
- `npm run build` — production-сборка должна пройти без ошибок и без missing dynamic imports
- Проверить, что vite-плагин не ругается на удалённые модули (PWA / SW)

### 5. Smoke-тест ключевых роутов (через curl + `code--fetch_website`)
Маршруты, на которых концентрировались правки последних волн:
- `/` (consumer home — после фикса AppLayout)
- `/discover`
- `/auth`
- `/property`, `/property/rent`, `/property/buy`
- `/yachts`, `/transport`, `/flowers`, `/market`
- `/me`, `/wallet`
- `/mc` (workspace для owner)
- `/admin` (workspace для admin)

Проверяем: HTTP 200, наличие `<div id="root">`, отсутствие "App configuration error" в HTML, отсутствие 404 на `main.tsx`/`index.css`.

### 6. Playwright E2E (опционально, по флагу)
Если хватит времени и дев-сервер стабилен, запустить headless suite:
```
npx playwright install chromium --with-deps
PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test --config=playwright.ci.config.ts --project=chromium
```
Полный booking-flow требует тестового аккаунта (`test@myuno.app` / `TestPassword123!`) — если он не существует в проде-БД, помечаем тест как skipped, а не fail. Это не блокер диагностики.

### 7. Сводный отчёт
Записать результат в `docs/audits/2026-04-wave5-e2e-diagnostic.md`:
- Таблица: статика / типы / lint / vitest / build / smoke / supabase-логи — статус ✅/⚠️/❌
- Список найденных регрессий с приоритетом (P0 — блокер прод, P1 — UX, P2 — cosmetic)
- Список применённых фиксов в этой же сессии
- Открытые вопросы / рекомендации (например: "удалить блоки `[functions.X]` из config.toml", "добавить `npm run test` и `npm run test:e2e` в package.json")

## Технические детали

- **Порт dev-сервера**: `8080` (из `package.json`), Playwright-конфиг `playwright.ci.config.ts` использует тот же порт — несоответствия с `playwright.config.ts` (5173) обходим переменной `PLAYWRIGHT_BASE_URL`
- **Lovable Cloud статус**: проверить `cloud_status` перед запросами к БД, чтобы отличить "проект просыпается" от реальной ошибки
- **Браузер-инструменты НЕ используем** — для диагностики достаточно `curl`, `tsc`, `vitest`, `eslint`, `supabase--*`. Браузер только если пользователь явно попросит визуальной проверки
- **`src/integrations/supabase/types.ts`** — авто-генерируется, не трогаем
- **Финальные правки в коде** допустимы только для регрессий Wave 5 (например, осиротевший импорт удалённой функции). Любая значимая переработка — отдельный план

## Что НЕ входит

- Новые фичи, рефакторинг ради рефакторинга
- Удаление "подозрительных" таблиц из аудита (требует отдельного миграционного плана с бэкапом)
- Чистка `[functions.*]` в `config.toml` для функций, которые ещё существуют (только для уже удалённых)
- Полный Playwright-прогон в CI (только локальный smoke)

## Итог для пользователя

Один markdown-отчёт `docs/audits/2026-04-wave5-e2e-diagnostic.md` + перечень применённых фиксов + чёткий вердикт «всё чисто» / «найдено N регрессий, M пофикшено, K требуют решения».
