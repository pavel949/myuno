

User wants:
1. Объективная оценка блока «Недвижимость» по 10-15 параметрам (шкала 100).
2. План исправлений/улучшений/дебага.

Это **research + plan**. Не нужно ask_questions — задача чёткая. Соберу факты из БД и кода, потом сформирую таблицу оценок и приоритизированный backlog.

Что уже знаю из предыдущего аудита:
- БД: developers (40), property_projects (267), properties (32), resale_properties (3), project_units (50), nb_leads (3), floor_plans (1), property_documents (0).
- 90+ роутов real-estate.
- 5 P0 багов, 8 P1, 12 P2 уже идентифицированы в прошлом аудите.
- P3-P5 (микросайты, impersonation, SEO) уже частично реализованы.

Нужно дополнительно проверить:
- Свежие данные БД (изменилось ли что-то)
- Edge Functions для real-estate (newbuilds-search, property-*)
- Производительность роутов (lazy loading)
- Mobile vs Desktop разница
- RLS policies

План — чистый аудит-отчёт с оценками. Реализация = подготовить отчётный документ + backlog. Не требует кода в моменте — это диагностика, выводом будет markdown-документ. Сделаю это в default-режиме после approve.

Структура отчёта:
1. **Методология оценки** (что измеряли)
2. **Сводная таблица: 12 параметров × оценка/100 + комментарий**
3. **Детализация по каждому параметру** (что хорошо, что плохо, доказательства)
4. **Приоритизированный backlog** (P0/P1/P2 с estimated effort)
5. **Дебаг чек-лист** (что проверить вручную)

Параметры оценки (12):
1. Архитектура данных (схема БД, FK, RLS)
2. Архитектура роутов (структура URL, redirects)
3. UX desktop
4. UX mobile (375px)
5. Функционал застройщика (Developer Portal)
6. Функционал покупателя/арендатора
7. Функционал админа (модерация, impersonation)
8. Производительность (bundle, lazy loading, queries)
9. SEO + микросайты
10. Канон форм (consistency, validation)
11. Отчёты и аналитика
12. Связность с другими модулями (CRM, Capital, Booking)

После approve — запущу анализ, прогоню запросы к БД (READ), посмотрю edge logs, и сгенерирую структурированный markdown-отчёт в `/mnt/documents/real-estate-audit-v2.md` + создам tasks в task tracker для каждого P0/P1.

Без правок кода. Только отчёт + tasks.

# План: Аудит блока «Недвижимость» v2 + backlog

## Что сделаю

### Шаг 1 — Сбор фактов (READ-only)
- Свежий снимок БД: counts по `developers`, `property_projects`, `properties`, `resale_properties`, `project_units`, `nb_leads`, `floor_plans`, `property_documents`, `developer_users`, `developer_impersonation_log`.
- RLS policies для real-estate таблиц (`security--get_table_schema`).
- Edge Functions logs для `newbuilds-*`, `property-*` за последние 7 дней.
- Список real-estate роутов из `src/lib/config/routes.ts`.
- Анализ страниц: `/property/*`, `/newbuilds`, `/developer-portal/*`, `/admin/properties`, `/admin/developers`, `/admin/capital/*`.
- Проверка lazy-loading через `App.tsx` chunks.
- Mobile vs Desktop layout: проверю наличие отдельных `*Mobile.tsx` / `useIsDesktop()` веток.

### Шаг 2 — Оценка по 12 параметрам (шкала 100)
Каждый параметр получит:
- Оценку 0-100
- Что работает (✅)
- Что сломано / отсутствует (❌)
- Доказательство (файл/таблица/строка)

**12 параметров:**

| № | Параметр | Что меряем |
|---|---|---|
| 1 | Архитектура данных | Целостность схемы, FK, RLS, дубли таблиц |
| 2 | Архитектура роутов | Структура URL, redirects, дубликаты |
| 3 | UX Desktop | Sidebar, фильтры, плотность, навигация |
| 4 | UX Mobile (375px) | Адаптивность, bottom nav, sheet vs dialog |
| 5 | Developer Portal | Создание/редактирование проектов, юнитов, медиа |
| 6 | Buyer/Renter UX | Поиск, фильтры, детальная карточка, viewing request |
| 7 | Admin UX | Модерация, impersonation, claim flow |
| 8 | Производительность | Bundle size, lazy chunks, query count, кэш |
| 9 | SEO + Микросайты | meta tags, OG, slugs, sitemap, /p/:slug |
| 10 | Каноничность форм | Validation, бил-я RU/EN, draft auto-save |
| 11 | Отчёты и аналитика | KPI dashboard, экспорт PDF/CSV, графики |
| 12 | Связность модулей | CRM лиды, Capital investor flow, Booking, AI |

### Шаг 3 — Приоритизированный backlog
Структура: **P0 (блокеры)** → **P1 (критично)** → **P2 (улучшения)** → **P3 (nice to have)**

Для каждого пункта:
- ID, описание, файл/таблица, effort (1-8pt), risk (low/med/high)
- Acceptance criteria

### Шаг 4 — Дебаг чек-лист (manual QA)
20-30 пунктов для ручной проверки:
- «Создай проект как застройщик → проверь, что появилось в /newbuilds»
- «Открой /p/aria-villas → проверь meta tags в DevTools»
- «На 375px viewport открой /property → проверь, что filters в bottom sheet»
- и т.д.

### Шаг 5 — Артефакты
- `/mnt/documents/real-estate-audit-v2-2026-04-17.md` — полный отчёт (~30-40KB)
- Создам tasks в task tracker для каждого P0/P1 пункта

## Что НЕ войдёт в этот шаг
- Код-правки (только отчёт + tasks).
- Тестирование в браузере (только статический анализ + БД-данные).
- Storage files / auth.users миграция (отложено).

## Технические детали

**Используемые tools:**
- `supabase--read_query` — counts, sample rows, RLS check
- `supabase--edge_function_logs` — для real-estate функций
- `code--search_files` + `code--view` — карта роутов и компонентов
- `security--get_table_schema` — RLS аудит
- `task_tracking--create_task` — создание backlog items

**Формат отчёта:** Markdown с таблицами, без emoji в заголовках, semantic-ясно структурированный для последующей передачи в `code-reviewer` / `tech-lead-orchestrator`.

**Время выполнения:** ~5-8 минут чистой работы (БД-запросы + чтение файлов + генерация markdown).

