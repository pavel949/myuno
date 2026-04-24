

# Унификация CRM — план без потери MC-клиента

## Главный вывод по данным

| Таблица | Строк | Владелец | RLS |
|---|---|---|---|
| `crm_contacts` (MC CRM) | **386 живых** | `company_id` (multi-tenant MC) | по company_id + members |
| `capital_contacts` (Capital CRM) | 0 | `user_id` (per-agent) | personal |
| `vendor_prospects` (Admin аутрич) | 0 | `assigned_manager_id` | admin + assignee |

**Решение продиктовано данными:** MC уже работает на `crm_contacts` (386 контактов, 90+ полей, lifecycle, KYC, addresses, pipeline_stage). Эта таблица — самая зрелая и единственная, где есть real-money data. **Сливать таблицы нельзя** — это сломает RLS и данные клиента. Можно и нужно унифицировать **слой выше** — единый интерфейс контакта с маршрутизацией по контексту.

## Архитектурный принцип

**Не «один CRM», а «один контакт — три pipeline».** Один человек (Иван Петров) может одновременно быть:
- арендатором у MC (запись в `crm_contacts`)
- инвестором в Capital pipeline (запись в `capital_contacts`)
- не быть vendor prospect

Сейчас это три не связанные записи. Цель — **связать их через `linked_user_id` / `email` / `phone`**, не объединяя физически.

```text
                    ┌─────────────────────────┐
                    │  UnifiedContact (view)  │  ← один SELECT по 3 таблицам
                    │  + identity matching    │
                    └────────────┬────────────┘
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
       crm_contacts        capital_contacts   vendor_prospects
       (MC tenant)         (Capital agent)    (Admin acquisition)
       386 строк           0                   0
```

## План в 4 этапа

### Этап 1 — Identity layer (zero-risk, без миграций данных)

Создать таблицу `contact_identities` — единый идентификатор «человека» поверх трёх pipeline:

```text
contact_identities (
  id uuid PK,
  primary_email citext,
  primary_phone text,
  primary_user_id uuid (FK → auth.users, nullable),
  display_name text,
  created_at timestamptz
)

contact_identity_links (
  identity_id uuid FK,
  source_table text  -- 'crm_contacts' | 'capital_contacts' | 'vendor_prospects'
  source_id uuid,
  PRIMARY KEY (source_table, source_id)
)
```

И SQL-функция `find_or_create_identity(email, phone, user_id)` — вызывается из триггеров на INSERT в каждую из 3 таблиц. Старые данные не трогаем — backfill идёт асинхронно.

**Эффект для MC-клиента:** ноль ломающих изменений. Их 386 контактов остаются на месте, RLS не меняется, ни одно поле не переименовано.

### Этап 2 — Unified Contact View (read-only слой)

Postgres VIEW `v_unified_contacts` объединяет все 3 источника в один список с одинаковыми колонками + `pipelines: text[]` (массив pipeline-ов, в которых контакт есть). RLS — `SECURITY INVOKER` (наследует политики от исходных таблиц), значит:
- MC видит только свои crm_contacts
- Capital agent видит только свои capital_contacts
- Admin видит всё

В UI добавляется компонент `<UnifiedContactCard contact={…} />` — показывает все pipeline-ы, в которых контакт присутствует (бейджи MC / Capital / Vendor).

### Этап 3 — Чистка дублей в UI (без миграций)

Сейчас три URL-зоны делают почти одно и то же. Финальная карта:

| Зона | Назначение | Источник данных | Кто видит |
|---|---|---|---|
| `/mc/contacts` | Контакты конкретной MC | `crm_contacts WHERE company_id=…` | MC team |
| `/capital/contacts` | Лиды отдела недвижимости | `capital_contacts WHERE user_id=…` | Capital agents + admin |
| `/admin/crm` | Вендоры/Owner outreach + платформенный обзор | `vendor_prospects` + `v_unified_contacts` (read-only) | Admin |

Удаляются:
- Дубль вкладок «Vendors» (4 компонента: `VendorProspectsPipeline/Table/Stats` + `AdminVendorProspects`) → один `<VendorProspectsHub />` с тремя view-режимами
- `vendorView` switch в `AdminCRM.tsx` остаётся, но `AdminVendorProspects.tsx` редиректит на `/admin/crm?tab=vendors`
- Дублирующиеся outreach точки (`/admin/crm?tab=outreach`, `/capital/outreach`, `/mc/sequences`) сводятся к одному движку `outreach_campaigns` с 3 view: «вендоры», «инвесторы», «гости/клиенты MC»

