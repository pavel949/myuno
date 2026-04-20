# MD Documentation Audit — myUNO

> Generated: 2026-04-20 | Auditor: Claude Code | Scope: all .md files excluding node_modules, dist, build, archive, awesome-claude-agents
> Total files surveyed: 108 (excluding awesome-claude-agents subproject)

---

## Notes Before the Table

### Expected canonical files — NOT FOUND
The prompt names four expected canonical files. None exist in this repo:

| Expected | Status | What exists instead |
|---|---|---|
| `OS_system_prompt.md` | ❌ MISSING | `SYSTEM_PROMPT.md` (root, 175L, different naming) |
| `MYUNO_app_matrix.md` | ❌ MISSING | `audit/01_current_state.md` covers similar ground |
| `ESTATE_property_list.md` | ❌ MISSING | No equivalent found |
| `CAPITAL_active_mandates.md` | ❌ MISSING | No equivalent found |

`audit/01_current_state.md` itself noted (line 3): *"Source files referenced in the audit brief do not exist in this repo."*

### Untracked files
`handoff/`, `myuno-design/`, and some `docs/` files show `never` as last commit — they are untracked by git (listed in `git status` as `??`). They are likely from recent working sessions.

### `.lovable/plan.md` anomaly
449 commits, last updated 2026-04-19 — this is the active Lovable AI platform session log, not a documentation file. Marked TOOL below.

---

## Summary Counts

| Category | Files | Notes |
|---|---|---|
| ROOT | 9 | Root-level docs |
| DOCS | 47 | docs/ subdirectory |
| AUDIT | 1 | audit/ subdirectory |
| LOVABLE | 34 | .lovable/ AI platform artifacts |
| HANDOFF | 8 | handoff/ + myuno-design/ (untracked) |
| DESIGN-SYS | 4 | src/design-system/ READMEs |
| SUPABASE | 1 | supabase/functions/_docs/ |
| SCRIPTS | 1 | scripts/ |
| **Total** | **105** | |

---

## Full Inventory Table

### ROOT — Root-level documents

| File | Lines | Last Commit | Commits | Status | Role | Pересечения |
|---|---|---|---|---|---|---|
| `CLAUDE.md` | 280 | 2026-04-18 | 8 | **CANONICAL** | AI assistant instructions for this repo. Single source of truth for code rules, stack, DB schema. | Overlaps with `project.md`, `docs/ENVIRONMENT.md` (intentional — CLAUDE.md summarizes them) |
| `DESIGN.md` | 205 | 2026-04-18 | 1 | **CANONICAL** | Design system DS 2.1. Runtime tokens, typography, color palette, component rules. | Supersedes `src/design-system/tokens.json` (deprecated DS 2.0). Referenced by `CLAUDE.md`. |
| `README.md` | 115 | 2026-04-18 | 8 | **CANONICAL** | Project overview, stack, dev setup links. | Summary of `CLAUDE.md`; should list all canonical docs. |
| `DEVELOPER_MODULE_SPEC.md` | 1090 | 2026-04-17 | 1 | **CANONICAL** | Full technical spec for developer/newbuilds module: business model, attribution engine, masked comms, Stripe Connect. First client: Peylaa. | Duplicate of `myuno-design/project/uploads/DEVELOPER_MODULE_SPEC.md` (1099L, untracked — likely source) |
| `project.md` | 311 | 2026-04-17 | 1 | **CANONICAL** | Current state snapshot: v3.40.0, 45+ verticals, active work blocks. | Overlaps with `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md` and `CLAUDE.md` §1-3. More detailed on app verticals. |
| `SYSTEM_PROMPT.md` | 175 | 2026-04-14 | 1 | **UNKNOWN** | Business/product system prompt for AI tools — describes myUNO's architecture, services, positioning. Not code-assistant instructions. | May be the intended `OS_system_prompt.md`. Unclear if actively used. **Needs owner review.** |
| `ARCHITECTURE_AUDIT.md` | 316 | 2026-04-07 | 5 | **STALE** | April 2026 architecture audit. Several findings marked RESOLVED inline. | Overlaps with `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md` and `handoff/ARCHITECTURE_V2.md`. |
| `MIGRATION_PLAN.md` | 223 | 2026-04-07 | 2 | **STALE** | Plan for migrating from Lovable-hosted DB to own Supabase. References old DB `erfwtoavipwjqmylpizt`. | May be completed — `docs/ENVIRONMENT.md` shows PRIMARY DB is now `kakkwibljrjsawxgnupk`. |
| `DEBUG_REPORT.md` | 73 | 2026-03-12 | 1 | **ARCHIVE-CANDIDATE** | Single debug session report from March 12. No ongoing value. | Standalone; no cross-references. |

---

