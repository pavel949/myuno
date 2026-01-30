# Frontend AI Entrypoints Map
## Phase D: Current State Analysis

---

## AI Component Inventory

### Chat/Conversational Components

| Component | File Path | Current AI Endpoint | Streaming | Notes |
|-----------|-----------|---------------------|-----------|-------|
| UnifiedChatFAB | `src/components/chat/UnifiedChatFAB.tsx` | `ai-support-chat` | Yes | Main support chat FAB |
| AIChatbot | `src/components/chat/AIChatbot.tsx` | `ai-support-chat` | Yes | Legacy component |

### Hook-Based AI Integrations

| Hook | File Path | Current AI Endpoint | Streaming | Notes |
|------|-----------|---------------------|-----------|-------|
| useOwnerAIChat | `src/hooks/useOwnerAIChat.ts` | `ai-owner-assistant` | Yes | Owner dashboard AI |
| usePropertyAIChat | `src/hooks/usePropertyAIChat.ts` | `ai-property-assistant` | Yes | Property search AI |
| useAISearch | `src/hooks/useAISearch.ts` | `ai-smart-search` | No | Smart search |
| useAutoTranslate | `src/hooks/useAutoTranslate.ts` | `ai-translate` | No | Auto translation |

### Utility Components

| Component | File Path | Current AI Endpoint | Notes |
|-----------|-----------|---------------------|-------|
| AIDescriptionGenerator | `src/components/shared/AIDescriptionGenerator.tsx` | `ai-generate-description` | Content generation |
| AITextExtractor | `src/components/shared/AITextExtractor.tsx` | `ai-smart-data` | Text extraction |
| AISmartFieldMapper | `src/components/shared/AISmartFieldMapper.tsx` | `ai-smart-data` | Field mapping |
| AIPhotoAnalyzer | `src/components/shared/AIPhotoAnalyzer.tsx` | `ai-smart-data` | Photo analysis |

---

## Current Implementation Patterns

### Pattern 1: Direct Fetch with SSE (Chat Components)

```typescript
// Current pattern in UnifiedChatFAB.tsx, useOwnerAIChat.ts
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

const response = await fetch(CHAT_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  },
  body: JSON.stringify({ messages }),
});

// SSE parsing loop
const reader = response.body.getReader();
// ... process stream
```

### Pattern 2: Direct Fetch with JSON (Utility Components)

```typescript
// Current pattern in AIDescriptionGenerator.tsx
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate-description`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ type, name, language, details }),
  }
);

const data = await response.json();
```

---

## Issues with Current Implementation

1. **Duplicated Code**: SSE parsing logic repeated in multiple files
2. **No Correlation ID**: No request tracing across frontend/backend
3. **Inconsistent Error Handling**: Each component handles errors differently
4. **No Centralized Configuration**: URLs scattered across files
5. **Hard to Test**: Direct fetch calls are hard to mock

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        src/lib/aiClient.ts                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ - Unified AI interface                                     │  │
│  │ - Correlation ID generation                                │  │
│  │ - SSE stream parsing                                       │  │
│  │ - Error handling                                           │  │
│  │ - Feature flag support                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
              │                    │                    │
              ▼                    ▼                    ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   Hooks     │      │  Components │      │  Utilities  │
    │             │      │             │      │             │
    │ useOwner... │      │ Unified...  │      │ AIDescript..│
    │ useProperty │      │ AIChatbot   │      │ AIText...   │
    │ useAISearch │      │             │      │ AISmart...  │
    └─────────────┘      └─────────────┘      └─────────────┘
```

---

## Files to Modify

### Priority 1: Create aiClient.ts
- New file: `src/lib/aiClient.ts`
- Unified interface for all AI calls

### Priority 2: Create featureFlags.ts
- New file: `src/lib/featureFlags.ts`
- AI routing flag management

### Priority 3: Update Chat Components
- `src/components/chat/UnifiedChatFAB.tsx`
- `src/components/chat/AIChatbot.tsx`

### Priority 4: Update Hooks
- `src/hooks/useOwnerAIChat.ts`
- `src/hooks/usePropertyAIChat.ts`

### Lower Priority: Utility Components
- Keep existing implementation
- Add shared logging helper call
