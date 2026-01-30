# AI Agent Delta Patch Plan
## Minimal Safe Changes to Canonical Entrypoint

---

## Current State Summary

The `ai-agent` edge function is **functional and production-ready** for its current use case.
It correctly loads DB-managed agents and streams responses.

**Risk Assessment:** LOW - changes are additive only

---

## Patch 1: Add Correlation ID Support

**Priority:** P1
**Risk:** LOW
**Effort:** 30 minutes

**Changes:**
1. Generate UUID correlation_id if not provided in request
2. Add to response headers
3. Pass to logging

```typescript
// At request handling start
const correlationId = body.correlationId || crypto.randomUUID();

// Add to response headers
return new Response(aiResponse.body, {
  headers: {
    ...corsHeaders,
    "Content-Type": "text/event-stream",
    "X-Correlation-ID": correlationId,  // ADD
  },
});

// Include in log entry
const logPromise = supabase.from("ai_agent_logs").insert({
  agent_id: agent.id,
  user_id: userId,
  session_id: sessionId || null,
  correlation_id: correlationId,  // ADD
  messages_count: messages.length,
  response_time_ms: Date.now() - startTime,
});
```

---

## Patch 2: Add Rate Limiting

**Priority:** P1
**Risk:** LOW
**Effort:** 30 minutes

**Changes:**
1. Import rate limit module
2. Apply before processing

```typescript
import { withRateLimit, RATE_LIMITS } from "../_shared/rate-limit.ts";

// After CORS check, before JSON parse
const rateLimitResponse = await withRateLimit(
  req,
  `ai-agent:${agentSlug}`,
  RATE_LIMITS.ai,
  corsHeaders,
  userId
);
if (rateLimitResponse) return rateLimitResponse;
```

**Note:** Rate limiting currently requires `agentSlug` from body, so we need to:
1. Parse body first (minimal)
2. Or use a generic rate limit key

---

## Patch 3: Add Model and Version to Logs

**Priority:** P2
**Risk:** LOW
**Effort:** 15 minutes

**Requires:** Schema migration to add columns

```typescript
const logPromise = supabase.from("ai_agent_logs").insert({
  agent_id: agent.id,
  user_id: userId,
  session_id: sessionId || null,
  correlation_id: correlationId,
  messages_count: messages.length,
  response_time_ms: Date.now() - startTime,
  model: agent.model || "google/gemini-3-flash-preview",  // ADD
  agent_version: knowledge.version,  // ADD
});
```

---

## Patch 4: Improve Logging Reliability

**Priority:** P2
**Risk:** MEDIUM
**Effort:** 1 hour

**Current Issue:** Async logging may be lost if function terminates early

**Options:**

### Option A: Synchronous with Short Timeout (RECOMMENDED)
```typescript
// Wait for log with 500ms timeout
const logController = new AbortController();
const timeoutId = setTimeout(() => logController.abort(), 500);

try {
  await supabase.from("ai_agent_logs").insert({...});
} catch (err) {
  console.error("[AI-AGENT] Log write failed:", err);
  // Fail silently - don't block response
} finally {
  clearTimeout(timeoutId);
}

return new Response(aiResponse.body, {...});
```

### Option B: Fire-and-Forget with Console Backup
```typescript
// Current approach with console logging as backup
const logPromise = supabase.from("ai_agent_logs").insert({...});
logPromise.then(({ error }) => {
  if (error) {
    console.error("[AI-AGENT] Log failed:", JSON.stringify({
      correlationId, agentId: agent.id, error: error.message
    }));
  }
});
```

**Recommendation:** Use Option A for critical agents, Option B for utilities.

---

## Patch 5: Structured Error Responses

**Priority:** P3
**Risk:** LOW
**Effort:** 30 minutes

**Changes:**
Create consistent error format:

```typescript
function errorResponse(
  code: string,
  message: string,
  status: number,
  correlationId: string
): Response {
  return new Response(
    JSON.stringify({ error: message, code, correlationId }),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Correlation-ID": correlationId,
      },
    }
  );
}

// Usage
if (!agent) {
  return errorResponse("AGENT_NOT_FOUND", "Agent not found or inactive", 404, correlationId);
}
```

---

## Implementation Order

| Step | Patch | Dependency | Test |
|------|-------|------------|------|
| 1 | Schema migration | None | Query new columns |
| 2 | Correlation ID | Schema | Check headers |
| 3 | Rate limiting | None | Hit limit |
| 4 | Model/Version logs | Schema | Query logs |
| 5 | Logging reliability | None | Monitor errors |
| 6 | Error responses | Correlation ID | Test error cases |

---

## Schema Migration Required

```sql
-- Add observability columns to ai_agent_logs
ALTER TABLE public.ai_agent_logs 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS agent_version INTEGER,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS is_success BOOLEAN DEFAULT true;

-- Index for correlation ID lookups
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_correlation_id 
ON public.ai_agent_logs(correlation_id);

-- Index for error analysis
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_is_success 
ON public.ai_agent_logs(is_success) WHERE is_success = false;
```

---

## Verification Checklist

- [ ] All existing agents still work
- [ ] Response format unchanged for streaming
- [ ] New headers present (X-Correlation-ID)
- [ ] Logs contain new columns
- [ ] Rate limiting blocks excessive requests
- [ ] Error responses include correlation ID
- [ ] No performance regression (< 100ms added latency)