**Что остаётся у MC-клиента:** всё. URL `/mc/contacts`, импорт, дубликаты, заметки, документы, задачи, sequences, automations — без изменений. Только в карточке контакта появляется блок «Также в Capital pipeline» (если матч найден).

### Этап 4 — Outreach Engine consolidation

Сейчас есть 3 параллельных движка:
- `outreach_campaigns` (Capital)
- `crm_sequences` (MC)
- `vendor_outreach_*` (Admin)

Унификация: 
- Базовая таблица `outreach_campaigns` (есть в Capital) расширяется полями `company_id` (nullable — для MC) и `audience_type` (`vendor` | `investor` | `guest` | `owner`)
- MC-овские sequences остаются, но новые создаются через единый интерфейс
- Edge-функция `outreach-runner` принимает любой campaign и роутит по audience

Это уже последний шаг — делаем после того, как стабилизируется identity layer.

## Что НЕ делаем (явно)

- ❌ **Не мигрируем `crm_contacts` в новую таблицу** — потеряем 386 контактов клиента и сломаем RLS
- ❌ **Не объединяем три таблицы в одну** — разные модели владения (`company_id` vs `user_id` vs `assigned_manager_id`)
- ❌ **Не удаляем `/mc/*` CRM** — это рабочий инструмент клиента
- ❌ **Не трогаем `useCrmContacts.ts`** — на нём держится MC-витрина (24 файла зависят)
- ❌ **Не делаем migration big-bang** — все 4 этапа независимы и обратимы

## Технические детали (по этапам)

### Миграции БД (этап 1)

1. `CREATE EXTENSION IF NOT EXISTS citext`
2. `CREATE TABLE contact_identities (…)` + `contact_identity_links (…)`
3. `CREATE FUNCTION find_or_create_identity(…)` — `SECURITY DEFINER`, нормализует email/phone, возвращает identity_id
4. Триггеры `AFTER INSERT/UPDATE` на `crm_contacts`, `capital_contacts`, `vendor_prospects` — вызывают функцию
5. RLS на `contact_identities`: `SELECT` для всех authenticated, `INSERT/UPDATE` только через функцию
6. Backfill-скрипт для 386 существующих `crm_contacts` (one-shot, идёт фоном)

### View (этап 2)

```sql
CREATE VIEW v_unified_contacts AS
SELECT 
  ci.id as identity_id, 
  ci.display_name,
  ci.primary_email, ci.primary_phone,
  array_agg(cil.source_table) as pipelines,
  jsonb_object_agg(cil.source_table, cil.source_id) as source_ids
FROM contact_identities ci
JOIN contact_identity_links cil ON cil.identity_id = ci.id
GROUP BY ci.id;
```

### Новые файлы кода

- `src/hooks/useUnifiedContact.ts` — fetch единой identity + pipelines
- `src/components/crm/UnifiedContactCard.tsx` — карточка с pipeline-бейджами
- `src/components/crm/CrossPipelineBanner.tsx` — баннер «этот контакт также в Capital pipeline»

### Изменения в существующем коде (минимальные)

- `src/pages/owner/ContactDetail.tsx` — добавить `<CrossPipelineBanner />` в шапку
- `src/pages/capital/CapitalContactDetail.tsx` — то же
- `src/pages/admin/AdminCRM.tsx` — Activity tab дополнить «cross-pipeline events»
- Удалить дубль роута `AdminVendorProspects` → редирект (1 строка)

### Откат

Каждый этап откатывается независимо:
- Этап 1: `DROP TABLE contact_identities CASCADE` — данные клиента не задеты
- Этап 2: `DROP VIEW v_unified_contacts`
- Этап 3: только UI-изменения, git revert
- Этап 4: campaign-таблица расширяется новыми nullable-полями — откат через `DROP COLUMN`

## Резюме одной фразой

**Три таблицы остаются, MC-клиент не замечает изменений, но появляется identity-слой, который связывает одного человека во всех трёх pipeline-ах. Дубли убираются на UI-уровне, не на data-уровне.**

Если одобряешь — начинаю с **Этапа 1** (миграция БД + identity layer + триггеры). Это ~30 минут работы, ноль риска для MC-клиента, и сразу даёт основу для всего остального.

