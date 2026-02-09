

# LifeOS Taxonomy Rebuild: 3-Level Data Model

## Current State Analysis

### What exists today (flat, 2-level model):

```text
life_situations (12 rows, 11 active)
    |
    +-- catalog_life_map (590 rows) -- direct entity_id -> situation binding
    |
    +-- lifeos_routes (9 rows) -- empathy/guided-path layer
```

### Anti-patterns identified:

| Problem | Example | Impact |
|---|---|---|
| Situations masquerading as verticals | `investment_property` is a vertical, not a life context | Blurs the taxonomy boundary |
| Situations masquerading as events | `wedding_event`, `departure_day` are time-bound events, not stable life states | Inflates the root level |
| No scenario layer | "First day at airport" and "Need a SIM card" live at the same level as "Living in Phuket" | Cannot distinguish urgency or sub-context |
| No task layer | 590 entity mappings are raw entity_id bindings without actionable intent | AI cannot reason about "what the user needs to DO" |
| `lifeos_routes` is a parallel empathy layer | 9 hand-crafted routes with pain/emotional fields | Useful but disconnected from scenario/task hierarchy |

### What works well (preserve):

- `lifeos_governance` (constraints, health monitoring)
- `life_os_catalog` view (unified entity read layer)
- `resolve_life_os_context` RPC (resolver pattern)
- `catalog_life_map` pattern of entity_type + entity_id binding
- Hooks: `useLifeOS`, `useLifeOSRoutes`, `useLifeOSGovernance`
- Admin UI: `AdminLifeSituations`, `LifeOSMappingsTab`, `LifeOSAuditTab`

---

## Target Architecture: 3 Levels

```text
LEVEL 1: life_situations (7-8 root, STABLE)
    "I'm arriving" / "I'm living here" / "I need help"
    |
LEVEL 2: life_scenarios (contextual sub-situations)
    "First day from airport" / "Settling into routine" / "Emergency"
    |
LEVEL 3: life_tasks (actionable needs)
    "Get from airport to hotel" / "Find a doctor now"
    |
BINDING: task_entity_map (task -> entity_type + entity_id)
    Links tasks to actual platform entities
```

---

## Step 1: Consolidate Root Life Situations

### Current 11 active -> Target 7 stable roots:

| New Code | New Title EN | New Title RU | Merges From |
|---|---|---|---|
| `arrival` | Arrival & First Days | Прибытие и первые дни | `arrival_first_day` + `pre_trip_planning` + `departure_day` (as scenarios) |
| `living` | Daily Life | Повседневная жизнь | `long_term_living` + `retirement_living` (as scenario) |
| `leisure` | Leisure & Experiences | Отдых и впечатления | `vacation_leisure` + `wedding_event` (as scenario) |
| `health` | Health & Safety | Здоровье и безопасность | `emergency_medical` (stays, expanded) |
| `family` | Family & Kids | Семья и дети | `family_with_children` (stays) |
| `business` | Business & Work | Бизнес и работа | `business_work` (stays) |
| `property` | Property & Investment | Недвижимость и инвестиции | `investment_property` + `relocation_visa` property aspects |
| `relocation` | Relocation & Legals | Переезд и документы | `relocation_visa` (stays, narrower) |

### Why 7-8, not 12:
- 7 fits a single mobile screen row without scrolling or "show more" hacks
- Each root represents a genuinely distinct LIFE DOMAIN
- Sub-contexts move to Level 2 (scenarios)

---

## Step 2: Create `life_scenarios` Table

New table:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `life_situation_id` | uuid, FK -> life_situations | Parent root |
| `code` | text, unique | e.g. `arrival.first_day`, `arrival.pre_trip` |
| `title_en` | text | |
| `title_ru` | text | |
| `description_en` | text, nullable | |
| `description_ru` | text, nullable | |
| `urgency_level` | text | `low`, `medium`, `high`, `critical` |
| `icon` | text, nullable | |
| `priority` | int | Sort within parent |
| `is_active` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

### Initial scenarios (examples per root):

**arrival:**
- `arrival.pre_trip` -- Planning before arrival (low urgency)
- `arrival.first_day` -- Just landed, need essentials (high)
- `arrival.departure` -- Leaving the island (medium)

**living:**
- `living.settling_in` -- First month, setting up (medium)
- `living.daily_routine` -- Established life (low)
- `living.retirement` -- Senior-specific needs (low)

**leisure:**
- `leisure.vacation` -- Tourist activities (low)
- `leisure.celebration` -- Wedding, birthday, event (medium)
- `leisure.nightlife` -- Evening activities (low)

**health:**
- `health.emergency` -- Urgent medical (critical)
- `health.checkup` -- Routine medical (low)
- `health.wellness` -- Gym, spa, wellbeing (low)

**family:**
- `family.childcare` -- Schools, babysitters (medium)
- `family.activities` -- Kid-friendly things to do (low)
- `family.pets` -- Pet relocation, vet (medium)

**business:**
- `business.remote_work` -- Coworking, internet (low)
- `business.company_setup` -- Registration, legal (high)
- `business.networking` -- Events, meetups (low)

**property:**
- `property.rental` -- Finding a place to live (medium)
- `property.purchase` -- Buying property (high)
- `property.management` -- Managing owned property (low)

**relocation:**
- `relocation.visa` -- Visa applications (high)
- `relocation.banking` -- Bank accounts, finances (medium)
- `relocation.documents` -- Insurance, contracts (medium)

---

## Step 3: Create `life_tasks` Table

