# myUNO · Протокол внедрения v1.0
## Operational playbook для встраивания Segmentation Framework, Service Catalogue v2 и Tone of Voice в существующий стек

> **Назначение.** Пошаговый протокол для AI-инженера (Claude Code, Cursor, любой LLM-агент), который реализует внедрение трёх новых канонических документов в работающую систему без breaking changes, с проверками на каждом шаге и возможностью отката.
>
> **Три документа-источника:**
> 1. `myuno_segmentation_framework.md` — 3-осевая сегментация, 25 персон, 10 кластеров, CRM-схема
> 2. `ServiceCatalogue_v2.jsx` — 16 категорий × 230 услуг с тегами lifecycle/role/cluster
> 3. `myuno_tone_of_voice.md` — канонический голос бренда
>
> **Константа, которая не нарушается:** один Supabase public schema, один user_id через все субдомены, TypeScript strict, mobile-first 375px, bilingual (RU/EN) — как зафиксировано в PROJECT_v2.2.md.

---

## 0 · Философия протокола

### 0.1 Три правила, которым следует AI на каждом шаге

**Правило 1 · Audit before change.** Ни одно изменение не делается до того, как AI прочитал существующий код, зафиксировал состояние «как есть» и сравнил с целевым «как надо». Слепая генерация кода на старой базе — главная причина breaking changes.

**Правило 2 · Additive over replacement.** Новое добавляется параллельно старому, а не вместо него. Старое удаляется только после того, как новое работает в production хотя бы 7 дней. Это превращает «миграцию» в «эволюцию».

**Правило 3 · One atomic change per PR.** Каждое изменение — один pull request с чётко сформулированной целью, минимальной областью затронутого кода, тестами и возможностью отката через `git revert`. Никаких «заодно поправлю». Никаких multi-concern коммитов.

### 0.2 Формат работы с AI-инженером

Внедрение разделено на **7 последовательных вех (M1–M7)**. Каждая веха — независимый блок работы, который можно выполнить и проверить отдельно. Внутри каждой вехи:

- **AUDIT** — что AI должен прочитать и зафиксировать перед началом
- **GAP** — что отсутствует или противоречит новым документам
- **PLAN** — последовательность атомарных изменений
- **PROMPT** — готовый промпт для копирования в AI-инженера
- **ACCEPTANCE** — критерии успешного завершения (что должно работать)
- **ROLLBACK** — как откатиться, если что-то пошло не так

### 0.3 Последовательность вех — зависимости

```
M1 · Загрузка документов в репозиторий (фундамент, блокирует всё)
   │
   ├─► M2 · Расширение схемы БД (lifecycle + role + modifiers)
   │       │
   │       └─► M3 · Обновление TypeScript типов и API-контрактов
   │               │
   │               └─► M4 · Рефактор каталога услуг (v1 → v2)
   │                       │
   │                       ├─► M5 · AI-консьерж: 3-вопросный онбординг
   │                       │
   │                       └─► M6 · Лендинги персон и кластеров (25 + 10)
   │
   └─► M7 · Tone of Voice — микрокопии, ошибки, нотификации (параллельно M4+)
```

**M1 не имеет зависимостей — с него начинаем всегда.**
**M7 можно запускать параллельно M4–M6 — работа с текстами не блокирует структурные изменения.**

---

## M1 · Загрузка канонических документов в репозиторий

### M1.AUDIT

AI читает:
- Корень репозитория
- Папку `/docs` (если существует)
- Папку `/packages/shared` или аналогичную (shared monorepo package)
- `README.md`, `CONTRIBUTING.md`, `.cursor/rules` или `.cursorrules`, `CLAUDE.md` если есть

**Цель audit:** понять, где в проекте принято хранить документацию и AI-инструкции.

### M1.GAP

Три новых канонических документа не присутствуют в репо. Нет системы версионирования этих документов. Нет механизма, который заставит AI-инженера читать их перед работой.

### M1.PLAN

Атомарные шаги:

1. Создать папку `/docs/canonical/` в корне монорепо
2. Положить три документа:
   - `/docs/canonical/01-segmentation-framework.md`
   - `/docs/canonical/02-service-catalogue.md` (копия .md-версии каталога)
   - `/docs/canonical/03-tone-of-voice.md`
3. Создать `/docs/canonical/README.md` с индексом и статусом документов
4. Создать `/docs/canonical/CHANGELOG.md` с начальной записью v1.0
5. Обновить корневой `README.md` — добавить секцию "Canonical docs" со ссылками
6. Обновить `.cursor/rules` или `CLAUDE.md` — добавить директиву: AI читает все три canonical-документа перед любым продуктовым или UX-изменением
7. Commit: `docs(canonical): add segmentation, catalogue, tone of voice v1`

### M1.PROMPT

```
ЗАДАЧА M1 · Загрузка канонических документов myUNO в репозиторий.

КОНТЕКСТ. У нас есть три новых канонических документа:
— myuno_segmentation_framework.md (3-осевая модель сегментации, 25 персон, 10 кластеров, CRM-спецификация)
— myuno_service_catalogue_v2.md (16 категорий × 230 услуг с lifecycle/role/cluster тегами)
— myuno_tone_of_voice.md (канонический голос бренда: спокойная уверенность, никаких "лучший/уникальный/революционный", продаём доверие не транзакцию)

Документы прикреплены к задаче. Они — источник истины для всех дальнейших решений.

ШАГИ.
1. Прочитай корень репозитория, /docs, /packages/shared (если есть), README.md, .cursor/rules, CLAUDE.md.
2. Создай папку /docs/canonical/ если не существует.
3. Положи три документа как:
   - /docs/canonical/01-segmentation-framework.md
   - /docs/canonical/02-service-catalogue.md
   - /docs/canonical/03-tone-of-voice.md
4. Создай /docs/canonical/README.md со списком документов, версиями (v1.0), датой, owner (Pavel), статусом "Canonical — source of truth".
5. Создай /docs/canonical/CHANGELOG.md с записью "2026-04-22 · v1.0 · Initial canonical set".
6. В корневом README.md добавь секцию "## Canonical Documentation" со ссылками на три документа и пояснением "Эти документы — источник истины. Любое UX-, продуктовое или текстовое решение начинается с их прочтения."
7. Обнови .cursor/rules (или создай если нет) и CLAUDE.md — добавь блок:

"""
## ОБЯЗАТЕЛЬНОЕ ЧТЕНИЕ ПЕРЕД РАБОТОЙ
Перед любым изменением UX, копирайта, каталога услуг, CRM-схемы, AI-промптов —
прочитай три документа из /docs/canonical/. Они — источник истины:
- 01-segmentation-framework.md — персоны, жизненные фазы, роли, ситуации
- 02-service-catalogue.md — каталог услуг с тегами
- 03-tone-of-voice.md — голос бренда
Если изменение противоречит этим документам — останови работу и спроси Павла.
"""

ЧТО НЕ ДЕЛАТЬ.
— Не трогать существующий код приложений.
— Не менять существующие файлы документации (старые остаются как есть).
— Не коммитить в main напрямую — создай ветку docs/canonical-v1 и PR.

АКЦЕПТ. PR создан, все 4 новых файла в /docs/canonical/, README.md и rules-файлы обновлены, CHANGELOG начат.
```

