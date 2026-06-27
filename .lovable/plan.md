## Taxonomy Spine v2 — Wave A (TS-only foundation)

Принятые ответы по §15:
- §15.1 **property_manager** → добавить в DB enum `app_role` (Wave A.5, отдельная миграция)
- §15.5 **readiness enum** → 6 значений: `ready / lead_only / preview / hidden / parked / deprecated`
- DRI — Павел (по умолчанию, можно переопределить позже)

### Что делаем в Wave A (без бизнес-логики, без правок UI)

**A.1 — Создать Spine типы и константы**
- Новый файл `src/lib/taxonomies/spine.ts`:
  - `SpineAppId` — канонический union из 60 приложений (источник: `appRegistry.ts`, он считается primary)
  - `Readiness` — `'ready' | 'lead_only' | 'preview' | 'hidden' | 'parked' | 'deprecated'`
  - `SpineAppNode` — `{ id, surface, jtbd[], personas[], readiness, monetization, route, leadTable? }`
  - `SPINE: Record<SpineAppId, SpineAppNode>` — единая запись на приложение

**A.2 — Адаптеры (read-only)**
- `src/lib/taxonomies/spine/adapters.ts`:
  - `fromAppRegistry()` — мост к существующему `appRegistry.ts`
  - `fromCatalogTaxonomy()` — мост к `catalog/taxonomy.ts`
  - Никакие данные в этих файлах не правятся — только сверка

**A.3 — Contract test**
- `src/lib/taxonomies/__tests__/spine.contract.test.ts`:
  - Каждый `SpineAppId` существует либо в `appRegistry`, либо в `catalog/taxonomy`
  - Каждое приложение из `appRegistry` имеет запись в Spine (или явно помечено `deprecated`)
  - Расхождения логируются в snapshot `docs/audits/taxonomy-spine-drift.json`
  - Тест **не падает** на drift в Wave A (warning-режим) — станет blocking в Wave C

**A.4 — Документация**
- `docs/canonical/architecture/TAXONOMY_SPINE.md` — описание модели, инвариантов, как добавлять новые ноды
- Обновить `mem://index.md`: добавить ссылку на Spine как future SSOT (параллельно с текущими реестрами, без отмены)

**A.5 — DB enum `property_manager` (отдельная миграция, последний шаг)**
- `supabase/migrations/<ts>_app_role_add_property_manager.sql`:
  - `ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'property_manager';`
  - Без RLS-изменений, без новых grant'ов
- Проверить, что `src/types/auth.ts` уже содержит `property_manager` (по аудиту — содержит) → drift закрыт

### Что НЕ делаем в Wave A
- Не правим `appRegistry.ts`, `catalog/taxonomy.ts`, `verticalGroups.ts`, `clusterCatalog.ts`
- Не трогаем RLS, routes, UI, i18n
- Не вводим унифицированный `leads view` (это Wave B)
- Не вводим геоиерархию (Wave D)
- Не меняем persona/JTBD enums в DB (Wave C, после ревью Spine)

### Acceptance
1. `tsgo` зелёный
2. Contract test проходит (drift-snapshot создан и закоммичен)
3. Миграция `property_manager` применена, `app_role` в DB содержит 18 значений
4. Документ `TAXONOMY_SPINE.md` опубликован, индекс памяти обновлён

### Откат
- Wave A полностью обратима: удалить `src/lib/taxonomies/spine*`, тест, доку; миграцию enum откатить нельзя (Postgres), но добавленное значение безопасно — нигде не используется как required.

### Следующие волны (для контекста, не реализуем сейчас)
- **Wave B** — унифицированный `leads_unified` view + адаптер инбокса
- **Wave C** — sync DB enums (persona, jtbd) ↔ `master.ts`, contract test → blocking
- **Wave D** — Geo-иерархия (country → region → city → district)
- **Wave E** — Monetization tagging + Spine как primary SSOT, deprecate дубли
