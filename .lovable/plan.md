## Текущее состояние

- В репозитории есть `supabase/migrations/20260511120000_relocation_articles_and_plans.sql` с корректным DDL: таблицы, RLS, политики, индексы, триггеры `updated_at`.
- В реальной БД (`kakkwibljrjsawxgnupk`) ни `public.relocation_articles`, ни `public.relocation_plans` **не существуют** — миграция никогда не применялась.
- Поэтому в `src/integrations/supabase/types.ts` их тоже нет → пришлось обходить `as never`/`(supabase as any)`.
- Из-за этого:
  - `useRelocationArticles` молча падает на `error` и всегда отдаёт bundled-сиды (13 статей из `src/data/relocationArticles.seed.ts`) — пользователь думает, что данные есть, но БД пуста.
  - `useRelocationPlan` не может сохранить план в БД — упсерты возвращают ошибку, которая игнорируется, и план живёт только в `localStorage`. При смене устройства/браузера прогресс теряется.

Роли `admin`, `uno_team`, `staff` уже присутствуют в enum `app_role` — политики из миграции применятся без правок.

## Что нужно сделать

### Шаг 1 — Применить миграцию схемы (один SQL-запуск)

Содержимое — ровно то, что лежит в `20260511120000_relocation_articles_and_plans.sql`:

**`public.relocation_articles`**
- Поля: `slug` (UNIQUE), `category`, `title_en/ru`, `summary_en/ru`, `content_en/ru`, `related_route`, `sort_order`, `is_published` (default true), `created_at/updated_at`.
- Индексы: `idx_relocation_articles_category`, partial `idx_relocation_articles_published WHERE is_published = true`.
- RLS ON.
  - SELECT: anyone, если `is_published = true`.
  - ALL: пользователи с ролью `admin` / `uno_team` / `staff`.
- Триггер `update_relocation_articles_updated_at`.

**`public.relocation_plans`**
- Поля: `user_id` → `auth.users(id) ON DELETE CASCADE` (UNIQUE), `quiz_answers` jsonb, `steps` jsonb, `created_at/updated_at`.
- Индекс: `idx_relocation_plans_user`.
- RLS ON, политики per-user (SELECT/INSERT/UPDATE/DELETE через `auth.uid() = user_id`).
- Триггер `update_relocation_plans_updated_at`.

### Шаг 2 — Засеять статьи из bundled-сидов

13 статей из `src/data/relocationArticles.seed.ts` залить в `relocation_articles` через `INSERT … ON CONFLICT (slug) DO UPDATE` (идемпотентно). Так главная страница `/relocate` сразу покажет реальные данные из БД, а не fallback.

### Шаг 3 — Обновить frontend под честные типы

После применения миграции запустить регенерацию типов Supabase (автоматически по триггеру Lovable Cloud). Затем:
- Убрать `as never` в `src/hooks/useRelocationArticles.ts` (строки 39, 55).
- Убрать `(supabase as any)` и `as never` в `src/hooks/useRelocationPlan.ts` (строки 46, 69).
- В `useRelocationPlan` перестать молча игнорировать ошибки апсерта — пробрасывать через toast (sonner), чтобы пользователь знал, если sync не сработал.

### Шаг 4 — Проверка

- `SELECT count(*) FROM relocation_articles WHERE is_published = true` → 13.
- Залогинившись, заполнить квиз → перезагрузить страницу → план подгружается из БД.
- Проверить, что неавторизованный юзер видит статьи, но НЕ видит чужие планы (RLS).

## Что НЕ делаем

- Не меняем структуру таблиц / поля / типы — миграция уже подписана и хорошо спроектирована.
- Не трогаем сиды как fallback — они остаются на случай сетевой ошибки.
- Не добавляем edit-UI для статей в этом плане (админка статей — отдельная задача).

## Риски

- Минимальные: таблицы новые, конфликтов с существующими данными нет.
- `ON DELETE CASCADE` от `auth.users` корректен — план должен удаляться вместе с юзером.

## Рекомендую

Идти всеми тремя шагами сразу (миграция + сид + чистка типов в хуках). Применять только Шаг 1 без сида — даст пустую страницу `/relocate` для неавторизованных, пока контент не зальют вручную; чистка `as never` без миграции — оставит TypeScript-ложь.