### M1.ACCEPTANCE

- [ ] Три документа лежат в `/docs/canonical/` с правильными именами
- [ ] README индексный файл есть
- [ ] CHANGELOG начат с v1.0
- [ ] Корневой README ссылается на canonical-папку
- [ ] `.cursor/rules` или `CLAUDE.md` содержит директиву читать canonical-документы
- [ ] PR не трогает код приложений (только документация)

### M1.ROLLBACK

`git revert <commit>` — безопасно, никакого кода не затронуто.

---

## M2 · Расширение схемы Supabase (CRM-поля)

### M2.AUDIT

AI читает:
- `/packages/db` или `/supabase/migrations/` — все существующие миграции
- Текущую схему таблицы `users` или `profiles`
- Связанные таблицы (leads, transactions, если есть)
- RLS-политики этих таблиц
- Сид-скрипты

**Цель audit:** полностью понять текущую модель пользователя, прежде чем её расширять.

### M2.GAP

В `myuno_segmentation_framework.md` раздел 12 требует новые поля:

- `lifecycle_stage` (enum: scout, tourist, snowbird, nomad, settler, resident, absentee, returnee)
- `lifecycle_stage_history` (jsonb)
- `first_visit_at` (timestamptz)
- `total_days_in_thailand` (int)
- `visits_count` (int)
- `visa_type` (enum)
- `visa_expires_at` (date)
- `primary_role` (enum: consumer, resident-user, investor-passive, investor-active, operator, provider)
- `secondary_roles` (enum[])
- `owned_properties_count` (int default 0)
- `operated_properties_count` (int default 0)
- `language` (enum)
- `household_type` (enum)
- `special_status` (text[] — набор модификаторов: pet-owner, medical, halal, kosher, accessibility, lgbtq, athlete, wedding)
- `kids_ages` (int[])
- `detected_persona` (text) — P1..P25
- `detected_persona_confidence` (numeric)
- `active_clusters` (text[]) — A..J
- `triggers_active` (text[])
- `next_lifecycle_stage_eta` (date, nullable)

Если ни одного из этих полей нет — gap полный.

### M2.PLAN

**Принцип: additive migration.** Не удаляем существующие поля. Добавляем все новые как nullable с дефолтами. Backfill делается отдельной миграцией.

Атомарные шаги (каждый = отдельная миграция в `/supabase/migrations/`):

1. **Миграция 001 · Enums.** Создать все необходимые типы PostgreSQL enum.
2. **Миграция 002 · Lifecycle columns.** Добавить nullable колонки `lifecycle_stage`, `lifecycle_stage_history`, `first_visit_at`, `total_days_in_thailand`, `visits_count`, `visa_type`, `visa_expires_at`.
3. **Миграция 003 · Role columns.** Добавить `primary_role`, `secondary_roles`, `owned_properties_count`, `operated_properties_count`.
4. **Миграция 004 · Modifier columns.** Добавить `language`, `household_type`, `special_status`, `kids_ages`.
5. **Миграция 005 · Persona columns.** Добавить `detected_persona`, `detected_persona_confidence`, `active_clusters`, `triggers_active`, `next_lifecycle_stage_eta`.
6. **Миграция 006 · Indexes.** Индексы на `lifecycle_stage`, `primary_role`, `detected_persona`, `special_status` (GIN для массивов).
7. **Миграция 007 · RLS.** Обновить RLS так, чтобы новые поля читались/писались по тем же правилам, что и старые.
8. **Миграция 008 · Backfill defaults.** Для существующих users — выставить `primary_role = 'consumer'`, `lifecycle_stage = null`, всё остальное — null. **Не угадываем значения.**

Каждая миграция — отдельный файл, отдельный PR, отдельный прогон в staging.

### M2.PROMPT

