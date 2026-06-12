## Цель
1. Автоматизировать обновление `official_news` (cron каждые 4 часа).
2. Добавить русские переводы заголовка и summary через Lovable AI Gateway (Gemini Flash) — отображать их в UI при `language === 'ru'`.

## Изменения

### 1. БД (миграция)
Добавить колонки в `public.official_news`:
- `title_ru text` — перевод заголовка
- `summary_ru text` — перевод summary
- `translated_at timestamptz` — метка успешного перевода (для идемпотентности)

Индекс не нужен — выборка остаётся по `published_at`.

### 2. Edge-функция `fetch-official-news` (доработка)
После upsert строк — батч-перевод тех записей, где `title_ru IS NULL`:
- Один запрос на источник через Lovable AI (`https://ai.gateway.lovable.dev/v1/chat/completions`, модель `google/gemini-2.5-flash`).
- Системный промпт: «Translate Thailand official news headlines and summaries to Russian. Preserve proper names, return JSON array `[{i, title_ru, summary_ru}]`».
- Лимит: до 20 непереведённых записей за вызов (защита от перегруза).
- Обработка `429`/`402` от AI Gateway: лог + продолжить (перевод докатится в следующий cron).

Использует уже доступный `LOVABLE_API_KEY` (есть в среде Edge Functions автоматически).

### 3. Cron (через `supabase--insert`, не миграция — содержит anon key)
```sql
select cron.schedule(
  'fetch-official-news-every-4h',
  '0 */4 * * *',
  $$ select net.http_post(
      url := 'https://kakkwibljrjsawxgnupk.supabase.co/functions/v1/fetch-official-news',
      headers := '{"Content-Type":"application/json","apikey":"<anon>"}'::jsonb,
      body := '{}'::jsonb
  ); $$
);
```
Включить расширения `pg_cron`, `pg_net` если ещё не включены.

### 4. Фронт
- `useOfficialNews.ts` — добавить в select `title_ru, summary_ru`.
- `OfficialNews.tsx` и `OfficialNewsPage.tsx` — рендерить `isRu && n.title_ru ? n.title_ru : n.title` (то же для summary). Без изменений в дизайне.

### 5. Типы
После миграции Supabase авто-регенерирует `types.ts` — отдельных правок не нужно.

## Что не делаем (вне scope)
- Не трогаем дизайн карточек.
- Не добавляем админ-страницу управления cron'ом — есть стандартный мониторинг через `cron.job_run_details`.
- Не делаем RU-кастомные источники (РИА/ТАСС) — задача была про официальные тайские.

## Acceptance
- Cron виден в `cron.job` и срабатывает (проверим вручную через `select cron.run_job`).
- После ручного запуска edge-функции у новых записей появляются `title_ru`/`summary_ru`.
- На главной при RU-локали заголовки отображаются по-русски, на EN — как прежде.