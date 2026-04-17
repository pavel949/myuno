// Unified AI client — single entry point for all AI calls.
// See spec: AI Client Specification / Unified Frontend Interface

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type AgentSlug =
  | 'support-chat'
  | 'owner-assistant'
  | 'property-search'
  | 'smart-search';

export interface AIRequestOptions {
  agentSlug?: AgentSlug;
  messages?: ChatMessage[];
  context?: Record<string, unknown>;
  sessionId?: string;
  signal?: AbortSignal;
}

export type StreamCallback = (chunk: string, done: boolean) => void;

export interface AIError {
  code: string;
  message: string;
  correlationId?: string;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const ENDPOINTS = {
  canonical:   `${SUPABASE_URL}/functions/v1/ai-agent`,
  translate:   `${SUPABASE_URL}/functions/v1/ai-translate`,
  description: `${SUPABASE_URL}/functions/v1/ai-generate-description`,
  smartSearch: `${SUPABASE_URL}/functions/v1/ai-smart-search`,
  smartData:   `${SUPABASE_URL}/functions/v1/ai-smart-data`,
};

// ---------------------------------------------------------------------------
// Routing flags (feature-flag-driven migration from legacy to canonical)
// ---------------------------------------------------------------------------

type RoutingFlag = 'canonical' | 'legacy';

interface AIRoutingFlags {
  supportChat: RoutingFlag;
  ownerAssistant: RoutingFlag;
  propertyAssistant: RoutingFlag;
}

function getAIRoutingFlags(): AIRoutingFlags {
  // All legacy by default; flip individual flags here as migration progresses.
  return {
    supportChat:       'legacy',
    ownerAssistant:    'legacy',
    propertyAssistant: 'legacy',
  };
}

function getEndpoint(agent: AgentSlug): string {
  const flags = getAIRoutingFlags();

  const flagMap: Record<AgentSlug, keyof AIRoutingFlags> = {
    'support-chat':    'supportChat',
    'owner-assistant': 'ownerAssistant',
    'property-search': 'propertyAssistant',
    'smart-search':    'supportChat', // Not migrated
  };

  const flag = flags[flagMap[agent]];

  if (flag === 'canonical') {
    return ENDPOINTS.canonical;
  }

  const legacyMap: Record<AgentSlug, string> = {
    'support-chat':    `${SUPABASE_URL}/functions/v1/ai-support-chat`,
    'owner-assistant': `${SUPABASE_URL}/functions/v1/ai-owner-assistant`,
    'property-search': `${SUPABASE_URL}/functions/v1/ai-property-assistant`,
    'smart-search':    ENDPOINTS.smartSearch,
  };

  return legacyMap[agent];
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function generateCorrelationId(): string {
  return crypto.randomUUID();
}

const isDev = import.meta.env.DEV;

function logRequest(endpoint: string, correlationId: string): void {
  if (isDev) {
    console.log(`[AI] ${endpoint} | ${correlationId.slice(0, 8)}...`);
  }
}

function logError(error: AIError): void {
  console.error(`[AI ERROR] ${error.code}: ${error.message}`, error.correlationId);
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${ANON_KEY}`,
  };
}

// ---------------------------------------------------------------------------
// SSE parser
// ---------------------------------------------------------------------------

async function parseSSEStream(
  response: Response,
  onChunk: StreamCallback,
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
        // Incomplete JSON — will be completed in the next read
      }
    }
  }

  onChunk('', true);
}

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

async function handleAIError(response: Response): Promise<never> {
  let error: AIError;

  try {
    const data = await response.json();
    error = {
      code: response.status === 429 ? 'RATE_LIMITED' : 'AI_ERROR',
      message: data.error || 'AI request failed',
      correlationId: response.headers.get('X-Correlation-ID') ?? undefined,
    };
  } catch {
    error = {
      code:    'UNKNOWN_ERROR',
      message: 'Failed to parse error response',
    };
  }

  logError(error);
  throw error;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * sendChatMessage — streaming conversational AI via SSE.
 */
export async function sendChatMessage(
  options: AIRequestOptions,
  onChunk: StreamCallback,
): Promise<{ correlationId: string }> {
  const correlationId = generateCorrelationId();
  const endpoint = getEndpoint(options.agentSlug ?? 'support-chat');

  logRequest(endpoint, correlationId);

  const response = await fetch(endpoint, {
    method:  'POST',
    headers: {
      ...authHeaders(),
      'X-Correlation-ID': correlationId,
    },
    body: JSON.stringify({
      agentSlug:  options.agentSlug,
      messages:   options.messages,
      context:    options.context,
      sessionId:  options.sessionId,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    await handleAIError(response);
  }

  await parseSSEStream(response, onChunk);

  return { correlationId };
}

/**
 * generateDescription — content generation returning JSON.
 */
export async function generateDescription(
  type: 'product' | 'service' | 'property',
  name: string,
  language: 'en' | 'ru',
  details?: Record<string, unknown>,
): Promise<{ description: string; correlationId: string }> {
  const correlationId = generateCorrelationId();

  logRequest(ENDPOINTS.description, correlationId);

  const response = await fetch(ENDPOINTS.description, {
    method:  'POST',
    headers: { ...authHeaders(), 'X-Correlation-ID': correlationId },
    body:    JSON.stringify({ type, name, language, details }),
  });

  if (!response.ok) {
    await handleAIError(response);
  }

  const data = await response.json();
  return { description: data.description, correlationId };
}

/**
 * translateContent — translate a single string.
 */
export async function translateContent(
  text: string,
  targetLang: 'en' | 'ru' | 'th',
): Promise<{ translated: string; correlationId: string }> {
  const correlationId = generateCorrelationId();

  logRequest(ENDPOINTS.translate, correlationId);

  const response = await fetch(ENDPOINTS.translate, {
    method:  'POST',
    headers: { ...authHeaders(), 'X-Correlation-ID': correlationId },
    body:    JSON.stringify({ text, targetLang }),
  });

  if (!response.ok) {
    await handleAIError(response);
  }

  const data = await response.json();
  return { translated: data.translated, correlationId };
}

/**
 * translateFields — translate multiple fields at once.
 */
export async function translateFields(
  fields: Record<string, string>,
  targetLang: 'en' | 'ru' | 'th',
): Promise<{ translations: Record<string, string>; correlationId: string }> {
  const correlationId = generateCorrelationId();

  logRequest(ENDPOINTS.translate, correlationId);

  const response = await fetch(ENDPOINTS.translate, {
    method:  'POST',
    headers: { ...authHeaders(), 'X-Correlation-ID': correlationId },
    body:    JSON.stringify({ fields, targetLang }),
  });

  if (!response.ok) {
    await handleAIError(response);
  }

  const data = await response.json();
  return { translations: data.translations, correlationId };
}

/**
 * smartSearch — intelligent search returning structured results.
 */
export async function smartSearch(
  query: string,
  options?: { language?: string; personas?: string[] },
): Promise<{
  type: 'answer' | 'navigation' | 'search';
  answer?: string;
  suggestedCategories?: string[];
  suggestedServices?: string[];
  correlationId: string;
}> {
  const correlationId = generateCorrelationId();

  logRequest(ENDPOINTS.smartSearch, correlationId);

  const response = await fetch(ENDPOINTS.smartSearch, {
    method:  'POST',
    headers: { ...authHeaders(), 'X-Correlation-ID': correlationId },
    body:    JSON.stringify({ query, ...options }),
  });

  if (!response.ok) {
    await handleAIError(response);
  }

  const data = await response.json();
  return { ...data, correlationId };
}

/**
 * extractData — smart data extraction (field-mapping, text-extraction, photo-analysis).
 */
export async function extractData(
  type: 'field-mapping' | 'text-extraction' | 'photo-analysis',
  input: Record<string, unknown>,
): Promise<{ data: unknown; correlationId: string }> {
  const correlationId = generateCorrelationId();

  logRequest(ENDPOINTS.smartData, correlationId);

  const response = await fetch(ENDPOINTS.smartData, {
    method:  'POST',
    headers: { ...authHeaders(), 'X-Correlation-ID': correlationId },
    body:    JSON.stringify({ type, input }),
  });

  if (!response.ok) {
    await handleAIError(response);
  }

  const data = await response.json();
  return { data: data.data, correlationId };
}

// ---------------------------------------------------------------------------
// Testing exports (not for production use)
// ---------------------------------------------------------------------------

export const __testing = {
  parseSSEStream,
  generateCorrelationId,
  handleAIError,
};
