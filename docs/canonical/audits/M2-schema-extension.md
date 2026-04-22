# M2 · Schema Extension Audit (lifecycle + role + modifiers)

> **Дата:** 2026-04-22
> **Веха протокола:** M2 (Расширение Supabase-схемы)
> **Статус:** ✅ done — 3 миграции применены в production
> **Owner:** Pavel
> **Канон:** [`01-segmentation-framework.md`](../01-segmentation-framework.md) § 5, § 12

---

## TL;DR

> M2 завершена smart-additive стратегией: **13 новых колонок** в `profiles`, **3 новых enum**, **3 security definer функции** для канонического маппинга ролей, **1 view** с inline-маппингом. Существующие данные (6 профилей) бэкфилены defaults без угадывания. **Zero breaking changes**, существующий код продолжает работать.

---

## 1 · Решения архитектора (зафиксировано @Pavel)

| Развилка | Решение | Обоснование |
|----------|---------|-------------|
| Role taxonomy (канон vs `app_role`) | **Map canonical → existing app_role** | Минимум breaking changes. Существующие 17 ролей не трогаем. |
| Profile fields strategy | **Smart additive** | Переиспользуем `preferred_language`, `nationality`, `family_member_ids`. Добавляем только то, чего нет. |
| Migration cadence | **3 группы вместо 8** | Компромисс между атомарностью и количеством approve-циклов. |
| Production safety | **Прямо в production** | Согласно CLAUDE.md § 4: «отдельного staging нет, миграции аддитивные → регрессия = 0». |

---

## 2 · Что сделано

### 2.1 Migration 1/3 — Enums + columns + indexes

**Новые enum:**
- `public.lifecycle_stage` — 8 значений: `scout, tourist, snowbird, nomad, settler, resident, absentee, returnee`
- `public.household_type_enum` — 5 значений: `solo, couple, family_with_kids, family_extended, group_friends`
- `public.language_code` — 3 значения: `ru, en, th` (расширяемый при добавлении ZH/KO/JA)

**Новые колонки в `public.profiles` (13 шт.):**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `lifecycle_stage` | `lifecycle_stage` | NULL | Жизненная фаза (ось 1) |
| `lifecycle_stage_history` | `jsonb` | `'[]'` | История переходов |
| `first_visit_at` | `timestamptz` | NULL | Дата первого визита |
| `total_days_in_thailand` | `integer` | `0` | Накопленные дни в стране |
| `visits_count` | `integer` | `0` | Число визитов |
| `next_lifecycle_stage_eta` | `date` | NULL | Прогноз следующей фазы |
| `household_type` | `household_type_enum` | NULL | Тип домохозяйства (модификатор) |
| `special_status` | `text[]` | `'{}'` | pet-owner, medical, halal, kosher, accessibility, lgbtq, athlete, wedding |
| `kids_ages` | `integer[]` | `'{}'` | Возрасты детей |
| `detected_persona` | `text` | NULL | P1..P25 (заполняет AI в M5) |
| `detected_persona_confidence` | `numeric(3,2)` | NULL | 0..1 |
| `active_clusters` | `text[]` | `'{}'` | A..J (10 кластеров) |
| `triggers_active` | `text[]` | `'{}'` | Активные триггеры из канона |

**CHECK constraints:**
- `detected_persona ~ '^P([1-9]|1[0-9]|2[0-5])$'` — формат `P1..P25`
- `detected_persona_confidence ∈ [0,1]`
- `active_clusters ⊆ {A..J}`

**Индексы:**
- B-tree: `lifecycle_stage`, `detected_persona`, `household_type` (с partial WHERE NOT NULL)
- GIN: `special_status`, `active_clusters`, `triggers_active`

### 2.2 Migration 2/3 — Canonical role mapping (без расширения `app_role`)

**Маппинг (документирован в SQL-комментариях):**

| Canonical role | ← Mapped from `app_role` | Priority |
|----------------|--------------------------|----------|
| `provider` | `vendor`, `partner` | highest |
| `operator` | `property_owner`, `owner` | |
| `investor-active` | `broker` | |
| `investor-passive` | `investor` | |
| `resident-user` | `resident` | |
| `consumer` | `user`, `guest`, `tourist` (default) | lowest |

**Функции (3 шт., все `SECURITY DEFINER` + `SET search_path = public`):**

```sql
public.get_canonical_primary_role(_user_id uuid) RETURNS text
public.get_canonical_secondary_roles(_user_id uuid) RETURNS text[]
public.has_canonical_role(_user_id uuid, _canonical_role text) RETURNS boolean
```

**View `public.v_profiles_canonical`:**
- `WITH (security_invoker = true)` — наследует RLS от `profiles`
- Inline subquery маппит `user_roles → canonical` (без вызова security definer функций — иначе линтер 0010 сработает)
- Содержит все 13 канонических полей + `canonical_primary_role` + `canonical_all_roles`

### 2.3 Migration 3/3 — Backfill + sanity

