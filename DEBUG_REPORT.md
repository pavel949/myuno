# Отчёт дебага приложения myUNO

Дата: 2026-03-04

## 1. Результаты проверок

### TypeScript (`tsc --noEmit`)
- **Статус:** без ошибок
- Сборка типов проходит успешно.

### ESLint
- **Было:** 1429 проблем (1247 errors, 182 warnings)
- **Исправлено в рамках дебага:**
  - E2E: отключено правило `react-hooks/rules-of-hooks` для папок `e2e/` и `supabase/functions/` (в фикстурах Playwright используется `use`, что ESLint ошибочно считает хуком React).
  - `e2e/utils/simulationRunner.ts`: объявления `const` в `case` обёрнуты в блоки `{ }` (устранены `no-case-declarations`).
  - `src/components/auth/EmailVerificationBanner.tsx`: пустой `catch` заменён на комментарий (устранён `no-empty`).
  - `src/components/admin/MCMemberManager.tsx`: `let profiles` → `const profiles` с явным типом (устранён `prefer-const` и часть `no-explicit-any`).
  - `tailwind.config.ts`: `require("tailwindcss-animate")` заменён на ES-import (устранён `@typescript-eslint/no-require-imports`).
  - `supabase/functions/ota-scrape/index.ts`: убран лишний escape в regex `[^\)]` → `[^)]` (устранён `no-useless-escape`).

### Оставшиеся замечания ESLint (рекомендации)
- **@typescript-eslint/no-explicit-any** — много использований `any` в админке, каталоге, интейке, Supabase functions. Рекомендация: постепенно заменять на конкретные типы или `unknown`.
- **react-hooks/exhaustive-deps** — в ряде мест в зависимостях `useEffect`/`useCallback` не указаны все зависимости. Рекомендация: добавлять недостающие или явно отключать с комментарием, если это осознанное решение.
- **react-refresh/only-export-components** — в некоторых файлах экспортируются и компоненты, и константы/функции. Рекомендация: вынести не-компоненты в отдельные файлы для стабильного Fast Refresh.

---

## 2. Маршруты и ссылки

- Файл `src/lib/config/routes.ts` задаёт централизованный реестр маршрутов (APP_ROUTES).
- Маршруты в `AnimatedRoutes.tsx` согласованы с этим реестром (lazy-импорты из `pageRegistry.ts`).
- Проверенные ссылки в коде (`/auth`, `/contact`, `/terms`, `/refund-policy`, `/g-trust`, `/partners`, `/support`, `/discover`, `/bookings`, `/cart`, `/market/checkout`, `/mc/*`, `/vendor/*`, `/admin/*`) соответствуют задекларированным путям.
- **Рекомендация:** для новых страниц использовать константы из `APP_ROUTES` вместо хардкода строк (например, `navigate(APP_ROUTES.AUTH)` вместо `navigate('/auth')`), чтобы избежать опечаток и битых ссылок.

---

## 3. Потенциальные баги и риски

### Уже исправленные ранее (в рамках текущей сессии)
- Белый текст на белом фоне: исправлены PageHeader, LoadingSpinner, PartnerCTACard, глобальный Input и поля на `/auth`.
- Поиск: в полях поиска и на странице Auth явно задан `text-foreground` для вводимого текста.

### Рекомендации по устойчивости
- **Обработка ошибок:** в местах вызова API (Supabase, fetch) убедиться, что ошибки обрабатываются и при необходимости показываются пользователю (toast/сообщение).
- **Загрузка и пустые состояния:** для списков и карточек проверять `loading` и пустой массив, чтобы не обращаться к `data[0]` без проверки.
- **Роутинг:** страницы с динамическим `id` (например, `/property/:id`) должны обрабатывать отсутствие сущности (404 или редирект), если данные не найдены.

---

## 4. Производительность

- **Lazy-загрузка:** страницы подключаются через `React.lazy` и `pageRegistry`, что уменьшает начальный бандл.
- **Prefetch:** в `AnimatedRoutes` есть prefetch популярных маршрутов в `requestIdleCallback` (PropertyIndex, RestaurantsIndex, ExperiencesIndex, BeautySpaIndex).
- **Рекомендации:**
  - Крупные тяжёлые компоненты (таблицы, графики, редакторы) по возможности оборачивать в `React.lazy`.
  - Списки с большим количеством элементов рассмотреть для виртуализации (например, `@tanstack/react-virtual` уже в зависимостях).
  - Избегать тяжёлых вычислений в рендере без мемоизации (`useMemo`/`useCallback`) там, где это влияет на частые ре-рендеры.

---

## 5. Сборка

- `npm run build` после правок запускается (Tailwind с ES-import работает).
- Предупреждения Tailwind про «ambiguous» классы `ease-[cubic-bezier(...)]` не блокируют сборку; при желании их можно заменить на стандартные утилиты или экранировать по подсказке Tailwind.

---

## 6. Краткий чеклист следующих шагов

1. Постепенно убирать `any` в ключевых модулях (admin, catalog, intake).
2. Прогнать E2E-тесты после правок в `simulationRunner.ts` и фикстурах.
3. Проверить страницы с динамическими ID при несуществующем ID (404/redirect).
4. При необходимости ужесточить ESLint (например, включить `@typescript-eslint/no-explicit-any` как warning) и править по одному файлу.
