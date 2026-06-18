## Что есть сейчас (аудит)

| Слой | Файл | Что делает | Оценка |
|---|---|---|---|
| Хук | `src/hooks/useGlobalSearch.ts` (455) | ilike по 12 таблицам + `listings` + `categories` + 60+ синонимов, кэш 5с, debounce 300мс | работает, но «глупый» |
| Модалка | `src/components/search/GlobalSearchModal.tsx` (269) | UI диалога, Recent/Trending/Quick categories | ОК |
| Страница | `src/pages/Search.tsx` (271) | Полнокран. результаты | ОК |
| Вход | `src/components/nav/TopBar.tsx` | Иконка + ⌘K + desktop fake-input | **на мобиле есть, но непостоянно** |
| Edge fn | `supabase/functions/ai-smart-search/` | Persona-aware AI-ответ, JSON {answer, categories, services} | **ORPHAN — нигде не вызывается** |
| Edge fn | `supabase/functions/ai-knowledge-search/` + pgvector + RPC `match_ai_knowledge` | Семантика по `ai_knowledge_documents` | используется только в Admin |
| Admin | `src/components/admin/AdminCommandPalette.tsx` | Отдельный командный палет | вне scope |

**Главные проблемы:**
1. AI infra существует, но не подключена → пользователь видит «тупой» ilike.
2. `useGlobalSearch` игнорирует роль / персону / активную ситуацию.
3. Нет навигационных шорткатов (нельзя «открыть страховку», «invest dashboard», «мои заказы»).
4. Источники неполные (нет страниц/маршрутов, нет статей `knowledge_pillars`, нет личного контекста).
5. На мобильном Bottom nav нет search-entry — поиск доступен только когда виден `TopBar`.
6. CORS edge fn зашит на `https://myuno.app` → сломается на preview/localhost.

---

## План — M1 (быстрые победы, 1 PR)

### 1. Добавить навигационный реестр (новый файл `src/lib/search/navigationIndex.ts`)
Статический список 60–80 точек назначения: `{ id, titleRu, titleEn, path, keywords[], cluster, requiresRole?, icon }`. Источник — `APP_ROUTES` + Master Taxonomy v1.0 (`src/lib/taxonomies/master.ts`) + `clusterCatalog`. Включает мини-аппы (sim, exchange, transfer, sos), личные хабы (orders, vault, properties), админ/owner-разделы (фильтруются по роли).

### 2. Расширить `useGlobalSearch`
- Добавить **layer 0**: матч по `navigationIndex` (титулы + keywords + cluster) — фуззи через `fuzzysort` (lib уже в проекте, иначе тривиальный bigram-скор).
- Прокинуть текущую **роль / персону / активную ситуацию** (через `usePersonaContext` / `useActiveContext`) в ранкинг: совпадение по `cluster`/`role` поднимает результат вверх.
- Расширить источники: `knowledge_pillars` (статьи-ответы), `orders` (только мои, через RLS), `crm_contacts` (только если у юзера роль mc/admin).
- Сгруппировать результаты по секциям в фиксированном порядке: **AI-ответ → Действия (navigation) → Каталоги → Статьи → Мои данные**.

### 3. Подключить `ai-smart-search`
- Чинить CORS: `Access-Control-Allow-Origin: *` (или из allow-list `myuno.app`, `*.lovable.app`, `localhost`).
- В `GlobalSearchModal` вызывать `ai-smart-search` параллельно с DB-поиском, debounce 500мс, только если query > 6 символов или содержит вопросительные слова.
- Рендерить AI-ответ верхним блоком с цитатами (типа карточки, не путать с результатами).
- Записывать запрос/ответ в `concierge_sessions` (insert через RLS — юзерский session_id).

### 4. UI/доступность
- **Bottom nav**: добавить 5-й/центральный CTA «Поиск» (Sheet, не Dialog — mobile-first) в `AdaptiveBottomNav`. Поиск доступен с любого экрана.
- Голосовой ввод (Web Speech API) — иконка микрофона рядом с инпутом.
- Скелетон-стейт + zero-state с примерами вопросов под персону.

### 5. Аналитика
- Logging в `analytics_events` (`search_query`, `search_click`, `search_zero_result`, `search_ai_used`) для будущего ранкинга.

---