### AUDIT — audit/ subdirectory

| File | Lines | Last Commit | Commits | Status | Role | Пересечения |
|---|---|---|---|---|---|---|
| `audit/01_current_state.md` | 148 | 2026-04-17 | 1 | **CANONICAL** | App inventory audit from appRegistry.ts. Lists all 45+ verticals, their routes and status. | Fills the role of missing `MYUNO_app_matrix.md`. |

---

### DOCS — docs/ subdirectory

#### Active / Recently Updated (< 30 days)

| File | Lines | Last Commit | Commits | Status | Role | Пересечения |
|---|---|---|---|---|---|---|
| `docs/ENVIRONMENT.md` | 129 | 2026-04-18 | 2 | **CANONICAL** | Single source of truth for DB project refs, URLs, Lovable project ID, env setup. Self-declared canonical. | Cross-referenced from `docs/DATABASE.md`. Supersedes any other env/DB references. |
| `docs/DATABASE.md` | 128 | 2026-04-18 | 2 | **CANONICAL** | DB schema overview, key tables, financial flow. References `ENVIRONMENT.md`. | Overlaps with `CLAUDE.md` §4. CLAUDE.md summarizes; DATABASE.md has detail. |
| `docs/QA_MULTI_ROLE_SETUP.md` | 93 | 2026-04-18 | 1 | **CANONICAL** | QA setup for multi-role testing: test accounts, roles, how to switch. | — |
| `docs/DEVELOPER_PORTAL_QA.md` | 114 | 2026-04-17 | 1 | **CANONICAL** | Developer portal QA checklist and test matrix. | — |
| `docs/DB_MIRROR_SETUP.md` | 129 | 2026-04-17 | 1 | **CANONICAL** | Mirror DB setup guide: scripts, sync process, which DB is primary. | Cross-references `ENVIRONMENT.md`. |
| `docs/UNICORN_ANALYSIS.md` | 343 | 2026-04-09 | 1 | **CANONICAL** | Strategic analysis: unicorn potential, market sizing, competitive landscape. Apr 2026. | Standalone strategic doc. |
| `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md` | 486 | 2026-04-07 | 2 | **CANONICAL-OUTDATED** | "Factual snapshot" of the platform. Thorough but references old DB counts. Some data may lag `project.md`. | Overlaps heavily with `project.md` (311L), `docs/SYSTEM_OVERVIEW.md` (532L), `docs/ARCHITECTURE.md`. |
| `docs/DOUBLE_BOOKING_SETUP.md` | 61 | 2026-04-07 | 2 | **CANONICAL** | Operational guide for double-booking prevention setup. | — |
| `docs/HEADER_ROUTE_INVENTORY.md` | 36 | 2026-04-14 | 1 | **CANONICAL** | Route-to-header mapping inventory. | Related to `handoff/ARCHITECTURE_V2.md` route audit. |

#### March 2026 (30–55 days old — borderline STALE)

