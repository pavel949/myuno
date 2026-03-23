# Технический аудит приложения myUNO

**Дата:** 23 марта 2026  
**Версия:** Pre-PMF  
**Цель:** детальная оценка архитектуры, качества кода, безопасности и производительности

---

## 1. Обзор проекта

| Метрика | Значение |
|---------|----------|
| Страницы (`src/pages/`) | ~380 |
| Компоненты (`src/components/`) | ~1 054 |
| Хуки (`src/hooks/`) | ~359 |
| Edge Functions | **129** |
| SQL-миграции | **505** |
| Unit-тесты (Vitest) | 14 файлов |
| E2E-тесты (Playwright) | ~18 файлов |

**Стек:** React 18, TypeScript, Vite 5, Tailwind CSS, Supabase (PostgreSQL + Edge Functions + Auth), React Query

---

## 2. Критические проблемы

### 2.1 CORS — небезопасная и несогласованная конфигурация

- **Только 2 функции** используют `getCorsHeaders` из `_shared/cors.ts`: `mc-onboarding-agent` и сам `cors.ts`
- **~100+ edge functions** используют жёстко заданный `Access-Control-Allow-Origin: "*"` — любой origin может вызывать эти API
- **Риск:** утечка данных, CSRF, подмена запросов с произвольных сайтов

**Рекомендация:** массово заменить inline CORS на импорт `getCorsHeaders(req)` во всех функциях, вызываемых из браузера.

### 2.2 TypeScript — отключён строгий режим

```json
// tsconfig.json
"noImplicitAny": false,
"strictNullChecks": false

// tsconfig.app.json  
"strict": false,
"noImplicitAny": false
```

- **~280+ файлов** содержат `any` или `as any`
- Много потенциальных runtime-ошибок (null/undefined) не отлавливаются на этапе компиляции

**Рекомендация:** включать `strict: true` пошагово (по модулям), начиная с новых файлов и критичных путей.

### 2.3 Discrepancy: CORS localhost vs Vite port

- `_shared/cors.ts` разрешает `http://localhost:5173` и `http://localhost:3000`
- Vite в проекте настроен на порт **8080** (`vite.config.ts`)
- Разработка на `localhost:8080` получает CORS-ошибки при вызове функций, использующих `getCorsHeaders`

**Рекомендация:** добавить `http://localhost:8080` в `ALLOWED_ORIGINS` при `NODE_ENV === "development"`.

### 2.4 Документация vs реализация — env-переменные

- В `CLAUDE.md` указано: `VITE_SUPABASE_ANON_KEY`
- В `client.ts` используется: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Возможная путаница при настройке окружения

---

## 3. Архитектура

### 3.1 Сильные стороны

- **Централизованные маршруты:** `APP_ROUTES` в `src/lib/config/routes.ts` — единый источник истины
- **Code splitting:** ~100 lazy-страниц через `pageRegistry.ts` и `lazyWithRetry`
- **Manual chunks:** разумное разбиение (vendor-react, vendor-radix, recharts, maps и т.д.)
- **Shared edge utilities:** `_shared/` — cors, auth-guard, internal-secret, supabase, stripe, whatsapp, rate-limit, ssrf-guard
- **RLS:** большое количество политик в миграциях

### 3.2 Слабые стороны

#### Смешение паттернов загрузки данных
- **React Query** — основной паттерн
- **`useSupabaseQuery`** — альтернатива на `useState`/`useEffect` без React Query
- Дублирование логики и несогласованность в обработке loading/error

#### Hardcoded routes
Найдены строковые пути вместо `APP_ROUTES`:
- `AnimatedRoutes.tsx`: `/transport/vehicle/`, `/experiences/`, `/restaurants/` и др.
- `VendorDashboard.tsx`: `/vendor/analytics`, `/vendor/bookings`
- `ChannelManagementCTA.tsx`: `/owner/full-management`

#### Дублирование путей в Git (Windows)
- Одинаковые файлы отображаются как `src\lib\untypedTables.ts` и `src/lib/untypedTables.ts`
- Рекомендуется `.gitattributes`: `* text=auto eol=lf` для нормализации

---

## 4. Безопасность

### 4.1 Edge Functions — авторизация

| Тип | Количество |
|-----|-------------|
| `requireAuth` | ~22 функции |
| `requireInternalSecret` | ~25 функций |
| Остальные | ~80+ (webhooks, anon, другие механизмы) |

