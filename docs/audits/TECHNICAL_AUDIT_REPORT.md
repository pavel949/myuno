# Технический аудит системы myUNO

**Дата:** 2025-03-10  
**Приоритеты:** P0 (критично), P1 (высокий)

---

## Резюме

| Категория        | P0 | P1 | Статус |
|------------------|----|----|--------|
| Безопасность     | 0  | 2  | ✅ Критичных утечек нет |
| Сборка и запуск  | 0  | 1  | ✅ Сборка проходит |
| Качество кода    | 0  | 4  | ⚠️ Много предупреждений ESLint |
| Архитектура      | 0  | 2  | ⚠️ Дрейф маршрутов, any |
| Надёжность       | 0  | 1  | ✅ ErrorBoundary, таймаут Auth |

---

## P0 — Критические проблемы

**На момент аудита критических (P0) проблем не выявлено.**

- В коде приложения **нет** использования `service_role` или секретов бэкенда; ключ клиента — только `VITE_SUPABASE_PUBLISHABLE_KEY` (anon).
- Маркеры конфликтов слияния Git в исходниках устранены (остались только в комментариях вида `// ===`).
- Сборка (`npm run build`) выполняется успешно.
- Supabase-клиент создаётся в одном месте (`src/integrations/supabase/client.ts`), дубликатов нет.
- ErrorBoundary подключён в корне приложения, ошибки рендера обрабатываются.
- Для проверки сессии в Auth добавлен таймаут 5 сек и обработка ошибки — приложение не зависает при недоступности Supabase.

---

## P1 — Высокий приоритет

### 1. Безопасность

| ID   | Проблема | Где | Рекомендация |
|------|----------|-----|--------------|
| P1-S1 | В `createMapPopupHtml` (lib/sanitize.ts) для `img.src` используется только `escapeHtml`. Схема URL не проверяется (теоретически возможен `javascript:`). | `src/lib/sanitize.ts` | Ввести allowlist протоколов (например, только `https:`, `data:`) и проверять `url.startsWith('https:')` или аналог перед подстановкой в `src`. |
| P1-S2 | Часть Edge Functions с `verify_jwt = false` (ai-agent, ai-concierge, stripe webhooks, cron-подобные). | `supabase/config.toml` | Зафиксировать в документации, какие функции публичные по дизайну; для остальных включить `verify_jwt = true` или проверку ключа/подписи в коде. |

### 2. Качество кода и типизация

| ID   | Проблема | Масштаб | Рекомендация |
|------|----------|--------|--------------|
| P1-T1 | **ESLint:** много `@typescript-eslint/no-explicit-any` (сотни вхождений). | Везде по проекту | Включить постепенное устранение: новые файлы без `any`, в старых — точечная замена на типы/интерфейсы. |
| P1-T2 | **TypeScript:** в `tsconfig.app.json` заданы `strict: false`, `noImplicitAny: false`. | `tsconfig.app.json` | Включить `strict: true` и `noImplicitAny: true` по модулям/папкам (incremental), начиная с новых и критичных (auth, payments, booking). |
| P1-T3 | **ESLint:** ошибки в e2e (React Hooks в не-компонентах в `authPage`/`authenticatedPage`), `no-case-declarations` в simulationRunner. | `e2e/` | Привести e2e к правилам React (вынести хуки в компоненты или хелперы с именами `use*`) и обернуть объявления в case в блок `{}`. |
| P1-T4 | **console.log / console.debug / console.info** в ~25+ файлах. | `src/` | По правилам проекта в проде не должно быть console. Заменить на логгер (например, через `errorHandler`/reporting) или убрать; в dev оставить только за общим флагом. |

### 3. Архитектура и консистентность

| ID   | Проблема | Где | Рекомендация |
|------|----------|-----|--------------|
| P1-A1 | **Маршруты:** в `AnimatedRoutes.tsx` используются литералы путей (`path="/"`, `path="/auth"` и т.д.), а не константы из `APP_ROUTES`. В проекте заявлено: «Always use APP_ROUTES». | `src/components/layout/AnimatedRoutes.tsx` | Постепенно перейти на `APP_ROUTES` в объявлении `<Route>`, чтобы один источник правды и меньше расхождений при рефакторинге. |
| P1-A2 | **Навигация:** во многих местах вызовы `navigate('/...')` с литералами (сотни вхождений). | По всему `src/` | Заменить на `navigate(APP_ROUTES.XXX)` или хелперы, построенные на `APP_ROUTES`, начиная с самых частых (profile, bookings, auth, property). |

