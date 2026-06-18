# План: довести симуляцию до 90+/100 по всем параметрам QA

**Текущий baseline (отчёт `docs/audit/2026-06-18-taxonomy-simulation.md`):**

| Параметр | Сейчас | Цель |
|---|---|---|
| Закрытые сценарии 50 персон | 17 / 50 (34%) | **≥ 45 / 50 (90%)** |
| Покрытие ролей (owner/vendor/developer) | 0 / 22 | **≥ 20 / 22** |
| Сирота-ситуации `life_situations` | 12 / 37 | **0** |
| Кластеры в БД vs SSOT | 15 vs 6 | **6 = 6** |
| Локализация TH (DB + UI) | ~10% | **≥ 90%** |
| Нормализация `providers.business_category` | done (48/48) | держать через trigger |
| Vendor onboarding: поиск + «другое» | нет | есть |
| Единая модерация (`moderation_queue`) | 2 ленты | 1 лента |

---

## Волна 1 — P0 «Разблокировать каталог» (цель: 17→38/50)

### 1.1 Наполнить кластер `manage` категориями (миграция)
В `category_groups` (cluster=`manage`) сейчас 0 категорий. Завести 6:
`cleaning`, `maintenance`, `pool`, `garden`, `accounting`, `channel-management`.
Существующие провайдеры (уже нормализованы в прошлой волне) автоматически попадут в счётчики через `v_provider_catalog_match`.

**Эффект:** owner (8) + vendor (10) = **+18 ✅**.

### 1.2 Привязать 12 сирот-ситуаций к кластерам
Один SQL-инсёрт в `cluster_life_situations`:
```text
planning           → arrive, live, invest
pre_trip_planning  → arrive
digital_nomad      → live, legal
shopping           → live
pets               → live
sports             → live
retirement_living  → live, legal
property           → invest, manage
relocation         → arrive, legal, live
health             → live
emergency          → live
visa_renewal       → legal
```
**Эффект:** **+12 ✅** (закрывает все «сирота-ситуация»).

### 1.3 Удалить/смержить 9 фантомных БД-кластеров
`home-maintenance`, `home-living`, `leisure`, `professional`, `life-admin`, `water`, `transport`, `health-wellness`, `other` → перенести их категории в SSOT-кластеры (`arrive`/`live`/`manage`) и пометить cluster='deprecated' (мягкий delete, без потери истории).

**Эффект:** Drawer/footer/Discover перестают показывать пустые разделы; SSOT = БД.

**Контроль волны 1:** прогнать `/tmp/sim2.mjs` — ожидание ≥ 38/50.

---

## Волна 2 — P1 «Тайская локализация» (цель: 38→42/50 + язык)

### 2.1 Расширить схему под TH
- `life_situations`: добавить `title_th text`, `description_th text`.
- `categories`: добавить `name_th text`, `description_th text`.
- `category_groups`: `name_th text`.

### 2.2 Перевести контент
- 37 ситуаций — TH через переводчика/LLM (один edge-call `translate-batch`).
- 18 SSOT-категорий + 6 новых `manage` — TH.
- 6 кластеров — TH.

### 2.3 Протянуть `labelTh` в UI
- `CategoryPicker` уже принимает `labelTh` в типе, но не рендерит → исправить.
- `useSituationServiceCounts`, `SituationCard`, `SituationDetailPage`, `useNavigatorContent` — выбирать поле по `language`.
- Fallback цепочка: `th → en → ru`.

**Контроль волны 2:** прогнать симуляцию с `language='th'` по 17 персонам — все строки TH, ни одного `[missing]`.

---

## Волна 3 — P1 «Vendor onboarding до 10/10» (цель: 42→45/50)

### 3.1 Поиск в `CategoryPicker`
`<Input>` сверху + fuzzy-match по `labelRu/En/Th` + `keywords`. Скролл к первому совпадению.

### 3.2 «Моей категории нет»
Кнопка → modal → запись в `category_suggestions` (status=`pending`, source=`vendor_onboarding`) + админ-уведомление.

### 3.3 Единая модерация
Edge-trigger: на `INSERT INTO partner_applications` дублировать запись в `moderation_queue` (kind=`partner_application`, ref_id=…). Админ видит всё в одной ленте `/admin/moderation`.

### 3.4 CHECK + trigger на `providers.business_category`
Trigger из прошлой волны уже нормализует, добавить `CHECK (business_category IN (SELECT slug FROM categories))` через FK или валидатор, чтобы новые insert'ы не сломали маппинг.

