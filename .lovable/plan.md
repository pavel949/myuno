
# myUNO Taxonomy Audit — Read-only report

Scope: aудит без правок кода. Источники: `src/lib/taxonomies/*`, `src/lib/catalog/taxonomy.ts`, `src/lib/nav/*`, `src/lib/appRegistry.ts`, `src/lib/config/routes.ts`, `src/lib/ecosystemGlossary.ts`, `src/lib/verticalGroups.ts`, `src/types/auth.ts`, `src/i18n/*`, БД `kakkwibljrjsawxgnupk` (`category_groups`, `categories`, `services`, `cities`, `communities`, `system_settings`, enum `app_role`).

---

## 1. Executive verdict

**Состояние: ЖЁЛТОЕ.** Каркас таксономии разумный (Master Taxonomy v1.0 + Catalog SSOT + Master Routes), но он **раздроблён по 6 параллельным реестрам** с несовпадающими enum'ами status/role/group и расходится с БД в 2–3 раза по объёму. Это уже не «дрейф», а структурный долг, который блокирует масштабирование на новые города и автоматическую маршрутизацию AI-консьержа.

Топ-5 рисков:
1. **Два реестра приложений** (`appRegistry.ts` 60 шт. со статусами `active|soon|pro` vs `catalog/taxonomy.ts` ~69 шт. со статусами `available|info|soon`) — невозможно ответить «что такое app в myUNO» одним запросом.
2. **DB ↔ static drift**: БД содержит 15 `category_groups` / 90 `categories` / 40 `services`, SSOT — 6 / 18 / ~69. Расхождение задокументировано в самом SSOT, но не имеет owner'а.
3. **Readiness model отсутствует** как enum. Нет `lead-only / preview / hidden / parked / deprecated` — есть только бинарь `active|soon` + feature_flags в `system_settings`, причём флаги покрывают только ~10 вертикалей из 60.
4. **AppRole drift**: `src/types/auth.ts` объявляет 18 ролей (включая `property_manager`), DB enum `app_role` имеет 17 (без `property_manager`). Любой `INSERT` падает.
5. **Geo не таксономия, а заглушка**: `cities=5` (active=1), `city_areas=0`, `communities=107` без иерархии country→region. Любое расширение за пределы Пхукета сейчас сломает routing/SEO.

Вердикт: **строить canonical Taxonomy Spine v2 (single source) и мигрировать остальные слои как адаптеры**. См. §11.

---

## 2. Taxonomy source map (что и где живёт сегодня)

| Слой | Файл / таблица | Размер | Назначение | Owner |
|---|---|---|---|---|
| Surfaces (6) | `src/lib/taxonomies/master.ts` + `catalog/taxonomy.ts` CLUSTERS | 6 | Arrive/Live/Manage/Invest/Legal/Build — навигационные «дома» | Master Tax v1.0 |
| JTBD clusters (A–J) | `taxonomies/master.ts` JTBD_CLUSTERS | 10 | Функциональные классификаторы услуг | Master Tax v1.0 |
| Personas | `taxonomies/master.ts` PERSONAS | 25 (P01–P25) | Аудитория, CRM-сегментация | Master Tax v1.0 |
| Catalog SSOT | `src/lib/catalog/taxonomy.ts` | 6 clusters / 18 categories / ~69 services | Static cluster→category→service tree | Catalog SSOT memory |
| App Registry | `src/lib/appRegistry.ts` | 60 apps | Микро-приложения, иконки, persona tags | (нет явного owner) |
| Vertical groups | `src/lib/verticalGroups.ts` | adapter | Footer / legacy | Адаптер над SSOT |
| Cluster catalog | `src/lib/nav/clusterCatalog.ts` | adapter | Home/Discover grid | Адаптер над SSOT |
| Routes | `src/lib/config/routes.ts` APP_ROUTES | 433 константы | Top-level URL inventory | (нет owner) |
| Route registry | `src/lib/nav/routeRegistry.ts` | подмножество | Permissions/visibility per route | (нет owner) |
| Domain taxonomies | `taxonomies/{beauty,medical,education,experiences,restaurant}.ts` | 5 файлов | Подкатегории по вертикалям | Per-vertical |
| Lookup values | DB `lookup_values` (51 types) | runtime | Dropdowns, enums | `taxonomies/index.ts` адаптер |
| DB catalogue | `category_groups` (15) / `categories` (90) / `services` (40) | runtime | Используется для подстановки тегов в листинги | (нет sync с SSOT) |
| Roles | `src/types/auth.ts` AppRole + DB enum `app_role` | 18 vs 17 | Permissions, RLS | DB / types desync |
| Feature flags | `system_settings` key=`feature_flag:*` | 29 keys | Готовность модулей | Per-feature |
| Geo | DB `cities/city_areas/communities` + `src/lib/geo.ts` + `LocationContext` | 5/0/107 | География | (Пхукет-only) |
| Localization | `src/i18n/{en,ru,th}.ts` + `th.machine-pending.json` | 3 локали | UI-перевод | i18n-audit |
| Ecosystem labels | `src/lib/ecosystemGlossary.ts` ECOSYSTEM_APP_TRIPLET | глоссарий | RU/EN/TH labels for marketing | Glossary |

