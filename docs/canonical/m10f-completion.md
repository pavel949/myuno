# M10f — Cross-journey CTAs & Smart Connections · COMPLETED

**Principle:** Connect before Create. 0 new tables, 0 new top-level routes.

## New
- `src/hooks/useContextualMatches.ts` — `useContextualOffplanMatches({min,max,district})` returns `{count, href, isLoading}` from `property_projects`. Empty matches are filtered out by callers.
- `src/components/shared/ContextualCTA.tsx` — reusable "Next steps" cluster. Hard rules from §25 enforced: never renders empty actions, logs every click to `analytics_events` (`event_name='ipp_cross_cta_click'`).

## Wired
- **ROI Calculator → Catalogue / ClearView / Compare** (`NewbuildsCalculator.tsx`): post-calc CTA with "N projects in price band ±35%" + per-project ClearView Apply + Compare. Also fires `roi_calculator_run` (+25) per IPP §3.
- **Knowledge Pillar → Catalogue / ROI / ClearView** (`KnowledgePillarPage.tsx`): only for property-relevant clusters (6.1, 6.2, 6.6, 6.7, 6.11). "От теории к делу" footer.
- **Comparison → ClearView Apply** (already wired in M10e — kept).

## Tracking
- All cross-CTA clicks → `analytics_events` with `source_module`, `target`, `transactional`, `action_id`. Feed for future M10a audits.
- IPP §3 scoring events fire on intent (e.g. `clearview_summary_open` when CTA leads to apply).

## Acceptance
- [x] ContextualCTA primitive per matrix §18.3 (3 highest-impact pairs wired)
- [x] Tracking via analytics_events works (RLS-open insert)
- [x] All wired pages now have ≥3 next actions, ≥1 transactional

## Verified
- `tsc --noEmit`: clean for new files

## Next: M10g (Distressed Vertical — new module per §26, requires new tables)
