> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# AI Behavior Unknowns
## Items Requiring Verification

Generated: 2026-01-30
Source: Phase 1 Discovery

---

## UNKNOWN-001: ai-personalize-home Frontend Integration

| Field | Value |
|-------|-------|
| Agent | ai-personalize-home |
| Issue | Frontend entry point not found in search |
| Risk | LOW |
| Verification Needed | Search for components calling this function |

**Action Required:**
Search for `ai-personalize-home` invocation in frontend to verify actual usage pattern.

---

## UNKNOWN-002: Legacy vs New Agent Routing

| Field | Value |
|-------|-------|
| Agents | owner-assistant, property-assistant, support-chat |
| Issue | Both legacy (hardcoded) and new (DB-managed) versions exist |
| Risk | MEDIUM |
| Verification Needed | Confirm which version frontend actually calls |

**Current State:**
- `ai-support-chat` edge function: Called directly by `AIChatbot.tsx` and `UnifiedChatFAB.tsx`
- `ai-owner-assistant` edge function: Called directly by `useOwnerAIChat.ts`
- `ai-property-assistant` edge function: Called directly by `usePropertyAIChat.ts`
- `ai-agent` edge function: DB-managed universal handler (appears unused by frontend)

**Resolution Required:**
Migrate frontend to use `ai-agent` with `agentSlug` parameter, then deprecate legacy functions.

---

## UNKNOWN-003: ai-agent Log Accuracy

| Field | Value |
|-------|-------|
| Agent | ai-agent (universal) |
| Issue | Logging is async and non-blocking |
| Risk | LOW |
| Verification Needed | Confirm logs are being written correctly |

**Code Reference (ai-agent/index.ts line 164-176):**
```javascript
// Log usage asynchronously (don't block response)
const logPromise = supabase.from("ai_agent_logs").insert({...});
// Don't await logging - let it complete in background
logPromise.then(({ error }) => {
  if (error) console.error("[AI-AGENT] Failed to log usage:", error);
});
```

**Concern:** If edge function terminates before log completes, logs may be lost.

**Recommendation:** Move to synchronous logging or use Deno.cron for batch processing.

---

## UNKNOWN-004: Rate Limit Configuration

| Field | Value |
|-------|-------|
| Agents | ai-support-chat, ai-owner-assistant, ai-translate |
| Issue | Rate limit values not directly visible |
| Risk | LOW |
| Verification Needed | Check `_shared/rate-limit.ts` for actual limits |

**Data Request:**
```
FILE: supabase/functions/_shared/rate-limit.ts
SECTION: RATE_LIMITS.ai definition
```

---

## UNKNOWN-005: Smart Search Question Detection Accuracy

| Field | Value |
|-------|-------|
| Agent | ai-smart-search |
| Issue | Rule-based question detection may have edge cases |
| Risk | LOW |
| Verification Needed | Review detection logic for false positives/negatives |

**Code Reference (ai-smart-search/index.ts line 39-57):**
- Checks for `?` character
- Checks for question indicators in RU/EN
- Falls back to word count > 4

**Potential Issues:**
- Short questions (e.g., "visa?") may not trigger AI
- Long product names may falsely trigger AI

---

## DATA REQUESTS

### DR-001: Rate Limit Configuration
```
Request: View rate-limit.ts to document actual limits
Path: supabase/functions/_shared/rate-limit.ts
Priority: P2
```

### DR-002: Frontend ai-personalize-home Usage
```
Request: Search for personalize-home invocation
Pattern: ai-personalize-home|personalize.*home
Priority: P3
```

### DR-003: Production AI Usage Metrics
```
Request: Query ai_agent_logs for usage patterns
Query: SELECT agent_id, DATE(created_at), COUNT(*) FROM ai_agent_logs GROUP BY 1,2 ORDER BY 2 DESC
Priority: P2
```

---

## SUMMARY

| Category | Count |
|----------|-------|
| Critical Unknowns | 0 |
| Medium Risk | 1 (legacy routing) |
| Low Risk | 4 |
| Data Requests | 3 |

**Overall Assessment:** AI infrastructure is well-documented and safe. Main concern is legacy/new function duplication that should be consolidated.