```
ЗАДАЧА M2 · Расширение Supabase public schema для 3-осевой сегментации.

ПРЕРЕКВИЗИТ. M1 выполнен — /docs/canonical/01-segmentation-framework.md доступен в репо. Прочитай раздел 12 этого документа — там полная спецификация полей.

КОНСТАНТА ПРОЕКТА. Supabase public schema — единственная. v2 schema не создаём. Все изменения — через миграции в /supabase/migrations/. Никаких прямых изменений в БД через dashboard.

AUDIT (обязательно перед кодом).
1. Прочитай все существующие миграции в /supabase/migrations/.
2. Найди таблицу users (или profiles, или accounts — как у нас называется основная таблица пользователя).
3. Выпиши текущие поля, типы, дефолты, RLS-политики.
4. Проверь зависимые таблицы (leads, transactions) — есть ли FK на users.
5. Зафиксируй audit в комментарии к PR.

GAP. В текущей схеме нет полей из /docs/canonical/01-segmentation-framework.md раздел 12:
lifecycle_stage, lifecycle_stage_history, first_visit_at, total_days_in_thailand, visits_count, visa_type, visa_expires_at, primary_role, secondary_roles, owned_properties_count, operated_properties_count, language, household_type, special_status, kids_ages, detected_persona, detected_persona_confidence, active_clusters, triggers_active, next_lifecycle_stage_eta.

PLAN. Восемь миграций, каждая — отдельный файл с префиксом даты. Создавай по одной, после каждой — локальный прогон `supabase db reset` + проверка.

1. 20260422_01_enums.sql — CREATE TYPE для всех enums (lifecycle_stage, role_type, visa_type, language_code, household_type). Используй `CREATE TYPE IF NOT EXISTS` где возможно.

2. 20260422_02_lifecycle_columns.sql — ALTER TABLE users ADD COLUMN ... IF NOT EXISTS для всех 7 lifecycle-полей. Все nullable. `lifecycle_stage_history` типа jsonb default '[]'.

3. 20260422_03_role_columns.sql — primary_role enum nullable, secondary_roles role_type[] default '{}', owned_properties_count int default 0, operated_properties_count int default 0.

4. 20260422_04_modifier_columns.sql — language language_code nullable, household_type household_type nullable, special_status text[] default '{}' (массив, не enum — расширяемость), kids_ages int[] default '{}'.

5. 20260422_05_persona_columns.sql — detected_persona text nullable (формат P1..P25), detected_persona_confidence numeric(3,2) nullable, active_clusters text[] default '{}' (значения A..J), triggers_active text[] default '{}', next_lifecycle_stage_eta date nullable.

6. 20260422_06_indexes.sql — B-tree на lifecycle_stage, primary_role, detected_persona. GIN на special_status, active_clusters, secondary_roles.

7. 20260422_07_rls_update.sql — новые поля следуют тем же политикам, что и существующие user-поля (обычно: select/update владельцу, select для admin). Не создавай новых политик — расширь существующие через ALTER POLICY если нужно, иначе никаких изменений (новые колонки автоматически покроются существующей политикой с USING на auth.uid = id).

8. 20260422_08_backfill.sql — для всех существующих users: UPDATE users SET primary_role = 'consumer' WHERE primary_role IS NULL. Больше ничего не угадываем.

ЧТО НЕ ДЕЛАТЬ.
— Не трогай существующие колонки.
— Не удаляй ничего.
— Не меняй FK, PK, имена таблиц.
— Не создавай новых таблиц в этой задаче (они — в M4, когда будем делать service_tags и persona_templates).
— Не пиши в продовую БД. Только staging.

ТЕСТИРОВАНИЕ.
1. `supabase db reset` на локальной БД — все миграции применяются без ошибок.
2. Проверь в psql: `\d users` — все новые колонки на месте.
3. Вставь тестового user с пустыми новыми полями — вставка проходит.
4. Вставь тестового user со всеми полями заполненными — проходит.
5. Попробуй невалидный enum (primary_role = 'invalid') — БД должна отклонить.

АКЦЕПТ. 8 миграций, каждая в отдельном коммите. PR содержит комментарий с результатом audit и списком добавленных полей. Ревью — только Павел.

ROLLBACK. Каждая миграция обратима: для каждой 20260422_NN_*.sql создай 20260422_NN_*_rollback.sql с DROP COLUMN IF EXISTS (в обратном порядке). Не прикладываем в миграции — держим отдельным файлом в /supabase/rollbacks/.
```

### M2.ACCEPTANCE

- [ ] 8 миграций применяются без ошибок в staging
- [ ] Все новые поля nullable, не ломают существующую вставку users
- [ ] RLS-политики работают для новых полей
- [ ] Существующие users автоматически получают `primary_role = 'consumer'`
- [ ] Rollback-скрипты подготовлены
- [ ] `supabase db reset` в dev-окружении проходит чисто

### M2.ROLLBACK

- Применяем rollback-скрипты в обратном порядке (008 → 001)
- Либо `git revert` + `supabase db reset`

---

## M3 · TypeScript-типы и shared API контракты

### M3.AUDIT

AI читает:
- `/packages/shared/types/` или аналог — текущие TS-типы для user
- `/packages/db` если используется supabase/generate-types
- Все места, где импортируется `User` или `Profile`

### M3.GAP

Существующие TS-типы не содержат новых полей. Код, который будет опираться на `user.lifecycle_stage` — не скомпилируется.

### M3.PLAN

1. Регенерировать типы через Supabase CLI: `supabase gen types typescript`
2. Создать в `/packages/shared/types/` новые enum-константы и утилиты:
   - `LifecycleStage`, `EconomicRole`, `Modifier`, `SituationCluster`
   - Массивы-константы (LIFECYCLE_STAGES, ROLES, MODIFIERS, CLUSTERS)
   - Type guards: `isInvestor(user)`, `isResident(user)`, `hasModifier(user, 'halal')`
   - Утилита `detectPersona(user): PersonaId` — чистая функция по матрице из framework
3. **Не менять** существующие импорты. Старый тип User продолжает работать, просто получает новые опциональные поля.

### M3.PROMPT

```
ЗАДАЧА M3 · Обновить TypeScript-типы под новые CRM-поля.

ПРЕРЕКВИЗИТ. M2 выполнена — миграции Supabase применены в staging.

AUDIT.
1. Найди в /packages/shared/types/ или /apps/*/types/ существующие типы User, Profile.
2. Выпиши импорты этих типов — где они используются.
3. Проверь как у нас генерятся типы из Supabase (supabase gen types или вручную).

PLAN.

Шаг 1. Регенерация.
Запусти `supabase gen types typescript --local > packages/shared/types/database.ts` (или как у нас принято). Проверь что новые поля появились.

Шаг 2. Константы.
В /packages/shared/types/segmentation.ts создай:

```typescript
// Канонические значения — единая точка истины для всего monorepo.
// Источник: /docs/canonical/01-segmentation-framework.md разделы 1–3.

export const LIFECYCLE_STAGES = [
  'scout', 'tourist', 'snowbird', 'nomad',
  'settler', 'resident', 'absentee', 'returnee'
] as const;
export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export const ECONOMIC_ROLES = [
  'consumer', 'resident-user', 'investor-passive',
  'investor-active', 'operator', 'provider'
] as const;
export type EconomicRole = typeof ECONOMIC_ROLES[number];

export const MODIFIERS = [
  'pet-owner', 'medical', 'halal', 'kosher',
  'accessibility', 'lgbtq', 'athlete', 'wedding'
] as const;
export type Modifier = typeof MODIFIERS[number];

export const SITUATION_CLUSTERS = ['A','B','C','D','E','F','G','H','I','J'] as const;
export type SituationCluster = typeof SITUATION_CLUSTERS[number];

export const CLUSTER_NAMES: Record<SituationCluster, string> = {
  A: 'Arrival & Orientation',
  B: 'Extension & Transition',
  C: 'Settlement',
  D: 'Investment Consideration',
  E: 'Transaction',
  F: 'Ownership & Operations',
  G: 'Compliance & Legal',
  H: 'Emergency',
  I: 'Lifestyle',
  J: 'Exit & Re-entry',
};

