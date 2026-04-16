

# Реализация каталога + импорт 122 проектов + Featured система

## Что нужно сделать

### 1. Применить миграцию `offplan_catalog`
Колонка `offplan_catalog JSONB` не существует в production DB. Без неё фильтры, BUY/WATCH/AVOID, beach, ownership, segment — всё пустое.

**SQL:**
```sql
ALTER TABLE public.property_projects
ADD COLUMN IF NOT EXISTS offplan_catalog jsonb;

CREATE INDEX IF NOT EXISTS idx_property_projects_offplan_rec
  ON public.property_projects ((offplan_catalog->>'rec'))
  WHERE offplan_catalog IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_property_projects_offplan_legacy
  ON public.property_projects ((offplan_catalog->>'legacy_id'))
  WHERE offplan_catalog ? 'legacy_id';
```

### 2. Импорт 122 проектов из `projects.json`
Файл `data/offplan-seed/projects.json` уже содержит 122 проекта с rich данными (rec, seg, zone, beach, own, mgmt, yield, rating, risk, desc, tags).

**Подход:** Написать скрипт-миграцию (Edge Function или exec script), который:
- Читает `projects.json`
- Для каждого проекта: ищет по `name_en` совпадение в существующих 157 проектах
- Если совпадение — UPDATE с `offplan_catalog` JSONB + обновление `price_from`, `roi_projected`, `muuno_score`, `risk_level`, `description_en`, `description_summary`, `yield_estimate`, `source_url`
- Если нет — INSERT новый проект
- Использует логику из `scripts/import-offplan-catalog.mjs` (buildRow, mapStkToProjectStatus, etc.)

Я запущу импорт через `code--exec` с Supabase service role key (или через insert tool для batch upsert).

### 3. Featured система — выделение лучших проектов
Колонка `is_featured` уже существует. Улучшения:

**DB:**
- Добавить `featured_rank INTEGER` — позиция в Featured (1, 2, 3...)  
- Добавить `featured_label TEXT` — кастомный текст ("Editor's Pick", "Best ROI", "Top Scarcity")

**UI на каталоге:**
- Featured-проекты отображаются первыми (уже сортируются через `featured_score`)
- Добавить визуальный бейдж "⭐ FEATURED" на карточке + золотой border
- Отдельная секция "Featured Projects" над основным гридом (горизонтальный скролл, крупные карточки)

**Admin UI:**
- На странице `/admin` или в деталях проекта — toggle `is_featured` + input для `featured_rank` и `featured_label`
- Quick action: кнопка "Feature" прямо в списке проектов

### 4. Обновить `useOffplanProjects` — убрать workaround
Сейчас хук делает 2 запроса (основной + отдельный для `offplan_catalog`) из-за того что колонка могла не существовать. После миграции — включить `offplan_catalog` в основной select.

### 5. Обновить карточку `CatalogProjectCard`
- Добавить Featured badge (золотой border + "⭐ FEATURED" / custom label)
- Показывать `description_summary` или первые 2 строки `description_en`
- Показывать `source_url` как ссылку

---

## Файлы

**Миграция (1 SQL):**
- Добавить `offplan_catalog JSONB` + индексы
- Добавить `featured_rank INTEGER`, `featured_label TEXT`

**Скрипт импорта (exec):**
- Чтение `projects.json`, batch upsert в `property_projects` через Supabase API

**Редактировать:**
- `src/hooks/useOffplanProjects.ts` — включить `offplan_catalog` в основной select, убрать двойной запрос
- `src/components/newbuilds/CatalogProjectCard.tsx` — Featured badge, description excerpt, source link
- `src/pages/newbuilds/NewbuildsLanding.tsx` — Featured секция сверху

**Новые:**
- Нет новых файлов — всё в существующих компонентах