---

## 3. Discrepancy register (что не сходится)

### A. Status / readiness
- `appRegistry.ts`: `active | soon | pro` (61 entries; распределение не учтено в типах).
- `catalog/taxonomy.ts`: `available | info | soon` (58 available, 10 info, 1 soon).
- DB `properties.approval_status`: `approved|draft` (27/6). DB `listings.approval_status`: `approved|pending` (252/248).
- DB `services.lifecycle` (по канону 02): не используется в коде вообще.
- **Нет** единого enum readiness как требует промпт (ready/lead-only/preview/hidden/parked/deprecated).

### B. Roles
- `AppRole` (TS): 18 значений, включая `property_manager`.
- `public.app_role` (DB enum): 17, **без** `property_manager` (хотя комментарий в `auth.ts` это признаёт).
- Дополнительно: persona-роли `tourist|resident` сосуществуют с консумерскими ролями («consumer/operator/investor-passive») в `appRegistry.roleTags` — другой словарь, **не маппится** на `app_role`.

### C. Clusters vs Groups
- `appRegistry.AppGroupId` = 20 значений (arrive/live/enjoy/health/settle/invest/maintain/help/home/transport/leisure/wellness/admin_docs/maintenance/manage/build/lifestyle/b2b/internal).
- `NavigatorClusterId` = 8 (arrive/live/legal/invest/manage/build/enjoy/family).
- Surfaces (canonical) = 6.
- **Три разных классификатора на один и тот же объект.** Например, `enjoy` и `family` нет в Surfaces.

### D. App inventory drift
- `appRegistry.ts`: 60 apps.
- `catalog/taxonomy.ts FLAT_SERVICES`: ~69 услуг.
- Документация в CLAUDE.md упоминает **59** micro-apps.
- В БД `services` всего 40 строк. Расхождение 40 vs 60 vs 69.

### E. DB ↔ SSOT
- DB `category_groups`=15 vs SSOT `CLUSTERS`=6 (категория-группа путается с кластером).
- DB `categories`=90 vs SSOT `CATEGORIES`=18.
- Drift задокументирован в SSOT файле, не имеет migration plan.

### F. Routes
- `APP_ROUTES` содержит 433 константы; `routeRegistry.ts` ≈151 строка — покрывает только подмножество.
- Жёстко-кодированных top-level routes под `/property`, `/beauty`, `/legal` 30+ — нарушают правило «никаких новых top-level routes» из ARCHITECTURE_V2.md, но grandfathered.

### G. Feature flags vs vertical inventory
- 29 ключей `feature_flag:*`, из них `vertical_*` покрывают только 10 вертикалей (beauty/events/experiences/flowers/invest/legal/medical/pets/restaurants/transport/yachts).
- Остальные ~50 micro-apps идут в продакшен без kill-switch.