| File | Lines | Last Commit | Commits | Status | Role | Пересечения |
|---|---|---|---|---|---|---|
| `docs/SYSTEM_OVERVIEW.md` | 532 | 2026-03-09 | 1 | **STALE** | Full system description: stack, verticals, DB, flows. Mar 2026. | **Heavy overlap** with `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md` and `project.md`. Likely superseded by both. |
| `docs/MC_DASHBOARD_CORE_AUDIT.md` | 384 | 2026-03-12 | 1 | **STALE** | MC dashboard audit findings. | Part of MC audit series with `AUDIT-MC-BLOCK.md`, `MC_MODULE_DEEP_AUDIT.md`, `MC_SCOPING_FIXES_REPORT.md`. |
| `docs/AUDIT_CYCLE_2.md` | 379 | 2026-03-08 | 1 | **STALE** | Cycle 2 audit: booking flow, CRM, Edge Functions security, Capacitor. | Overlaps with `docs/FIX_SPRINT_CYCLE2_REPORT.md`. |
| `docs/FIX_SPRINT_CYCLE2_REPORT.md` | 243 | 2026-03-08 | 1 | **STALE** | Sprint cycle 2 fix report. Follows `AUDIT_CYCLE_2.md`. | Pair with `AUDIT_CYCLE_2.md`. |
| `docs/ADMIN_PANEL_DEEP_AUDIT.md` | 176 | 2026-03-08 | 1 | **STALE** | Admin panel deep audit. | Related to `docs/ADMIN_VS_MC_AND_EDGE_AUTH.md`. |
| `docs/ADMIN_VS_MC_AND_EDGE_AUTH.md` | 85 | 2026-03-08 | 1 | **STALE** | Admin vs MC access control audit. | Part of admin audit series. |
| `docs/AUDIT-MC-BLOCK.md` | 140 | 2026-03-08 | 1 | **STALE** | MC block audit. Part of MC audit series. | MC audit cluster. |
| `docs/MC_MODULE_DEEP_AUDIT.md` | 99 | 2026-03-08 | 1 | **STALE** | MC module deep audit. | MC audit cluster. |
| `docs/MC_SCOPING_FIXES_REPORT.md` | 109 | 2026-03-08 | 1 | **STALE** | MC scoping fixes report. | MC audit cluster. |
| `docs/IGNATEV_USE_CASES_MAPPING.md` | 144 | 2026-03-08 | 1 | **STALE** | Use cases mapping for Ignatev (estate agency vertical). | Standalone; may inform `DEVELOPER_MODULE_SPEC.md`. |
| `docs/USER_PROCESS_AUDIT_REPORT.md` | 230 | 2026-03-08 | 1 | **STALE** | User process audit: flows, pain points. | Overlaps with `docs/MYUNO_DEEP_AUDIT.md`. |
| `docs/SYSTEM_INFO_FOR_ANALYSIS.md` | 174 | 2026-03-12 | 1 | **STALE** | System info dump for external analysis. | Subset of info in `docs/SYSTEM_OVERVIEW.md`. |
| `docs/TECHNICAL_AUDIT_REPORT.md` | 112 | 2026-03-12 | 1 | **STALE** | Technical audit report (March). | Overlaps with `ARCHITECTURE_AUDIT.md` (April, more recent). |
| `docs/PROPERTY_CARD_UX_AUDIT.md` | 156 | 2026-03-12 | 1 | **STALE** | Property card UX audit. | — |
| `docs/MC_HOME_AUDIT_MATRIX.md` | 30 | 2026-03-12 | 1 | **STALE** | MC home audit matrix (30 lines only). | Subset of `MC_DASHBOARD_CORE_AUDIT.md`. |
| `docs/CONTACT_IMPORT_AUDIT.md` | 110 | 2026-03-12 | 1 | **STALE** | CRM contact import audit. | — |
| `docs/DATA_SOURCE_MAPPING.md` | 45 | 2026-03-12 | 1 | **STALE** | Data source mapping (45 lines). | Short; may be absorbed into DATABASE.md. |
| `docs/EDGE_FUNCTIONS.md` | 108 | 2026-03-04 | 2 | **STALE** | Edge Functions overview. | Superseded by `docs/DEPLOY_EDGE_FUNCTIONS.md` and `supabase/functions/_docs/API_REFERENCE.md`. |
| `docs/EDGE_FUNCTIONS_JWT.md` | 32 | 2026-03-12 | 1 | **STALE** | JWT config for Edge Functions (32 lines). | Subset of edge function docs. |
| `docs/ODOO_CRM_CONTACTS_MAPPING.md` | 58 | 2026-03-12 | 1 | **STALE** | Odoo CRM contacts field mapping. | CRM-specific; standalone. |
| `docs/GOOGLE_MAPS_KEY_SETUP.md` | 64 | 2026-03-12 | 1 | **STALE** | Google Maps API key setup. | Operational how-to; still relevant if Maps migration ongoing. |
| `docs/TYPESCRIPT_POLICY.md` | 19 | 2026-03-12 | 1 | **STALE** | TypeScript strictness policy (19 lines). | Could be absorbed into `docs/CONVENTIONS.md` or `CLAUDE.md`. |
| `docs/BUILD_AND_CI.md` | 14 | 2026-03-12 | 1 | **STALE** | Build/CI notes (14 lines — very short). | Could be absorbed into `README.md` or `CLAUDE.md §8`. |
| `docs/DEPLOY_EDGE_FUNCTIONS.md` | 43 | 2026-03-08 | 1 | **STALE** | Edge function deployment guide. | Should be updated with Deno 2.0 migration info from `CLAUDE.md §2`. |

#### Older (> 60 days — before 2026-02-19)

