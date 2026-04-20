> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# Memory: architecture/intake-lead-config-db-migration
Updated: now

## Status: ✅ COMPLETE

Successfully migrated hardcoded `intakeVerticals.ts` (728 lines, 25+ verticals) and `leadVerticalConfig.ts` (664 lines, 12+ verticals) to database-driven architecture.

## Architecture

**Database Tables:**
- `sys_intake_configs` — 23 active verticals for AI Intake Agent (keywords, required/optional fields, field labels)
- `sys_lead_configs` — 10 active verticals for Universal Lead Form (request types, form fields, CTA text)

**Hybrid Hooks:**
- `useIntakeConfigs()` — DB-first with static fallback to `INTAKE_VERTICALS`
- `useLeadConfigs()` — DB-first with static fallback to `LEAD_VERTICALS`

**Edge Function:**
- `intake-listing-agent` loads configs from `sys_intake_configs` with `STATIC_VERTICALS` fallback

## Admin UI

| Route | Purpose |
|-------|---------|
| `/admin/intake-configs` | Manage AI detection keywords, field mapping |
| `/admin/lead-configs` | Manage form fields, request types, popularity |
| `/admin/taxonomy` | Quick links to both config pages |

## Benefits

- Single source of truth (database)
- Zero-downtime config updates via admin UI
- Fallback guarantees system stability
- No code deployment needed for new verticals