export const PERSONAS = [
  'P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12',
  'P13','P14','P15','P16','P17','P18','P19','P20','P21','P22','P23','P24','P25'
] as const;
export type PersonaId = typeof PERSONAS[number];
```

Шаг 3. Type guards и утилиты.
В /packages/shared/lib/segmentation.ts создай чистые функции:

- `hasModifier(user, modifier): boolean`
- `isInvestor(user): boolean`
- `isResident(user): boolean`
- `isOperator(user): boolean`
- `getActiveClusters(user): SituationCluster[]` — возвращает из user.active_clusters
- `detectPersona(user): PersonaId | null` — ПОКА заглушка, возвращает null. Реальная логика — в M5.

Шаг 4. Тесты.
В /packages/shared/lib/segmentation.test.ts напиши unit-тесты для type guards (минимум 8 тестов, по 1–2 на функцию).

ЧТО НЕ ДЕЛАТЬ.
— Не менять существующий импорт User. Всё — additive.
— Не переписывать компоненты, которые используют старые поля. Это будет в M4+.
— Не импортировать тип прямо из database.ts в app-коде — всегда через shared/types.

АКЦЕПТ.
— Monorepo собирается: `pnpm -w build` проходит.
— Тесты проходят: `pnpm -w test`.
— Нигде в коде нет `any` для полей сегментации.
— PR описывает все новые экспорты в /packages/shared.
```

### M3.ACCEPTANCE

- [ ] `supabase gen types` прошла, новые поля в database.ts
- [ ] Новые enum-константы в shared package
- [ ] Type guards написаны и покрыты тестами
- [ ] Весь monorepo собирается без ошибок
- [ ] Ни одного нового `any` в кодбазе

### M3.ROLLBACK

`git revert` — типы изолированы в shared package, откат безопасный.

---

## M4 · Рефактор каталога услуг (v1 → v2)

### M4.AUDIT

AI читает:
- `ServiceCatalogue.jsx` (v1) в репо
- Все места, где он импортируется
- Есть ли каталог в БД (таблица `services`, `categories`)? Или только в коде?
- `/docs/canonical/02-service-catalogue.md`

### M4.GAP

v1 имеет 10 категорий и 7 аудиторий. v2 имеет 16 категорий и 25 персон. Каждая услуга в v2 помечена `lifecycle[]`, `role[]`, `cluster`. v1 не имеет этих полей.

### M4.PLAN

**Важно.** Если каталог сейчас живёт только в `ServiceCatalogue.jsx` (hardcoded JSX) — это не продакшн-каталог, а **демо-компонент для презентаций**. В таком случае рефактор — это просто замена файла.

Если каталог живёт в БД (таблица services) — это **отдельная большая задача** (создание service_catalog таблицы, миграция данных, новый admin-UI). В этом случае M4 разбивается на под-вехи M4a / M4b / M4c.

**Шаги (для случая "каталог только в JSX"):**

1. Переименовать существующий `ServiceCatalogue.jsx` → `ServiceCatalogue.v1.jsx` (архив)
2. Положить новый `ServiceCatalogue_v2.jsx` как новый файл, добавить в него импорт типов из `/packages/shared/types/segmentation.ts`
3. Подменить импорт в местах использования
4. Добавить Storybook-story (если Storybook есть) для визуальной проверки
5. Через 7 дней в production — удалить v1

**Шаги (для случая "каталог в БД"):**

1. Создать миграцию для таблиц `service_categories` и `services` с колонками lifecycle[], role[], cluster
2. Seed-скрипт: импортировать все 16 категорий и 230 услуг из v2
3. API endpoint `/api/services` возвращает каталог, клиент читает оттуда
4. Admin-панель получает возможность редактировать категории и услуги с валидацией по типам из M3
5. Frontend читает из API, а не из hardcoded JSX

### M4.PROMPT

```
ЗАДАЧА M4 · Миграция каталога услуг v1 → v2.

ПРЕРЕКВИЗИТЫ. M1, M2, M3 выполнены.

СНАЧАЛА AUDIT.
1. Найди все файлы с именем ServiceCatalogue*.jsx / .tsx в кодбазе.
2. Найди таблицы services, service_categories в Supabase schema.
3. Определи вердикт:
   (A) Каталог только в JSX (hardcoded) → иди по сценарию A.
   (B) Каталог в БД → иди по сценарию B, он сложнее, требует разделения на M4a/M4b/M4c.

Напиши в комментарии PR: "Audit result: (A) / (B). Обоснование: ..."

СЦЕНАРИЙ A — каталог только в JSX.

1. Переименуй старый ServiceCatalogue.jsx → ServiceCatalogue.v1.jsx (не удаляй).
2. Положи новый ServiceCatalogue_v2.jsx как ServiceCatalogue.jsx.
3. В новом файле замени inline-строковые типы на импорт из /packages/shared/types/segmentation.ts:
   - lifecycle: LifecycleStage[]
   - role: EconomicRole[]
   - cluster: SituationCluster
4. Найди все import-ы старого файла — подмени или удостоверься, что новый экспортирует default ServiceCatalogue.
5. Запусти dev-сервер, открой страницу каталога — визуально проверь: 16 категорий в сайдбаре, 25 персон во вкладке Audiences, плашки lifecycle/role/cluster отображаются на раскрытой услуге.
6. Добавь в /docs/canonical/CHANGELOG.md запись о замене.

СЦЕНАРИЙ B — каталог в БД.

Стоп. Не делай в одной задаче. Создай три подзадачи:
- M4a · Миграции БД для новой структуры service_catalog
- M4b · Seed-скрипт с данными из ServiceCatalogue_v2.jsx
- M4c · Переключение frontend на API-чтение

Вернись к Павлу за уточнением приоритетов.

ЧТО НЕ ДЕЛАТЬ.
— Не удаляй v1 сразу. Архивируй, удалишь через 7 дней после prod-деплоя.
— Не трогай категории-цвета — сохраняй существующую брендинг-палитру.
— Не добавляй новые услуги "от себя" — только те, что в /docs/canonical/02-service-catalogue.md.

АКЦЕПТ.
— Страница каталога показывает 16 категорий.
— Раскрытие услуги показывает теги lifecycle и role.
— Вкладка "25 персон" работает.
— Старый файл переименован в *.v1.jsx и лежит рядом.
— Нет TypeScript-ошибок.
```