- Много функций рассчитаны на webhook/cron и не требуют JWT
- Важно явно разделять: публичные, защищённые JWT, внутренние (secret)

### 4.2 RLS

- **`mc_can_access`** — используется в ~7 миграциях
- Рекомендуется периодический аудит политик для CRM/MC-таблиц:
  ```sql
  SELECT tablename, policyname, cmd, qual
  FROM pg_policies
  WHERE tablename IN ('crm_contacts','agent_deals','crm_tasks','crm_pipelines','crm_workflows')
  ORDER BY tablename;
  ```

### 4.3 Консольный вывод

- **11 файлов** в `src/` содержат `console.log`/`console.debug`/`console.info`
- Часть — в PWA, logger, sw.ts, Install — приемлемо для dev/debug
- Остальные лучше перевести на централизованный `logger` или удалить

---

## 5. Качество кода

### 5.1 Формы и валидация

- **react-hook-form** и **Zod** — в зависимостях
- Используются **локально**, не везде (немного компонентов: `UniversalLeadForm`, `EditProfile` и др.)
- Много форм без единого подхода к валидации и обработке ошибок

### 5.2 i18n

- Поддержка `ru`, `en`, `th` через `LanguageContext`
- Статические бандлы + опциональная таблица `translations` с кешем 1 час
- Есть риск строк только на одном языке при добавлении нового функционала

### 5.3 Error handling

- Корневой `ErrorBoundary` с билингвальными сообщениями
- Широкое использование `toast.success`/`toast.error` в хуках
- В ряде мутаций — тихий `catch()` без вывода пользователю

---

## 6. Производительность

### 6.1 Build

- Сборка проходит успешно
- **Tailwind:** предупреждения о неоднозначных классах `ease-[cubic-bezier(...)]` — можно заменить на escape-варианты
- **chunkSizeWarningLimit: 800** — крупные чанки (>800KB) помечены, но не блокируют сборку

### 6.2 Тяжёлые зависимости

Используются и вынесены в отдельные chunks:
- Recharts, Framer Motion
- @react-google-maps/api
- jspdf, exceljs
- react-hook-form, zod

Загрузка страниц оптимизирована за счёт lazy-роутов.

---

## 7. Тестирование

| Тип | Файлов | Охват |
|-----|--------|-------|
| Unit (Vitest) | 14 | Низкий — в основном lib, utils, feature flags |
| E2E (Playwright) | ~18 | Частичный — MC hard suite, storefront |

- Нет комплексных тестов для critical paths (checkout, CRM, owner flows)
- Рекомендуется постепенное добавление тестов для новых и наиболее важных сценариев

---

## 8. Приоритеты исправлений

### Высокий приоритет
1. **CORS:** все 107+ edge functions переведены на `getCorsHeaders(req)` вместо `*` ✓
2. **CORS localhost:** добавлен `http://localhost:8080` в `ALLOWED_ORIGINS` ✓
3. **Документация:** CLAUDE.md обновлён — `VITE_SUPABASE_PUBLISHABLE_KEY` (client.ts)

### Средний приоритет
4. Устранить hardcoded routes — использовать `APP_ROUTES`
5. Унифицировать паттерн данных: либо React Query повсеместно, либо чёткий критерий использования `useSupabaseQuery`
6. Убрать/перевести на logger лишние `console.log` в production-коде

### Низкий приоритет
7. Пошагово включать `strict` и `noImplicitAny` в TypeScript
8. Расширить unit/e2e тесты для критичных путей
9. Привести Tailwind-предупреждения к одному стилю (escape или замена классов)

---

## 9. Сводная оценка

| Критерий | Оценка | Комментарий |
|----------|--------|-------------|
| Архитектура | 7/10 | Хорошая структура, но смешение паттернов |
| Безопасность | 5/10 | CORS `*` — серьёзный риск, RLS в порядке |
| Качество кода | 6/10 | Нет strict TS, много `any`, не единообразные формы |
| Производительность | 8/10 | Lazy loading, manual chunks |
| Тестирование | 4/10 | Мало тестов, слабое покрытие critical flows |
| Поддерживаемость | 6/10 | Документация местами расходится с кодом |

**Общая оценка:** 6/10 — работоспособная основа, но есть критические точки (CORS, TS strictness), требующие внимания до масштабирования.
