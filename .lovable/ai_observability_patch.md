# AI Observability Patch Plan
## Phase B: Hardening Logging and Tracing

---

## Current State Analysis

### Existing Logging

**Location:** `ai_agent_logs` table

**Current Schema:**
| Column | Type | Status |
|--------|------|--------|
| id | uuid | ✅ Working |
| agent_id | uuid | ✅ Working |
| user_id | uuid | ✅ Working (nullable) |
| session_id | text | ✅ Working (nullable) |
| messages_count | integer | ✅ Working |
| tokens_used | integer | ⚠️ Always 0 (not implemented) |
| response_time_ms | integer | ✅ Working |
| user_rating | integer | 🔲 Not used yet |
| feedback | text | 🔲 Not used yet |
| created_at | timestamptz | ✅ Working |

**Current Implementation Issues:**
1. Async logging with no error handling (may lose entries)
2. No correlation_id for request tracing
3. No agent_version or model tracking
4. tokens_used never populated
5. No error tracking

---

## Approach Selection: Option A - Synchronous with Short Timeout

**Rationale:**
- Guarantees log write before response ends
- 500ms timeout prevents blocking
- Console backup for failures
- Simple to implement and debug

---

## Schema Changes Required

```sql
-- Migration: Add observability columns to ai_agent_logs

-- Add new columns
ALTER TABLE public.ai_agent_logs 
ADD COLUMN IF NOT EXISTS correlation_id TEXT,
ADD COLUMN IF NOT EXISTS agent_version INTEGER,
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS error_code TEXT,
ADD COLUMN IF NOT EXISTS is_success BOOLEAN DEFAULT true;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_correlation_id 
ON public.ai_agent_logs(correlation_id);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_created_at 
ON public.ai_agent_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_agent_id_created 
ON public.ai_agent_logs(agent_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_errors 
ON public.ai_agent_logs(is_success, created_at DESC) 
WHERE is_success = false;

-- Comment for documentation
COMMENT ON COLUMN public.ai_agent_logs.correlation_id IS 'UUID for request tracing across frontend/backend';
COMMENT ON COLUMN public.ai_agent_logs.agent_version IS 'Knowledge version from ai_agent_knowledge.version';
COMMENT ON COLUMN public.ai_agent_logs.model IS 'AI model used (e.g., google/gemini-3-flash-preview)';
COMMENT ON COLUMN public.ai_agent_logs.error_code IS 'Error code if request failed';
COMMENT ON COLUMN public.ai_agent_logs.is_success IS 'Whether request completed successfully';
```

---

## Shared Logging Helper

**File:** `supabase/functions/_shared/ai-logging.ts`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AILogEntry {
  agentId: string;
  userId?: string | null;
  sessionId?: string | null;
  correlationId: string;
  messagesCount: number;
  responseTimeMs: number;
  model: string;
  agentVersion?: number;
  isSuccess?: boolean;
  errorCode?: string | null;
}

/**
 * Log AI usage with reliability guarantee.
 * Uses synchronous write with 500ms timeout.
 * Falls back to console logging on failure.
 */
export async function logAIUsage(entry: AILogEntry): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 500);

  try {
    const { error } = await supabase
      .from("ai_agent_logs")
      .insert({
        agent_id: entry.agentId,
        user_id: entry.userId || null,
        session_id: entry.sessionId || null,
        correlation_id: entry.correlationId,
        messages_count: entry.messagesCount,
        response_time_ms: entry.responseTimeMs,
        model: entry.model,
        agent_version: entry.agentVersion || null,
        is_success: entry.isSuccess ?? true,
        error_code: entry.errorCode || null,
        tokens_used: 0, // TODO: Extract from gateway response
      })
      .abortSignal(controller.signal);

    if (error) {
      throw error;
    }
  } catch (err) {
    // Backup: log to console for CloudWatch/observability
    console.error("[AI-LOG-BACKUP]", JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString(),
      logError: err instanceof Error ? err.message : "Unknown error",
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generate correlation ID if not provided.
 */
export function ensureCorrelationId(provided?: string): string {
  return provided || crypto.randomUUID();
}
```

---

## Correlation ID Propagation

### Backend (Edge Functions)

```typescript
// At request start
const correlationId = ensureCorrelationId(body.correlationId);

// In response headers
headers: {
  ...corsHeaders,
  "X-Correlation-ID": correlationId,
}
```

### Frontend Client

```typescript
// src/lib/aiClient.ts
function generateCorrelationId(): string {
  return crypto.randomUUID();
}

// Include in all AI requests
const correlationId = generateCorrelationId();
const response = await fetch(url, {
  headers: {
    "X-Correlation-ID": correlationId,
  },
  body: JSON.stringify({ ...payload, correlationId }),
});

// Log for debugging (dev only)
if (import.meta.env.DEV) {
  console.log(`[AI] Request ${correlationId}`);
}
```

### Admin UI Display

```typescript
// Show correlation ID in logs table
<TableCell className="font-mono text-xs">
  {log.correlation_id?.slice(0, 8)}...
</TableCell>
```

---

## Verification Steps

### 1. Schema Migration
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_agent_logs' 
ORDER BY ordinal_position;
```

### 2. Log Write Test
```typescript
// Call any AI agent
// Check response headers for X-Correlation-ID
// Query logs for that correlation_id
```

### 3. Error Tracking Test
```typescript
// Trigger an error (e.g., invalid agent slug)
// Verify log entry with is_success=false, error_code set
```

### 4. Timeout Behavior Test
```typescript
// Temporarily slow down DB
// Verify request completes within acceptable time
// Check console for backup logs
```

---

## Rollout Plan

| Step | Action | Rollback |
|------|--------|----------|
| 1 | Run schema migration | No rollback needed (additive) |
| 2 | Deploy shared logging helper | Revert to inline logging |
| 3 | Update ai-agent function | Revert to previous version |
| 4 | Update standalone functions | Revert individually |
| 5 | Update frontend client | Revert client code |

---

## Monitoring Queries

### Error Rate by Agent
```sql
SELECT 
  a.slug,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE l.is_success = false) as errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE l.is_success = false) / COUNT(*), 2) as error_rate
FROM ai_agent_logs l
JOIN ai_agents a ON l.agent_id = a.id
WHERE l.created_at > NOW() - INTERVAL '24 hours'
GROUP BY a.slug
ORDER BY error_rate DESC;
```

### Average Response Time by Agent
```sql
SELECT 
  a.slug,
  ROUND(AVG(l.response_time_ms)) as avg_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY l.response_time_ms)) as p95_ms
FROM ai_agent_logs l
JOIN ai_agents a ON l.agent_id = a.id
WHERE l.created_at > NOW() - INTERVAL '24 hours'
GROUP BY a.slug
ORDER BY avg_ms DESC;
```

### Recent Errors
```sql
SELECT 
  l.correlation_id,
  a.slug,
  l.error_code,
  l.created_at
FROM ai_agent_logs l
JOIN ai_agents a ON l.agent_id = a.id
WHERE l.is_success = false
ORDER BY l.created_at DESC
LIMIT 20;
```
