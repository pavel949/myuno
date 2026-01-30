# AI Agent Deployment Order
## Safe Rollout Plan for UNO AI Infrastructure

Generated: 2026-01-30

---

## Current State

| Category | Count | Status |
|----------|-------|--------|
| Active Agents | 8 | ✅ OPERATIONAL |
| Deprecated Agents | 2 | ⚠️ PENDING REMOVAL |
| New Agents | 0 | N/A |

---

## Phase 0: Validation (COMPLETE)

- [x] Discovery complete
- [x] All agents documented
- [x] Boundary contract verified
- [x] No money/security touching
- [x] Normalization report generated

---

## Phase 1: Consolidation (RECOMMENDED)

### Step 1.1: Migrate Support Chat Frontend
**Priority:** P1
**Risk:** LOW
**Effort:** 2 hours

**Current State:**
- Frontend calls `ai-support-chat` directly
- DB-managed `support-chat` agent exists but unused

**Action:**
```typescript
// src/components/chat/AIChatbot.tsx
// Change from:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

// To:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

// And update request body to include:
{ agentSlug: 'support-chat', messages: [...] }
```

**Verification:**
1. Test chat FAB in all user roles
2. Verify streaming works
3. Check ai_agent_logs for new entries

---

### Step 1.2: Migrate Owner Assistant Frontend
**Priority:** P1
**Risk:** LOW
**Effort:** 2 hours

**Current State:**
- `useOwnerAIChat.ts` calls `ai-owner-assistant` directly
- DB-managed `owner-assistant` exists and has been tested

**Action:**
```typescript
// src/hooks/useOwnerAIChat.ts
// Change from:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-owner-assistant`;

// To:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

// Update request to include agentSlug: 'owner-assistant'
```

**Verification:**
1. Test AI chat in owner dashboard
2. Verify context (properties, bookings) is passed
3. Check ai_agent_logs

---

### Step 1.3: Migrate Property Search Frontend
**Priority:** P1
**Risk:** LOW
**Effort:** 2 hours

**Current State:**
- `usePropertyAIChat.ts` calls `ai-property-assistant` directly
- DB-managed `property-search` exists

**Action:**
```typescript
// src/hooks/usePropertyAIChat.ts
// Change from:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-property-assistant`;

// To:
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-agent`;

// Update request to include agentSlug: 'property-search'
```

---

### Step 1.4: Deprecate Legacy Edge Functions
**Priority:** P2
**Risk:** LOW
**Effort:** 1 hour
**Prerequisite:** Steps 1.1-1.3 verified in production

**Action:**
1. Remove from `supabase/config.toml`:
   - `[functions.ai-owner-assistant]`
   - `[functions.ai-property-assistant]`
   
2. Delete edge function directories:
   - `supabase/functions/ai-owner-assistant/`
   - `supabase/functions/ai-property-assistant/`

3. Keep `ai-support-chat` for now (may have external integrations)

---

## Phase 2: Observability Improvements

### Step 2.1: Fix Token Tracking
**Priority:** P2
**Risk:** LOW
**Effort:** 4 hours

**Location:** `supabase/functions/ai-agent/index.ts`

**Action:**
```typescript
// After streaming response, extract token count from headers or estimate
// Update log entry with actual token count
```

---

### Step 2.2: Add Session Tracking
**Priority:** P2
**Risk:** LOW
**Effort:** 2 hours

**Action:**
1. Generate UUID in frontend for each conversation
2. Pass `sessionId` to all AI agent calls
3. Use for multi-turn conversation analysis

---

### Step 2.3: Add User Rating Collection
**Priority:** P3
**Risk:** LOW
**Effort:** 4 hours

**Action:**
1. Add thumbs up/down UI after AI responses
2. Call `ai_agent_logs` update with rating
3. Dashboard for rating trends

---

## Phase 3: New Agent Candidates (FUTURE)

Based on `uncovered_domains` in capability map:

| Candidate | Domain | Value | Effort | Priority |
|-----------|--------|-------|--------|----------|
| Review Analyzer | reviews_trust | Fake review detection | Medium | P2 |
| Order Analyst | orders_canonical | Revenue insights | Medium | P3 |
| Vendor Advisor | vendor_subscriptions | Upsell, churn prevention | High | P2 |
| Analytics Reporter | analytics_metrics | Executive dashboards | Medium | P3 |

**NOTE:** These are recommendations only. No implementation until Phase 1-2 complete.

---

## Deployment Checklist

### Pre-Deployment
- [ ] Backup current edge functions
- [ ] Document current frontend behavior
- [ ] Notify team of planned changes

### During Deployment
- [ ] Deploy one migration at a time
- [ ] Monitor error rates
- [ ] Check ai_agent_logs for entries

### Post-Deployment
- [ ] Verify all AI features working
- [ ] Compare response quality
- [ ] Clean up deprecated code

---

## Rollback Plan

If any migration causes issues:

1. **Immediate:** Revert frontend code to call legacy endpoints
2. **Edge Functions:** Legacy functions remain in place until Phase 1.4
3. **Database:** No schema changes, no rollback needed

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 (Consolidation) | 1-2 days | None |
| Phase 2 (Observability) | 2-3 days | Phase 1 |
| Phase 3 (New Agents) | 5-10 days | Phase 2 + Business requirements |

---

## Approval Required

Phase 1-2: **Self-service** (no business logic changes)
Phase 3: **Requires product approval** (new capabilities)