### H. Localization
- TH — `th.ts` + `th.machine-pending.json` (machine-pending = пробелы).
- Baseline `scripts/i18n-ternary-baseline.json`: 20 921 ternary, 1 265 файлов — backlog.
- ECOSYSTEM_APP_TRIPLET — третий слой имён рядом с appRegistry.labelEn/Ru/Th и catalog labelEn/Ru. Три источника для одного и того же ярлыка.

### I. Geo
- `cities` (5, active=1) — фактически Пхукет.
- `city_areas` = 0 — поле есть, заполнения нет.
- `communities` = 107 — без FK на area, без иерархии.
- В коде `'Phuket'`/`'THB'` форбидден, но реальной партиции `city_id` нет — это конвенция, не enforcement.

---

## 4. App/service matrix (sample, по `appRegistry` + DB)

| App id | Route | Surface (canon) | groupId (registry) | clusterIds (registry) | DB linked? | Status | Risk |
|---|---|---|---|---|---|---|---|
| property | `/property` | invest | home | invest | properties ✓ | active | OK |
| transfer | `/airport/transfer` | arrive | — (cat-transport in SSOT) | arrive | transfers ✓ | available/active | OK |
| flowers | n/a | live | — | — | bouquets ✓ | available | duplicate registry |
| yacht | `/yachts` | live (cat-tourism) | — | — | yachts ✓ | available | OK |
| vip-concierge | `/vip-concierge` | live | help | — | — | available | нет DB |
| sos | `/sos` | live | help | — | — | available | нет DB, нет flag |
| thai-business | `/thai-services` | live | b2b | — | thai_businesses ✓ | flag GA | OK |
| cleaning | `/cleaning` | live | maintain | live | cleaning_services ✓ | available | OK |

(Полная матрица — будет частью deliverable §11.)

---

## 5. Tourist funnel assessment (лиды → CRM/STAYS/DEALS/concierge)

Текущая модель:
- Tourist-услуги (experience, tours, yachts, transfers, water-activity, events) → checkout в `orders` (Stripe). **Лид не создаётся** автоматически.
- Concierge → `consultation_requests` / `help_requests` → admin notify, в CRM не маршрутизируется по persona.
- DEALS → `nb_leads`, `investment_interests`, `consultation_requests` (3 разные таблицы для одной воронки).
- STAYS → `property_inquiries`, `property_bookings`, `mc_onboarding_progress`.
- Нет таблицы `lead` как канонической сущности с `source=app_id`, `persona`, `lifecycle_stage`, `next_action`. Это блокирует «tourist→stays→deals» воронку, которую промпт ставит в фокус.

Gaps:
1. Tourist booking не помечается lifecycle-флагом `tourist→snowbird` → CRM не знает, что клиент потенциальный relocator.
2. `lead_attributions` есть (22 колонки), но не подключена к app_id из `appRegistry`.
3. Нет события `funnel:tourist→stays_lead`.

---

## 6. STAYS / DEALS alignment

- STAYS живёт в `properties` (282 колонок!) + `owner_*` + `property_*` — 30+ таблиц, **без единого view-фасада**.
- DEALS использует `investment_deals`, `investment_projects`, `property_projects`, `agent_deals`, `nb_leads`, `developer_users` — параллельный домен.
- Пересечение: `properties.complex_id ↔ property_complexes` vs `investment_projects` — два каталога застройщика. Один и тот же ЖК может существовать в обеих ветках.
- Roles: `property_owner`, `broker`, `vendor`, `partner` — все из `app_role`, но `agent_deals` использует своё поле `agent_user_id` без проверки `app_role`.

---

## 7. Role consistency

- 17 DB enum vs 18 TS — `property_manager` несинхронизирован.
- В `appRegistry.roleTags` живёт **другой** словарь: `consumer/operator/investor-active/investor-passive/all`. Нет маппинга на `app_role`.
- В Navigator situations `roleTags: ['all']` — strings без типизации.
- RLS использует `has_role(uid, 'admin')` корректно (security-definer), но любые правила, опирающиеся на `property_manager`, фактически no-op.

