# Feature Flags Specification
## AI Routing Control

---

## Overview

Feature flags control the AI routing migration without code deployments.
Flags are stored in environment variables for simplicity.

---

## Flag Definitions

| Flag | Type | Default | Purpose |
|------|------|---------|---------|
| `VITE_AI_ROUTE_SUPPORT_CHAT` | string | `legacy` | Route for support chat |
| `VITE_AI_ROUTE_OWNER_ASSISTANT` | string | `legacy` | Route for owner assistant |
| `VITE_AI_ROUTE_PROPERTY_ASSISTANT` | string | `legacy` | Route for property search |

**Values:**
- `legacy` - Use original edge function
- `canonical` - Use ai-agent with agentSlug
- `dual` - Call both, compare results (dev only)

---

## Implementation

### Frontend Flag Reader

```typescript
// src/lib/featureFlags.ts

type AIRouteFlag = 'legacy' | 'canonical' | 'dual';

interface AIRoutingFlags {
  supportChat: AIRouteFlag;
  ownerAssistant: AIRouteFlag;
  propertyAssistant: AIRouteFlag;
}

export function getAIRoutingFlags(): AIRoutingFlags {
  return {
    supportChat: (import.meta.env.VITE_AI_ROUTE_SUPPORT_CHAT as AIRouteFlag) || 'legacy',
    ownerAssistant: (import.meta.env.VITE_AI_ROUTE_OWNER_ASSISTANT as AIRouteFlag) || 'legacy',
    propertyAssistant: (import.meta.env.VITE_AI_ROUTE_PROPERTY_ASSISTANT as AIRouteFlag) || 'legacy',
  };
}

export function shouldUseCanonical(flag: AIRouteFlag): boolean {
  return flag === 'canonical' || flag === 'dual';
}
```

### URL Resolution

```typescript
// src/lib/aiClient.ts

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const AI_ENDPOINTS = {
  legacy: {
    supportChat: `${SUPABASE_URL}/functions/v1/ai-support-chat`,
    ownerAssistant: `${SUPABASE_URL}/functions/v1/ai-owner-assistant`,
    propertyAssistant: `${SUPABASE_URL}/functions/v1/ai-property-assistant`,
  },
  canonical: `${SUPABASE_URL}/functions/v1/ai-agent`,
};

export function getAIEndpoint(
  agent: 'supportChat' | 'ownerAssistant' | 'propertyAssistant'
): { url: string; useSlug: boolean; slug?: string } {
  const flags = getAIRoutingFlags();
  const flag = flags[agent];
  
  if (shouldUseCanonical(flag)) {
    const slugMap = {
      supportChat: 'support-chat',
      ownerAssistant: 'owner-assistant',
      propertyAssistant: 'property-search',
    };
    return {
      url: AI_ENDPOINTS.canonical,
      useSlug: true,
      slug: slugMap[agent],
    };
  }
  
  return {
    url: AI_ENDPOINTS.legacy[agent],
    useSlug: false,
  };
}
```

---

## Migration Stages

### Stage 1: Preparation (Current)
```env
VITE_AI_ROUTE_SUPPORT_CHAT=legacy
VITE_AI_ROUTE_OWNER_ASSISTANT=legacy
VITE_AI_ROUTE_PROPERTY_ASSISTANT=legacy
```

### Stage 2: Test Support Chat
```env
VITE_AI_ROUTE_SUPPORT_CHAT=canonical  # ← Test first
VITE_AI_ROUTE_OWNER_ASSISTANT=legacy
VITE_AI_ROUTE_PROPERTY_ASSISTANT=legacy
```

### Stage 3: Expand to Owner
```env
VITE_AI_ROUTE_SUPPORT_CHAT=canonical
VITE_AI_ROUTE_OWNER_ASSISTANT=canonical  # ← Expand
VITE_AI_ROUTE_PROPERTY_ASSISTANT=legacy
```

### Stage 4: Full Migration
```env
VITE_AI_ROUTE_SUPPORT_CHAT=canonical
VITE_AI_ROUTE_OWNER_ASSISTANT=canonical
VITE_AI_ROUTE_PROPERTY_ASSISTANT=canonical  # ← Complete
```

### Stage 5: Cleanup
Remove flags, hardcode canonical paths, delete legacy functions.

---

## Rollback Procedure

1. Set flag back to `legacy` in environment
2. Rebuild/redeploy frontend
3. Monitor for recovery

**No backend changes required for rollback.**

---

## Monitoring During Migration

### Track by Flag Value

```typescript
// Include in analytics
const routeType = shouldUseCanonical(flags.supportChat) ? 'canonical' : 'legacy';
console.log(`[AI] Using ${routeType} route for support chat`);
```

### Compare Error Rates

```sql
-- After migration, compare error rates
SELECT 
  CASE WHEN correlation_id IS NOT NULL THEN 'canonical' ELSE 'legacy' END as route,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_success = false) as errors
FROM ai_agent_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1;
```

---

## Edge Function Deprecation Flags

When ready to deprecate legacy functions, add warning headers:

```typescript
// In legacy ai-support-chat/index.ts
return new Response(response.body, {
  headers: { 
    ...corsHeaders, 
    "Content-Type": "text/event-stream",
    "X-Deprecation-Warning": "This endpoint is deprecated. Use /ai-agent with agentSlug.",
  },
});
```