| File | Lines | Last Commit | Commits | Status | Role | Пересечения |
|---|---|---|---|---|---|---|
| `docs/MYUNO_DEEP_AUDIT.md` | 661 | 2026-03-08 | 1 | **ARCHIVE-CANDIDATE** | Deep audit from **March 2025** (internal date says March 2025, 337 tables, 7 users, 0 transactions). A year old. | Superseded by all later audits. Historic reference only. |
| `docs/AUDIT_MC_PMS.md` | 351 | 2026-02-26 | 1 | **ARCHIVE-CANDIDATE** | MC/PMS audit from Feb 2026. | Followed by `MC_PMS_FIX_PLAN.md`. Both likely executed. |
| `docs/MC_PMS_FIX_PLAN.md` | 465 | 2026-02-26 | 3 | **ARCHIVE-CANDIDATE** | Fix plan based on `AUDIT_MC_PMS.md`. Likely implemented. | Pair with `AUDIT_MC_PMS.md`. |
| `docs/UAT_MATRIX.md` | 176 | 2026-02-28 | 2 | **ARCHIVE-CANDIDATE** | UAT test matrix for MC/PMS from Feb 2026. | Superseded by `docs/QA_MULTI_ROLE_SETUP.md`. |
| `docs/ARCHITECTURE.md` | 173 | 2026-02-13 | 1 | **ARCHIVE-CANDIDATE** | Directory structure overview. Feb 2026. | Superseded by `handoff/ARCHITECTURE_V2.md` (untracked). `CLAUDE.md §9` has current structure. |
| `docs/CONVENTIONS.md` | 106 | 2026-02-13 | 1 | **STALE** | Coding conventions: file naming, component patterns. | `CLAUDE.md §5` has the rules. This has more detail on patterns. Worth keeping but merging updates. |
| `docs/UX_CONTRACT.md` | 688 | 2026-02-02 | 2 | **STALE** | UX design contract v1.0. 688 lines of UX rules. Feb 2026. | Overlaps with `DESIGN.md` (DS 2.1) and `docs/MYUNO_DEEP_AUDIT.md`. DESIGN.md is newer. |
| `docs/MCC_ARCHITECTURE.md` | 731 | 2026-02-02 | 1 | **ARCHIVE-CANDIDATE** | Marketing Command Center architecture. Design phase Feb 2026. 731 lines. | Standalone MCC spec; unclear if implemented. Likely superseded by other docs. |
| `docs/SYSTEM_OVERVIEW.md` | 532 | 2026-03-09 | 1 | **ARCHIVE-CANDIDATE** | System overview from March 2026. | **Duplicate** of `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md` (more recent, April). Recommend archiving. |
| `docs/audit-report.md` | 235 | 2026-02-25 | 1 | **ARCHIVE-CANDIDATE** | Generic audit report from Feb 2026 (lowercase filename). | Superseded by later audit cycle docs. |
| `docs/fix-plan.md` | 51 | 2026-03-06 | 2 | **ARCHIVE-CANDIDATE** | Generic fix plan (lowercase, 51 lines). | Superseded by `FIX_SPRINT_CYCLE2_REPORT.md`. |

#### Untracked docs (never committed)

| File | Lines | Last Commit | Status | Notes |
|---|---|---|---|---|
| `docs/MULTI_ROLE_REGRESSION.md` | 34 | never | **DRAFT** | Untracked. Regression test plan for multi-role. |
| `docs/MULTI_ROLE_SUPER_ACCESS.md` | 49 | never | **DRAFT** | Untracked. Multi-role super-access documentation. |
| `docs/PERSONA_JOURNEYS_DEVELOPER_INVESTOR.md` | 52 | never | **DRAFT** | Untracked. Persona journeys for developer and investor roles. |

---

### LOVABLE — .lovable/ AI platform artifacts