---

## 8. Route consistency

- 433 константы в `APP_ROUTES`. Уникальность не проверяется тестом.
- 30+ grandfathered top-level paths (`/property`, `/beauty`, `/legal`, `/cleaning`, `/yachts`…) живут параллельно с canonical `/app/:cluster/:vertical` — последний почти не используется.
- `routeRegistry.ts` (~151 строка) описывает permissions для подмножества — большинство routes не имеют permissions metadata.
- Orphan routes: ручной поиск нужен (deliverable §11).

---

## 9. Localization findings

- 3 локали (EN/RU/TH). TH — частично machine-pending.
- 20 921 ternary `isRu ? … : …` baseline — основной долг.
- ECOSYSTEM_APP_TRIPLET, appRegistry.label*, catalog.label* — **3 параллельных источника** для одного ярлыка. Глоссарий ослаблен.
- Нет таблицы `translations` с runtime-управлением для admin-ов (есть `translations` 10 колонок, но не подключена к UI каталога).

---

## 10. Scalability

Что сломается при добавлении 2-го города (Самуи) или 2-й вертикали (например, Bali):
- `LocationContext` — single-tenant Пхукет, hardcoded fallback.
- `city_id` партиция декларирована в core rules, но `city_areas=0` и большинство таблиц её не используют.
- Routes — нет namespace `/{city}/`.
- Roles — без `city_scope`.
- Catalog SSOT — глобальный, нельзя per-city включать/выключать категории.

Что сломается при удвоении количества apps:
- Drift между appRegistry и catalog/taxonomy.ts усугубится (нет CI-теста соответствия).
- Status enum не масштабируется (нет `lead-only`, `preview`).
- AI-консьерж не сможет отвечать «доступно ли X в Phuket для persona Y» — нет facet API.

---

## 11. Proposed canonical model (Taxonomy Spine v2)

Единый Spine с 1 источником истины и адаптерами. Не реализуется в этом промпте.

```
Taxonomy Spine v2
├── geo:        country → region → city → area → community → property
├── surface:    6 (Arrive/Live/Manage/Invest/Legal/Build)        [routes/RLS]
├── jtbd:       10 (A..J)                                        [tagging/AI/SEO]
├── persona:    25 (P01..P25)                                    [CRM/segments]
├── role:       single AppRole enum (DB + TS in sync) + scope
├── lifecycle:  tourist → snowbird → nomad → settler → resident
│                       → returnee → absentee → exit
├── strategic:  tourist | stays | deals | services | legal | ops
├── readiness:  ready | lead_only | preview | hidden | parked | deprecated
├── monetization: stripe_sub | stripe_oneoff | commission | lead_fee
│                  | brokered | free
├── fulfillment:  self_serve | concierge | partner | offline_only
├── app:        single App entity {id, surface, jtbd[], persona[], role[],
│                                  lifecycle[], strategic, readiness,
│                                  monetization, fulfillment, route,
│                                  vertical_id, db_table, i18n_key,
│                                  feature_flag, owner_team}
└── i18n:       per-entity, key-based, runtime overridable
```

Адаптеры (read-only): `appRegistry`, `catalog/taxonomy`, `verticalGroups`, `clusterCatalog`, `routeRegistry`, `ecosystemGlossary` — derive из Spine.

---

## 12. Build / Park / Hide decisions (draft, требует подтверждения)

