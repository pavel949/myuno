> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# AI Agent Canonical Specification
## Version 1.0 | 2026-01-30

---

## Executive Summary

The canonical AI entrypoint is `supabase/functions/ai-agent/index.ts`. This function already exists and implements the core requirements. This document defines the target specification and identifies gaps.

---

## Current Implementation Analysis

### Existing `ai-agent` Edge Function

**Location:** `supabase/functions/ai-agent/index.ts` (195 lines)

**What It Already Does (KEEP):**
- ✅ Loads agent config from `ai_agents` table by `slug`
- ✅ Loads knowledge from `ai_agent_knowledge` (versioned, published only)
- ✅ Injects `{{KNOWLEDGE_BASE}}` placeholder into system prompt
- ✅ Adds context from request body
- ✅ Adds language preference (Russian/English)
- ✅ Calls Lovable AI Gateway with streaming
- ✅ Logs usage to `ai_agent_logs` (async, non-blocking)
- ✅ Returns SSE stream
- ✅ Handles 429/402 rate limit errors from gateway
- ✅ Extracts user ID from auth header

**What's Missing (ADD):**
- ❌ Rate limiting (uses gateway limits only, no local rate limit)
- ❌ AI Boundary Contract enforcement
- ❌ correlation_id for tracing
- ❌ agent_version in logs
- ❌ model in logs
- ❌ Reliable logging (currently async with no retry)
- ❌ Tool calling support (for future agents)

---

## Target Canonical Specification

### Request Schema

```typescript
interface AIAgentRequest {
  agentSlug: string;           // Required: agent identifier
  messages: ChatMessage[];      // Required: conversation history
  context?: Record<string, unknown>;  // Optional: runtime context
  sessionId?: string;          // Optional: conversation session
  correlationId?: string;      // Optional: tracing ID (auto-generated if missing)
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
```

### Response Types

**Success (Streaming):**
```
Content-Type: text/event-stream
X-Correlation-ID: <uuid>
X-Agent-Version: <version>

data: {"choices":[{"delta":{"content":"..."}}]}
data: [DONE]
```

**Error (JSON):**
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "correlationId": "uuid"
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AGENT_NOT_FOUND` | 404 | Agent slug not found or inactive |
| `NO_KNOWLEDGE` | 404 | No published knowledge for agent |
| `RATE_LIMITED` | 429 | Too many requests |
| `GATEWAY_ERROR` | 500 | AI gateway failure |
| `GATEWAY_RATE_LIMITED` | 429 | AI gateway rate limit |
| `GATEWAY_QUOTA` | 402 | AI credits exhausted |
| `INVALID_REQUEST` | 400 | Missing or invalid parameters |

---

## AI Boundary Contract Enforcement

The canonical agent MUST enforce these rules:

### Allowed Actions
- Read from `ai_agents`, `ai_agent_knowledge`
- Write to `ai_agent_logs`
- Call external AI gateway
- Return text responses only

### Forbidden Actions (BLOCKED)
- Write to any table except logs
- Access `orders`, `ledger_entries`, `wallets`, `property_bookings`
- Modify `approval_status` on any table
- Execute RPC functions
- Access other users' data

**Enforcement Location:** System prompt + response filtering

---

## Observability Requirements

### Log Entry Schema (Enhanced)

```sql
-- Current columns
id, agent_id, user_id, session_id, messages_count, 
tokens_used, response_time_ms, user_rating, feedback, created_at

-- Required additions
correlation_id TEXT,           -- Tracing ID
agent_version INTEGER,         -- Knowledge version used
model TEXT,                    -- AI model used
error_code TEXT,               -- Error code if failed
is_success BOOLEAN DEFAULT true
```

### Metrics to Capture

| Metric | Source | Purpose |
|--------|--------|---------|
| response_time_ms | Edge function timing | Performance |
| messages_count | Request body | Usage |
| tokens_used | Gateway response (if available) | Cost |
| error_code | Exception handling | Reliability |
| agent_version | ai_agent_knowledge.version | Debugging |

---

## Rate Limiting Strategy

Use existing `_shared/rate-limit.ts` module:

```typescript
// Apply AI rate limit (10 requests per 60 seconds)
const rateLimitResponse = await withRateLimit(
  req,
  `ai-agent:${agentSlug}`,
  RATE_LIMITS.ai,
  corsHeaders,
  userId
);
if (rateLimitResponse) return rateLimitResponse;
```

---

## Integration with Standalone Functions

### Functions That Remain Standalone

| Function | Reason | Integration |
|----------|--------|-------------|
| `ai-translate` | Stateless utility | Use shared logging helper |
| `ai-generate-description` | Stateless utility | Use shared logging helper |
| `ai-smart-data` | Complex tool calling | Use shared logging helper |
| `ai-smart-search` | Different response format | Consider migration to ai-agent |
| `ai-personalize-home` | Rule-based, no AI | Keep separate |

### Shared Helpers to Create

```typescript
// supabase/functions/_shared/ai-logging.ts
export async function logAIUsage(params: {
  agentId: string;
  userId?: string;
  sessionId?: string;
  correlationId: string;
  messagesCount: number;
  responseTimeMs: number;
  model: string;
  isSuccess: boolean;
  errorCode?: string;
}): Promise<void>;
```

---

## Deployment Considerations

1. **No Breaking Changes**: Existing behavior must be preserved
2. **Feature Flags**: Use environment variables for new features
3. **Gradual Rollout**: Test with one agent before enabling for all
4. **Rollback Plan**: Keep legacy functions until migration complete