**Контроль волны 3:** пройти flow `/vendor/join` вручную (3 кейса: cleaning / yacht / «не нашёл — предложил»), проверить, что заявка падает и в `partner_applications`, и в `moderation_queue`.

---

## Волна 4 — P2 «Целостность данных» (цель: 45→47/50 + 90+ по чистоте)

### 4.1 Enum для `listings.category`
- Добавить FK `listings.category → categories.slug`.
- 74 листинга без категории → backfill скриптом по `title`/`type` + ручная разметка топ-20.
- Мусорные значения (`mixed`, `premium`, `boxes`) — перенести в `listings.tier`/`listings.tags`.

### 4.2 Мост `marketplace_categories` ↔ `categories`
Добавить колонку `marketplace_categories.service_category_slug` (FK). Создать view `v_unified_catalog` (UNION services + products) для глобального поиска.

### 4.3 `user_personas` ↔ `life_situations`
Создать `persona_situations (persona_id, situation_id, weight)`. Засеять из Master Taxonomy (P01–P25). Это нужно AI-роутеру и `useSituationServiceCounts` для персонализации.

---

## Волна 5 — QA-прогон и метрика (цель: подтвердить 90+/100)

### 5.1 Автоматизированный прогон
Скрипт `scripts/qa/simulate-50.mjs`:
- 50 персон × {role, lang, situation}.
- Для каждой: ищет кластер → категории → провайдеров → SSOT-метки → локализацию → vendor-onboarding-ready.
- Результат → `docs/audit/2026-06-18-qa-after.md` с теми же колонками, что в baseline.

### 5.2 Целевая таблица
```text
Сценариев OK            ≥ 45/50   (90%)
Owner OK                ≥ 7/8
Vendor OK               ≥ 9/10
Developer OK            ≥ 4/4
Тайские строки missing  = 0
Фантомные кластеры      = 0
Сироты-ситуации         = 0
Counter mismatch        = 0
```

### 5.3 Регресс-гард
Добавить в CI (`.github/workflows/qa-taxonomy.yml`) шаг, который падает, если:
- появилась сирота-ситуация,
- провайдер с `business_category NOT IN categories.slug`,
- категория без `name_th`.

---

## Технические артефакты

**Миграции (примерные имена):**
1. `20260618130000_manage_cluster_categories.sql`
2. `20260618130100_link_orphan_situations.sql`
3. `20260618130200_deprecate_phantom_clusters.sql`
4. `20260618140000_th_localization_columns.sql`
5. `20260618140100_th_localization_data.sql`
6. `20260618150000_moderation_queue_unify.sql`
7. `20260618150100_listings_category_fk.sql`
8. `20260618150200_marketplace_bridge_view.sql`
9. `20260618150300_persona_situations.sql`

**Код:**
- `src/components/vendor/onboarding/CategoryPicker.tsx` — поиск + «другое» + `labelTh`.
- `src/hooks/useSituationServiceCounts.ts` — fallback chain.
- `src/lib/i18n/getLocalizedField.ts` — единый helper `pickLocale(record, lang)`.
- `scripts/qa/simulate-50.mjs` — автотест.
- `.github/workflows/qa-taxonomy.yml` — регресс-гард.

---

## Порядок исполнения и итерации

```text
W1 (P0)  ──►  prog 38/50  ──►  go
W2 (TH)  ──►  TH 100%      ──►  prog 42/50
W3 (V)   ──►  vendor 9/10  ──►  prog 45/50
W4 (D)   ──►  data clean   ──►  prog 47/50
W5 (QA)  ──►  report + CI  ──►  ✅ 90+/100
```

**Рекомендую** стартовать с Волны 1 (P0) — она самая дешёвая (3 миграции, без кода) и даёт скачок 17→38/50 за один заход. После неё имеет смысл показать промежуточный прогон и решать, идти ли сразу в TH-локализацию (Волна 2) или в vendor onboarding (Волна 3), потому что они независимы и могут идти параллельно.

**Что НЕ входит в план (сознательно):**
- Реальные браузерные сессии × 50 (Playwright) — дорого, не ловит структурных багов лучше SQL-симуляции.
- Перепроектирование Master Taxonomy v1.0 — она утверждена.
- Изменение SSOT (`taxonomy.ts`) — мы подгоняем БД к SSOT, не наоборот.