| File | Lines | Last Commit | Commits | Status | Role |
|---|---|---|---|---|---|
| `.lovable/plan.md` | 58 | 2026-04-19 | **449** | **TOOL** | Active Lovable session task log. Not documentation. Do not archive. |
| `.lovable/brand-book.md` | 60 | 2026-03-04 | 3 | **DUPLICATE** | Brand guidelines. Superseded by `DESIGN.md` (DS 2.1). Unique content: none visible. |
| `.lovable/memory/architecture/catalog-taxonomy-governance.md` | 27 | 2026-03-07 | 1 | **DRAFT** | Catalog/taxonomy governance note. 27 lines. |
| `.lovable/memory/architecture/intake-lead-config-db-migration.md` | 34 | 2026-02-04 | 1 | **ARCHIVE-CANDIDATE** | Lead config DB migration note. |
| `.lovable/memory/strategy/marketing-command-center-architecture.md` | 4 | 2026-02-02 | 1 | **ARCHIVE-CANDIDATE** | 4 lines — stub. |
| `.lovable/finance-restructure-plan.md` | 34 | 2026-02-28 | 2 | **STALE** | Finance restructure plan, Feb 2026. |
| `.lovable/landing-system-architecture.md` | 368 | 2026-02-06 | 1 | **ARCHIVE-CANDIDATE** | Landing system architecture. Feb 2026. |
| `.lovable/uno-admin-l1-implementation-spec.md` | 637 | 2026-02-06 | 1 | **ARCHIVE-CANDIDATE** | Admin L1 implementation spec (637 lines). Feb 2026. Large — may have unique content. |
| `.lovable/uno-core-system-design.md` | 559 | 2026-02-06 | 1 | **ARCHIVE-CANDIDATE** | Core system design (559 lines). Feb 2026. Large — may have unique content. |
| `.lovable/PAVEL_AI_OPERATIONS_GUIDE.md` | 213 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI operations guide. Jan 2026. Superseded by `CLAUDE.md`. |
| `.lovable/PAVEL_PHASE_5_LAUNCH.md` | 106 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Phase 5 launch plan. Jan 2026. |
| `.lovable/PAVEL_PHASE_H_SUMMARY.md` | 144 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Phase H summary. Jan 2026. |
| `.lovable/activated_agents_selection.md` | 108 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Agent selection for activated AI agents. Jan 2026. |
| `.lovable/admin_ai_observability_spec.md` | 243 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Admin AI observability spec. Jan 2026. |
| `.lovable/admin_ui_integration_plan.md` | 246 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Admin UI integration plan. Jan 2026. |
| `.lovable/aiClient_spec.md` | 310 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI client spec. Jan 2026. |
| `.lovable/ai_agent_canonical_spec.md` | 199 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI agent canonical spec. Jan 2026. |
| `.lovable/ai_agent_delta_patch_plan.md` | 230 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI agent delta patch plan. Jan 2026. |
| `.lovable/ai_agent_knowledge_versioning.md` | 297 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI agent knowledge versioning. Jan 2026. |
| `.lovable/ai_agent_normalization_report.md` | 305 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI agent normalization report. Jan 2026. |
| `.lovable/ai_behavior_unknowns.md` | 139 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI behavior unknowns. Jan 2026. |
| `.lovable/ai_factory_v1_implementation_plan.md` | 239 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI factory v1 plan. Jan 2026. |
| `.lovable/ai_observability_patch.md` | 293 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | AI observability patch. Jan 2026. |
| `.lovable/automatable_domains_v1.md` | 190 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Automatable domains v1. Jan 2026. |
| `.lovable/blocked_domains.md` | 173 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Blocked domains list. Jan 2026. |
| `.lovable/db_managed_agents_contracts.md` | 291 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | DB-managed agents contracts. Jan 2026. |
| `.lovable/deployment_and_rollback.md` | 341 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Deployment and rollback guide. Jan 2026. Superseded by `docs/DEPLOY_EDGE_FUNCTIONS.md`. |
| `.lovable/deployment_order.md` | 236 | 2026-01-30 | 2 | **ARCHIVE-CANDIDATE** | Deployment order. Jan 2026. |
| `.lovable/event_surface.md` | 182 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Event surface mapping. Jan 2026. |
| `.lovable/feature_flags_spec.md` | 183 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Feature flags spec. Jan 2026. `CLAUDE.md §5` has current flag rules. |
| `.lovable/frontend_ai_entrypoints_map.md` | 134 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Frontend AI entrypoints map. Jan 2026. |
| `.lovable/kpi_and_evaluation_plan.md` | 237 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | KPI and evaluation plan. Jan 2026. |
| `.lovable/migration_steps.md` | 227 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Migration steps. Jan 2026. Superseded by `MIGRATION_PLAN.md`. |
| `.lovable/routing_matrix.md` | 179 | 2026-01-30 | 1 | **ARCHIVE-CANDIDATE** | Routing matrix. Jan 2026. Superseded by `docs/HEADER_ROUTE_INVENTORY.md`. |

---

### HANDOFF — Untracked files from recent design/architecture sessions

| File | Lines | Last Commit | Status | Role | Пересечения |
|---|---|---|---|---|---|
| `handoff/README.md` | 86 | never | **DRAFT** | Drop-in package for handoff files. Describes what's in handoff/. | — |
| `handoff/ARCHITECTURE_V2.md` | 257 | never | **DRAFT** | Architecture blueprint v2 — roles, clusters, surfaces, agents. Untracked. | **Duplicate** of `myuno-design/project/handoff/ARCHITECTURE_V2.md`. Supersedes `docs/ARCHITECTURE.md`. |
| `handoff/CLAUDE_PATCH.md` | 41 | never | **DRAFT** | Patch to apply to CLAUDE.md from architecture v2 session. | — |
| `handoff/FEASIBILITY.md` | 206 | never | **DRAFT** | Feasibility assessment for architecture v2. | Duplicate of `myuno-design/project/handoff/FEASIBILITY.md`. |
| `myuno-design/README.md` | 25 | never | **DRAFT** | Design project README. Describes myuno-design/ folder structure. | — |
| `myuno-design/chats/chat1.md` | 706 | never | **DRAFT** | Full chat log from design session (706 lines). | Raw session log; content distilled into handoff/ files. |
| `myuno-design/project/uploads/DEVELOPER_MODULE_SPEC.md` | 1099 | never | **DUPLICATE** | Developer module spec. Nearly identical to root `DEVELOPER_MODULE_SPEC.md` (1090L). | Source copy; root file is 9L shorter — likely slightly edited. |
| `myuno-design/project/uploads/EXECUTION_PLAN_1.md` | 1468 | never | **DRAFT** | Execution plan from design session (1468 lines). Unique content. | No direct equivalent. May have useful implementation detail. |

