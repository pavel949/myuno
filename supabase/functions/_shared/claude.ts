/**
 * Claude API wrapper for Edge Functions (Lead AI SDR Phase 1).
 *
 * Source of truth for all Anthropic SDK calls in `supabase/functions/**`.
 * Inline `fetch('https://api.anthropic.com/...')` calls or other LLM SDKs
 * should be migrated here.
 *
 * Models (Claude 4.x family — see CLAUDE.md):
 *   - claude-haiku-4-5            — scoring, intent classification, routing
 *   - claude-sonnet-4-6           — conversational SDR, longer drafting
 *
 * Cost discipline:
 *   - Mark static system blocks and tool definitions with cache_control
 *     `{type:'ephemeral'}` (5-min TTL, refreshed by repeat calls).
 *   - Force structured output via `tool_choice` when you need strict JSON.
 *   - Circuit breaker: if `system_settings.claude_circuit_open=true`, helpers
 *     throw `ClaudeCircuitOpenError` so non-essential paths short-circuit.
 */

import { createServiceClient } from "./supabase.ts";

const ANTHROPIC_BASE = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const CLAUDE_MODELS = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
} as const;

export type ClaudeModel = (typeof CLAUDE_MODELS)[keyof typeof CLAUDE_MODELS];

export class ClaudeCircuitOpenError extends Error {
  constructor() {
    super("Claude circuit breaker is open (system_settings.claude_circuit_open=true)");
    this.name = "ClaudeCircuitOpenError";
  }
}

export class ClaudeApiError extends Error {
  constructor(public status: number, public body: string) {
    super(`Claude API error ${status}: ${body.slice(0, 300)}`);
    this.name = "ClaudeApiError";
  }
}

type CacheControl = { type: "ephemeral" };

type ContentBlock =
  | { type: "text"; text: string; cache_control?: CacheControl }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };

export type ClaudeMessage = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

export type ClaudeTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  cache_control?: CacheControl;
};

export type ClaudeUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

export type ClaudeResponse = {
  id: string;
  model: string;
  stop_reason: string;
  content: ContentBlock[];
  usage: ClaudeUsage;
};

type CompleteOptions = {
  model?: ClaudeModel;
  system?: string | ContentBlock[];
  messages: ClaudeMessage[];
  tools?: ClaudeTool[];
  tool_choice?: { type: "auto" | "any" } | { type: "tool"; name: string };
  max_tokens?: number;
  temperature?: number;
  metadata?: Record<string, string>;
};

async function checkCircuit(): Promise<void> {
  try {
    const sb = createServiceClient();
    const { data } = await sb
      .from("system_settings")
      .select("value")
      .eq("key", "claude_circuit_open")
      .maybeSingle();
    if (data?.value === true || (data?.value as unknown) === "true") {
      throw new ClaudeCircuitOpenError();
    }
  } catch (e) {
    if (e instanceof ClaudeCircuitOpenError) throw e;
    // Failure to check shouldn't block calls — log and proceed.
    console.warn("[claude] circuit check failed", e);
  }
}

function getApiKey(): string {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  return key;
}

async function callApi(body: Record<string, unknown>, attempt = 0): Promise<ClaudeResponse> {
  const apiKey = getApiKey();
  const res = await fetch(ANTHROPIC_BASE, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429 || res.status === 529) {
    if (attempt >= 3) {
      const text = await res.text();
      throw new ClaudeApiError(res.status, text);
    }
    const wait = (2 ** attempt) * 500 + Math.random() * 250;
    await new Promise((r) => setTimeout(r, wait));
    return callApi(body, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new ClaudeApiError(res.status, text);
  }

  return (await res.json()) as ClaudeResponse;
}

/**
 * Free-form completion. Returns the raw response (caller extracts text/tool_use).
 */
export async function complete(opts: CompleteOptions): Promise<ClaudeResponse> {
  await checkCircuit();

  const model = opts.model ?? CLAUDE_MODELS.haiku;
  const max_tokens = opts.max_tokens ?? 1024;

  const systemBlocks: ContentBlock[] | undefined =
    typeof opts.system === "string"
      ? [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }]
      : opts.system;

  return callApi({
    model,
    max_tokens,
    temperature: opts.temperature ?? 0.7,
    system: systemBlocks,
    messages: opts.messages,
    tools: opts.tools,
    tool_choice: opts.tool_choice,
    metadata: opts.metadata,
  });
}

/**
 * Force a single structured tool_use call. Useful for scoring / classification
 * where you need a strict JSON object back. `schema` is the JSON Schema for the
 * tool's input.
 *
 * Returns the parsed input of the tool_use block. Throws if Claude refused to
 * emit a tool call.
 */
export async function scoreStructured<T = Record<string, unknown>>(args: {
  toolName: string;
  toolDescription: string;
  schema: Record<string, unknown>;
  system: string;
  userPrompt: string;
  model?: ClaudeModel;
  max_tokens?: number;
}): Promise<{ result: T; usage: ClaudeUsage; raw: ClaudeResponse }> {
  const tool: ClaudeTool = {
    name: args.toolName,
    description: args.toolDescription,
    input_schema: args.schema,
    cache_control: { type: "ephemeral" },
  };

  const raw = await complete({
    model: args.model ?? CLAUDE_MODELS.haiku,
    max_tokens: args.max_tokens ?? 1024,
    temperature: 0,
    system: [{ type: "text", text: args.system, cache_control: { type: "ephemeral" } }],
    tools: [tool],
    tool_choice: { type: "tool", name: args.toolName },
    messages: [{ role: "user", content: args.userPrompt }],
  });

  const toolBlock = raw.content.find((b): b is Extract<ContentBlock, { type: "tool_use" }> =>
    b.type === "tool_use" && b.name === args.toolName,
  );
  if (!toolBlock) {
    throw new Error(`Claude did not emit tool_use for "${args.toolName}" (stop_reason=${raw.stop_reason})`);
  }

  return { result: toolBlock.input as T, usage: raw.usage, raw };
}

/**
 * Extract concatenated assistant text from a Claude response (ignoring tool_use).
 */
export function getText(res: ClaudeResponse): string {
  return res.content
    .filter((b): b is Extract<ContentBlock, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Persist a single Claude call's usage to `ai_decisions_log` for cost auditing.
 * Best-effort — never throws. Pass a meaningful `decision_type` like
 * `'lead_score'`, `'sdr_chat'`, `'nurture_draft'`.
 *
 * The existing schema stores model/tokens/cache details inside `payload` jsonb;
 * `tokens_used` is set to (input + output) for easy aggregation.
 */
export async function logUsage(args: {
  agent_slug: string;
  decision_type: string;
  status?: "ok" | "error";
  contact_id?: string | null;
  conversation_id?: string | null;
  model: string;
  usage: ClaudeUsage;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    const sb = createServiceClient();
    const tokens_total = (args.usage.input_tokens ?? 0) + (args.usage.output_tokens ?? 0);
    await sb.from("ai_decisions_log").insert({
      agent_slug: args.agent_slug,
      decision_type: args.decision_type,
      status: args.status ?? "ok",
      tokens_used: tokens_total,
      payload: {
        model: args.model,
        contact_id: args.contact_id ?? null,
        conversation_id: args.conversation_id ?? null,
        tokens_in: args.usage.input_tokens,
        tokens_out: args.usage.output_tokens,
        cache_read_tokens: args.usage.cache_read_input_tokens ?? 0,
        cache_creation_tokens: args.usage.cache_creation_input_tokens ?? 0,
        ...(args.meta ?? {}),
      },
    });
  } catch (e) {
    console.warn("[claude] logUsage failed", e);
  }
}
