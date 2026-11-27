# DOCS_MAP — which document is a norm, which is history

> Read this before trusting any .md in the repo. Purpose: stop AI agents from following superseded documents.
> Order of authority: PROJECT.md > AGENTS.md > DESIGN.md > docs/ENVIRONMENT.md > docs/canonical/* . docs/STATUS.md is status, not a norm.

## 1. Norms (follow these)

| Area | Document |
|---|---|
| Product & engineering constitution | `/PROJECT.md` |
| AI execution invariants | `/AGENTS.md` (`/CLAUDE.md` is only a short pointer) |
| Visual design | `/DESIGN.md` (Design Bible v4: Outfit / Manrope / IBM Plex Mono; navy / paper / gold) |
| Databases & environments | `/docs/ENVIRONMENT.md` |
| Specialised contracts | `/docs/canonical/` (index: `docs/canonical/README.md`) |
| Navigation / information architecture | `/docs/canonical/07-information-architecture.md` |
| Current state & yes/no decisions | `/docs/STATUS.md` (not a norm) |

## 2. Evidence (read for context, never as a rule)

`docs/convergence/`, `docs/audits/`, `docs/audit/`, `docs/qa/`, `docs/hardening/`, `archive/`. Accepted rules must be promoted into PROJECT.md / AGENTS.md / docs/canonical; until then they are evidence. Exception: `docs/hardening/rollback/` holds required rollback artifacts (AGENTS.md).

## 3. Superseded or competing documents (do NOT follow)

From the Lovable documentation audit of 2026-11-27 (structure-level review, not a line-by-line check):

- Design: `docs/DESIGN_BIBLE.md` (v2.1), `docs/DESIGN_TOKENS.md`, `docs/canonical/05-visual-design-system.md` (v1.1), `docs/design-system/` — history. Norm: `/DESIGN.md`.
- `docs/PROJECT_BIBLE.md` duplicates `/PROJECT.md` — follow PROJECT.md.
- Navigation: `docs/NAVIGATION.md`, `docs/NAVIGATION_MAP.md`, `docs/HEADER_ROUTE_INVENTORY.md`, `docs/INFO_ARCHITECTURE.md` — follow `docs/canonical/07` and current routes in `src/lib/config/routes.ts`.
- `docs/ADMIN_VS_MC_AND_EDGE_AUTH.md`, `docs/MULTI_ROLE_*.md` may predate the merged admin (D1–D13) and the ban on self-assigning the management-company role; verify against code before use.
- Duplicate folders: `docs/audit/` (use `docs/audits/`), `docs/architecture/` (use `docs/canonical/architecture/`).

## 4. Do not trust counters

Page / function / migration counts, versions and commit logs are not stored in docs; read them from code (`src/lib/appVersion.ts`, `package.json`, `supabase/`).

## 5. Databases

Production is Lovable Cloud project `kakkwibljrjsawxgnupk`. Supabase MCP sessions do not reach it; projects they show are not production. See `docs/ENVIRONMENT.md` and `docs/STATUS.md`.

## 6. Known open item (from root TODO.md)

Provider supply: 33 active/approved service rows linked to 14 provider IDs, but `public_provider_catalog` returned no matching public profile. Needs a publication/moderation/visibility check in Lovable Cloud without weakening RLS. `TODO.md` is NOT finished and must not be archived until this is tracked in `docs/STATUS.md`.
