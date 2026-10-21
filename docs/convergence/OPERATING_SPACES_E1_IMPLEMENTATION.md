# Operating spaces E1 — shadow foundation

Migration: `drizzle/migrations/0021_operating_spaces_shadow_foundation.sql` (applied to the shared backend).
Rollback: `docs/hardening/rollback/0021_operating_spaces_shadow_foundation.sql`.
Design: [OPERATING_SPACES_DESIGN.md](../canonical/OPERATING_SPACES_DESIGN.md) · Bypass register: [MANAGER_SCOPE_BYPASS_REGISTER.md](MANAGER_SCOPE_BYPASS_REGISTER.md).

## Status
Shadow and unconsumed. No runtime file, hook, page, existing policy or feature flag reads these objects. No rows were seeded. Existing PMS authorization is unchanged.

## Preflight (live catalog, read-only, before migration)
- `management_company_members`: PK `id`, `UNIQUE(company_id,user_id)`, `company_id`/`user_id`/`role` NOT NULL, `is_active` nullable → treated fail-closed (`IS TRUE`).
- `properties`: PK `id`, `management_company_id` nullable. 33 rows; members 4 rows.
- No `operating_space*` objects existed. Audit assumptions held; no stop condition.

## DDL
| Object | Purpose |
|---|---|
| `properties_id_management_company_key UNIQUE(id, management_company_id)` | composite FK target; cannot fail (id is PK) |
| `management_company_members_id_company_key UNIQUE(id, company_id)` | composite FK target; cannot fail |
| `operating_spaces` | id, company (NOT NULL, RESTRICT), `key` (slug check, unique per company), name_en/ru, is_active, created_by, timestamps |
| `operating_space_properties` | PK(space, property); `one_primary_space UNIQUE(property_id)`; composite FKs to space and property on company |
| `operating_space_members` | PK(space, company_member); composite FKs to space and `management_company_members(id, company_id)` |
| triggers | `updated_at` touch; space company immutable |

No type column and no JSON config: no enforced consumer exists.

## Why `company_member_id`
Membership is company-scoped already; deactivating or deleting the company membership revokes space access automatically (authorization requires it active; delete cascades). A bare `user_id` could not prove same-company and would survive company removal.

## Same-company enforcement
Composite FKs carry `management_company_id` on both child tables:
- property of company B into space of company A → FK violation;
- member of company B into space of A → FK violation;
- changing `properties.management_company_id` while assigned → `ON UPDATE RESTRICT` rejects. Controlled reassignment = remove assignment first (no helper in E1);
- changing a space's company → trigger rejects.

## Helpers (SECURITY DEFINER, `search_path=public`, actor = `auth.uid()`, no user_id argument; execute: authenticated, service_role; anon revoked)
- `actor_is_operating_company_overseer(company)` — platform `admin`/`uno_team` in `user_roles`, or active company `director`/`admin`.
- `actor_can_access_operating_space(space)` — overseer, or active space + active space membership + active company membership of the caller.

## RLS matrix (anon: no grants)
| Table | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| operating_spaces | accessible spaces | overseer of the company |
| operating_space_properties | rows of accessible spaces | overseer |
| operating_space_members | overseer, or own grants | overseer (no self-grant) |

Existing policies on properties/orders/tasks/finance/CRM were not touched.

## Tests — isolated synthetic PostgreSQL
`src/lib/__tests__/operatingSpaces.postgres.test.ts` (+ `fixtures/operating-spaces-base.sql`) runs the applied migration file in a temporary local cluster: 16/16 passed. Covers cross-company property/member rejection, duplicate primary space, reassignment rejection, space company immutability, duplicate key, director/platform oversight, resort vs condo isolation, cross-space grant, inactive space/space-membership/company-membership denial, other-company non-leak, no self-grant, other-company director write denied, same-company director write, anonymous denied.

Not certified: hosted production RLS under real accounts (stand-in `auth.uid()` and roles).

## Seed manifest (not executed)
Required before E1b, all values from confirmed lists, never invented:
```text
space:      management_company_id, key, name_en, name_ru
assignment: operating_space_id, property_id (must belong to same company), management_company_id
member:     operating_space_id, company_member_id (active member of same company), management_company_id
checks:     every property in exactly one space; count per space matches business list;
            members have intended company role; run as overseer; dry-run in transaction first
```

## Blockers before E2
B1 confirmed property lists per portfolio; B2 confirmed team members/roles; B3 CRM/owners scope decision; B4 `send-property-report` hardening; hosted RLS check under synthetic accounts.
