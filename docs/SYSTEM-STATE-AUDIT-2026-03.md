# Аудит текущего состояния системы — myUNO (март 2026)

**Дата снимка:** 2026-03-23  
**Цель:** зафиксировать фактическое состояние репозитория после Phase A/B (качество, CI, логирование).

---

## 1. Резюме

| Область | Состояние | Комментарий |
|--------|-----------|-------------|
| **Сборка** | ✅ В CI | `npm run lint`, `typecheck`, `test:run`, `build` на push/PR в `main`/`master` |
| **TypeScript** | ⚠️ Смягчённый режим | `strict: false`, `noImplicitAny: false` в `tsconfig.app.json`; отдельный `typecheck:strict-null` только для узкого набора |
| **Логирование (frontend)** | ✅ Централизовано | Прямые `console.*` в `src/**/*.ts(x)` — только в разрешённых местах (см. §4) |
| **Тесты** | ⚠️ Базовый уровень | Vitest в CI; ~14 unit-файлов под `src/`; e2e smoke отдельным workflow |
| **Документация качества** | ✅ Есть | Roadmap, ADR, ENV, CORS, ownership — см. `docs/` и корневые `*-AUDIT*.md` |
| **Зависимости** | ⚠️ Регулярный аудит | Dependabot включён; `npm audit` периодически (см. `docs/SECURITY-NPM-AUDIT.md`) |

---

## 2. CI / автоматизация

| Workflow | Триггер | Шаги |
|----------|---------|------|
| `.github/workflows/ci.yml` | push/PR → `main`, `master` | `npm ci` → `lint` → `typecheck` → `test:run` → `build` |
| `.github/workflows/e2e-smoke.yml` | (по конфигу репо) | smoke Playwright |
| `.github/dependabot.yml` | расписание | npm + GitHub Actions |

**Env в CI:** плейсхолдеры `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — сборка не требует реальных секретов.

**В CI:** `npm run typecheck` (`tsc -p tsconfig.app.json --noEmit`). Отдельно `typecheck:strict-null` — по-прежнему только для узкого набора файлов.

---

## 3. Скрипты `package.json` (ключевые)

| Скрипт | Назначение |
|--------|------------|
| `lint` | ESLint по репозиторию |
| `typecheck` | `tsc -p tsconfig.app.json --noEmit` |
| `typecheck:strict-null` | строгая проверка null для выбранных файлов (`tsconfig.strict-null.json`) |
| `test` / `test:run` | Vitest (watch / один прогон) |
| `test:e2e` / `test:e2e:smoke` | Playwright |

**Dev-сервер:** Vite порт **8080** (`vite.config.ts`).

---

## 4. Логирование и `console`

**Политика:** в прикладном коде предпочтительно `logger` из `@/lib/logger`; прямые вызовы `console.log|warn|error|info|debug` в `src` ограничены:

| Файл | Назначение |
|------|------------|
| `src/lib/logger.ts` | реализация логгера |
| `src/lib/errorHandler.ts` | ссылки на `console.error` / `warn` / `log` как целевой sink |
| `src/sw.ts` | service worker (отдельный контекст) |
| `src/lib/finance/__test_run__.ts` | ручной/диагностический прогон |

ESLint `no-console` настроен инкрементально (hooks, lib, pages, components, contexts — по правилам проекта).

---

## 5. Тестирование

- **Unit / integration (Vitest):** файлы в `src/test/`, `src/lib/__tests__/`, `src/test/mc-hard-suite/` и др. — **~14** файлов `*.test.*` / `*.spec.*` под `src/`.
- **E2E:** Playwright, smoke в `e2e/tests/smoke/`.

**Пробел:** покрытие критичных MC/CRM потоков (контакты, сделки) должно расти по мере стабилизации спринта из `CLAUDE.md`.

---

## 6. TypeScript и типобезопасность

- Основное приложение: **`strict: false`** — технический долг; миграция на `strict` поэтапная.
- **`strictNullChecks`** для всего `src` **не** включены; узкий `tsconfig.strict-null.json` — для точечных модулей (например `env`).

---

## 7. Безопасность и конфигурация

- Публичные переменные: валидация через `src/lib/env.ts` + вызов при старте в `main.tsx`.
- Публичные URL: `src/lib/config/publicUrls.ts`.
- Секреты только в Supabase/Vercel — не в репозитории.

---

## 8. Рекомендуемые следующие шаги (приоритет)

1. **Продукт / спринт:** закрыть известные баги CRM/MC из `CLAUDE.md` (контакты, сохранение сделки, скролл формы).
2. **CI:** при зелёном полном `tsc` — добавить `typecheck` в `ci.yml`.
3. **Тесты:** happy-path для контактов и сделки в e2e или интеграционных тестах.
4. **TS:** постепенное ужесточение — `noImplicitAny` → `strict` по модулям.

---

## 9. Связанные документы

- `TECHNICAL-AUDIT-2026.md` — технический аудит (если обновлялся параллельно)
- `PLATFORM-QUALITY-ROADMAP-90.md` — дорожная карта качества
- `docs/ENV.md`, `docs/CORS-POLICY.md`, `docs/MODULE-OWNERSHIP.md`
- `scripts/migrate-console-to-logger.mjs` — миграция `console` → `logger`

---

*Документ предназначен для быстрого онбординга и синхронизации состояния; при значимых изменениях CI/TS/логирования обновить разделы 2–6.*