---

### DESIGN-SYS — src/design-system/ READMEs

| File | Lines | Last Commit | Commits | Status | Notes |
|---|---|---|---|---|---|
| `src/design-system/components/README.md` | 108 | 2026-03-12 | 2 | **STALE** | Component library docs. `DESIGN.md` is more authoritative now. |
| `src/design-system/foundations/README.md` | 84 | 2026-03-02 | 1 | **STALE** | Foundation tokens. `DESIGN.md` DS 2.1 supersedes. |
| `src/design-system/patterns/README.md` | 195 | 2026-03-02 | 1 | **STALE** | UX patterns reference. |
| `src/design-system/screens/README.md` | 94 | 2026-03-02 | 1 | **STALE** | Screen templates reference. |

---

### SUPABASE & SCRIPTS

| File | Lines | Last Commit | Commits | Status | Notes |
|---|---|---|---|---|---|
| `supabase/functions/_docs/API_REFERENCE.md` | 512 | 2026-04-07 | 2 | **CANONICAL-OUTDATED** | Edge Functions API reference. Uses OLD DB base URL `erfwtoavipwjqmylpizt` (mirror), not PRIMARY `kakkwibljrjsawxgnupk`. Needs URL correction. |
| `scripts/MIGRATION_HOWTO.md` | 101 | 2026-04-07 | 1 | **CANONICAL** | Operational how-to for DB migration. References correct DB setup. |

---

---

## Phase 2: Classification — Non-CANONICAL files

### Files with unique content — do NOT lose

| File | Unique Content | Where to consolidate | Action |
|---|---|---|---|
| `SYSTEM_PROMPT.md` | **Business system prompt**: 13 verticals with commission rates (STR 12%, resale 1.5–2%, etc.), Year 1 financial model ($5.27M revenue), Q1–Q4 roadmap, sales/marketing KPIs. Not duplicated anywhere. | This IS the `OS_system_prompt.md` canonical. Rename or re-declare as canonical. | **PROMOTE → CANONICAL** |
| `handoff/ARCHITECTURE_V2.md` | Architecture blueprint v2: 6-role model, 6 clusters, 6 surfaces (Home/Discover/Operate/Wallet/Me/Admin), role weighting equation `primary·3+secondary·2+tertiary·1`, shell collapse plan. Currently the architectural basis for home screen redesign already implemented. | Should become `docs/ARCHITECTURE_V2.md`. Supersedes `docs/ARCHITECTURE.md`. | **COMMIT + CANONICALISE** |
| `handoff/CLAUDE_PATCH.md` | Hard rules for architecture v2: never add top-level routes, never create new shells, never hardcode hex, never import across cluster boundaries, always gate features behind feature flags, always show audit marker on money screens. | Merge into `CLAUDE.md` §1.5 (or §5 Must Follow rules). | **MERGE INTO CLAUDE.md** |
| `handoff/FEASIBILITY.md` | Role-to-code mapping: which `app_role` values map to which roles, status per role (80%, ready, greenfield), what's missing vs present in code. Concrete migration status. | Should become `docs/FEASIBILITY.md`. Companion to ARCHITECTURE_V2. | **COMMIT + CANONICALISE** |
| `myuno-design/project/uploads/EXECUTION_PLAN_1.md` | 1468-line Cursor execution plan (Stages 1–6, Day 1–22). Detailed implementation steps for platform build. Historic record but granular enough to be reference. | None currently. If still relevant → commit as `docs/EXECUTION_PLAN_1.md`. Else archive. | **NEEDS OWNER DECISION** |
| `docs/CONVENTIONS.md` | File naming conventions table (page, hook, context, filter, type, utility, edge function), barrel exports pattern, `useLanguage()` usage example. Not fully covered in `CLAUDE.md`. | Keep as-is. Update to reflect current naming (e.g., new home components). | **PROMOTE → CANONICAL** |
| `docs/UX_CONTRACT.md` | 688 lines of UX rules: component compliance levels, layout patterns for each vertical type, form validation rules, error state patterns, mobile-first specifics. Partially superseded by `DESIGN.md` DS 2.1, but `UX_CONTRACT` has behavioral/interaction detail `DESIGN.md` omits. | Unique interaction patterns could be absorbed into `DESIGN.md §patterns`. Current UX rules remain relevant. | **STALE but retain — review in Phase 3** |
| `.lovable/uno-core-system-design.md` | Events schema, User State Machine, post-landing flows, landing layer architecture. 559 lines. Partially implemented (MCC dashboard built per spec). Has DB table schemas not in DATABASE.md. | Unique events schema → could go into `docs/DATABASE.md` or new `docs/EVENTS.md`. | **ARCHIVE-CANDIDATE with extraction note** |
| `.lovable/uno-admin-l1-implementation-spec.md` | Implementation status map (MCC Dashboard 9 tabs, Campaign Factory, Lead Hub, Funnels — all ✅ built). References component files. Current build status snapshot. | Archive — but note component locations are still valid reference. | **ARCHIVE-CANDIDATE** |
| `supabase/functions/_docs/API_REFERENCE.md` | Edge Functions API reference (512 lines). **BUG**: uses old DB base URL `erfwtoavipwjqmylpizt` (mirror). Should be `kakkwibljrjsawxgnupk` (primary). | Fix URL, then keep as CANONICAL reference. | **FIX URL → CANONICAL** |