### M4.ACCEPTANCE

- [ ] Audit-вердикт зафиксирован в PR
- [ ] Каталог визуально рендерится со всеми 16 категориями и 25 персонами
- [ ] Теги lifecycle/role/cluster видны в UI
- [ ] v1 сохранён рядом (не удалён)
- [ ] Монорепо собирается без ошибок

### M4.ROLLBACK

Переименовать `ServiceCatalogue.v1.jsx` обратно в `ServiceCatalogue.jsx`, удалить v2. 1 коммит, 1 минута.

---

## M5 · AI-консьерж: 3-вопросный онбординг

### M5.AUDIT

AI читает:
- Текущий system prompt AI-консьержа (если есть): `/packages/ai/prompts/`, `/supabase/functions/concierge/`, `/apps/*/api/concierge/`
- Текущую реализацию онбординга
- WhatsApp / Telegram webhook handlers
- Документы: `/docs/canonical/01-segmentation-framework.md` раздел 9.2 (3-вопросная логика)

### M5.GAP

Текущий AI-консьерж (если есть) не построен на 3-осевой сегментации. Либо вообще нет 3-вопросного онбординга, либо есть, но вопросы другие.

### M5.PLAN

1. Написать новый system prompt, опирающийся на canonical docs
2. Создать edge function `detect-persona` — принимает ответы на 3 вопроса, возвращает PersonaId + confidence + рекомендованные кластеры
3. Обновить онбординг-UI: 3 экрана, каждый — один вопрос, минимум визуального шума
4. Логировать ответы в `users.lifecycle_stage_history` + детектированную персону в `users.detected_persona`
5. **Не удалять** существующий онбординг сразу — запустить новый как `/onboarding/v2` параллельно, через 14 дней в prod заменить

### M5.PROMPT

```
ЗАДАЧА M5 · Запуск 3-вопросного AI-консьержа.

ПРЕРЕКВИЗИТЫ. M1, M2, M3 выполнены. Опционально M4 (каталог нужен для рекомендаций).

AUDIT.
1. Найди текущий system prompt AI-консьержа. Ищи в /packages/ai/, /supabase/functions/, /apps/*/api/.
2. Найди текущий онбординг-UI — где, как выглядит, сколько экранов.
3. Найди обработчик WhatsApp/Telegram webhook, если консьерж работает через мессенджеры.
4. Прочитай /docs/canonical/01-segmentation-framework.md разделы 4 (25 персон), 5 (10 кластеров), 9.2 (3 вопроса), 6 (матрица приоритетов).

ДИЗАЙН РЕШЕНИЯ.

3 вопроса онбординга:

ВОПРОС 1 · Как давно/надолго вы здесь?
Варианты (single select):
— Первый раз, на несколько дней (→ scout/tourist)
— Приезжаю каждый сезон (→ snowbird)
— Живу и работаю удалённо (→ nomad)
— Недавно переехал(а) / переезжаю (→ settler)
— Живу давно (→ resident)
— Не живу, но владею активом (→ absentee)
— Вернулся после перерыва (→ returnee)

ВОПРОС 2 · Что вас связывает с Пхукетом?
Варианты (single select):
— Отдыхаю / путешествую (→ consumer)
— Живу, обустраиваюсь (→ resident-user)
— Купил(а) недвижимость как инвестицию (→ investor-passive)
— Портфель из нескольких объектов (→ investor-active)
— Управляю недвижимостью / STR (→ operator)
— Я партнёр / подрядчик (→ provider)

ВОПРОС 3 · Что важно учесть?
Варианты (multi select):
— С детьми → family-young / family-school
— С питомцем → pet-owner
— Медицинская поездка → medical
— Халяль / религиозные практики → halal
— Кошер → kosher
— Доступная среда → accessibility
— ЛГБТК+ → lgbtq
— Спорт / тренировки → athlete
— Свадьба / юбилей → wedding
— Ничего из перечисленного → []

Логика детекции персоны: функция в /packages/shared/lib/segmentation.ts `detectPersona(lifecycle, role, modifiers[]): PersonaId`.

Таблица соответствий (из framework раздел 4.1 + 4.2) — жёстко зашитая в функцию:

tourist + consumer + [no modifiers] + lang=RU → P1
tourist + consumer + [] + lang=CN → P2
snowbird/tourist + consumer + [] + lang=DE → P3
nomad + consumer + [] → P4
snowbird + consumer/resident-user + [] → P5
settler + resident-user + [] + lang=RU → P6
any + resident-user + [family-*] → P7
absentee + investor-passive + [] → P8
any + investor-active + [] → P9
resident + operator + [] → P10
any + * + [halal] → P17 (halal override если есть)
any + * + [pet-owner] → P13 (дополняет, не override)
tourist + consumer + [medical] → P14
tourist + consumer + [wedding] → P15
any + * + [athlete] → P16
any + * + [lgbtq] → P18
any + * + [accessibility] → P19
resident + resident-user + household=retiree → P20
resident + provider + [] → P21 или P22 или P23 (уточнить вопросом 3b если provider)
nomad + consumer + [] + age<25 → P25

Confidence: если ответы укладываются в одну персону однозначно — 1.0. Если несколько вариантов — 0.5..0.9.

PLAN.

Шаг 1. Эндпоинт.
Создай Supabase edge function `detect-persona`:
- POST /functions/v1/detect-persona
- Body: { lifecycle: LifecycleStage, role: EconomicRole, modifiers: Modifier[], language: LanguageCode, household?: HouseholdType }
- Response: { persona: PersonaId, confidence: number, active_clusters: SituationCluster[], recommended_services: string[] }
- Функция вызывает detectPersona(), затем строит active_clusters по матрице из framework раздел 6, затем формирует recommended_services (6–8 услуг из каталога v2 по кластерам).

Шаг 2. System prompt.
В /packages/ai/prompts/concierge-v2.md положи new system prompt. Ключевые блоки:
- Identity: "Ты AI-консьерж myUNO. Ты не продаёшь — ты ориентируешь. Ты знаешь, что переезд и покупка недвижимости в чужой стране — это сложно."
- Tone: "Следуй /docs/canonical/03-tone-of-voice.md. Никаких 'лучший', 'уникальный', 'революционный'. Никаких восклицаний. Конкретные цифры и сроки."
- Flow: "При первом контакте — задаёшь 3 вопроса последовательно. Не все сразу. После 3-го — вызываешь detect-persona, показываешь 5–7 сервисов. Не больше."
- Escalation: "Сложные вопросы (HNW-сделки, юридические споры, экстренные ситуации) — эскалируй к человеку. Не придумывай ответы про законы."
- Знание: system prompt содержит краткую выжимку из /docs/canonical/01-segmentation-framework.md (25 персон в одной таблице) и перечень 16 категорий каталога из /docs/canonical/02-service-catalogue.md.

Шаг 3. UI.
Создай /apps/web/app/onboarding/v2/page.tsx — три шага, один вопрос на экран, stepper вверху. Используй shadcn/ui компоненты. Mobile-first. Итоговый экран — рекомендованные 5–7 сервисов карточками + CTA "Начать".

Шаг 4. Логирование.
После ответов — запиши в users.lifecycle_stage = ответ1, users.primary_role = ответ2, users.special_status = ответ3, users.detected_persona = результат edge function, users.active_clusters = результат edge function.

Шаг 5. Старый онбординг.
Не трогай. Оставь по адресу /onboarding (v1). Новый — на /onboarding/v2. A/B тестим (или просто сравниваем) 14 дней, потом переключаем роутинг.

ЧТО НЕ ДЕЛАТЬ.
— Не пиши промпт в коде — только в /packages/ai/prompts/*.md, импортируется оттуда.
— Не используй в промпте запрещённые слова из tone-of-voice (лучший, уникальный, революционный).
— Не передавай больше 6–8 рекомендованных сервисов — когнитивная нагрузка.
— Не делай онбординг обязательным — skip-кнопка есть на каждом шаге.

АКЦЕПТ.
— /onboarding/v2 работает локально.
— Edge function отвечает < 500ms.
— Для 10 тестовых комбинаций ответов — persona детектится корректно.
— Поля в БД заполняются.
— Старый онбординг продолжает работать.
```