New table:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `life_scenario_id` | uuid, FK -> life_scenarios | Parent scenario |
| `code` | text, unique | e.g. `arrival.first_day.airport_transfer` |
| `title_en` | text | Actionable: "Get from airport to hotel" |
| `title_ru` | text | |
| `task_type` | text | `service`, `product`, `experience`, `info` |
| `priority` | int | Sort within scenario |
| `is_active` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

### Example tasks:

**arrival.first_day:**
- `arrival.first_day.airport_transfer` -- "Get from airport to hotel" (service)
- `arrival.first_day.sim_card` -- "Get a local SIM card" (product)
- `arrival.first_day.first_meal` -- "Find a place to eat nearby" (experience)
- `arrival.first_day.cash_exchange` -- "Exchange money or find ATM" (info)

**health.emergency:**
- `health.emergency.hospital` -- "Get to nearest hospital" (service)
- `health.emergency.insurance_check` -- "Check insurance coverage" (info)
- `health.emergency.pharmacy` -- "Find 24h pharmacy" (service)

---

## Step 4: Create `task_entity_map` (replaces `catalog_life_map`)

New binding table:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `life_task_id` | uuid, FK -> life_tasks | Which task this entity fulfills |
| `entity_type` | text | `transfer`, `clinic`, `restaurant`, etc. |
| `entity_id` | uuid | Actual entity row ID |
| `relevance_weight` | int | 0-100, how well it fulfills the task |
| `role_scope` | text[] | `guest`, `resident`, `owner`, `investor` |
| `rules` | jsonb | Extensible metadata |
| `is_active` | boolean | |
| `created_at` / `updated_at` | timestamptz | |

### Migration strategy for existing 590 `catalog_life_map` rows:
1. Each old mapping had `life_situation_id` + `entity_type` + `entity_id`
2. Map old situation to new scenario (most specific match)
3. Map old entity_type to a task within that scenario
4. Preserve `weight` as `relevance_weight`, preserve `role_scope` and `rules`
5. Keep `catalog_life_map` as deprecated (read-only) until full migration verified

---

## Step 5: Backward Compatibility Bridge

To avoid breaking existing code (hooks, admin, RPC), we:

1. **Keep `catalog_life_map` populated** via a trigger or materialized view that flattens `task_entity_map` back to the old format
2. **Update `resolve_life_os_context` RPC** to query the new 3-level structure but return the same response shape
3. **Add new RPCs**:
   - `resolve_life_scenarios(p_situation_code)` -- returns scenarios for a situation
   - `resolve_life_tasks(p_scenario_code)` -- returns tasks for a scenario
   - `resolve_task_entities(p_task_code)` -- returns entities for a task

### Compatibility view:

```text
CREATE VIEW catalog_life_map_v2 AS
SELECT
  tem.id,
  ls.id AS life_situation_id,
  tem.entity_type,
  tem.entity_id,
  tem.relevance_weight AS weight,
  tem.role_scope,
  tem.rules,
  lsc.code AS scenario_code,
  lt.code AS task_code
FROM task_entity_map tem
JOIN life_tasks lt ON lt.id = tem.life_task_id
JOIN life_scenarios lsc ON lsc.id = lt.life_scenario_id
JOIN life_situations ls ON ls.id = lsc.life_situation_id
WHERE tem.is_active AND lt.is_active AND lsc.is_active AND ls.is_active;
```

---

## Step 6: Update Supporting Infrastructure

### `lifeos_health_view` -- rebuild to monitor 3 levels:
- Situations with no scenarios
- Scenarios with no tasks
- Tasks with no entities
- Entity over-mapping (>3 tasks)

### `lifeos_governance` -- add new keys:
- `MAX_SCENARIOS_PER_SITUATION` (default: 8)
- `MAX_TASKS_PER_SCENARIO` (default: 10)
- `MAX_ENTITIES_PER_TASK` (default: 15)

### `lifeos_routes` -- link to `life_scenarios` instead of `life_situations`:
- Add `life_scenario_id` column (nullable for migration)
- Routes become scenario-level empathy, not situation-level

---

## What NOT to Change

- No UI component changes (LifeSituationSelector, admin pages stay as-is)
- No hook signature changes (backward compat via bridge)
- No changes to `life_os_catalog` view (entity aggregation layer)
- No changes to `lifeos_governance` table structure

---

## Execution Order

| Step | Action | Type |
|---|---|---|
| 1 | Create `life_scenarios` table with RLS | SQL migration |
| 2 | Create `life_tasks` table with RLS | SQL migration |
| 3 | Create `task_entity_map` table with RLS | SQL migration |
| 4 | Consolidate `life_situations` (rename, deactivate, reprioritize) | SQL data update |
| 5 | Populate canonical scenarios (~25 rows) | SQL data insert |
| 6 | Populate canonical tasks (~60-80 rows) | SQL data insert |
| 7 | Migrate `catalog_life_map` data into `task_entity_map` | SQL data migration |
| 8 | Create compatibility bridge view | SQL migration |
| 9 | Update `resolve_life_os_context` RPC | SQL migration |
| 10 | Add new resolver RPCs | SQL migration |
| 11 | Rebuild `lifeos_health_view` | SQL migration |
| 12 | Update governance keys | SQL data insert |
| 13 | Add `life_scenario_id` to `lifeos_routes` | SQL migration |

All steps are database-only. Zero frontend files touched.

---

## Success Criteria

- 7-8 stable root situations (no verticals, no events at root)
- ~25 scenarios with urgency levels
- ~60-80 actionable tasks with task_type
- All 590 existing entity mappings preserved in new structure
- Existing `resolve_life_os_context` RPC continues to work unchanged
- New RPCs available for scenario/task-level queries
- Health monitoring covers all 3 levels
- No orphaned data at any level

