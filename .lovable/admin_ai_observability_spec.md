# Admin AI Observability Specification
## Enhanced /admin/ai-agents Page

---

## Current State

The `/admin/ai-agents` page exists with:
- List of DB-managed agents
- Agent editor with knowledge/prompt versioning
- Basic stats (invocation count, avg response time)

---

## Required Enhancements

### 1. Agent List View Improvements

Add columns:
- **Status Indicator**: Active/Inactive badge
- **Last Activity**: "5 minutes ago" or "Never"
- **Error Rate**: "0%" or "2.3% (last 24h)"
- **Model**: "gemini-3-flash-preview"

### 2. Agent Detail Stats Card

Current:
```
Invocations: 5
Avg Response: 2.3s
```

Enhanced:
```
┌─────────────────────────────────────────────────────────────┐
│ Last 24 Hours                                                │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ Invocations │ Avg Time    │ Error Rate  │ Model               │
│ 47          │ 1.8s        │ 0%          │ gemini-3-flash      │
├─────────────┴─────────────┴─────────────┴─────────────────────┤
│ [View Logs] [View Errors] [Test Agent]                       │
└─────────────────────────────────────────────────────────────┘
```

### 3. Logs Table

New expandable section showing recent logs:

| Column | Description |
|--------|-------------|
| Time | Relative time (e.g., "2m ago") |
| Correlation ID | First 8 chars, copyable |
| User | User email or "anonymous" |
| Messages | Count |
| Response Time | In ms |
| Status | ✅ or ❌ |
| Version | Knowledge version used |

**Features:**
- Filter by success/error
- Filter by time range
- Click to expand full log details
- Copy correlation ID

### 4. Error Panel

When errors exist, show:

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Recent Errors (3 in last 24h)                             │
├─────────────────────────────────────────────────────────────┤
│ 2 min ago  │ RATE_LIMITED    │ abc123...                    │
│ 1 hour ago │ GATEWAY_ERROR   │ def456...                    │
│ 3 hours ago│ GATEWAY_QUOTA   │ ghi789...                    │
└─────────────────────────────────────────────────────────────┘
```

### 5. Real-time Rate Limit Status

Show current rate limit state:

```
Rate Limit Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current: 3/10 requests (60s window)
[████████░░] 30% used
```

---

## Database Queries

### Agent List Query

```typescript
const { data: agents } = await supabase
  .from('ai_agents')
  .select(`
    *,
    ai_agent_logs(count),
    ai_agent_knowledge(version, is_published)
  `)
  .order('slug');
```

### Stats Query (per agent)

```typescript
const { data: stats } = await supabase
  .from('ai_agent_logs')
  .select('*')
  .eq('agent_id', agentId)
  .gte('created_at', twentyFourHoursAgo)
  .order('created_at', { ascending: false });

// Calculate:
const total = stats.length;
const errors = stats.filter(s => !s.is_success).length;
const errorRate = total > 0 ? (errors / total * 100).toFixed(1) : 0;
const avgTime = stats.reduce((a, s) => a + s.response_time_ms, 0) / total;
```

### Recent Logs Query

```typescript
const { data: logs } = await supabase
  .from('ai_agent_logs')
  .select(`
    id,
    correlation_id,
    user_id,
    messages_count,
    response_time_ms,
    is_success,
    error_code,
    agent_version,
    model,
    created_at
  `)
  .eq('agent_id', agentId)
  .order('created_at', { ascending: false })
  .limit(50);
```

### Error Summary Query

```typescript
const { data: errors } = await supabase
  .from('ai_agent_logs')
  .select('error_code, correlation_id, created_at')
  .eq('agent_id', agentId)
  .eq('is_success', false)
  .gte('created_at', twentyFourHoursAgo)
  .order('created_at', { ascending: false });
```

---

## UI Components to Create/Update

### New Components

1. **AIAgentStatsCard.tsx**
   - Enhanced stats display
   - Trend indicators
   - Quick actions

2. **AIAgentLogsTable.tsx**
   - Paginated logs table
   - Filtering
   - Expandable rows

3. **AIAgentErrorPanel.tsx**
   - Error summary
   - Error details modal

4. **AIAgentRateLimitIndicator.tsx**
   - Visual rate limit status
   - Warning when approaching limit

### Updates to Existing

1. **AdminAIAgents.tsx**
   - Add error rate column
   - Add last activity column
   - Add model column

2. **AdminAIAgentEditor.tsx**
   - Add logs tab
   - Add errors tab
   - Add test panel

---

## Hooks to Create

### useAIAgentLogs

```typescript
function useAIAgentLogs(agentId: string, options?: {
  limit?: number;
  onlyErrors?: boolean;
  since?: Date;
}) {
  return useQuery({
    queryKey: ['ai-agent-logs', agentId, options],
    queryFn: () => fetchAgentLogs(agentId, options),
    refetchInterval: 30000, // Auto-refresh
  });
}
```

### useAIAgentStats

Already exists in `useAIAgents.ts`, but needs enhancement:

```typescript
function useAIAgentStats(agentId: string) {
  return useQuery({
    queryKey: ['ai-agent-stats', agentId],
    queryFn: async () => {
      const logs = await fetchRecentLogs(agentId, 24);
      return {
        total: logs.length,
        errors: logs.filter(l => !l.is_success).length,
        avgResponseTime: calculateAvg(logs, 'response_time_ms'),
        errorRate: calculateErrorRate(logs),
        lastActivity: logs[0]?.created_at || null,
      };
    },
    refetchInterval: 60000,
  });
}
```

---

## Permissions

- Only `admin` role can view logs
- Correlation IDs can be shared with support for debugging
- User IDs should be masked or require additional permission