### M5.ACCEPTANCE

- [ ] Edge function `detect-persona` покрыта тестами (минимум 10 комбинаций)
- [ ] System prompt в отдельном .md файле, версионируется
- [ ] Новый онбординг `/onboarding/v2` работает
- [ ] Старый онбординг не тронут
- [ ] Все 6 полей в БД заполняются
- [ ] Mobile-first (проверено на 375px)
- [ ] Tone of voice соблюдён — нет запрещённых слов

### M5.ROLLBACK

- Удалить роут `/onboarding/v2`
- Удалить edge function
- БД не трогаем (поля остаются, просто не заполняются)

---

## M6 · Лендинги персон и кластеров (25 + 10)

### M6.AUDIT

AI читает:
- Структуру `/apps/web/app/` — Next.js app router
- Существующие лендинги (`/for/owners`, `/for/investors` и т.д. если есть)
- SEO-инфраструктуру (sitemap, robots, meta tags generation)

### M6.GAP

В PROJECT_v2.2 упомянуты только 4 лендинга (`/for/owners`, `/for/investors`, `/for/families`, `/for/nomads`). Нужно 25 + 10.

### M6.PLAN

Не делать все 35 за раз. Сделать инфраструктуру и 3 шаблонных, остальные — batch после валидации.

1. Создать шаблон персонального лендинга `[persona]/page.tsx` с параметром
2. Создать конфиг `persona-landings.ts` — массив из 25 объектов с content per persona (H1, подзаголовок, боли, сервисы, CTA, FAQ)
3. Контент для первых 3 (P1 tourist, P9 HNW, P13 pet-owner) — от руки, с соблюдением tone of voice
4. Проверка SEO: meta, OG, schema.org Service, hreflang RU/EN
5. Остальные 22 — сгенерировать по шаблону, но **каждый прочитать и отредактировать вручную** перед публикацией
6. То же для 10 ситуационных лендингов

### M6.PROMPT

```
ЗАДАЧА M6 · Инфраструктура и первые лендинги для 25 персон.

ПРЕРЕКВИЗИТЫ. M1, M3 выполнены. M4 опционально (каталог для интеграции "Ключевые сервисы").

AUDIT.
1. Посмотри /apps/web/app/ (предполагаю Next.js app router).
2. Найди существующие /for/* лендинги если есть.
3. Зафиксируй как мы генерим sitemap, meta, OG.

PLAN.

Шаг 1. Шаблон.
Создай /apps/web/app/for/[persona]/page.tsx — динамический route.
- Получает persona slug (tourists, snowbirds, nomads, ...)
- Читает данные из /apps/web/content/persona-landings.ts
- 404 если persona не найдена

Шаг 2. Конфиг.
Создай /apps/web/content/persona-landings.ts со структурой:

```typescript
import { PersonaId } from '@myuno/shared';

export interface PersonaLanding {
  slug: string;                // URL-часть: "tourists"
  personaId: PersonaId;        // "P1"
  h1: string;                  // "Пхукет на 7–14 дней"
  subtitle: string;            // одно предложение о клиенте
  pains: string[];             // 3–5 болей, языком клиента
  services: string[];          // slug услуг из каталога, 5–7 штук
  bundle?: {                   // опциональный готовый pack
    name: string;
    price: string;
    contents: string[];
  };
  faq: Array<{ q: string; a: string }>;  // 5–8 FAQ
  cta: { text: string; href: string };
  ogImage: string;             // путь в /public/og/
  hreflang: { ru: string; en: string };
}

