# Phase B — Code quality & debt (implemented)

## B1 — Strict TypeScript (incremental)

- **Глобальный `strictNullChecks`** для всего `src/` отложен: даёт тысячи ошибок; включайте поэтапно.
- **`tsconfig.strict-null.json`** — отдельная проверка с `strictNullChecks: true` только для `src/lib/env.ts`.
- **Скрипт:** `npm run typecheck:strict-null` — запускайте локально или в CI при расширении списка файлов.
- **Полный проект:** `npm run typecheck` — `tsc -p tsconfig.app.json --noEmit` (без strict; можно подключить в CI после устранения ошибок).

## B2 — ESLint

- Для **`src/hooks/**`** и **`src/lib/**`** включено **`no-console`: `warn`** (исключения: `logger.ts`, `errorHandler.ts`, `finance/__test_run__.ts`).
- Страницы и компоненты вне этих папок — по-прежнему без глобального `no-console` (следующая волна миграции).

## B3 — Logger

- Скрипт **`scripts/migrate-console-to-logger.mjs`** заменил `console.*` на `logger.*` в **hooks** и **lib** (41 файл), кроме исключений выше.
- Повторный запуск безопасен (файлы без `console` пропускаются).

## B4 — Конфиг URL

- **`src/lib/config/publicUrls.ts`** — `PUBLIC_URLS.APP_ORIGIN`, хелпер `appUrl(path)`.
- Реэкспорт: `import { ... } from '@/lib/config'` или `@/lib/config/publicUrls`.

## Следующие шаги

1. Мигрировать `console` в `src/pages`, `src/components` на `logger` пакетами.
2. Расширить `tsconfig.strict-null.json` новыми файлами после исправления nullability.
3. Включить `npm run typecheck` в CI при зелёном `tsc` на всём приложении.
