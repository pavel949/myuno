# Activated Agents Selection — Phase H

**Date**: 2026-01-30  
**Status**: APPROVED FOR ACTIVATION  
**Decision Maker**: AI Studio with Pavel review

---

## Selection Criteria Applied

Each candidate was evaluated against these mandatory requirements:

| Criterion | Required | Notes |
|-----------|----------|-------|
| Uses existing data | ✅ | No new data sources |
| Schema changes | None or additive only | No modifications to business tables |
| Clear human consumer | ✅ | Admin/ops can see and act on output |
| Output reviewable in UI | ✅ | Visual placement in existing pages |
| Risk level | LOW only | No money, ledger, security touch |
| Measurable outcome | ✅ | KPIs defined upfront |

---

## Selected Agents (2)

### Agent 1: `listing-quality-analyzer`

| Field | Value |
|-------|-------|
| agent_id | `listing-quality-analyzer` |
| Business Problem | Low-quality listings reduce conversion and trust. Admins manually review 30+ verticals without quality signals. |
| Primary User | **Admin** (Content Moderation team) |
| Expected Outcome | Flag listings with missing data, poor descriptions, no photos — before they go live |
| Risk Level | **LOW** — Read-only analysis, advisory output only |
| Data Source | All vertical tables (yachts, tours, restaurants, etc.) |
| Domain | `listings_catalog` (AVAILABLE in capability map) |

**Why this agent:**
- 30+ vertical tables exist with inconsistent quality
- Moderation workflow already exists (`approval_status`)
- Direct ROI: Improve listing quality → Increase conversion
- Zero risk: AI suggests, admin decides

---

### Agent 2: `review-quality-scorer`

| Field | Value |
|-------|-------|
| agent_id | `review-quality-scorer` |
| Business Problem | No visibility into review authenticity or helpfulness. Fake/low-quality reviews erode trust. |
| Primary User | **Admin** (Trust & Safety / Content Moderation) |
| Expected Outcome | Score reviews for authenticity, detect suspicious patterns, flag for human review |
| Risk Level | **LOW** — Read-only analysis, no auto-moderation |
| Data Source | `reviews` table (16 reviews currently) |
| Domain | `reviews_trust` (AVAILABLE in capability map) |

**Why this agent:**
- Reviews directly impact conversion and vendor trust
- Small dataset (16 reviews) — easy to validate
- Existing `is_approved` field enables human-in-the-loop
- Zero risk: AI scores, admin decides visibility

---

## Rejected Candidates

| Candidate | Reason for Rejection |
|-----------|---------------------|
| `vendor-advisor` | Requires conversational UI in vendor dashboard — scope too large for Phase H |
| `order-analyst` | Only 20 orders — insufficient data for meaningful patterns |
| `analytics-reporter` | Metrics already visible in dashboard — low incremental value |
| `payout-advisor` | Touches money domain — BLOCKED by AI Boundary Contract |

---

## Activation Priority

```
1. listing-quality-analyzer  — Day 1-3 (schema + agent + UI)
2. review-quality-scorer     — Day 4-6 (schema + agent + UI)

Evaluation period: Day 7-14
Decision: Keep / Adjust / Disable
```

---

## Schema Impact

### Additive Only

| Agent | New Table | Modifies Existing | RLS |
|-------|-----------|-------------------|-----|
| listing-quality-analyzer | `ai_insights` (optional) | No | Admin-only |
| review-quality-scorer | Uses `ai_agent_logs` | No | Admin-only |

**Recommendation**: Use generic `ai_artifacts` table for both agents to avoid schema proliferation.

---

## Next Steps

1. Define agent contracts (agent_contracts.json)
2. Create artifact storage schema (ai_artifact_schemas.sql)
3. Plan admin UI integration (admin_ui_integration_plan.md)
4. Define KPIs and evaluation plan (kpi_and_evaluation_plan.md)
5. Create deployment runbook (deployment_and_rollback.md)