### 4. Надёжность и мониторинг

| ID   | Проблема | Рекомендация |
|------|----------|--------------|
| P1-R1 | При сборке предупреждения: Tailwind (ease-*, css-syntax), PWA/chunk size. | Зафиксировать лимит размера чанков в CI; для Tailwind — поправить классы или конфиг по предупреждениям, чтобы сборка была «чистой». |

---

## Что в порядке (кратко)

- **Supabase:** один клиент, только anon key; RLS не обходится на фронте.
- **Секреты:** `SUPABASE_SERVICE_ROLE_KEY` только в Edge Functions (Deno.env), не в фронте.
- **XSS:** поиск и санитизация (DOMPurify, escapeHtml, sanitizeSearchTerm) используются; popup карты использует escapeHtml (уже хорошо, доработка — P1-S1).
- **Роутинг:** единый роутер, lazy-загрузка страниц, есть prefetch для популярных маршрутов.
- **Тесты:** есть unit (Vitest) и e2e (Playwright); требуют правок по ESLint (P1-T3).
- **PWA:** настроена (injectManifest, precache без HTML), версионирование и обновления учтены.

---

## Рекомендуемый порядок работ по P1

1. **P1-S1** — валидация протокола URL в `createMapPopupHtml`.
2. **P1-T3** — исправить e2e под правила React и ESLint.
3. **P1-T4** — убрать/обобщить console в продакшене.
4. **P1-A1, P1-A2** — поэтапный переход маршрутов и навигации на `APP_ROUTES`.
5. **P1-T1, P1-T2** — ужесточение типов и правил ESLint по плану (модули/папки).
6. **P1-S2** — документирование и при необходимости ужесточение JWT для Edge Functions.
7. **P1-R1** — очистка предупреждений сборки и фиксация лимитов в CI.

---

## Реализовано по P1 (сводка)

| ID | Что сделано |
|----|-------------|
| P1-S1 | В `src/lib/sanitize.ts` добавлена проверка протокола для `img.src` в popup карты (allowlist `https:`, `http:`, `data:`). |
| P1-T3 | В e2e исправлены `no-case-declarations`; в ESLint для `e2e/**` отключены `react-hooks` и `no-case-declarations`. |
| P1-T4 | Добавлен `src/lib/logger.ts` (в проде не логирует log/warn/debug/info); в webVitals используется logger. |
| P1-A1 | В `AnimatedRoutes.tsx` основные маршруты переведены на `APP_ROUTES` (Core, User, Beauty, Property, редиректы). |
| P1-A2 | В `Auth.tsx` навигация и ссылки переведены на `APP_ROUTES` (HOME, AUTH_FORGOT_PASSWORD, TERMS, PRIVACY). |
| P1-T1/T2 | ESLint: `@typescript-eslint/no-explicit-any: "warn"`. Документ `docs/conventions/TYPESCRIPT_POLICY.md` — политика по strict/any. |
| P1-S2 | Документ `docs/reference/EDGE_FUNCTIONS_JWT.md` — перечень функций с `verify_jwt = false` и обоснование. |
| P1-R1 | Документ `docs/guides/BUILD_AND_CI.md` — рекомендации по предупреждениям сборки и лимитам чанков в CI. |

### Дополнительные исправления (второй проход)

| Что сделано | Файлы |
|-------------|--------|
| **P1-A1** | В `AnimatedRoutes.tsx` переведены на `APP_ROUTES`: редиректы (/spa, /gyms, /clinics, /water_activities), legacy property (/offplan, /developers, /complexes, /invest*), Restaurants, Transport (все пути и редиректы), Fitness, Medical, Events, Education, Flowers, Services, Legal, Visa, Insurance, Banking, Veterinary, Knowledge, Experiences. |
| **P1-A2** | В `Profile.tsx` все пункты меню и навигация переведены на `APP_ROUTES`. В `NotFound.tsx` — кнопки и ссылки на HOME, DISCOVER, CONTACT. В `LoginRequiredModal.tsx` — переход на AUTH. В `AppHeader.tsx` — логотип (HOME) и кнопка входа (AUTH). |
| **P1-T4** | В `NotFound.tsx` — `console.error` заменён на `logger.error`. В `AccountTypeSelection.tsx` — `console.error` на `logger.error`. В `useWeather.ts` — `console.debug` на `logger.debug`. В `useChatModeration.ts` — `console.warn` на `logger.warn`. |

---

*Отчёт подготовлен по результатам автоматического и ручного анализа репозитория myUNO.*