| Module / app | Решение | Обоснование |
|---|---|---|
| `cat-emergency`/SOS | **READY** (но без feature_flag — добавить kill-switch) | продакшн trust-критично |
| Thai Business Layer | **READY** (flag активен) | GA 2026-06-24 |
| `property_manager` role в TS | **PARK** до синхронизации DB enum | нерабочее |
| `AppGroupId` legacy (home/transport/leisure/wellness/admin_docs/maintenance/manage/build/lifestyle/b2b/internal) | **DEPRECATE** | дубль surfaces |
| `NavigatorClusterId.family` и `.enjoy` | **PARK** или fold в `live` | вне canonical 6 |
| `cities` за пределами Phuket | **HIDE** (active=false) | пока нет реального покрытия |
| `feature_flag:command_palette` | **READY** для internal | уже включён |
| `feature_flag:home_v2` | **PREVIEW** (internal cohort) | в roll-out |
| Lifestyle apps P14–P19 (med tourist/wedding/athlete/halal/lgbtq/accessibility) | **LEAD-ONLY** | per core rule «zero engineering» |
| DB `services` (40 rows) | **DEPRECATE** в пользу `listings` SSOT | дубль |
| Domain taxonomies (`beauty/medical/education/experiences/restaurant`) | **READY как L2** под Spine | оставить, привязать к `category_id` |

---

## 13. Implementation plan (не выполнять сейчас)

**Wave A — Spine foundation (без UI-изменений):**
1. Создать `src/lib/taxonomy/spine/` с типами `Surface/JTBD/Persona/Role/Lifecycle/Strategic/Readiness/Monetization/Fulfillment`.
2. Поднять DB enum `readiness_status` и `strategic_layer`, добавить колонки в `services`/`listings`/`appRegistry → DB table`.
3. Sync `app_role`: добавить `property_manager` в DB enum **или** убрать из TS — выбрать одно.
4. CI-тест: appRegistry ↔ catalog/taxonomy ↔ DB соответствие (любой drift = fail).

**Wave B — Adapters:**
5. Переписать `appRegistry`, `clusterCatalog`, `verticalGroups`, `ecosystemGlossary` как derived из Spine.
6. Единый `getAppMeta(appId)` API.

**Wave C — Lead funnel:**
7. Канонический `leads` view над (`property_inquiries|nb_leads|consultation_requests|help_requests|investment_interests|thai_chats`) с `source_app_id`, `persona`, `lifecycle_stage`.
8. Tourist booking → авто-создание `lead` с `source_app_id` для CRM.

**Wave D — Geo:**
9. Партиция `city_id` на 8 hot-tables; backfill = `phuket`.
10. Routes namespacing `/{city}/…` под флагом.

**Wave E — i18n consolidation:**
11. Удалить ECOSYSTEM_APP_TRIPLET, переключить на key-based из Spine.

---

## 14. Next AI coder prompt (готовый брифинг для следующего шага)

> «Implement Wave A of Taxonomy Spine v2 per audit §11–§13. Create `src/lib/taxonomy/spine/` with TS types only (no DB changes yet). Add a vitest `spine.contract.test.ts` that asserts: (a) every entry in `appRegistry` resolves to a `Surface`, `JTBD[]`, `Persona[]`, `Readiness`, `Strategic`, `Monetization`, `Fulfillment`; (b) every `APP_ROUTES.*` referenced by `appRegistry` exists; (c) `AppRole` TS union equals `public.app_role` DB enum (snapshot). Don't touch UI. Open one PR per wave.»

---

## 15. Open questions (нужно подтверждение перед Wave A)

1. **Property_manager**: добавить в DB enum или удалить из TS? (рекомендую добавить в DB — есть `property_manager_assignments`).
2. **`AppGroupId` legacy**: можно ли deprecate за один спринт или нужны redirects?
3. **Geo**: фиксируем Пхукет-only ещё на N месяцев, или Wave D запускать сразу?
4. **DB `services` (40)** — мигрировать в `listings` или оставить как domain-specific?
5. **Readiness enum**: 6 значений из промпта (`ready/lead_only/preview/hidden/parked/deprecated`) подтверждаем как канон?
6. **Lead funnel**: канонический view или новая таблица `leads`?
7. **Owner для Taxonomy Spine**: кто из команды (нужен single DRI).

---

## Рекомендую

**Утверждать план и начинать с Wave A (TS-only Spine + contract test).** Это даёт reversible foundation за 1–2 дня без рисков для прод-данных, после чего §15.1 (роль) и §15.5 (readiness enum) превращаются в маленькие миграции, а Wave B–E идут параллельно по командам.