### Files with no unique content — safe to archive

| File | What would be lost | Verdict |
|---|---|---|
| `docs/SYSTEM_OVERVIEW.md` (532L) | Sections on LifeOS, Channel Manager, CRM, MCC (not in other docs). But March 2026, likely outdated. | **ARCHIVE** — extract LifeOS/Channel Manager note to `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md §PART 3` |
| `docs/MYUNO_DEEP_AUDIT.md` (661L) | March 2025 audit (337 tables, 7 users, 0 tx). Historically interesting but factually wrong today. | **ARCHIVE** — zero current value |
| `docs/MCC_ARCHITECTURE.md` (731L) | MCC design doc. MCC is now built. This is the pre-build spec. | **ARCHIVE** — `.lovable/uno-admin-l1-implementation-spec.md` is more precise |
| `docs/ARCHITECTURE.md` (173L) | Directory structure from Feb 2026. `CLAUDE.md §9` and `handoff/ARCHITECTURE_V2.md` supersede it. | **ARCHIVE** |
| `docs/SYSTEM_INFO_FOR_ANALYSIS.md` (174L) | Subset of SYSTEM_OVERVIEW.md. Duplicate. | **ARCHIVE** |
| `docs/MC_HOME_AUDIT_MATRIX.md` (30L) | 30 lines. Subset of MC_DASHBOARD_CORE_AUDIT.md. | **ARCHIVE** |
| `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md` (486L) | PART 7: Known Gaps. Unique list of gaps as of April 2026. **Extract before archiving.** | **ARCHIVE after extracting PART 7 → `project.md §12`** |
| `.lovable/brand-book.md` (60L) | Brand guidelines. DESIGN.md DS 2.1 supersedes. | **ARCHIVE** |
| `.lovable/migration_steps.md` (227L) | Migration steps Jan 2026. Superseded by `MIGRATION_PLAN.md`. | **ARCHIVE** |
| `.lovable/routing_matrix.md` (179L) | Routing matrix Jan 2026. Superseded by `docs/HEADER_ROUTE_INVENTORY.md`. | **ARCHIVE** |
| `.lovable/PAVEL_AI_OPERATIONS_GUIDE.md` (213L) | AI operations guide Jan 2026. Superseded by `CLAUDE.md`. | **ARCHIVE** |
| `docs/audit-report.md` (235L) | Generic Feb 2026 audit. Superseded by Cycle 2. | **ARCHIVE** |
| `docs/fix-plan.md` (51L) | Generic fix plan. Superseded by FIX_SPRINT_CYCLE2_REPORT.md. | **ARCHIVE** |
| `DEBUG_REPORT.md` (73L) | Single debug session. No ongoing value. | **ARCHIVE** |
| All other Jan 2026 `.lovable/` files | Specs from 80+ days ago, all superseded by implemented code. | **ARCHIVE** |
| `myuno-design/project/uploads/DEVELOPER_MODULE_SPEC.md` (1099L) | Near-identical to root `DEVELOPER_MODULE_SPEC.md`. 9L difference — likely minor edits. | **ARCHIVE** (root version is canonical) |

### Стоп-вопросы для владельца

До Phase 3 нужно твоё решение по следующим:

