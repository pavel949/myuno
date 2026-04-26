## Проблема

В блоке "Operations / Управление" на Home отображается вертикаль **Weddings** — это визуально некорректно, т.к. кластер `manage` предназначен для собственников и управляющих (PMS, брони, финансы, операции).

## Глубокий аудит mapping (3 источника, все расходятся)

| Источник | Файл | Кластер для wedding | Назначение |
|---|---|---|---|
| **SSOT-таксономия (catalog)** | `src/lib/catalog/taxonomy.ts:378` | **`manage`** (cat-wedding-events) | Каталог Home / Discover — **источник, который рендерит блок "Operations"** |
| Persona-сегментация | `src/lib/segmentation/detectPersona.ts:93` | **`arrive`** | Подсказки онбординга |
| App registry (legacy) | `src/lib/appRegistry.ts:864` | **`enjoy`** (несуществующий кластер) | Адаптер для старых блоков |

### Почему Weddings оказался в Operations

Кластер `manage` в SSOT (`taxonomy.ts:153`) описан как:
> "Hosts & managers: bookings, money, operations, events — one workspace"
> `audience: 'workspace'`, `personas: ['property_owner', 'local_services_provider']`

Из-за слова **"events"** в описании, при последней унификации каталога (M10b, 2026-04-24) категорию `cat-wedding-events` положили под `manage`. Но на публичном Home `manage` рендерится как блок «Operations / Управление недвижимостью», и Weddings там выглядит чужеродно.

При этом весь кластер `manage` в публичной таксономии содержит **ровно одну категорию** — `cat-wedding-events`. Реальные операционные модули (PMS, финансы, команда) живут в `/mc/*` и `/owner/*` workspace-роутах и не представлены как services-категории.

Дополнительно: `appRegistry.ts:864` ссылается на `clusterIds: ['enjoy']` — кластера `enjoy` в канонических 6 (arrive/live/manage/invest/legal/build) нет вообще. Это мёртвая ссылка.

## План исправления

### 1. Перенести `cat-wedding-events` из `manage` в `live`
`src/lib/catalog/taxonomy.ts`
- Изменить `clusterId: 'manage'` → `clusterId: 'live'` для `cat-wedding-events`.
- Свадьба — это lifestyle-событие гостя, а не операционный модуль УК. Кластер `live` ("Home, health, food, family, pets — everyday life sorted") покрывает family/celebration темы.
- Альтернатива: `arrive` (как в persona-системе), если PM подтвердит, что свадьба = destination-туризм. Уточним вопросом.

### 2. Решить судьбу пустого кластера `manage` в публичной выдаче
После переноса в `manage` не остаётся ни одной публичной категории. Варианты:
- **A. Скрыть `manage` для не-workspace аудитории** на Home/Discover (фильтр по `audience !== 'workspace'`). Тогда блок «Operations» исчезнет из публичного UI и будет виден только в кабинете УК.
- **B. Добавить под `manage` реальные workspace-категории** (PMS, Finance, Team, Bookings) со ссылками на `/mc/*`. Это сделает блок осмысленным, но требует расширения SSOT.

Рекомендация: **A** — быстрее, не требует новых сущностей, согласуется с `audience: 'workspace'`.

### 3. Починить `appRegistry.ts`
`src/lib/appRegistry.ts:864` — заменить `groupId: 'enjoy', clusterIds: ['enjoy']` на канонический `clusterIds: ['live']` (или `arrive`, согласно решению по п.1) для устранения дрейфа.

### 4. Синхронизировать persona-mapping
`src/lib/segmentation/detectPersona.ts:93` — `wedding: ['arrive']`. Если по п.1 выбираем `live`, обновить и здесь, чтобы все три источника совпадали.

### 5. Регрессия
Расширить `src/test/catalog/taxonomy-coverage.test.ts`:
- Тест: каждый `clusterId` сервиса должен совпадать с `clusterIds` соответствующей записи в `appRegistry.ts` (если запись существует).
- Тест: `clusterIds` в `appRegistry` ⊂ канонических 6 кластеров (отлавливает «enjoy» и подобный мусор).

## Технические детали

**Файлы к правке:**
- `src/lib/catalog/taxonomy.ts` — clusterId `cat-wedding-events`
- `src/lib/appRegistry.ts` — `wedding.clusterIds`, `wedding.groupId`
- `src/lib/segmentation/detectPersona.ts` — `MODIFIER_CLUSTERS.wedding`
- (опционально) фильтр `audience !== 'workspace'` в компоненте, который рендерит Home cluster grid из `CLUSTERS`
- `src/test/catalog/taxonomy-coverage.test.ts` — два новых теста

**Не трогаем:**
- `src/pages/wedding/*` — страницы остаются на `/wedding`
- `src/lib/landings/*` — SEO landings для wedding не зависят от cluster-маппинга

## Уточняющий вопрос

Куда логичнее перенести Weddings:
- **`live`** — как family/lifestyle событие (рекомендую)
- **`arrive`** — как destination-туризм (соответствует persona-mapping)

Если ответите — соберу финальный PR одним проходом.
