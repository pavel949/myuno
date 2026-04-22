> ARCHIVED: 2026-04-20
> Superseded by: CLAUDE.md, DESIGN.md, current codebase
> Reason: Lovable AI session artifact from Jan-Feb 2026, superseded by implemented code

# AI Client Specification
## Unified Frontend Interface

---

## File: src/lib/aiClient.ts

---

## Core Responsibilities

1. **Unified Interface**: Single entry point for all AI calls
2. **Correlation ID**: Auto-generate and propagate for tracing
3. **SSE Streaming**: Reusable stream parsing logic
4. **Error Handling**: Consistent error responses
5. **Feature Flags**: Support routing migration
6. **Logging**: Development-mode request logging

---

## Type Definitions

```typescript
// Message types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Agent slugs for canonical routing
export type AgentSlug = 
  | 'support-chat' 
  | 'owner-assistant' 
  | 'property-search' 
  | 'smart-search';

// Request options
export interface AIRequestOptions {
  agentSlug?: AgentSlug;
  messages?: ChatMessage[];
  context?: Record<string, unknown>;
  sessionId?: string;
  signal?: AbortSignal;
}

// Stream callback
export type StreamCallback = (chunk: string, done: boolean) => void;

// Error types
export interface AIError {
  code: string;
  message: string;
  correlationId?: string;
}
```

---

## Public API

### 1. sendChatMessage (Streaming)

For conversational AI with SSE streaming.

```typescript
export async function sendChatMessage(
  options: AIRequestOptions,
  onChunk: StreamCallback
): Promise<{ correlationId: string }>;
```

**Usage:**
```typescript
import { sendChatMessage } from '@/lib/aiClient';

const { correlationId } = await sendChatMessage(
  {
    agentSlug: 'support-chat',
    messages: [{ role: 'user', content: 'Hello' }],
  },
  (chunk, done) => {
    if (!done) {
      setResponse(prev => prev + chunk);
    }
  }
);
```

### 2. generateDescription (JSON)

For content generation utilities.

```typescript
export async function generateDescription(
  type: 'product' | 'service' | 'property',
  name: string,
  language: 'en' | 'ru',
  details?: Record<string, unknown>
): Promise<{ description: string; correlationId: string }>;
```

### 3. translateContent (JSON)

For translation utilities.

```typescript
export async function translateContent(
  text: string,
  targetLang: 'en' | 'ru' | 'th'
): Promise<{ translated: string; correlationId: string }>;

export async function translateFields(
  fields: Record<string, string>,
  targetLang: 'en' | 'ru' | 'th'
): Promise<{ translations: Record<string, string>; correlationId: string }>;
```

### 4. smartSearch (JSON)

For intelligent search.

```typescript
export async function smartSearch(
  query: string,
  options?: { language?: string; personas?: string[] }
): Promise<{
  type: 'answer' | 'navigation' | 'search';
  answer?: string;
  suggestedCategories?: string[];
  suggestedServices?: string[];
  correlationId: string;
}>;
```

### 5. extractData (JSON)

For smart data extraction.

```typescript
export async function extractData(
  type: 'field-mapping' | 'text-extraction' | 'photo-analysis',
  input: Record<string, unknown>
): Promise<{ data: unknown; correlationId: string }>;
```

---

## Internal Implementation

### Configuration

```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const ENDPOINTS = {
  canonical: `${SUPABASE_URL}/functions/v1/ai-agent`,
  translate: `${SUPABASE_URL}/functions/v1/ai-translate`,
  description: `${SUPABASE_URL}/functions/v1/ai-generate-description`,
  smartSearch: `${SUPABASE_URL}/functions/v1/ai-smart-search`,
  smartData: `${SUPABASE_URL}/functions/v1/ai-smart-data`,
};
```

### Correlation ID

```typescript
function generateCorrelationId(): string {
  return crypto.randomUUID();
}
```

### SSE Parser

```typescript
async function parseSSEStream(
  response: Response,
  onChunk: StreamCallback
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        onChunk('', true);
        return;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          onChunk(content, false);
        }
      } catch {
        // Incomplete JSON, will be handled in next iteration
      }
    }
  }

  onChunk('', true);
}
```

### Error Handler

```typescript
async function handleAIError(response: Response): Promise<never> {
  let error: AIError;
  
  try {
    const data = await response.json();
    error = {
      code: response.status === 429 ? 'RATE_LIMITED' : 'AI_ERROR',
      message: data.error || 'AI request failed',
      correlationId: response.headers.get('X-Correlation-ID') || undefined,
    };
  } catch {
    error = {
      code: 'UNKNOWN_ERROR',
      message: 'Failed to parse error response',
    };
  }

  throw error;
}
```

---

## Development Logging

```typescript
const isDev = import.meta.env.DEV;

function logRequest(endpoint: string, correlationId: string): void {
  if (isDev) {
    console.log(`[AI] ${endpoint} | ${correlationId.slice(0, 8)}...`);
  }
}

function logError(error: AIError): void {
  console.error(`[AI ERROR] ${error.code}: ${error.message}`, error.correlationId);
}
```

---

## Migration Support

The client supports gradual migration via feature flags:

```typescript
function getEndpoint(agent: AgentSlug): string {
  const flags = getAIRoutingFlags();
  
  const flagMap: Record<AgentSlug, keyof typeof flags> = {
    'support-chat': 'supportChat',
    'owner-assistant': 'ownerAssistant',
    'property-search': 'propertyAssistant',
    'smart-search': 'supportChat', // Not migrated
  };

  const flag = flags[flagMap[agent]];
  
  if (flag === 'canonical') {
    return ENDPOINTS.canonical;
  }
  
  // Legacy endpoints
  const legacyMap: Record<AgentSlug, string> = {
    'support-chat': `${SUPABASE_URL}/functions/v1/ai-support-chat`,
    'owner-assistant': `${SUPABASE_URL}/functions/v1/ai-owner-assistant`,
    'property-search': `${SUPABASE_URL}/functions/v1/ai-property-assistant`,
    'smart-search': ENDPOINTS.smartSearch,
  };
  
  return legacyMap[agent];
}
```

---

## Testing Support

Export internal functions for testing:

```typescript
// For testing only
export const __testing = {
  parseSSEStream,
  generateCorrelationId,
  handleAIError,
};
```