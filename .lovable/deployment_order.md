# AI Agent Deployment Order
## Safe Rollout Plan for UNO AI Infrastructure

Generated: 2026-01-30 (Updated)

---

## Current State

| Category | Count | Status |
|----------|-------|--------|
| Active Agents (DB-managed) | 4 | ✅ OPERATIONAL |
| Standalone Utilities | 4 | ✅ OPERATIONAL |
| Legacy Duplicates | 2 | ⚠️ PENDING DEPRECATION |
| New Agents (v1) | 2 | 📋 PLANNED |

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `ai_agent_canonical_spec.md` | Canonical entrypoint specification |
| `ai_agent_delta_patch_plan.md` | Minimal safe patches |
| `ai_observability_patch.md` | Logging and tracing |
| `routing_matrix.md` | Current vs target routing |
| `feature_flags_spec.md` | Migration control |
| `migration_steps.md` | Step-by-step rollout |
| `frontend_ai_entrypoints_map.md` | Frontend integration points |
| `aiClient_spec.md` | Unified client specification |
| `admin_ai_observability_spec.md` | Admin UI enhancements |
| `db_managed_agents_contracts.md` | Agent behavior contracts |
| `ai_agent_knowledge_versioning.md` | Knowledge management |
| `ai_factory_v1_implementation_plan.md` | New agent creation |
| `PAVEL_AI_OPERATIONS_GUIDE.md` | Executive operations guide |

---

## Phase 0: Validation (COMPLETE)

- [x] Discovery complete (10 agents identified)
- [x] All agents documented
- [x] Boundary contract verified
- [x] No money/security touching
- [x] Normalization report generated

---

## Phase 1: Observability (PRIORITY)

### Step 1.1: Schema Migration
**Priority:** P0
**Risk:** NONE (additive only)
**Effort:** 15 minutes

Add columns to `ai_agent_logs`:
- `correlation_id`
- `agent_version`
- `model`
- `error_code`
- `is_success`

### Step 1.2: Shared Logging Helper
**Priority:** P1
**Risk:** LOW
**Effort:** 1 hour

Create `supabase/functions/_shared/ai-logging.ts`

### Step 1.3: Update ai-agent Function
**Priority:** P1
**Risk:** LOW
**Effort:** 2 hours

Apply patches from `ai_agent_delta_patch_plan.md`

---

## Phase 2: Frontend Consolidation

### Step 2.1: Create aiClient.ts
**Priority:** P1
**Risk:** LOW
**Effort:** 2 hours

Per `aiClient_spec.md`

### Step 2.2: Create featureFlags.ts
**Priority:** P1
**Risk:** LOW
**Effort:** 30 minutes

Per `feature_flags_spec.md`

### Step 2.3: Migrate Support Chat Frontend
**Priority:** P1
**Risk:** LOW
**Effort:** 1 hour

Update:
- `src/components/chat/UnifiedChatFAB.tsx`
- `src/components/chat/AIChatbot.tsx`

### Step 2.4: Migrate Owner Assistant Frontend
**Priority:** P1
**Risk:** LOW
**Effort:** 1 hour

Update:
- `src/hooks/useOwnerAIChat.ts`

### Step 2.5: Migrate Property Search Frontend
**Priority:** P1
**Risk:** LOW
**Effort:** 1 hour

Update:
- `src/hooks/usePropertyAIChat.ts`

---

## Phase 3: Legacy Cleanup

### Step 3.1: Add Deprecation Warnings
**Priority:** P2
**Risk:** NONE
**Effort:** 30 minutes

Add `X-Deprecation-Warning` header to legacy functions

### Step 3.2: Deprecate Legacy Edge Functions
**Priority:** P2
**Risk:** LOW
**Effort:** 1 hour
**Prerequisite:** Phase 2 verified in production (2 weeks)

Remove from `supabase/config.toml`:
- `[functions.ai-owner-assistant]`
- `[functions.ai-property-assistant]`

Delete directories:
- `supabase/functions/ai-owner-assistant/`
- `supabase/functions/ai-property-assistant/`

Keep `ai-support-chat` (may have external integrations)

---

## Phase 4: New Agents (v1)

### Step 4.1: Review Analyzer
**Priority:** P2
**Risk:** LOW
**Effort:** 4 hours

Per `ai_factory_v1_implementation_plan.md`

### Step 4.2: Vendor Advisor
**Priority:** P2
**Risk:** LOW
**Effort:** 4 hours

Per `ai_factory_v1_implementation_plan.md`

---

## Phase 5: Admin UI Enhancements

### Step 5.1: Enhanced Stats Card
**Priority:** P3
**Risk:** LOW
**Effort:** 2 hours

### Step 5.2: Logs Table
**Priority:** P3
**Risk:** LOW
**Effort:** 3 hours

### Step 5.3: Error Panel
**Priority:** P3
**Risk:** LOW
**Effort:** 2 hours

---

## Deployment Checklist

### Pre-Deployment
- [ ] Backup current edge functions
- [ ] Document current frontend behavior
- [ ] Review schema migration
- [ ] Notify team of planned changes

### During Deployment
- [ ] Deploy schema migration first
- [ ] Deploy one component at a time
- [ ] Monitor error rates
- [ ] Check ai_agent_logs for entries

### Post-Deployment
- [ ] Verify all AI features working
- [ ] Compare response quality
- [ ] Update Pavel's operations guide
- [ ] Clean up deprecated code

---

## Rollback Plan

If any migration causes issues:

1. **Immediate (Frontend):** Change feature flag to `legacy`
2. **Immediate (Backend):** Revert edge function to previous version
3. **Schema:** No rollback needed (additive columns)

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 (Observability) | 1 day | None |
| Phase 2 (Frontend) | 2 days | Phase 1 |
| Phase 3 (Cleanup) | 1 day | Phase 2 + 2 weeks |
| Phase 4 (New Agents) | 3 days | Phase 2 |
| Phase 5 (Admin UI) | 2 days | Phase 1 |

**Total:** 9 days (can parallelize Phase 4-5 after Phase 2)

---

## Approval Required

- Phase 1-3: **Self-service** (infrastructure only)
- Phase 4: **Product review** (new AI features)
- Phase 5: **Self-service** (admin tools)
