

## Импорт новостроек Этажи Пхукет

### Что будет сделано

Создание Edge Function `etagi-scrape-projects`, которая:
1. Парсит раздел новостроек `phuket.etagi.com/zastr/` через Firecrawl
2. Извлекает данные по каждому ЖК (название, адрес, цены, сроки сдачи, планировки)
3. Скачивает фото с `cdn.esoft.digital` в Supabase Storage (`property-images/etagi/`)
4. Сохраняет проекты в таблицу `property_projects` с внутренними ссылками на изображения
5. Удаляет все внешние ссылки на etagi -- в БД остаются только локальные URL

### Пошаговый план

**Шаг 1 -- Edge Function `etagi-scrape-projects/index.ts`**

Логика:
- `GET` -- запуск парсинга
- Firecrawl scrape `phuket.etagi.com/zastr/` в формате `markdown + links`
- Извлечь список проектов: название, цена от, срок сдачи, cover image URL
- Для каждого проекта -- скачать cover image через `fetch`, загрузить в Supabase Storage bucket `property-images` по пути `etagi/{project-slug}.webp`
- Upsert в `property_projects`:
  - `name_en` / `name_ru` (из парсинга)
  - `address`, `district` = 'Phuket'
  - `price_from` (THB)
  - `completion_date` (из "срок сдачи")
  - `project_status` = 'offplan' или 'under_construction'
  - `cover_image` = внутренний Supabase Storage URL
  - `images` = массив внутренних URL
  - `developer_name` (если есть)
  - `is_active` = true
- Дедупликация по `name_en` -- если проект уже есть, обновить цены и прогресс

**Шаг 2 -- Скачивание изображений**

- Используем прямой `fetch` к `cdn.esoft.digital` внутри Edge Function (CDN не блокирует серверные запросы)
- Загрузка в Storage bucket `property-images` через `supabase.storage.from('property-images').upload()`
- Итоговые URL: `{SUPABASE_URL}/storage/v1/object/public/property-images/etagi/{slug}.webp`
- Никаких внешних ссылок на etagi в финальных данных

**Шаг 3 -- Конфигурация**

- Добавить `[functions.etagi-scrape-projects]` с `verify_jwt = false` в `config.toml`
- Firecrawl API key уже настроен

**Шаг 4 -- Админ-кнопка запуска (опционально)**

- Добавить кнопку в админ-панель управления проектами для запуска импорта через вызов Edge Function

### Технические детали

- Firecrawl scrape для главной страницы каталога + отдельные scrape для страниц проектов (до 20 за раз, чтобы не превысить лимит)
- Все изображения проксируются и сохраняются локально -- в БД не будет ни одной ссылки на `etagi.com` или `cdn.esoft.digital`
- Batch upsert через `ON CONFLICT` по имени проекта для идемпотентности
- Лимит 50 проектов за один запуск для контроля расхода Firecrawl кредитов

