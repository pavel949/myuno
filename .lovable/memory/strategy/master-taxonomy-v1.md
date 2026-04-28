---
name: Master Taxonomy v1.0
description: Canonical SSOT for all taxonomies. Two-layer model — Surfaces (NavCluster, 6) vs JTBD Clusters (A-J, 10). 25 personas P01-P25 (incl. resurrected P14-P19 lifestyle), Deal types, ClearView AAA-CCC.
type: feature
---

# Master Taxonomy v1.0 — Canonical SSOT

**Source of truth:**
- Document: `docs/canonical/00-master-taxonomy.md`
- TypeScript: `src/lib/taxonomies/master.ts`
- DB enums: `jtbd_cluster`, `app_persona`, `deal_type`, `clearview_grade`, `lifecycle_stage`

## Two layers — DO NOT CONFUSE

1. **Surfaces (NavCluster, 6):** physical navigation — `arrive | live | manage | invest | legal | build`. Source: `src/lib/catalog/taxonomy.ts`. Used for routes, bottom nav, RLS gates.
2. **JTBD Clusters (10, A-J):** functional Jobs-To-Be-Done classifiers. NOT routes. Used for service tagging, AI routing, lifecycle analytics, SEO landings.

| Code | JTBD | Surface |
|------|------|---------|
| A | Arrival & Setup | arrive |
| B | Visa & Extension | legal |
| C | Long-term Settlement | live |
| D | Investment Decision | invest |
| E | Real Estate Transaction | invest |
| F | Property Operations | manage |
| G | Tax & Compliance | legal |
| H | Emergency & Support | live |
| I | Lifestyle & Family | live |
| J | Exit & Repatriation | manage |

## 25 Personas (P01–P25)

All 25 are ACTIVE in Y1, including resurrected lifestyle segments **P14 medical_tourist, P15 wedding_couple, P16 athlete, P17 halal_traveler, P18 lgbtq_traveler, P19 accessibility**.

## ClearView grades — full scale Y1

`AAA / AA / A / BBB / BB / B / CCC / unrated`. **Y1 rule lifted:** rate ALL projects (incl. PEYLAA/Siamese Bangtao/Nunyan). Disclaimer "Not ClearView rated" only for projects without an assessment.

## Deal types

`rent_short | rent_mid | rent_long | buy_resale | buy_offplan | buy_assignment | sell | invest_passive | invest_active | urgent`

## Hard rules

1. Never confuse `ClusterId` (surface) with `JtbdClusterId` (functional).
2. Never add a new top-level route — use existing surface + JTBD tag.
3. DB enums and `master.ts` must be updated in the same migration/PR.
4. All 25 persona enum values exist even if landings are not yet built.
5. Master Taxonomy supersedes Operating Model v2.0 on taxonomy conflicts.