export const personaLandings: PersonaLanding[] = [
  // P1 · Tourist RU — готов
  // P9 · HNW — готов
  // P13 · Pet-owner — готов
  // остальные — placeholder { slug, h1: 'TODO', ... }
];
```

Шаг 3. Контент первых трёх — руками.

P1 · Tourist RU — slug "tourists":
- H1: "Пхукет на неделю-другую. Без ловушек."
- Subtitle: "Пакет ориентации на первые 72 часа: трансфер, SIM, обмен, SOS, карта района. От 1 499 THB."
- Pains: "Не знаю где менять деньги — боюсь плохого курса" / "Мотобайк — как не попасть на ложное списание ущерба" / "Заболел — куда идти без тайского" / "Хочу острова — но не знаю какие не попса"
- Services: ["airport-transfer", "exchangebot", "motoguard", "sos", "medifind", "island-tours"]
- Bundle: Welcome Pack · 1 499 THB · { трансфер, SIM, обмен, доступ к SOS, путеводитель по району }
- FAQ: 5 вопросов языком клиента
- CTA: "Начать" → /onboarding/v2

P9 · HNW — slug "hnw":
- Tone — максимально формальный.
- Bundle не показываем — это не "пакет", это mandate.
- FAQ — про ombudsman-статус, про DD, про структурирование.

P13 · Pet-owner — slug "pet-owners":
- Один H1 должен включать слово "питомец".
- Pains — конкретика: "Чип, прививки, сертификат здоровья — что когда делать?", "Pet-friendly вилла — почему их так мало?"
- Bundle: Pet Arrival Pack · 25 000 THB · { ввоз + первичный вет + 3 мес pet-sitter}

TONE OF VOICE. Строго /docs/canonical/03-tone-of-voice.md:
- Первое предложение — про клиента, не про нас.
- Конкретные цифры, сроки, стоимость.
- Раздел "Что не входит" или "Что нас беспокоит" — обязателен в каждом лендинге.
- Никаких "лучший", "уникальный", восклицаний, urgency.

Шаг 4. SEO.
- meta.title: formula "{H1} · myUNO"
- meta.description: subtitle + ключевая фраза
- OG: автогенерация из title + subtitle
- Schema.org Service на каждом лендинге
- Добавь пути в sitemap.xml динамически из personaLandings
- hreflang RU/EN

Шаг 5. Placeholder для остальных 22.
Создай заглушки со slug + personaId + h1 = "TODO" + status = "draft". Они не должны рендериться для публики — сделай проверку в page.tsx:
```typescript
if (landing.status === 'draft') notFound();
```

ЧТО НЕ ДЕЛАТЬ.
— Не генерируй контент для остальных 22 в этой задаче — это отдельная работа по 3–5 лендингов в неделю с ручной редактурой.
— Не создавай ситуационные лендинги (/arrival, /buying) — они в M6b.
— Не подключай аналитику A/B — сначала контент, потом оптимизация.

АКЦЕПТ.
— Роут /for/tourists, /for/hnw, /for/pet-owners работает.
— Tone of voice соблюдён (попроси проверить Павла или сверь вручную с /docs/canonical/03-tone-of-voice.md чек-листом из раздела 14).
— Mobile-first.
— Meta и OG генерятся.
— Остальные 22 персоны — в конфиге с status: 'draft'.
```

### M6.ACCEPTANCE

- [ ] 3 живых лендинга работают
- [ ] Все 25 персон присутствуют в конфиге (3 live + 22 draft)
- [ ] Tone of voice прошёл чек-лист
- [ ] SEO meta/OG/schema.org работают
- [ ] Sitemap обновлён
- [ ] Mobile 375px проходит

### M6.ROLLBACK

Удалить ветку роутов `/for/` новые персоны. Существующие (если были) — не тронуты.

---

## M7 · Tone of Voice в продукте

### M7.AUDIT

AI проходит по всему приложению и собирает:
- Все CTA-кнопки (inline grep `<Button` / `<button`)
- Все empty states
- Все error messages
- Все toast notifications
- Все email templates
- Все WhatsApp/Telegram message templates
- Alt text на картинках

### M7.GAP

В текущих текстах есть: восклицательные знаки, urgency-язык, "лучший/уникальный/революционный", "узнать больше" вместо "подробнее", "попробуйте ещё раз" без конкретики, "упс, что-то пошло не так" и подобные.

### M7.PLAN

1. **Не переписывать всё сразу.** Это месяцы работы.
2. Создать централизованный i18n-файл / dictionary для всех UI-текстов
3. Пройти по ключевым экранам в приоритете:
   - Onboarding + регистрация (первое впечатление)
   - Emergency SOS (trust-критично)
   - Платёжные экраны (trust-критично)
   - Ошибки и empty states (всё приложение)
4. По остальным — постепенно, еженедельные PR по категориям
5. Создать lint-правило, которое ругается на запрещённые слова в текстах

### M7.PROMPT

```
ЗАДАЧА M7 · Применить Tone of Voice к существующему интерфейсу.

ПРЕРЕКВИЗИТЫ. M1 выполнен. Остальные — опционально.

AUDIT.
Пройди по репо и собери отчёт (в виде /docs/canonical/tone-audit.md):

1. CTA кнопки — список всех текстов, где встречаются. Ищи компоненты Button с children:string. Собери уникальные значения + пути к файлам.
2. Toast / notification — все вызовы toast.*, notify.*.
3. Error messages — все throw new Error("...") с user-facing текстом + error boundaries.
4. Empty states — компоненты EmptyState, NoData.
5. Email templates — /emails/, /templates/email/.
6. WhatsApp/Telegram templates — /packages/ai/messages/ или /bot/templates/.
7. Alt text — <Image alt="..." /> — хотя бы выборочно.

Категоризируй каждую строку:
- ✅ OK (соответствует tone of voice)
- ⚠️ Edge (формально OK, но можно улучшить)
- ❌ Нарушает (urgency, "лучший", восклицания, панибратство, расплывчатость)

PLAN.

Шаг 1. Dictionary.
Если i18n-решение уже есть (next-intl, i18next) — используй. Если нет — создай /packages/shared/i18n/ui-strings.ts со структурой:

```typescript
export const ui = {
  cta: {
    primary: { ru: 'Начать', en: 'Start' },
    submit: { ru: 'Подать', en: 'Submit' },
    details: { ru: 'Подробнее', en: 'Details' },
    contact: { ru: 'Написать нам', en: 'Contact us' },
    // ...
  },
  empty: {
    noProperties: { ru: 'Пока нет объектов. Когда появятся — увидите их здесь.', en: '...' },
    noTransactions: { ru: 'История пуста. Первая транзакция появится после оплаты.', en: '...' },
  },
  errors: {
    networkFail: {
      ru: 'Не удалось отправить. Проверьте соединение и попробуйте снова. Если ошибка повторяется — напишите нам.',
      en: '...'
    },
  },
  success: {
    paymentDone: { ru: 'Платёж отправлен. Деньги в escrow до подтверждения.', en: '...' },
  },
};
```

Шаг 2. Замена в приоритетных потоках.
Сначала (и в этой задаче — только это):
1. Онбординг и auth — замени все тексты на ui.cta.*, ui.errors.*.
2. Emergency SOS экран — тексты максимально сжатые, см. tone of voice раздел 10.1.
3. Payment flow — следовать tone of voice раздел 10.3.
4. Toast-уведомления глобально (их обычно 20–40 штук).

Остальные экраны — отдельными PR-ами по неделе, по разделу.

Шаг 3. Lint-правило.
Создай /packages/eslint-config/rules/no-forbidden-tone.js — custom ESLint rule, который ругается на строковые литералы со словами:
- "лучший", "лучшая", "лучшие", "best"
- "уникальный", "unique"
- "революционный", "revolutionary"
- "срочно", "только сегодня", "не упустите", "hurry", "don't miss"
- "Упс"
- эмодзи ⭐⭐⭐ (три и более подряд)

Включи rule как warn в dev, error в CI.

Шаг 4. Storybook или preview.
Если есть Storybook — добавь story "Tone of Voice · Examples" с эталонными примерами из раздела 13 tone-of-voice документа. Любой разработчик может открыть и сверить свой новый текст.

ЧТО НЕ ДЕЛАТЬ.
— Не переписывать всё за раз. Приоритет — онбординг, SOS, платежи.
— Не менять тексты в юридических документах без ревью юриста.
— Не менять тексты для HNW-сегмента (Ignatev Capital) — там ещё более формальный регистр.
— Не удалять дефолтные строки из i18n пока они в использовании.

АКЦЕПТ.
— /docs/canonical/tone-audit.md создан.
— Онбординг, SOS, payment flow — полностью в новой тональности.
— Toast-уведомления — в новой тональности.
— ESLint rule работает, CI падает на запрещённых словах.
— Остальные экраны — в backlog с приоритетом по категориям.
```

