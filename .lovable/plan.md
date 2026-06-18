# Аудит навигатора `/discover` — отчёт и план фиксов

## 1. Найденные проблемы

### A. Битые ссылки в детали ситуации (KILLER BUG)
RPC `resolve_life_os_context` использует **LEFT JOIN** с view `life_os_catalog`. Для типов сущностей, которых нет во view, возвращается `title=NULL, price=NULL, provider_id=NULL`. `ServiceCard` всё равно рендерит «пустую карточку», а `resolveItemHref` строит `/<entity_id>` — это **HARD 404**.

| entity_type | mappings | в `life_os_catalog` view | в `ENTITY_TYPES` | результат |
|---|---|---|---|---|
| `pharmacy` | 15 | ❌ нет | ❌ нет | пустая карточка → `/uuid` 404 |
| `page` | 4 | ❌ нет | ✅ route=`/` | пустая карточка → `/uuid` 404 |
| `bank` | 98 | ✅ есть | ❌ нет | route fallback `/` |
| `transfer` | 0 в catalog_life_map | ✅ нет | ✅ есть | OK |

Итого **19 гарантированно битых карточек** + ~98 банков ведут на `/`.

### B. Счётчик ≠ детальная страница
- `count_life_os_context` фильтрует `role_scope IS NULL OR len IS NULL OR role=ANY`.
- `resolve_life_os_context` фильтрует только `role_scope IS NULL OR role=ANY` (без `len IS NULL`).
- `resolve` имеет `LIMIT 50`, но default передаётся 50 хуком — для популярных ситуаций (`tourist`=256, `experience`=283) **тихая обрезка**.
- Счётчик считает даже те mapping'и, у которых entity_type отсутствует в view → их `resolve` вернёт как «пустые карточки».

Итог: «карточка `tourist` — 256, на странице 50, из которых 5 пустые».

### C. SSOT (`CLUSTER_LIFE_SITUATIONS` в `src/lib/catalog/taxonomy.ts`) не синхронизирован с БД
В БД активны `management_company` и `vendor_onboarding`, но в статическом SSOT их нет. Поэтому `buildSituationClusterMap` в `NavigatorPageV3.tsx` ловит их в `?? 'live'` — главная ситуация менеджмент-компании показывается во вкладке **Жизнь**, а не Manage.

### D. Слабая ролевая гейтинг-логика
`NavigatorPageV3.tsx` рендерит "primary clusters" по роли, но всё остальное падает в `Other areas` — гость видит **manage/invest/build** все равно (просто ниже скролла). Контракт «гость не видит управление недвижимостью» нарушен.

### E. Прочее
- 12 inactive ситуаций (`pets`, `property`, `wedding_event`...) лежат балластом без mapping'ов — безопасно, но в admin UI могут сбивать.
- `business` ситуация попадает только в `manage` (вес 90 максимум) — для investor/developer она невидима как primary.
- ENTITY_TYPES не покрывает `bank`, `pharmacy` — fallback роут `/` для них.

---

## 2. План фиксов (4 волны, один PR)

### Wave 1 — Миграция БД: безопасный детальный вывод
Файл: `supabase/migrations/<ts>_navigator_audit_fixes.sql`

1. Удалить mapping'и с типами, которых нет в view ИЛИ нет в ENTITY_TYPES (читаем как whitelist):
   ```sql
   DELETE FROM catalog_life_map
   WHERE entity_type IN ('pharmacy','page','bank');
   ```
   (Эти таблицы либо отсутствуют, либо требуют отдельной интеграции — оставлять = ломать UX.)
2. Переписать `resolve_life_os_context`:
   - Добавить `INNER JOIN life_os_catalog loc` (вместо LEFT) — пустые карточки больше не возможны.
   - Унифицировать фильтр role_scope с `count_life_os_context` (включить `array_length IS NULL`).
   - Поднять `p_limit DEFAULT` до 200, чтобы счётчик и список сходились на большинстве ситуаций.
3. Переписать `count_life_os_context` так, чтобы он использовал тот же `INNER JOIN life_os_catalog` — счётчик ≡ длина списка для любой роли.
4. GRANT EXECUTE на обе функции для `anon, authenticated, service_role` (на всякий случай).

### Wave 2 — Синхронизация статического SSOT
Файл: `src/lib/catalog/taxonomy.ts` (массив `CLUSTER_LIFE_SITUATIONS`)

Добавить недостающие линки (без primary):
```
{ clusterId: 'manage', situationCode: 'management_company', weight: 100, isPrimary: true },
{ clusterId: 'manage', situationCode: 'vendor_onboarding',  weight: 80,  isPrimary: false },
{ clusterId: 'invest', situationCode: 'business',           weight: 80,  isPrimary: false }, // уже есть, но проверить вес
```
После правки `buildSituationClusterMap` будет корректно класть MC-ситуацию в `manage`.

### Wave 3 — Жёсткая ролевая видимость в Navigator
Файл: `src/components/navigation/v3/NavigatorPageV3.tsx`

1. Ввести константу `ROLE_HIDDEN_CLUSTERS`:
   ```
   guest:     ['manage', 'build', 'invest']
   resident:  ['manage', 'build']
   owner:     ['build']
   ```
2. В `visibleClusters` фильтровать `rest` через blacklist — «Другие сферы» больше не покажет manage гостю.
3. Если после фильтра rest пуст — не рендерить заголовок «Другие сферы».
4. Если `forYou` пуст после фильтра — не рендерить секцию «Для вас сейчас».

### Wave 4 — ENTITY_TYPES + защитные рендеры
Файл: `src/components/navigation/v3/SituationDetailPage.tsx`, `src/lib/config/entityTypes.ts`

1. В `ServiceCard`: ранний `return null` если `!item.title && !item.title_localized` — двойная защита на случай будущих расхождений view.
2. В `resolveItemHref`: если `def.route === '/'` и нет `detailRoute` — вернуть `null` и не рендерить ссылку.
3. Удалить запись `page` из `ENTITY_TYPES` (после миграции `page` больше не маппится).

---

## 3. Acceptance criteria
- Любая карточка на `/discover/:code` ведёт на существующую страницу (нет переходов на `/<uuid>`).
- Число на карточке ситуации в `/discover` точно равно числу карточек на `/discover/:code` для текущей роли.
- Гость (без auth) не видит кластеров **Manage / Build / Invest** ни в primary, ни в «Других сферах».
- MC (`property_manager` роль) видит ситуацию **Management Company** в кластере **Manage**.
- Mobile 375px: один вертикальный поток, no horizontal scroll, hit-target ≥44px.
- Нет console errors / 404 в Network при клике по 10 случайным карточкам из 5 разных ситуаций.

## 4. Технические детали
- Миграция идемпотентна: `DELETE` по whitelist + `CREATE OR REPLACE FUNCTION`.
- React Query keys уже зависят от `scope` — после релиза счётчик автоматически перерисуется.
- Никаких изменений визуала кроме скрытия пустых секций — civic-grade DS 2.1 остаётся.
- Кроме `SituationDetailPage`, `NavigatorPageV3`, `useSituationServiceCounts`, `useLifeOS` ничего не трогаем.

**Рекомендую:** делать все 4 волны в одном PR — каждая по отдельности оставляет навигатор в полу-сломанном состоянии (например, fix UI без миграции даст пустые экраны вместо битых ссылок).
