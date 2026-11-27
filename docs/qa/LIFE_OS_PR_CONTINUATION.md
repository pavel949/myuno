# Life OS continuation PR — start here

This branch began as a handoff. It now contains the read-only implementation and review evidence for the next Life OS phase.

Read `docs/qa/LIFE_OS_AI_HANDOFF_2026_11_27.md` on main for the full source-backed instructions, then PROJECT.md and AGENTS.md.

## Work in this PR

The Structure tab and public scenario reads are updated. See the [read-only catalogue audit and mapping review](./LIFE_OS_TASK_MAPPING_REVIEW_2026_11_27.md) for data evidence, candidate categories and the remaining activation decision.

## Work checklist
- [ ] Audit backend situation/scenario/task/catalogue relationships and public/admin parity.
- [ ] Verify the Structure tab while signed in as an authorized admin, without writes.
- [ ] Correct misleading raw mapping counts, active filtering, ordering, search, locale behaviour and actor-bound caching using existing conventions.
- [ ] Propose task-to-category/offering mappings, including birthdays, weddings, family celebrations and children; get exact content approved before live changes.
- [ ] Extend existing admin scenario/task/mapping editing only after authorization review and owner approval for live writes.
- [ ] Route structured needs to eligible Marketplace REQUEST / BOOK / BOOK+PAY flows; Concierge is fallback, never booking/payment authority.
- [ ] Test public/admin agreement, missing supply, errors, old URLs, navigation, RU/EN/TH, both themes and mobile/desktop using synthetic data.

## Non-negotiable boundaries
Work only in pavel949/myuno, not myUNO-final. Preview and drafts share production data. No publication, deployment, migrations, seeds, account/rights/settings changes or business writes without explicit owner approval. E3 and Order Mutation Audit remain NO-GO. The historical ten-situation proposal is unapproved and incomplete: roles are filters, not the full event/need taxonomy. Never invent supply or duplicate canonical commerce/inventory/accounting.

Recommendation: audit and read-only corrections first, then submit the concrete mapping matrix for approval. Keep this PR draft until reviewed; do not auto-merge or publish.