### M7.ACCEPTANCE

- [ ] Аудит-документ составлен с категоризацией
- [ ] Онбординг, SOS, платежи — в новом голосе
- [ ] i18n-dictionary подключён
- [ ] ESLint rule активен
- [ ] Бэклог для остальных экранов составлен

### M7.ROLLBACK

Каждая замена — отдельный коммит. Revert по одному.

---

## 8 · Общий мастер-промпт для AI-инженера

Если Павел хочет дать AI-агенту **одну команду**, которая запустит всю последовательность:

```
Ты AI-инженер на проекте myUNO. У нас есть три канонических документа
и операционный протокол внедрения (этот файл, /docs/canonical/04-implementation-protocol.md).

ЗАДАНИЕ. Выполнить вехи M1 → M7 в последовательности, указанной в протоколе.

ПРАВИЛА.
1. Каждая веха — отдельный PR.
2. Перед началом вехи — читаешь AUDIT, пишешь в комментарий PR результат audit.
3. Следуешь PLAN пошагово.
4. Каждый шаг — отдельный коммит с conventional commit message (feat, fix, docs, refactor).
5. После всех шагов — проверяешь ACCEPTANCE чек-лист.
6. Если что-то противоречит canonical docs — ОСТАНАВЛИВАЕШЬСЯ и пишешь вопрос в PR.
7. Между вехами — ждёшь merge предыдущего PR в main.

СТАРТ. Начни с M1. Когда M1 PR будет смёржен — переходи к M2.

Если в процессе любой вехи обнаруживаешь:
- Нарушение одной из констант проекта (public schema, TS strict, mobile-first, bilingual)
- Риск breaking change в продакшене
- Противоречие в canonical-документах
- Неочевидный технический выбор
— ОСТАНАВЛИВАЕШЬСЯ и задаёшь вопрос в комментарии PR с тегом @Pavel.

Не беги вперёд. Не делай "заодно". Не оптимизируй. Не рефакторь лишнего.
Принцип: одна веха — один PR — один мёрдж — следующая веха.
```

---

## 9 · Таблица сводных зависимостей и времени

| Веха | Название | Зависит от | Сложность | Оценка времени AI-инженера |
|---|---|---|---|---|
| M1 | Загрузка canonical docs | — | ⭐ low | 30 мин |
| M2 | Расширение схемы БД | M1 | ⭐⭐⭐ medium | 3–5 часов |
| M3 | TypeScript-типы | M2 | ⭐⭐ low-medium | 2–3 часа |
| M4 | Каталог v1→v2 | M1, M3 | ⭐⭐ medium (A) / ⭐⭐⭐⭐ high (B) | 2 ч (A) / 1–2 дня (B) |
| M5 | AI-консьерж онбординг | M1, M2, M3 | ⭐⭐⭐⭐ high | 1–2 дня |
| M6 | Лендинги персон | M1, M3 (M4 опц.) | ⭐⭐⭐ medium + content | 1 день инфраструктура + по 1–2 часа на лендинг |
| M7 | Tone of Voice | M1 | ⭐⭐⭐ medium (audit) + итеративно | 1 день audit + еженедельные спринты |

**Суммарная оценка критического пути:** 3–5 дней работы AI-инженера + ручная редактура контента + QA.

---

## 10 · Что делать прямо сейчас — минимальное действие

Если у тебя сейчас есть 30 минут и ты хочешь начать движение:

1. Скачай три canonical-документа из /outputs и положи в папку проекта
2. Скопируй «Общий мастер-промпт» из раздела 8 выше
3. Открой Cursor или Claude Code в репозитории myUNO
4. Прикрепи 4 файла (3 canonical + этот protocol)
5. Вставь промпт
6. Нажми «Start»
7. Проверь первый PR на соответствие M1.ACCEPTANCE
8. Смёрдж, дай команду продолжать

AI-инженер сделает M1 за полчаса. Это будет безопасный фундамент, после которого уже можно спокойно запускать M2.

---

## 11 · Приложение · Какой документ когда применяется

| Твой вопрос / ситуация | Открой документ |
|---|---|
| «Кто наш клиент в этом сценарии?» | `01-segmentation-framework.md` разделы 4–6 |
| «Какие услуги показать этому клиенту?» | `02-service-catalogue.md` + раздел 6 framework |
| «Как написать этот текст?» | `03-tone-of-voice.md` разделы 5–13 |
| «Как это встроить в систему?» | Этот файл (`04-implementation-protocol.md`) |
| «Новый сервис — куда его положить?» | framework раздел 13 (5 вопросов приоритизации) |
| «Конфликт между документами» | Спросить Павла, CHANGELOG фиксирует разрешение |

---

*Документ живой. Обновляется после каждой завершённой вехи с фиксацией lessons learned.*
*Ведущий: CTO / AI-оркестратор. Утверждает: Павел.*
