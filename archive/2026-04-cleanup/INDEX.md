# Repo Cleanup · 2026-04-22

Crystallisation of the canonical knowledge base. Files moved here are **frozen historical context** — do not link from production docs. The current source of truth lives in `/PROJECT.md` + `/docs/canonical/`.

## What moved here

### `docs-audits/` — point-in-time audit snapshots
Replaced by living docs in `/docs/canonical/audits/`.
- `ADMIN_PANEL_DEEP_AUDIT.md`, `AUDIT-MC-BLOCK.md`, `AUDIT_CYCLE_2.md`
- `CONTACT_IMPORT_AUDIT.md`, `FIX_SPRINT_CYCLE2_REPORT.md`
- `MC_DASHBOARD_CORE_AUDIT.md`, `MC_MODULE_DEEP_AUDIT.md`, `MC_SCOPING_FIXES_REPORT.md`
- `PROPERTY_CARD_UX_AUDIT.md`, `TECHNICAL_AUDIT_REPORT.md`
- `UNICORN_ANALYSIS.md`, `USER_PROCESS_AUDIT_REPORT.md`

### `root-duplicates/` — superseded by canonical PROJECT.md
- `_AUDIT.md`, `project-lowercase.md` (was `project.md`)
- `ARCHITECTURE_AUDIT.md` → see `docs/canonical/architecture/ARCHITECTURE_V2.md`
- `OS_system_prompt.md` → see `docs/canonical/08-ai-prompts-library.md`
- `DEVELOPER_MODULE_SPEC.md` → see `docs/canonical/07-information-architecture.md`

### `myuno-design-snapshot/` — early HTML/JSX design sketches
Replaced by `docs/canonical/05-visual-design-system.md` + `DESIGN.md`.

### `old-archive/` — pre-existing `/archive` content consolidated here
- `docs/`, `lovable/`, `myuno-design/` (legacy phases, brand book drafts)

## Rule
Never re-introduce files from this directory into the active tree. If something is still useful, lift the content into the appropriate canonical document and cite the source from here.
