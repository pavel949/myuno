/**
 * Client-supplied chat history may only carry user/assistant turns. System or
 * tool roles are dropped so callers cannot inject privileged instructions.
 */
export type ChatTurn = { role: "user" | "assistant"; content: string };

export function sanitizeChatMessages(input: unknown, maxTurns = 40, maxChars = 4000): ChatTurn[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((m): m is { role: string; content: unknown } =>
      !!m && typeof m === "object" && ((m as { role?: unknown }).role === "user" || (m as { role?: unknown }).role === "assistant"))
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .slice(-maxTurns)
    .map((m) => ({ role: m.role as "user" | "assistant", content: (m.content as string).slice(0, maxChars) }));
}

/** Single-line, length-capped value safe to embed in a system prompt. */
export function promptSafe(value: unknown, max = 200): string {
  return String(value ?? "").replace(/[\r\n\u2028\u2029]+/g, " ").replace(/[[\]#]/g, "").slice(0, max);
}
