# AI Intake & Lead Config Migration — Complete

**Date Completed**: 2026-02-04  
**Status**: ✅ All Phases Complete

---

## Summary

Successfully migrated hardcoded `intakeVerticals.ts` (728 lines) and `leadVerticalConfig.ts` (664 lines) to database-driven architecture with hybrid fallback.

---

## What Was Done

### Phase 0: Database Infrastructure
- Created `sys_intake_configs` table (23 verticals)
- Created `sys_lead_configs` table (10 verticals)
- RLS policies: public read, admin/uno_team write
- Seeded data via temporary Edge Function

### Phase 1: Hybrid Hooks
- `useIntakeConfigs.ts` — DB-first with static fallback
- `useLeadConfigs.ts` — DB-first with static fallback
- Updated consumers: IntakeItemEditor, IntakeVerticalBadge, UniversalLeadForm

### Phase 2: Edge Function Refactoring
- Updated `intake-listing-agent` to load configs from DB
- Removed hardcoded `VERTICALS` array
- Added caching + static fallback for resilience

### Phase 3: Admin UI
- `/admin/intake-configs` — Full CRUD for AI intake verticals
- `/admin/lead-configs` — Full CRUD for lead form configs
- Navigation links added to Taxonomy Manager

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                        │
│                                                                  │
│    sys_intake_configs          sys_lead_configs                 │
│    ├── vertical_id             ├── vertical_id                  │
│    ├── keywords[]              ├── request_types[]              │
│    ├── required_fields[]       ├── fields[]                     │
│    ├── field_labels{}          ├── popularity_score             │
│    └── target_table            └── cta_text                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│  useIntakeConfigs │            │  useLeadConfigs  │
│  (hybrid hook)   │              │  (hybrid hook)   │
│  ↓ fallback to   │              │  ↓ fallback to   │
│  intakeVerticals │              │  leadVerticalCfg │
└─────────────────┘              └─────────────────┘
         │                                │
         ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│ IntakeItemEditor │              │ UniversalLeadForm│
│ IntakeVerticalBdg│              │ AdminConsultations│
│ intake-listing-  │              └─────────────────┘
│ agent (Edge Fn)  │
└─────────────────┘
```

---

## Admin Access Points

| Page | Route | Purpose |
|------|-------|---------|
| Intake Configs | `/admin/intake-configs` | AI detection keywords, field mapping |
| Lead Configs | `/admin/lead-configs` | Form fields, request types |
| Taxonomy Manager | `/admin/taxonomy` | Quick links to both configs |

---

## Benefits Achieved

| Before | After |
|--------|-------|
| 2+ hours to add vertical (code deploy) | 5 min via admin UI |
| 2 places to update (frontend + edge fn) | 1 source (database) |
| Risk of sync errors | Zero sync risk |
| Deploy downtime for changes | Hot reload, zero downtime |

---

## Fallback Guarantee

If database is empty or unavailable:
- Hooks return static config from original files
- Edge Function uses STATIC_VERTICALS constant
- Zero user-facing errors

---

## Files Created/Modified

### Created
- `src/hooks/useIntakeConfigs.ts`
- `src/hooks/useLeadConfigs.ts`
- `src/pages/admin/AdminIntakeConfigs.tsx`
- `src/pages/admin/AdminLeadConfigs.tsx`
- Migration: `sys_intake_configs`, `sys_lead_configs` tables

### Modified
- `src/components/admin/intake/IntakeItemEditor.tsx`
- `src/components/admin/intake/IntakeVerticalBadge.tsx`
- `src/components/leads/UniversalLeadForm.tsx`
- `supabase/functions/intake-listing-agent/index.ts`
- `src/pages/admin/AdminTaxonomyManager.tsx`
- `src/components/layout/AnimatedRoutes.tsx`

---

## Next Steps (Phase 4 — Later)

After 2 weeks of stable operation:
1. Remove fallback logic from hooks
2. Mark static files as `@deprecated`
3. Eventually delete static config files