| # | Вопрос | Файлы | Варианты |
|---|---|---|---|
| Q1 | `SYSTEM_PROMPT.md` — это тот самый `OS_system_prompt.md`? Нужно ли переименовать или добавить ссылку в README? | `SYSTEM_PROMPT.md` | A) Переименовать в `OS_system_prompt.md` / B) Оставить как есть, добавить в README как «product AI context» |
| Q2 | `handoff/` files — коммитить как есть или сначала слить в docs/? | `handoff/ARCHITECTURE_V2.md`, `handoff/FEASIBILITY.md` | A) `git add handoff/` + переместить в `docs/` / B) Создать `docs/ARCHITECTURE_V2.md` и `docs/FEASIBILITY.md` как новые файлы |
| Q3 | `handoff/CLAUDE_PATCH.md` — применять патч к CLAUDE.md прямо сейчас? | `CLAUDE.md`, `handoff/CLAUDE_PATCH.md` | A) Применить в Phase 3 / B) Пропустить — не актуально |
| Q4 | `myuno-design/project/uploads/EXECUTION_PLAN_1.md` — архивировать или коммитить как docs-reference? | `EXECUTION_PLAN_1.md` | A) Архив / B) Коммит в `docs/EXECUTION_PLAN_1.md` |
| Q5 | `docs/UX_CONTRACT.md` — обновлять под DS 2.1 или архивировать? | `docs/UX_CONTRACT.md`, `DESIGN.md` | A) Обновить (большая работа, ~2ч) / B) Архивировать, добавить раздел patterns в DESIGN.md |

---

## Status Summary

| Status | Count | Files |
|---|---|---|
| CANONICAL | 17 | CLAUDE.md, DESIGN.md, README.md, DEVELOPER_MODULE_SPEC.md, project.md, audit/01_current_state.md, docs/ENVIRONMENT.md, docs/DATABASE.md, docs/QA_MULTI_ROLE_SETUP.md, docs/DEVELOPER_PORTAL_QA.md, docs/DB_MIRROR_SETUP.md, docs/UNICORN_ANALYSIS.md, docs/DOUBLE_BOOKING_SETUP.md, docs/HEADER_ROUTE_INVENTORY.md, scripts/MIGRATION_HOWTO.md, docs/CONVENTIONS.md, docs/DEPLOY_EDGE_FUNCTIONS.md |
| PROMOTE TO CANONICAL | 4 | SYSTEM_PROMPT.md (= OS prompt), handoff/ARCHITECTURE_V2.md → docs/, handoff/FEASIBILITY.md → docs/, supabase/functions/_docs/API_REFERENCE.md (after URL fix) |
| CANONICAL-OUTDATED | 1 | docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md (extract PART 7 → project.md, then archive) |
| STALE (retain for now) | 11 | docs/UX_CONTRACT.md, docs/AUDIT_CYCLE_2.md, docs/FIX_SPRINT_CYCLE2_REPORT.md, docs/CONVENTIONS.md updates, docs/TECHNICAL_AUDIT_REPORT.md, docs/MC_DASHBOARD_CORE_AUDIT.md, docs/PROPERTY_CARD_UX_AUDIT.md, docs/CONTACT_IMPORT_AUDIT.md, docs/DATA_SOURCE_MAPPING.md, docs/ODOO_CRM_CONTACTS_MAPPING.md, src/design-system/ READMEs |
| ARCHIVE-CANDIDATE | 52 | All Jan–Feb 2026 .lovable/ files, older docs/, DEBUG_REPORT.md, MIGRATION_PLAN.md (complete), myuno-design duplicates |
| MERGE INTO OTHER | 1 | handoff/CLAUDE_PATCH.md → CLAUDE.md |
| DRAFT (untracked) | 4 | docs/MULTI_ROLE_*.md, docs/PERSONA_JOURNEYS*, myuno-design/chats/chat1.md |
| NEEDS OWNER DECISION | 1 | myuno-design/project/uploads/EXECUTION_PLAN_1.md |
| TOOL (do not touch) | 1 | .lovable/plan.md |

---

## Conflicts (to resolve in Phase 2)

| Conflict | Files | Question |
|---|---|---|
| DB URLs | `supabase/functions/_docs/API_REFERENCE.md` uses `erfwtoavipwjqmylpizt` (mirror), `docs/ENVIRONMENT.md` says PRIMARY is `kakkwibljrjsawxgnupk` | Is API_REFERENCE using the wrong DB? Needs correction. |
| Architecture doc authority | `docs/ARCHITECTURE.md` (Feb 2026), `handoff/ARCHITECTURE_V2.md` (untracked), `ARCHITECTURE_AUDIT.md` (Apr 2026) — three overlapping arch docs | Which is the current canonical architecture doc? |
| System snapshot overlaps | `docs/SYSTEM_OVERVIEW.md`, `docs/MYUNO_COMPLETE_SYSTEM_SNAPSHOT.md`, `project.md` — all describe "what is myUNO" | Should be one canonical source; other two archived or pointer-docs. |
| `SYSTEM_PROMPT.md` purpose | Not clear if this is the intended `OS_system_prompt.md` canonical | Owner needs to confirm. |
| `handoff/` untracked | Architecture v2 files exist but were never committed | Should these be committed? Merged into existing docs? |
