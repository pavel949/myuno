# M10e — Lead Scoring + ClearView Full Report flow (P8) · COMPLETED

**Principle:** Connect before Create. 0 new tables, 0 new top-level routes.

## Changes

### New files
- `src/lib/leads/ippLeadEvents.ts` — IPP §3 scoring table (single source of truth)
- `src/hooks/useIPPLeadEvent.ts` — fire-and-forget client tracker → `analytics_events`
- `src/pages/clearview/ClearViewApplyPage.tsx` — real ฿4,900 Full Report apply page (P8 trigger, IPP §12 step 5)

### Edited
- `src/components/layout/pageRegistry.ts` — lazy-register ClearViewApplyPage
- `src/components/layout/AnimatedRoutes.tsx` — `/property/clearview/apply` now points to real page (was stub)
- `src/components/newbuilds/ClearViewReport.tsx` — added "Full ClearView ฿4,900" CTA (visible to non-admin) + summary-open tracking
- `src/pages/newbuilds/NewbuildsCompare.tsx` — comparison_open tracking + per-project "Full ClearView for winner" CTAs (IPP §12 step 5)

## Lead-event wiring (IPP §3)

| Event | Score | Where fires |
|---|---|---|
| `clearview_summary_open` | +20 | ClearViewReport mount, ClearViewApplyPage mount |
| `comparison_open` | +20 | NewbuildsCompare with ≥2 items |
| `clearview_full_report_purchased` | +50 | nb_lead insert via NbLeadForm with `source=clearview_full_report:<projectId>` |

`auto-lead-scoring` edge fn already aggregates → triggers WhatsApp escalation when score ≥ `P8_HOT_LEAD_SCORE_THRESHOLD` (100).

## Storage
- Events: `analytics_events` (existing, RLS-open insert)
- Leads: `nb_leads` (existing, with `source` and `score` columns)
- No schema changes.

## Verified
- TypeScript: clean (`tsc --noEmit`)
- Routes: `/property/clearview/apply?project=<uuid>` → ClearViewApplyPage
- Backwards compatible: existing `NbLeadForm` source filter recognises `clearview_full_report*` prefix server-side via auto-lead-scoring lookup.

## Next: M10f
