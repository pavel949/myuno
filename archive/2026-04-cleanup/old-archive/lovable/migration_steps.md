> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# AI Migration Steps
## Safe Rollout Procedure

---

## Prerequisites

- [ ] All patches from `ai_agent_delta_patch_plan.md` applied
- [ ] Schema migration for observability columns complete
- [ ] Shared logging helper deployed
- [ ] Feature flags infrastructure in place

---

## Phase 1: Infrastructure (Day 1)

### Step 1.1: Schema Migration

```sql
-- Run this migration first
ALTER TABLE public.ai_agent_logs 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS agent_version INTEGER,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS is_success BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_correlation_id 
ON public.ai_agent_logs(correlation_id);
```

**Verification:**
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'ai_agent_logs';
```

### Step 1.2: Deploy Shared Logging Helper

Create `supabase/functions/_shared/ai-logging.ts`

**Verification:**
- Deploy any AI function
- Check import works

### Step 1.3: Update ai-agent Function

Apply patches:
1. Correlation ID support
2. Rate limiting
3. Model/version logging

**Verification:**
```bash
# Call ai-agent directly
curl -X POST $SUPABASE_URL/functions/v1/ai-agent \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentSlug":"support-chat","messages":[{"role":"user","content":"Hello"}]}'

# Check response headers for X-Correlation-ID
# Check ai_agent_logs for new entry
```

---

## Phase 2: Frontend Client (Day 2)

### Step 2.1: Create aiClient.ts

Create `src/lib/aiClient.ts` with:
- Unified interface for all AI calls
- Correlation ID generation
- Error handling
- Feature flag support

### Step 2.2: Create featureFlags.ts

Create `src/lib/featureFlags.ts` with flag readers.

### Step 2.3: Update .env (Preparation)

```env
# Keep legacy for now
VITE_AI_ROUTE_SUPPORT_CHAT=legacy
VITE_AI_ROUTE_OWNER_ASSISTANT=legacy
VITE_AI_ROUTE_PROPERTY_ASSISTANT=legacy
```

---

## Phase 3: Support Chat Migration (Day 3)

### Step 3.1: Update UnifiedChatFAB.tsx

Replace direct fetch with aiClient.

### Step 3.2: Update AIChatbot.tsx

Replace direct fetch with aiClient.

### Step 3.3: Test with Legacy Flag

```env
VITE_AI_ROUTE_SUPPORT_CHAT=legacy
```

Verify behavior unchanged.

### Step 3.4: Switch to Canonical

```env
VITE_AI_ROUTE_SUPPORT_CHAT=canonical
```

**Test checklist:**
- [ ] Chat FAB opens
- [ ] Message sends
- [ ] Response streams correctly
- [ ] No errors in console
- [ ] Log entry created in ai_agent_logs

### Step 3.5: Monitor

Watch for 24 hours:
- Error rates
- Response times
- User complaints

---

## Phase 4: Owner Assistant Migration (Day 4-5)

### Step 4.1: Update useOwnerAIChat.ts

Replace direct fetch with aiClient, using 'owner-assistant' slug.

### Step 4.2: Test with Legacy Flag

### Step 4.3: Switch to Canonical

```env
VITE_AI_ROUTE_OWNER_ASSISTANT=canonical
```

**Test checklist:**
- [ ] Owner dashboard AI chat works
- [ ] Context (properties, bookings) passed correctly
- [ ] Response quality matches legacy

### Step 4.4: Monitor 24 hours

---

## Phase 5: Property Assistant Migration (Day 6-7)

### Step 5.1: Update usePropertyAIChat.ts

Replace direct fetch with aiClient, using 'property-search' slug.

### Step 5.2: Test and Switch

### Step 5.3: Monitor 24 hours

---

## Phase 6: Cleanup (Week 2)

### Step 6.1: Remove Feature Flags

Hardcode canonical paths in aiClient.ts.

### Step 6.2: Add Deprecation Warnings

Add X-Deprecation-Warning header to legacy functions.

### Step 6.3: Schedule Deletion

After 2 more weeks of stable operation:
- Delete `supabase/functions/ai-owner-assistant/`
- Delete `supabase/functions/ai-property-assistant/`
- Keep `ai-support-chat` longer (may have external integrations)

---

## Rollback Procedures

### Immediate (< 5 minutes)
1. Change flag in .env to `legacy`
2. Rebuild frontend
3. Deploy

### Partial (< 30 minutes)
1. Revert specific component changes
2. Redeploy frontend

### Full (< 1 hour)
1. Revert all frontend changes
2. No backend changes needed

---

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Error rate | < 1% | ai_agent_logs.is_success |
| Response time | < 5s p95 | ai_agent_logs.response_time_ms |
| User complaints | 0 | Support tickets |
| Feature parity | 100% | Manual testing |

---

## Communication Plan

### Before Migration
- Notify team of planned changes
- Document current behavior

### During Migration
- Monitor actively during first hour of each phase
- Be available for quick rollback

### After Migration
- Report success metrics
- Update documentation
- Delete deprecated code