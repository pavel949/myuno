# AI Routing Matrix
## Phase C: Consolidation Strategy

---

## Current Routing State

| Frontend Entry | Current Target | Target After Migration |
|----------------|----------------|------------------------|
| `UnifiedChatFAB.tsx` | `ai-support-chat` | `ai-agent` (slug: `support-chat`) |
| `AIChatbot.tsx` | `ai-support-chat` | `ai-agent` (slug: `support-chat`) |
| `useOwnerAIChat.ts` | `ai-owner-assistant` | `ai-agent` (slug: `owner-assistant`) |
| `usePropertyAIChat.ts` | `ai-property-assistant` | `ai-agent` (slug: `property-search`) |
| `useAISearch.ts` | `ai-smart-search` | Keep as-is (different response format) |
| `useAutoTranslate.ts` | `ai-translate` | Keep as-is (utility) |
| `AIDescriptionGenerator.tsx` | `ai-generate-description` | Keep as-is (utility) |
| `AITextExtractor.tsx` | `ai-smart-data` | Keep as-is (utility) |
| `AISmartFieldMapper.tsx` | `ai-smart-data` | Keep as-is (utility) |
| `AIPhotoAnalyzer.tsx` | `ai-smart-data` | Keep as-is (utility) |

---

## Function Classification

### Tier 1: Migrate to ai-agent (Conversational)

These should route through the canonical `ai-agent` function:

| Function | DB Agent Slug | Current Status |
|----------|---------------|----------------|
| `ai-support-chat` | `support-chat` | MIGRATE → `ai-agent` |
| `ai-owner-assistant` | `owner-assistant` | MIGRATE → `ai-agent` |
| `ai-property-assistant` | `property-search` | MIGRATE → `ai-agent` |

### Tier 2: Evaluate for Migration (Search)

| Function | DB Agent Slug | Decision |
|----------|---------------|----------|
| `ai-smart-search` | `smart-search` | KEEP SEPARATE (JSON response, not SSE) |

### Tier 3: Keep Standalone (Utilities)

These remain standalone but adopt shared logging:

| Function | Reason |
|----------|--------|
| `ai-translate` | Stateless, different I/O schema |
| `ai-generate-description` | Stateless, single purpose |
| `ai-smart-data` | Complex tool calling, multi-mode |
| `ai-personalize-home` | Rule-based, no AI model |

---

## Request Schema Mapping

### ai-agent Unified Schema

```typescript
// Request to ai-agent
{
  agentSlug: "support-chat" | "owner-assistant" | "property-search",
  messages: ChatMessage[],
  context?: Record<string, unknown>,
  sessionId?: string,
  correlationId?: string
}

// Response: SSE stream (unchanged)
```

### Migration Mapping

| Current Request | ai-agent Request |
|-----------------|------------------|
| `POST /ai-support-chat { messages }` | `POST /ai-agent { agentSlug: "support-chat", messages }` |
| `POST /ai-owner-assistant { messages, context }` | `POST /ai-agent { agentSlug: "owner-assistant", messages, context }` |
| `POST /ai-property-assistant { messages, context }` | `POST /ai-agent { agentSlug: "property-search", messages, context }` |

---

## Response Compatibility

All three legacy functions return the same format:
- Content-Type: `text/event-stream`
- SSE format: `data: {\"choices\":[{\\\"delta\\\":{\\\"content\\\":\\\"...\\\"}}]}`
- Terminator: `data: [DONE]`

The `ai-agent` function already returns the same format. **No response changes needed.**

---

## Frontend Changes Required

### 1. UnifiedChatFAB.tsx (Line 32)

```typescript
// BEFORE
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

// AFTER (via aiClient)
import { sendChatMessage } from '@/lib/aiClient';
// Replace direct fetch with aiClient call
```

### 2. AIChatbot.tsx (Line 14)

```typescript
// BEFORE
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

// AFTER
import { sendChatMessage } from '@/lib/aiClient';
```

### 3. useOwnerAIChat.ts (Line 18)

```typescript
// BEFORE
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-owner-assistant`;

// AFTER
import { AI_AGENT_URL, buildAgentRequest } from '@/lib/aiClient';
const request = buildAgentRequest('owner-assistant', messages, context);
```

### 4. usePropertyAIChat.ts (Line 18)

```typescript
// BEFORE
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-property-assistant`;

// AFTER
import { AI_AGENT_URL, buildAgentRequest } from '@/lib/aiClient';
const request = buildAgentRequest('property-search', messages, context);
```

---

## Dual-Run Strategy (Optional)

For risk mitigation, we can run both paths simultaneously:

```typescript
// Feature flag check
const useNewRoute = import.meta.env.VITE_AI_USE_CANONICAL === 'true';

const url = useNewRoute 
  ? `${SUPABASE_URL}/functions/v1/ai-agent`
  : `${SUPABASE_URL}/functions/v1/ai-support-chat`;

const body = useNewRoute
  ? { agentSlug: 'support-chat', messages }
  : { messages };
```

**Recommendation:** Skip dual-run since both paths are functionally equivalent.

---

## Rollback Plan

If issues occur after migration:

1. **Immediate:** Revert frontend code to use legacy URLs
2. **Edge Functions:** Legacy functions remain deployed
3. **Database:** No changes to rollback

---

## Post-Migration Cleanup

After 2 weeks of stable operation:

1. Mark legacy functions as deprecated in code
2. Add deprecation warnings to legacy endpoints
3. After 4 weeks: Delete legacy function directories
4. Update `supabase/config.toml` to remove legacy entries

```lov-code