**Бэкфилл (6 существующих профилей):**
- `total_days_in_thailand` NULL → `0`
- `visits_count` NULL → `0`
- `special_status`, `kids_ages`, `active_clusters`, `triggers_active` NULL → `{}`
- `lifecycle_stage_history` NULL → `[]`
- **НЕ трогаем:** `lifecycle_stage`, `detected_persona`, `household_type` — заполняет онбординг (M5+)

**Sanity check:** 0 нарушений CHECK constraints.

---

## 3 · Acceptance verified

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 13 новых колонок добавлены в `profiles` | ✅ | `information_schema.columns` query returns 13 |
| 3 enum созданы | ✅ | `pg_type` query confirms |
| 3 функции маппинга существуют | ✅ | `information_schema.routines` query |
| View `v_profiles_canonical` создан с `security_invoker=true` | ✅ | Linter 0010 не срабатывает |
| Бэкфилл выполнен | ✅ | 6/6 профилей: `days_zeroed=6, status_empty=6, lifecycle_null=6` |
| RLS-политики работают для новых полей | ✅ | Существующие политики `profiles` автоматически покрывают новые колонки |
| Zero breaking changes | ✅ | Все ALTER TABLE — `ADD COLUMN IF NOT EXISTS`, существующий код работает |
| Линтер чистый (по M2-изменениям) | ✅ | Остался только pre-existing `Extension in Public` warn |

---

## 4 · Линтер: pre-existing warning

**`Extension in Public` (WARN, не error):**
- **НЕ создан M2** — миграции не делали `CREATE EXTENSION`
- Замаркирован как `ignore` с пометкой "out of M2 scope"
- Будет адресован в отдельной infrastructure cleanup PR

---

## 5 · Использование (для следующих вех)

### В app-коде

```ts
// Старый способ (продолжает работать)
const { data } = await supabase.from('profiles').select('*').eq('id', userId);

// Новый способ — с каноническим маппингом ролей
const { data } = await supabase
  .from('v_profiles_canonical')
  .select('*, canonical_primary_role, canonical_all_roles')
  .eq('id', userId);
```

### В RLS-политиках (M3+)

```sql
-- Пример: только operators (УК + собственники) видят строку
CREATE POLICY "operators_only" ON public.some_table
FOR SELECT USING (public.has_canonical_role(auth.uid(), 'operator'));
```

### В AI-агентах (M5)

```sql
-- Заполнение detected_persona через AI persona-detector
UPDATE public.profiles
SET detected_persona = 'P3',
    detected_persona_confidence = 0.87,
    active_clusters = ARRAY['A','C','F'],
    triggers_active = ARRAY['visa_expires_30d', 'first_property_inquiry']
WHERE id = $1;
```

---

## 6 · Не сделано (out of M2 scope)

- ❌ `service_tags` table — в M4 (рефактор каталога услуг v1→v2)
- ❌ `persona_templates` table — в M4
- ❌ Backfill `kids_ages` из `family_members` table — таблицы не существует, отложено
- ❌ Регенерация `src/integrations/supabase/types.ts` — Lovable Cloud делает автоматически
- ❌ Frontend hooks под новые поля — в M3 (TS-типы и API-контракты)

---

## 7 · Rollback

Если M2 нужно откатить:

```sql
-- Снять CHECK constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_detected_persona_format_chk;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_persona_confidence_range_chk;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_clusters_format_chk;

-- Удалить view + функции
DROP VIEW IF EXISTS public.v_profiles_canonical;
DROP FUNCTION IF EXISTS public.has_canonical_role(uuid, text);
DROP FUNCTION IF EXISTS public.get_canonical_secondary_roles(uuid);
DROP FUNCTION IF EXISTS public.get_canonical_primary_role(uuid);

-- Удалить колонки
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS lifecycle_stage,
  DROP COLUMN IF EXISTS lifecycle_stage_history,
  DROP COLUMN IF EXISTS first_visit_at,
  DROP COLUMN IF EXISTS total_days_in_thailand,
  DROP COLUMN IF EXISTS visits_count,
  DROP COLUMN IF EXISTS next_lifecycle_stage_eta,
  DROP COLUMN IF EXISTS household_type,
  DROP COLUMN IF EXISTS special_status,
  DROP COLUMN IF EXISTS kids_ages,
  DROP COLUMN IF EXISTS detected_persona,
  DROP COLUMN IF EXISTS detected_persona_confidence,
  DROP COLUMN IF EXISTS active_clusters,
  DROP COLUMN IF EXISTS triggers_active;

-- Удалить enum
DROP TYPE IF EXISTS public.language_code;
DROP TYPE IF EXISTS public.household_type_enum;
DROP TYPE IF EXISTS public.lifecycle_stage;
```

Поскольку колонки nullable и без FK — rollback безопасен.

---

## 8 · Готовность к M3

✅ M3 (TypeScript types + API contracts) **разблокирован**.
- `src/integrations/supabase/types.ts` автоматически регенерируется Lovable Cloud
- Можно создавать TS-типы `LifecyclePhase`, `CanonicalRole`, `PersonaCode`
- Hooks `useUserProfile()`, `useCanonicalRole()` — задача M3

— конец отчёта —
