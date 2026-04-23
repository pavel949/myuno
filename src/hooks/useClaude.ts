/**
 * Hook for Claude chat via Supabase Edge Function (claude-chat).
 * Keeps conversation in state and calls the secure proxy; never exposes API key.
 */
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_PROMPTS, type SystemPromptKey } from "@/lib/ai/systemPrompts";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export function useClaude(vertical: SystemPromptKey) {
  const [messages, setMessages] = useState<ClaudeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const systemPrompt = SYSTEM_PROMPTS[vertical] ?? SYSTEM_PROMPTS.support;

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      const userMessage: ClaudeMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const nextMessages: ClaudeMessage[] = [...messages, userMessage];
        const { data, error: fnError } = await supabase.functions.invoke("claude-chat", {
          body: {
            messages: nextMessages,
            systemPrompt,
            vertical,
          },
        });

        if (fnError) {
          setError(fnError.message || "Request failed");
          return;
        }

        const responseText = typeof data?.response === "string" ? data.response : "";
        if (responseText) {
          setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
        } else {
          setError("No response from assistant");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Assistant did not respond";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, systemPrompt, vertical, isLoading]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, sendMessage, clearHistory, isLoading, error };
}