## План — M2 (семантика, 2-й PR)

### 6. Edge function `semantic-catalog-search` (новая)
- На запрос: embed query через AI Gateway (`google/gemini-embedding-001`, 3072 dims; или `openai/text-embedding-3-small` 1536 если хотим использовать существующий HNSW). **Рекомендую: `text-embedding-3-small`** — уже есть `vector(1536)` колонка и HNSW индекс, не нужно мигрировать схему.
- Векторный поиск по 4 индексам (см. ниже) + score-fusion с BM25/ilike результатами (RRF — reciprocal rank fusion).
- Возвращает топ-20 с типами и score; клиент мержит с layer 0/1.

### 7. Embeddings pipeline
- Колонка `embedding vector(1536)` в:
  - `listings` (name + description + category)
  - `properties` (title + district + amenities)
  - `knowledge_pillars` + `relocation_articles` + `investment_articles`
  - `navigationIndex` дублировать в БД как `navigation_targets` для семантики
- HNSW индекс `vector_cosine_ops` для каждой.
- Cron-функция `embed-content-batch` (раз в час): берёт строки с `embedding IS NULL OR updated_at > embedded_at`, бьёт батчами по 50, embed → upsert. Дедуп по хэшу контента.
- Backfill-скрипт для первичной заливки (запускается из admin once).

### 8. Intent routing (упрощённо)
- В `ai-smart-search` добавить классификацию интента: `navigate | search | ask | personal`. Решает, какие источники приоритизировать. Используем тот же model call, добавляем `intent` в JSON-output.
- `navigate` → сразу подсветить top-1 действие и предложить Enter для перехода.
- `ask` → показать AI-ответ с источниками из knowledge_pillars (через `ai-knowledge-search`).

### 9. Связь с concierge
- При нажатии «Спросить подробнее» в AI-ответе → редирект на `/concierge?seed=<sessionId>` (страница уже есть). История поиска поднимается как стартовый turn.

---

## Что НЕ делаем (out of scope)

- Не строим полноценный chat-UI внутри поиска — для глубокой беседы есть `/concierge`.
- Не переписываем `AdminCommandPalette` — он отдельный case.
- Не трогаем `LOVABLE_API_KEY` — он уже есть.
- Не вводим новый top-level route — поиск открывается как Sheet/Dialog поверх любого экрана.

---

## Проверка (после M1)

1. ⌘K / mobile bottom-CTA → открывается поиск с любого экрана.
2. Запрос «страховка» → top-1 «Открыть Страхование», далее провайдеры из `insurance_providers`.
3. Запрос «как продлить визу» → AI-ответ + citations из `knowledge_pillars/visa`.
4. Запрос «мои заказы» → секция «Мои данные» с последними `orders`.
5. У роли `owner` запрос «выручка» → top-1 «Owner P&L Dashboard»; у анонима — нет.
6. Zero-result показывает 4 примера вопросов под персону.

## Проверка (после M2)

7. Запрос «вилла у океана с бассейном» → семантические `properties` в топе, даже если в title нет этих слов.
8. Запрос «найти няню англоязычную для 4-летнего» → `listings` (babysitter) + статья в knowledge_pillars.
9. Лог в `analytics_events` показывает rate использования AI vs ilike-fallback.

---

## Технические детали

- **Файлы M1:** `src/lib/search/navigationIndex.ts` (new), `src/hooks/useGlobalSearch.ts` (расш.), `src/components/search/GlobalSearchModal.tsx` (AI-блок + voice), `src/components/navigation/AdaptiveBottomNav.tsx` (CTA), `supabase/functions/ai-smart-search/index.ts` (CORS-fix + concierge_sessions write).
- **Файлы M2:** `supabase/functions/semantic-catalog-search/index.ts` (new), `supabase/functions/embed-content-batch/index.ts` (new), миграция на `embedding` колонки + индексы, `supabase/functions/ai-smart-search/index.ts` (intent classifier).
- **Модели:** chat — `google/gemini-3-flash-preview`; embeddings — `openai/text-embedding-3-small` (1536, переиспользует существующую инфру pgvector).
- **Кэш:** в-памяти TTL 5с (уже есть) + Supabase-side через `query_embedding` хэш в `google_place_cache`-style таблице (опц. в M2).
